<?php

namespace App\Http\Controllers;

use App\Models\FreelancerCollaboration;
use App\Models\CollaborationMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FreelancerCollaborationController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $collaborations = FreelancerCollaboration::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->with([
                'userOne:id,name,avatar,email,usage_type',
                'userTwo:id,name,avatar,email,usage_type',
                'messages' => fn($q) => $q->latest()->limit(1),
            ])
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($collab) use ($user) {
                $otherUser = $collab->getOtherParticipant($user);
                $collab->other_user = $otherUser ? [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'avatar_url' => $otherUser->avatar_url,
                    'usage_type' => $otherUser->usage_type,
                ] : null;

                $collab->unread_count = $collab->messages()
                    ->where('sender_id', '!=', $user->id)
                    ->whereNull('read_at')
                    ->count();

                return $collab;
            });

        return Inertia::render('Marketplace/CollaborationList', [
            'collaborations' => $collaborations,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $request->validate([
            'partner_id' => 'required|exists:users,id',
        ]);

        $partnerId = (int) $request->partner_id;

        if ($user->id === $partnerId) {
            return back()->with('error', 'You cannot message yourself.');
        }

        $userOneId = min($user->id, $partnerId);
        $userTwoId = max($user->id, $partnerId);

        $collaboration = FreelancerCollaboration::firstOrCreate([
            'user_one_id' => $userOneId,
            'user_two_id' => $userTwoId,
        ]);

        return redirect()->route('marketplace.collaborations.show', $collaboration->id);
    }

    public function show(FreelancerCollaboration $collaboration)
    {
        $user = Auth::user();

        if (!$collaboration->isParticipant($user)) {
            abort(403);
        }

        $collaboration->load(['userOne', 'userTwo']);

        $messages = $collaboration->messages()
            ->with('sender:id,name,avatar,usage_type')
            ->orderBy('created_at')
            ->get();

        // Mark messages as read
        $collaboration->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $otherUser = $collaboration->getOtherParticipant($user);

        return Inertia::render('Marketplace/CollaborationChat', [
            'collaboration' => $collaboration,
            'messages' => $messages,
            'otherUser' => $otherUser ? [
                'id' => $otherUser->id,
                'name' => $otherUser->name,
                'avatar_url' => $otherUser->avatar_url,
                'usage_type' => $otherUser->usage_type,
            ] : null,
            'currentUserId' => $user->id,
        ]);
    }

    public function sendMessage(Request $request, FreelancerCollaboration $collaboration)
    {
        $user = Auth::user();

        if (!$collaboration->isParticipant($user)) {
            abort(403);
        }

        $data = $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        $message = CollaborationMessage::create([
            'collaboration_id' => $collaboration->id,
            'sender_id' => $user->id,
            'body' => $data['body'],
            'type' => 'text',
        ]);

        $collaboration->update(['last_message_at' => now()]);

        $message->load('sender:id,name,avatar,usage_type');

        return response()->json($message);
    }
    public function markRead(FreelancerCollaboration $collaboration)
    {
        $user = Auth::user();
        if (!$collaboration->isParticipant($user)) {
            abort(403);
        }

        $updatedCount = $collaboration->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'messages_marked_read' => $updatedCount,
            'unread_count' => 0
        ]);
    }
}
