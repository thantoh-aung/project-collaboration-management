<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\FreelancerProfile;
use App\Models\ClientProfile;
use App\Models\ProjectPost;
use Illuminate\Http\Request;

class UserProfileController extends Controller
{
    public function show(User $user)
    {
        $profileData = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'avatar_url' => $user->avatar_url,
                'created_at' => $user->created_at,
            ],
            'type' => $user->usage_type,
        ];

        if ($user->usage_type === 'freelancer') {
            $freelancerProfile = $user->freelancerProfile;
            if ($freelancerProfile) {
                // Prioritize freelancer profile avatar over user avatar
                $avatar = $freelancerProfile->avatar ?? $user->avatar;
                $avatarUrl = null;
                
                if ($avatar) {
                    if (str_starts_with($avatar, 'http')) {
                        $avatarUrl = $avatar;
                    } elseif (str_starts_with($avatar, '/storage/') || str_starts_with($avatar, 'storage/')) {
                        $avatarUrl = url($avatar);
                    } else {
                        $avatarUrl = url('storage/' . $avatar);
                    }
                }
                
                // Update user avatar data with prioritized freelancer avatar
                $profileData['user']['avatar'] = $avatar;
                $profileData['user']['avatar_url'] = $avatarUrl;
                
                $profileData['freelancer_profile'] = [
                    'title' => $freelancerProfile->title,
                    'bio' => $freelancerProfile->bio,
                    'skills' => $freelancerProfile->skills ?? [],
                    'rate_min' => $freelancerProfile->rate_min,
                    'rate_max' => $freelancerProfile->rate_max,
                    'rate_currency' => $freelancerProfile->rate_currency,
                    'availability' => $freelancerProfile->availability,
                    'country' => $freelancerProfile->country,
                    'timezone' => $freelancerProfile->timezone,
                    'portfolio_links' => $freelancerProfile->portfolio_links ?? [],
                    'github_link' => $freelancerProfile->github_link,
                    'linkedin_link' => $freelancerProfile->linkedin_link,
                    'website_link' => $freelancerProfile->website_link,
                    'total_projects' => $freelancerProfile->total_projects,
                    'avg_rating' => $freelancerProfile->avg_rating,
                    'status' => $freelancerProfile->status,
                    'featured' => $freelancerProfile->featured,
                    'cv_path' => $freelancerProfile->cv_path,
                    'reviews' => $freelancerProfile->reviews()
                        ->with('client:id,name,avatar')
                        ->latest()
                        ->get(),
                ];

                // Stats for freelancer
                $profileData['stats'] = [
                    'member_since' => $user->created_at->format('M Y'),
                    'workspaces_count' => \App\Models\Workspace::whereHas('users', fn($q) => $q->where('users.id', $user->id))->count(),
                    'avg_rating' => round($freelancerProfile->avg_rating ?? 0, 1),
                ];
            }
        } elseif ($user->usage_type === 'client') {
            $clientProfile = $user->clientProfile;
            if ($clientProfile) {
                $profileData['client_profile'] = [
                    'company_name' => $clientProfile->company_name,
                    'industry' => $clientProfile->industry,
                    'country' => $clientProfile->country,
                    'timezone' => $clientProfile->timezone,
                    'website' => $clientProfile->website,
                    'avg_rating' => round($clientProfile->avg_rating ?? 0, 1),
                ];

                // Get recent posted projects
                $postedProjects = ProjectPost::where('user_id', $user->id)
                    ->orderByDesc('created_at')
                    ->limit(3)
                    ->get(['id', 'title', 'description', 'budget_min', 'budget_max', 'deadline']);

                $profileData['posted_projects'] = $postedProjects;

                // Stats
                $profileData['stats'] = [
                    'member_since' => $user->created_at->format('M Y'),
                    'projects_posted' => ProjectPost::where('user_id', $user->id)->count(),
                    'workspaces_count' => \App\Models\Workspace::where('owner_id', $user->id)->count()
                        + \App\Models\Workspace::whereHas('users', fn($q) => $q->where('users.id', $user->id))->count(),
                    'avg_rating' => round($clientProfile->avg_rating ?? 0, 1),
                    'review_count' => \App\Models\ClientReview::where('client_id', $user->id)->count(),
                ];

                // Trust badges
                $profileData['badges'] = [
                    'email_verified' => $user->email_verified_at !== null,
                    'has_website' => !empty($clientProfile->website),
                    'profile_complete' => !empty($clientProfile->company_name) && !empty($clientProfile->industry) && !empty($clientProfile->country),
                ];

                // Client reviews from freelancers
                $profileData['client_reviews'] = \App\Models\ClientReview::where('client_id', $user->id)
                    ->with('freelancer:id,name,avatar')
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get();
            }
        }

        // Add chat and collaboration status relative to the authenticated user
        $currentUser = auth()->user();
        $hasExistingChat = false;
        $existingChatId = null;
        $hasExistingCollab = false;
        $existingCollabId = null;

        if ($currentUser) {
            // Check for client-freelancer chat (either direction)
            $chat = \App\Models\PreProjectChat::where(function ($q) use ($currentUser, $user) {
                $q->where('client_id', $currentUser->id)->where('freelancer_id', $user->id);
            })->orWhere(function ($q) use ($currentUser, $user) {
                $q->where('freelancer_id', $currentUser->id)->where('client_id', $user->id);
            })->first();

            if ($chat) {
                $hasExistingChat = true;
                $existingChatId = $chat->id;
            }

            // Check for freelancer-freelancer collaboration
            if ($currentUser->usage_type === 'freelancer' && $user->usage_type === 'freelancer' && $currentUser->id !== $user->id) {
                $userOneId = min($currentUser->id, $user->id);
                $userTwoId = max($currentUser->id, $user->id);
                $collab = \App\Models\FreelancerCollaboration::where('user_one_id', $userOneId)
                    ->where('user_two_id', $userTwoId)
                    ->first();
                if ($collab) {
                    $hasExistingCollab = true;
                    $existingCollabId = $collab->id;
                }
            }
        }

        $profileData['hasExistingChat'] = $hasExistingChat;
        $profileData['existingChatId'] = $existingChatId;
        $profileData['hasExistingCollab'] = $hasExistingCollab;
        $profileData['existingCollabId'] = $existingCollabId;

        return response()->json($profileData);
    }
}
