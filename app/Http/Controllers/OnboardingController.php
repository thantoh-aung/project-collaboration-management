<?php

namespace App\Http\Controllers;

use App\Models\FreelancerProfile;
use App\Models\ClientProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OnboardingController extends Controller
{
    public function showProfile()
    {
        $user = Auth::user();

        \Log::info('Onboarding showProfile', [
            'user_id' => $user?->id,
            'session_id' => session()->getId(),
            'session_token' => session()->token(),
            'has_xsrf_cookie' => request()->hasCookie('XSRF-TOKEN'),
        ]);

        if ($user->onboarding_completed) {
            return $this->redirectAfterOnboarding($user);
        }

        if ($user->usage_type === 'freelancer') {
            $profile = $user->freelancerProfile;
            return Inertia::render('Onboarding/FreelancerProfile', [
                'profile' => $profile,
            ]);
        }

        if ($user->usage_type === 'client') {
            $profile = $user->clientProfile;
            return Inertia::render('Onboarding/ClientProfile', [
                'profile' => $profile,
            ]);
        }

        // Team members skip onboarding
        if ($user->usage_type === 'team_member') {
            $user->update(['onboarding_completed' => true]);
            return redirect()->route('pending-invitation');
        }

        // Fallback — no usage_type set yet, redirect to dashboard
        return redirect()->route('dashboard');
    }

    public function saveProfile(Request $request)
    {
        \Log::info('Onboarding saveProfile attempt', [
            'session_id' => $request->session()->getId(),
            'session_token' => $request->session()->token(),
            'request_token' => $request->input('_token'),
            'header_token' => $request->header('X-CSRF-TOKEN'),
            'has_xsrf_cookie' => $request->hasCookie('XSRF-TOKEN'),
        ]);

        $user = Auth::user();

        if ($user->usage_type === 'freelancer') {
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
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'cv' => 'required|file|mimes:pdf,png,jpg,jpeg|max:5120',
            ]);
            
            // Handle CV upload
            if ($request->hasFile('cv')) {
                $cvPath = $request->file('cv')->store('resumes', 'public');
                $data['cv_path'] = '/storage/' . $cvPath;
            }

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $path = $request->file('avatar')->store('profile-photos', 'public');
                $data['avatar'] = '/storage/' . $path;
                // Also update user's avatar
                $user->update(['avatar' => '/storage/' . $path]);
                
                \Log::info('Avatar uploaded in freelancer onboarding', [
                    'user_id' => $user->id,
                    'path' => $path,
                    'data_avatar' => $data['avatar'],
                    'user_avatar_after' => $user->fresh()->avatar,
                    'user_avatar_url_after' => $user->fresh()->avatar_url
                ]);
            }

            $profile = FreelancerProfile::updateOrCreate(
                ['user_id' => $user->id],
                array_merge($data, [
                    'slug' => FreelancerProfile::generateSlug($user->name),
                    'status' => 'draft',
                ])
            );
        }

        if ($user->usage_type === 'client') {
            $data = $request->validate([
                'company_name' => 'nullable|string|max:255',
                'industry' => 'nullable|string|max:255',
                'country' => 'nullable|string|max:100',
                'timezone' => 'nullable|string|max:100',
                'website' => 'nullable|url|max:500',
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $path = $request->file('avatar')->store('profile-photos', 'public');
                $data['avatar'] = '/storage/' . $path;
                // Also update user's avatar
                $user->update(['avatar' => '/storage/' . $path]);
                
                \Log::info('Avatar uploaded in client onboarding', [
                    'user_id' => $user->id,
                    'path' => $path,
                    'data_avatar' => $data['avatar'],
                    'user_avatar_after' => $user->fresh()->avatar,
                    'user_avatar_url_after' => $user->fresh()->avatar_url
                ]);
            }

            ClientProfile::updateOrCreate(
                ['user_id' => $user->id],
                $data
            );
        }

        $user->update(['onboarding_completed' => true]);

        // Refresh user model to get latest avatar data
        $user->refresh();
        
        // Re-authenticate user to ensure session has latest data
        Auth::login($user);
        
        // Clear any cached user data in session
        session()->forget(['auth.user', 'user']);

        return $this->redirectAfterOnboarding($user);
    }

    public function skip()
    {
        $user = Auth::user();
        $user->update(['onboarding_completed' => true]);

        return $this->redirectAfterOnboarding($user);
    }

    private function redirectAfterOnboarding($user)
    {
        if ($user->usage_type === 'team_member') {
            return redirect()->route('pending-invitation');
        }

        return redirect()->route('marketplace.home')
            ->with('success', 'Profile setup complete! Welcome to the marketplace.');
    }
}
