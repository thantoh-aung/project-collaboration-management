<?php

namespace App\Http\Controllers;

use App\Models\FreelancerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FreelancerProfileController extends Controller
{
    public function show()
    {
        $user = Auth::user();
        $profile = $user->freelancerProfile;

        if (!$profile) {
            $profile = FreelancerProfile::create([
                'user_id' => $user->id,
                'slug' => FreelancerProfile::generateSlug($user->name),
                'status' => 'draft',
            ]);
        }

        return Inertia::render('Marketplace/MyProfile', [
            'profile' => $profile,
            'user' => $user->only(['id', 'name', 'avatar', 'avatar_url', 'job_title']),
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'bio' => 'nullable|string|max:2000',
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:50',
            'portfolio_links' => 'nullable|array',
            'portfolio_links.*.title' => 'required_with:portfolio_links|string|max:255',
            'portfolio_links.*.url' => 'required_with:portfolio_links|url|max:500',
            'github_link' => 'nullable|url|max:500',
            'linkedin_link' => 'nullable|url|max:500',
            'website_link' => 'nullable|url|max:500',
            'rate_min' => 'nullable|numeric|min:0',
            'rate_max' => 'nullable|numeric|min:0',
            'rate_currency' => 'nullable|string|max:3',
            'availability' => 'nullable|in:available,limited,unavailable',
            'country' => 'nullable|string|max:100',
            'timezone' => 'nullable|string|max:100',
        ]);

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $request->validate(['avatar' => 'image|mimes:jpeg,png,jpg,webp|max:2048']);
            $path = $request->file('avatar')->store('profile-photos', 'public');
            $data['avatar'] = '/storage/' . $path;
            // Also sync avatar to users table so navbar stays updated
            $user->update(['avatar' => '/storage/' . $path]);
        }

        $profile = FreelancerProfile::updateOrCreate(
            ['user_id' => $user->id],
            $data
        );

        return redirect()->back()->with('success', 'Profile updated successfully.');
    }

    public function publish()
    {
        $user = Auth::user();
        $profile = $user->freelancerProfile;

        if (!$profile) {
            return redirect()->back()->with('error', 'Please complete your profile first.');
        }

        if (!$profile->title) {
            return redirect()->back()->with('error', 'A title is required to publish your profile.');
        }

        $profile->update(['status' => 'published']);

        return redirect()->back()->with('success', 'Your profile is now live on the marketplace!');
    }

    public function unpublish()
    {
        $user = Auth::user();
        $profile = $user->freelancerProfile;

        if ($profile) {
            $profile->update(['status' => 'draft']);
        }

        return redirect()->back()->with('success', 'Your profile has been unpublished.');
    }
}
