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
                    // Generate avatar URL similar to User model logic
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
                ];

                // Get recent posted projects
                $postedProjects = ProjectPost::where('user_id', $user->id)
                    ->orderByDesc('created_at')
                    ->limit(3)
                    ->get(['id', 'title', 'description', 'budget_min', 'budget_max', 'deadline']);

                $profileData['posted_projects'] = $postedProjects;
            }
        }

        return response()->json($profileData);
    }
}
