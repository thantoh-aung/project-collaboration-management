<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleSocialiteController extends Controller
{
    /**
     * Redirect to Google OAuth provider.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Redirect to Google OAuth with role selection.
     */
    public function redirectToGoogleWithRole($usage_type)
    {
        // Validate usage_type
        if (!in_array($usage_type, ['client', 'freelancer'])) {
            return redirect()->route('register')
                ->with('error', 'Invalid account type selected.');
        }

        // Store the usage type in session
        session(['google_oauth_usage_type' => $usage_type]);

        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google OAuth callback.
     */
    public function handleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // Check if user exists by google_id
            $user = User::where('google_id', $googleUser->getId())->first();

            // If user doesn't exist by google_id, check by email
            if (! $user) {
                $user = User::where('email', $googleUser->getEmail())->first();

                // If user exists by email, update with google_id
                if ($user) {
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar() ?? $user->avatar,
                    ]);
                }
            }

            // Create new user if doesn't exist
            if (! $user) {
                // Get usage type from session (set during role selection)
                $usageType = session('google_oauth_usage_type', 'freelancer');
                
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'email_verified_at' => now(),
                    'role' => 'team_member',
                    'usage_type' => $usageType,
                    'onboarding_completed' => false,
                ]);

                // Clear the session value
                session()->forget('google_oauth_usage_type');
            } else {
                // Update existing user's avatar if available
                if ($googleUser->getAvatar() && ! $user->avatar) {
                    $user->update([
                        'avatar' => $googleUser->getAvatar(),
                    ]);
                }
            }

            // Log the user in
            Auth::login($user, true);

            $request->session()->regenerate();

            // Check if user has completed onboarding
            if (!$user->onboarding_completed) {
                // Redirect to onboarding for new users
                return redirect()->route('onboarding.profile')
                    ->with('success', 'Welcome! Let\'s set up your profile to get started.');
            }

            return redirect()->intended('/dashboard');
        } catch (\Exception $e) {
            return redirect()->route('login')
                ->with('error', 'Unable to login with Google. Please try again.');
        }
    }
}
