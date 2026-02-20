<?php

namespace App\Http\Controllers;

use App\Models\PreProjectChat;
use App\Models\PreProjectMessage;
use App\Services\WorkspaceCreationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PreProjectChatController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $chats = PreProjectChat::where(function ($q) use ($user) {
            $q->where('client_id', $user->id)
              ->orWhere('freelancer_id', $user->id);
        })
            ->whereDoesntHave('deletions', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with([
                'client:id,name,avatar,email,job_title,usage_type',
                'freelancer:id,name,avatar,email,job_title,usage_type',
                'freelancer.freelancerProfile:id,user_id,title,slug,avatar',
                'messages' => fn($q) => $q->latest()->limit(1),
            ])
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($chat) use ($user) {
                $otherUser = $chat->getOtherParticipant($user);
                // Create proper array structure for other_user with avatar_url
                if ($otherUser) {
                    // Check if this is a freelancer and prioritize FreelancerProfile.avatar
                    $avatar = $otherUser->avatar;
                    $avatarUrl = null;
                    
                    if ($otherUser->usage_type === 'freelancer' && $chat->freelancer && $chat->freelancer->id === $otherUser->id) {
                        $freelancerProfileAvatar = $chat->freelancer->freelancerProfile->avatar ?? null;
                        if ($freelancerProfileAvatar) {
                            // Check if freelancer profile avatar exists and is not too small (corrupted)
                            $avatarPath = null;
                            if (str_starts_with($freelancerProfileAvatar, 'http')) {
                                $avatarPath = null; // External URL, can't check size
                            } elseif (str_starts_with($freelancerProfileAvatar, '/storage/') || str_starts_with($freelancerProfileAvatar, 'storage/')) {
                                $avatarPath = str_replace(['/storage/', 'storage/'], '', $freelancerProfileAvatar);
                            } else {
                                $avatarPath = $freelancerProfileAvatar;
                            }
                            
                            // Check file size if it's a local file
                            $useFreelancerAvatar = true;
                            if ($avatarPath) {
                                $fullPath = storage_path('app/public/' . $avatarPath);
                                \Log::info('Avatar check for user ' . $otherUser->id, [
                                    'freelancer_profile_avatar' => $freelancerProfileAvatar,
                                    'avatar_path' => $avatarPath,
                                    'full_path' => $fullPath,
                                    'file_exists' => file_exists($fullPath),
                                    'file_size' => file_exists($fullPath) ? filesize($fullPath) : 'N/A'
                                ]);
                                if (file_exists($fullPath) && filesize($fullPath) < 5000) { // Less than 5KB = likely corrupted
                                    \Log::info('Avatar too small, using fallback');
                                    $useFreelancerAvatar = false;
                                }
                            }
                            
                            if ($useFreelancerAvatar) {
                                $avatar = $freelancerProfileAvatar;
                                // Generate avatar URL similar to User model logic
                                if (str_starts_with($freelancerProfileAvatar, 'http')) {
                                    $avatarUrl = $freelancerProfileAvatar;
                                } elseif (str_starts_with($freelancerProfileAvatar, '/storage/') || str_starts_with($freelancerProfileAvatar, 'storage/')) {
                                    $avatarUrl = url($freelancerProfileAvatar);
                                } else {
                                    $avatarUrl = url('storage/' . $freelancerProfileAvatar);
                                }
                            }
                        }
                    }
                    
                    // If no freelancer profile avatar, use User model's avatar_url accessor
                    if (!$avatarUrl && $avatar) {
                        // Generate avatar URL similar to User model logic
                        if (str_starts_with($avatar, 'http')) {
                            $avatarUrl = $avatar;
                        } elseif (str_starts_with($avatar, '/storage/') || str_starts_with($avatar, 'storage/')) {
                            $avatarUrl = url($avatar);
                        } else {
                            $avatarUrl = url('storage/' . $avatar);
                        }
                    }
                    
                    \Log::info('Final avatar selection for user ' . $otherUser->id, [
                    'final_avatar' => $avatar,
                    'final_avatar_url' => $avatarUrl,
                    'user_avatar' => $otherUser->avatar,
                    'user_avatar_url' => $otherUser->avatar_url
                ]);
                
                $chat->other_user = [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'email' => $otherUser->email,
                    'avatar' => $avatar,
                    'avatar_url' => $avatarUrl,
                    'job_title' => $otherUser->job_title,
                    'usage_type' => $otherUser->usage_type,
                ];
                } else {
                    $chat->other_user = null;
                }
                $chat->unread_count = $chat->messages()
                    ->where('sender_id', '!=', $user->id)
                    ->whereNull('read_at')
                    ->count();
                return $chat;
            });

        return Inertia::render('Marketplace/ChatList', [
            'chats' => $chats,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        // Allow both clients and freelancers to initiate chats
        if (!in_array($user->usage_type, ['client', 'freelancer'])) {
            abort(403, 'Only clients and freelancers can initiate chats.');
        }

        $data = $request->validate([
            'freelancer_id' => 'required_if:usage_type,client|exists:users,id',
            'client_id' => 'required_if:usage_type,freelancer|exists:users,id',
        ]);

        // Determine the other participant based on user type
        if ($user->usage_type === 'client') {
            // Client initiating chat with freelancer
            $freelancer = \App\Models\User::find($data['freelancer_id']);
            if (!$freelancer || $freelancer->usage_type !== 'freelancer') {
                abort(422, 'Invalid freelancer.');
            }
            
            $clientId = $user->id;
            $freelancerId = $data['freelancer_id'];
        } else {
            // Freelancer initiating chat with client
            $client = \App\Models\User::find($data['client_id']);
            if (!$client || $client->usage_type !== 'client') {
                abort(422, 'Invalid client.');
            }
            
            $clientId = $data['client_id'];
            $freelancerId = $user->id;
        }

        // Find or create chat
        $chat = PreProjectChat::firstOrCreate(
            [
                'client_id' => $clientId,
                'freelancer_id' => $freelancerId,
            ],
            [
                'status' => 'open',
            ]
        );

        // If this chat was previously deleted by the user, restore it
        if ($chat->isDeletedByUser($user)) {
            \App\Models\ChatDeletion::where('user_id', $user->id)
                ->where('chat_id', $chat->id)
                ->delete();
        }

        return redirect()->route('marketplace.chats.show', $chat->id);
    }

    public function show(PreProjectChat $chat)
    {
        $user = Auth::user();

        if (!$chat->isParticipant($user)) {
            abort(403);
        }

        // If user had deleted this chat, restore it automatically
        if ($chat->isDeletedByUser($user)) {
            \App\Models\ChatDeletion::where('user_id', $user->id)
                ->where('chat_id', $chat->id)
                ->delete();
        }

        $chat->load([
            'client:id,name,avatar,email,job_title,usage_type',
            'client.clientProfile:id,user_id,company_name',
            'freelancer:id,name,avatar,email,job_title,usage_type',
            'freelancer.freelancerProfile:id,user_id,title,slug,avatar',
            'workspace:id,name,slug,owner_id',
        ]);
        
        // Create proper array structures for chat participants with avatar_url
        if ($chat->client) {
            \Log::info('Chat show - client avatar data', [
                'client_id' => $chat->client->id,
                'client_name' => $chat->client->name,
                'client_avatar' => $chat->client->avatar,
                'client_avatar_url' => $chat->client->avatar_url,
            ]);
            
            $chat->client = [
                'id' => $chat->client->id,
                'name' => $chat->client->name,
                'email' => $chat->client->email,
                'avatar' => $chat->client->avatar,
                'avatar_url' => $chat->client->avatar_url,
                'job_title' => $chat->client->job_title,
                'usage_type' => $chat->client->usage_type,
            ];
        }
        if ($chat->freelancer) {
            // Check freelancer profile avatar first
            $freelancerProfileAvatar = $chat->freelancer->freelancerProfile->avatar ?? null;
            $freelancerAvatar = $chat->freelancer->avatar;
            $freelancerAvatarUrl = null;
            
            if ($freelancerProfileAvatar) {
                // Check if freelancer profile avatar exists and is not too small (corrupted)
                $avatarPath = null;
                if (str_starts_with($freelancerProfileAvatar, 'http')) {
                    $avatarPath = null; // External URL, can't check size
                } elseif (str_starts_with($freelancerProfileAvatar, '/storage/') || str_starts_with($freelancerProfileAvatar, 'storage/')) {
                    $avatarPath = str_replace(['/storage/', 'storage/'], '', $freelancerProfileAvatar);
                } else {
                    $avatarPath = $freelancerProfileAvatar;
                }
                
                // Check file size if it's a local file
                $useFreelancerAvatar = true;
                if ($avatarPath) {
                    $fullPath = storage_path('app/public/' . $avatarPath);
                    if (file_exists($fullPath) && filesize($fullPath) < 5000) { // Less than 5KB = likely corrupted
                        $useFreelancerAvatar = false;
                    }
                }
                
                if ($useFreelancerAvatar) {
                    $freelancerAvatar = $freelancerProfileAvatar;
                    // Generate avatar URL similar to User model logic
                    if (str_starts_with($freelancerProfileAvatar, 'http')) {
                        $freelancerAvatarUrl = $freelancerProfileAvatar;
                    } elseif (str_starts_with($freelancerProfileAvatar, '/storage/') || str_starts_with($freelancerProfileAvatar, 'storage/')) {
                        $freelancerAvatarUrl = url($freelancerProfileAvatar);
                    } else {
                        $freelancerAvatarUrl = url('storage/' . $freelancerProfileAvatar);
                    }
                }
            }
            
            // If freelancer profile avatar is not used, fall back to user avatar
            if (!$freelancerAvatarUrl) {
                $freelancerAvatarUrl = $chat->freelancer->avatar_url;
                $freelancerAvatar = $chat->freelancer->avatar;
            }
            
            \Log::info('Chat show - freelancer avatar data', [
                'freelancer_id' => $chat->freelancer->id,
                'freelancer_name' => $chat->freelancer->name,
                'original_avatar' => $chat->freelancer->avatar,
                'original_avatar_url' => $chat->freelancer->avatar_url,
                'freelancer_profile_avatar' => $freelancerProfileAvatar,
                'final_avatar' => $freelancerAvatar,
                'final_avatar_url' => $freelancerAvatarUrl,
            ]);
            
            $chat->freelancer = [
                'id' => $chat->freelancer->id,
                'name' => $chat->freelancer->name,
                'email' => $chat->freelancer->email,
                'avatar' => $freelancerAvatar,
                'avatar_url' => $freelancerAvatarUrl,
                'job_title' => $chat->freelancer->job_title,
                'usage_type' => $chat->freelancer->usage_type,
            ];
        }

        $messages = $chat->messages()
            ->with('sender:id,name,avatar,usage_type')
            ->orderBy('created_at')
            ->get();
        
        // Create proper array structures for message senders with avatar_url
        $messages->transform(function ($message) {
            if ($message->sender) {
                $sender = $message->sender;
                $avatar = $sender->avatar;
                $avatarUrl = null;
                
                // Check if sender is a freelancer and apply avatar fixes
                if ($sender->usage_type === 'freelancer') {
                    $freelancerProfile = \App\Models\FreelancerProfile::where('user_id', $sender->id)->first();
                    if ($freelancerProfile && $freelancerProfile->avatar) {
                        // Check if freelancer profile avatar exists and is not too small (corrupted)
                        $avatarPath = null;
                        if (str_starts_with($freelancerProfile->avatar, 'http')) {
                            $avatarPath = null; // External URL, can't check size
                        } elseif (str_starts_with($freelancerProfile->avatar, '/storage/') || str_starts_with($freelancerProfile->avatar, 'storage/')) {
                            $avatarPath = str_replace(['/storage/', 'storage/'], '', $freelancerProfile->avatar);
                        } else {
                            $avatarPath = $freelancerProfile->avatar;
                        }
                        
                        // Check file size if it's a local file
                        $useFreelancerAvatar = true;
                        if ($avatarPath) {
                            $fullPath = storage_path('app/public/' . $avatarPath);
                            if (file_exists($fullPath) && filesize($fullPath) < 5000) { // Less than 5KB = likely corrupted
                                $useFreelancerAvatar = false;
                            }
                        }
                        
                        if ($useFreelancerAvatar) {
                            $avatar = $freelancerProfile->avatar;
                            // Generate avatar URL similar to User model logic
                            if (str_starts_with($freelancerProfile->avatar, 'http')) {
                                $avatarUrl = $freelancerProfile->avatar;
                            } elseif (str_starts_with($freelancerProfile->avatar, '/storage/') || str_starts_with($freelancerProfile->avatar, 'storage/')) {
                                $avatarUrl = url($freelancerProfile->avatar);
                            } else {
                                $avatarUrl = url('storage/' . $freelancerProfile->avatar);
                            }
                        }
                    }
                }
                
                // If no freelancer profile avatar, use User model's avatar_url accessor
                if (!$avatarUrl && $avatar) {
                    // Generate avatar URL similar to User model logic
                    if (str_starts_with($avatar, 'http')) {
                        $avatarUrl = $avatar;
                    } elseif (str_starts_with($avatar, '/storage/') || str_starts_with($avatar, 'storage/')) {
                        $avatarUrl = url($avatar);
                    } else {
                        $avatarUrl = url('storage/' . $avatar);
                    }
                }
                
                $message->sender = [
                    'id' => $sender->id,
                    'name' => $sender->name,
                    'avatar' => $avatar,
                    'avatar_url' => $avatarUrl,
                ];
            }
            
            // Detect file type for attachments
            if ($message->file_path) {
                $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                $extension = strtolower(pathinfo($message->file_path, PATHINFO_EXTENSION));
                $message->attachment_type = in_array($extension, $imageExtensions) ? 'image' : 'file';
                
                // Debug: Log file type detection
                \Log::info('File type detection:', [
                    'file_path' => $message->file_path,
                    'extension' => $extension,
                    'attachment_type' => $message->attachment_type
                ]);
            } else {
                $message->attachment_type = null;
            }
            
            return $message;
        });

        // Mark unread messages as read when user opens chat
        $chat->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // Create new chat data structure to avoid Laravel re-serializing original relationships
        $chatData = [
            'id' => $chat->id,
            'client_id' => $chat->client_id,
            'freelancer_id' => $chat->freelancer_id,
            'status' => $chat->status,
            'created_at' => $chat->created_at,
            'updated_at' => $chat->updated_at,
            'last_message_at' => $chat->last_message_at,
            'client' => $chat->client,
            'freelancer' => $chat->freelancer,
            'workspace' => $chat->workspace,
        ];

        return Inertia::render('Marketplace/Chat', [
            'chat' => $chatData,
            'messages' => $messages,
            'currentUserId' => $user->id,
        ]);
    }

    public function markAsRead(PreProjectChat $chat)
    {
        $user = Auth::user();

        if (!$chat->isParticipant($user)) {
            abort(403);
        }

        // Mark unread messages as read
        $updatedCount = $chat->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'messages_marked_read' => $updatedCount,
            'unread_count' => 0
        ]);
    }

    public function sendMessage(Request $request, PreProjectChat $chat)
    {
        $user = Auth::user();

        if (!$chat->isParticipant($user)) {
            abort(403);
        }

        // Allow messaging even after workspace creation
        // Only block if chat is explicitly closed
        if ($chat->status === 'closed') {
            return response()->json(['error' => 'This chat has been closed.'], 422);
        }

        $data = $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        $message = PreProjectMessage::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'body' => $data['body'],
            'type' => 'text',
        ]);

        $chat->update(['last_message_at' => now()]);

    // Restore chat for the other participant if they had deleted it
    // (so new messages make the chat reappear in their list)
    $otherUserId = $chat->client_id === $user->id ? $chat->freelancer_id : $chat->client_id;
    \App\Models\ChatDeletion::where('user_id', $otherUserId)
        ->where('chat_id', $chat->id)
        ->delete();

        $message->load('sender:id,name,avatar');
        
        // Create proper array structure for message sender with avatar_url
        if ($message->sender) {
            $message->sender = [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
                'avatar' => $message->sender->avatar,
                'avatar_url' => $message->sender->avatar_url,
            ];
        }

        return response()->json($message);
    }

    public function uploadFile(Request $request, PreProjectChat $chat)
    {
        $user = Auth::user();

        if (!$chat->isParticipant($user)) {
            abort(403);
        }

        // Allow file sharing even after workspace creation
        // Only block if chat is explicitly closed
        if ($chat->status === 'closed') {
            return response()->json(['error' => 'This chat has been closed.'], 422);
        }

        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $path = $file->store('chat-files', 'public');

        $message = PreProjectMessage::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'body' => $file->getClientOriginalName(),
            'type' => 'file',
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
        ]);

        $chat->update(['last_message_at' => now()]);

        // Restore chat for the other participant if they had deleted it
        $otherUserId = $chat->client_id === $user->id ? $chat->freelancer_id : $chat->client_id;
        \App\Models\ChatDeletion::where('user_id', $otherUserId)
            ->where('chat_id', $chat->id)
            ->delete();

        $message->load('sender:id,name,avatar');
        
        // Create proper array structure for message sender with avatar_url
        if ($message->sender) {
            $message->sender = [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
                'avatar' => $message->sender->avatar,
                'avatar_url' => $message->sender->avatar_url,
            ];
        }

        return response()->json($message);
    }

    public function uploadMultipleFiles(Request $request, PreProjectChat $chat)
    {
        $user = Auth::user();

        if (!$chat->isParticipant($user)) {
            abort(403);
        }

        // Allow file sharing even after workspace creation
        // Only block if chat is explicitly closed
        if ($chat->status === 'closed') {
            return response()->json(['error' => 'This chat has been closed.'], 422);
        }

        $request->validate([
            'images.*' => 'required|file|image|max:5120', // 5MB max per image, image files only
        ]);

        $images = $request->file('images');
        $messages = [];

        foreach ($images as $image) {
            $path = $image->store('chat-files', 'public');

            $message = PreProjectMessage::create([
                'chat_id' => $chat->id,
                'sender_id' => $user->id,
                'body' => $image->getClientOriginalName(),
                'type' => 'file',
                'file_path' => $path,
                'file_name' => $image->getClientOriginalName(),
                'file_size' => $image->getSize(),
            ]);

            $message->load('sender:id,name,avatar');
            
            // Create proper array structure for message sender with avatar_url
            if ($message->sender) {
                $message->sender = [
                    'id' => $message->sender->id,
                    'name' => $message->sender->name,
                    'avatar' => $message->sender->avatar,
                    'avatar_url' => $message->sender->avatar_url,
                ];
            }

            // Detect file type for attachments
            if ($message->file_path) {
                $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                $extension = strtolower(pathinfo($message->file_path, PATHINFO_EXTENSION));
                $message->attachment_type = in_array($extension, $imageExtensions) ? 'image' : 'file';
            } else {
                $message->attachment_type = null;
            }

            $messages[] = $message;
        }

        $chat->update(['last_message_at' => now()]);

        // Restore chat for the other participant if they had deleted it
        $otherUserId = $chat->client_id === $user->id ? $chat->freelancer_id : $chat->client_id;
        \App\Models\ChatDeletion::where('user_id', $otherUserId)
            ->where('chat_id', $chat->id)
            ->delete();

        return response()->json($messages);
    }

    public function uploadVoice(Request $request, PreProjectChat $chat)
    {
        $user = Auth::user();

        if (!$chat->isParticipant($user)) {
            abort(403);
        }

        // Allow voice messages even after workspace creation
        // Only block if chat is explicitly closed
        if ($chat->status === 'closed') {
            return response()->json(['error' => 'This chat has been closed.'], 422);
        }

        $request->validate([
            'voice' => 'required|file|max:5120|mimes:webm,ogg,mp3,wav,m4a', // 5MB max, audio formats
        ]);

        $voiceFile = $request->file('voice');
        $path = $voiceFile->store('chat-voices', 'public');

        // Get audio duration (simplified - in production you might use a library like getID3)
        $duration = 0; // We'll store duration in frontend for now

        $message = PreProjectMessage::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'body' => 'Voice Message',
            'type' => 'voice',
            'file_path' => $path,
            'file_name' => $voiceFile->getClientOriginalName(),
            'file_size' => $voiceFile->getSize(),
        ]);

        $chat->update(['last_message_at' => now()]);

        // Restore chat for the other participant if they had deleted it
        $otherUserId = $chat->client_id === $user->id ? $chat->freelancer_id : $chat->client_id;
        \App\Models\ChatDeletion::where('user_id', $otherUserId)
            ->where('chat_id', $chat->id)
            ->delete();

        $message->load('sender:id,name,avatar');
        
        // Create proper array structure for message sender with avatar_url
        if ($message->sender) {
            $message->sender = [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
                'avatar' => $message->sender->avatar,
                'avatar_url' => $message->sender->avatar_url,
            ];
        }

        return response()->json($message);
    }

    public function archive(PreProjectChat $chat)
    {
        $user = Auth::user();

        if (!$chat->isParticipant($user)) {
            abort(403);
        }

        $chat->update(['status' => 'archived']);

        return redirect()->route('marketplace.chats.index')
            ->with('success', 'Chat archived.');
    }

    public function convert(Request $request, PreProjectChat $chat)
    {
        $user = Auth::user();

        if ($chat->freelancer_id !== $user->id) {
            abort(403, 'Only the freelancer can start a project.');
        }

        // Allow conversion if chat is open OR archived OR already converted (in case of recreation)
        // Archived chats can now be converted since archive functionality was removed

        // If already converted, redirect to existing workspace
        if ($chat->status === 'converted_to_workspace' && $chat->workspace_id) {
            $workspace = \App\Models\Workspace::find($chat->workspace_id);
            if ($workspace) {
                session(['current_workspace_id' => $workspace->id]);
                return redirect()->route('dashboard')
                    ->with('info', "Workspace '{$workspace->name}' already exists. You've been redirected there.");
            } else {
                // Workspace was deleted, reset chat status to allow recreation
                $chat->update([
                    'status' => 'open',
                    'workspace_id' => null
                ]);
            }
        }

        $data = $request->validate([
            'workspace_name' => 'required|string|max:255',
        ]);

        $service = new WorkspaceCreationService();
        $workspace = $service->createFromChat($chat, $data['workspace_name']);

        // Set the new workspace as current
        session(['current_workspace_id' => $workspace->id]);

        return redirect()->route('dashboard')
            ->with('success', "Workspace '{$workspace->name}' created! You can now manage the project.");
    }

    /**
     * Delete a chat for the current user (user-specific soft delete).
     */
    public function delete(PreProjectChat $chat)
    {
        $user = Auth::user();

        if (!$chat->isParticipant($user)) {
            abort(403);
        }

        // Create a chat deletion record
        \App\Models\ChatDeletion::firstOrCreate([
            'user_id' => $user->id,
            'chat_id' => $chat->id,
        ]);

        // Redirect back to chats list (Inertia-compatible)
        return redirect()->route('marketplace.chats.index')
            ->with('success', 'Chat deleted successfully.');
    }

    /**
     * Restore chat access for the current user (undo deletion).
     */
    public function restore(PreProjectChat $chat)
    {
        $user = Auth::user();

        if (!$chat->isParticipant($user)) {
            abort(403);
        }

        // Remove the chat deletion record
        \App\Models\ChatDeletion::where('user_id', $user->id)
            ->where('chat_id', $chat->id)
            ->delete();

        return redirect()->route('marketplace.chats.show', $chat->id)
            ->with('success', 'Chat restored successfully.');
    }
}
