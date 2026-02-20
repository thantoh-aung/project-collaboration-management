<?php

namespace App\Http\Controllers;

use App\Models\ClientProfile;
use App\Models\ProjectPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClientProfileController extends Controller
{
    public function show()
    {
        $user = Auth::user();
        $profile = $user->clientProfile;

        if (!$profile) {
            $profile = ClientProfile::create(['user_id' => $user->id]);
        }

        // Load the user relationship on the profile
        $profile->load('user:id,name,avatar,email,email_verified_at,created_at');

        // Get client's posted projects
        $projects = ProjectPost::where('user_id', $user->id)
            ->with('user:id,name,avatar,email')
            ->orderByDesc('created_at')
            ->paginate(12);

        // Client reviews from freelancers
        $reviews = \App\Models\ClientReview::where('client_id', $user->id)
            ->with('freelancer:id,name,avatar')
            ->orderByDesc('created_at')
            ->get();

        // Stats computed from existing data
        $stats = [
            'member_since' => $user->created_at->format('M Y'),
            'projects_posted' => ProjectPost::where('user_id', $user->id)->count(),
            'workspaces_count' => \App\Models\Workspace::where('owner_id', $user->id)->count()
                + \App\Models\Workspace::whereHas('users', fn($q) => $q->where('users.id', $user->id))->count(),
            'avg_rating' => round($profile->avg_rating ?? 0, 1),
            'review_count' => \App\Models\ClientReview::where('client_id', $user->id)->count(),
        ];

        // Trust badges
        $badges = [
            'email_verified' => $user->email_verified_at !== null,
            'has_website' => !empty($profile->website),
            'profile_complete' => !empty($profile->company_name) && !empty($profile->industry) && !empty($profile->country),
        ];

        // Check if the current viewer (if freelancer) can review this client
        $canReview = false;
        $existingReview = null;
        $viewer = Auth::user();
        if ($viewer && $viewer->usage_type === 'freelancer' && $viewer->id !== $user->id) {
            $hasSharedWorkspace = \App\Models\Workspace::where('owner_id', $user->id)
                ->whereHas('users', fn($q) => $q->where('users.id', $viewer->id))
                ->exists();
            if (!$hasSharedWorkspace) {
                $hasSharedWorkspace = \App\Models\Workspace::where('owner_id', $viewer->id)
                    ->whereHas('users', fn($q) => $q->where('users.id', $user->id))
                    ->exists();
            }
            $canReview = $hasSharedWorkspace;

            if ($canReview) {
                $existingReview = \App\Models\ClientReview::where('freelancer_id', $viewer->id)
                    ->where('client_id', $user->id)
                    ->first();
            }
        }

        return Inertia::render('Marketplace/ClientProfile', [
            'profile' => $profile,
            'projects' => $projects,
            'reviews' => $reviews,
            'stats' => $stats,
            'badges' => $badges,
            'canReview' => $canReview,
            'existingReview' => $existingReview,
        ]);
    }

    public function edit()
    {
        $user = Auth::user();
        $profile = $user->clientProfile;

        if (!$profile) {
            $profile = ClientProfile::create(['user_id' => $user->id]);
        }

        return Inertia::render('Marketplace/ClientProfileEdit', [
            'profile' => $profile,
            'user' => $user->only(['id', 'name', 'avatar', 'avatar_url', 'job_title']),
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $data = $request->validate([
            'company_name' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:100',
            'timezone' => 'nullable|string|max:100',
            'website' => 'nullable|url|max:500',
        ]);

        // Handle avatar upload (stored on users table)
        if ($request->hasFile('avatar')) {
            $request->validate(['avatar' => 'image|mimes:jpeg,png,jpg,webp|max:2048']);
            $path = $request->file('avatar')->store('profile-photos', 'public');
            $user->update(['avatar' => '/storage/' . $path]);
        }

        ClientProfile::updateOrCreate(
            ['user_id' => $user->id],
            $data
        );

        return redirect()->route('marketplace.client-profile')->with('success', 'Profile updated successfully.');
    }
}
