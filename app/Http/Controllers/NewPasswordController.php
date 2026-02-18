<?php

namespace App\Http\Controllers;

use App\Http\Requests\ResetPasswordRequest;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class NewPasswordController extends Controller
{
    /**
     * Show the reset password form.
     */
    public function create(Request $request)
    {
        return Inertia::render('Auth/NewPassword', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Handle the password reset request.
     */
    public function store(ResetPasswordRequest $request)
    {
        \Log::info('=== Password Reset Request Started ===');
        \Log::info('Request data:', [
            'email' => $request->email,
            'token' => $request->token ? 'present' : 'missing',
            'password' => $request->password ? 'present' : 'missing',
            'password_confirmation' => $request->password_confirmation ? 'present' : 'missing'
        ]);
        
        // Ensure CSRF token is fresh
        $request->session()->regenerateToken();
        
        // Simple email format validation to avoid infinite loop
        if (!filter_var($request->email, FILTER_VALIDATE_EMAIL)) {
            \Log::error('Invalid email format:', ['email' => $request->email]);
            throw ValidationException::withMessages([
                'email' => ['Please enter a valid email address.'],
            ]);
        }
        
        // Check if user exists first to avoid issues
        $user = \App\Models\User::where('email', $request->email)->first();
        if (!$user) {
            \Log::error('User not found for email:', ['email' => $request->email]);
            throw ValidationException::withMessages([
                'email' => ['This email address is not registered.'],
            ]);
        }
        
        \Log::info('User found:', ['user_id' => $user->id]);
        
        // Here we will attempt to reset the user's password. If it is successful we
        // will update the password on an actual user model and persist it to the
        // database. Otherwise we will parse the error and return the response.
        try {
            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user) use ($request) {
                    \Log::info('Password reset callback triggered for user:', ['user_id' => $user->id, 'email' => $user->email]);
                    
                    $user->forceFill([
                        'password' => Hash::make($request->password),
                        'remember_token' => Str::random(60),
                    ])->save();

                    \Log::info('Password updated successfully for user:', ['user_id' => $user->id]);
                    event(new PasswordReset($user));
                }
            );

            \Log::info('Password reset status:', ['status' => $status]);
        } catch (\Exception $e) {
            \Log::error('Password reset exception:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw ValidationException::withMessages([
                'email' => ['Password reset failed. Please try again or request a new reset link.'],
            ]);
        }

        // Save session before redirect
        $request->session()->save();

        // If the password was successfully reset, we will redirect the user back to
        // the application's home authenticated view. If there is an error we can
        // redirect them back to where they came from with their error message.
        if ($status == Password::PASSWORD_RESET) {
            \Log::info('Password reset successful, redirecting to login');
            return redirect()->route('login')
                ->with('status', __($status))
                ->with('success', 'Your password has been reset successfully. Please login with your new password.');
        }

        \Log::error('Password reset failed:', ['status' => $status]);
        
        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }
}
