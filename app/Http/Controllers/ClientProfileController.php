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

        // Get client's posted projects
        $projects = ProjectPost::where('user_id', $user->id)
            ->with('user:id,name,avatar,email')
            ->orderByDesc('created_at')
            ->paginate(12);

        return Inertia::render('Marketplace/ClientProfile', [
            'profile' => $profile,
            'projects' => $projects,
            'user' => $user->only(['id', 'name', 'avatar', 'avatar_url', 'job_title']),
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
