<?php

namespace App\Http\Controllers;

use App\Models\WorkspaceInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InvitationController extends Controller
{
    /**
     * Show the invitation page (guest accessible).
     */
    public function show(string $token)
    {
        $invitation = WorkspaceInvitation::where('token', $token)
            ->with(['workspace.owner', 'inviter'])
            ->firstOrFail();

        if (!$invitation->isValid()) {
            return Inertia::render('Auth/InviteAccept', [
                'invitation' => null,
                'error' => 'This invitation is invalid or has expired.',
            ]);
        }

        // If user is logged in, check if the invitation matches their email
        $user = Auth::user();
        if ($user && $user->email !== $invitation->email) {
            return Inertia::render('Auth/InviteAccept', [
                'invitation' => null,
                'error' => 'This invitation is not for your account.',
            ]);
        }

        // Guest users: remember invite token so login/register can join the correct workspace
        if (!$user) {
            session(['invite_token' => $token]);
        }

        return Inertia::render('Auth/InviteAccept', [
            'invitation' => $invitation,
            'auth' => $user ? ['user' => $user] : null,
        ]);
    }

    /**
     * Accept the invitation (guest accessible, but must be logged in).
     */
    public function accept(Request $request, string $token)
    {
        $invitation = WorkspaceInvitation::where('token', $token)
            ->with('workspace')
            ->firstOrFail();

        if (!$invitation->isValid()) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Invalid or expired invitation.'], 422);
            }
            return back()->withErrors(['error' => 'Invalid or expired invitation.']);
        }

        $user = Auth::user();
        if (!$user) {
            // Not logged in: store invite token in session and redirect to login
            session(['invite_token' => $token]);
            if ($request->expectsJson()) {
                return response()->json(['error' => 'You must be logged in to accept an invitation.'], 401);
            }
            return redirect()->route('login')
                ->with('info', 'Please log in or register to accept the invitation.');
        }

        if ($user->email !== $invitation->email) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'This invitation is not for your email address.'], 403);
            }
            return back()->withErrors(['error' => 'This invitation is not for your email address.']);
        }

        // Accept the invitation (adds user to workspace and marks invitation accepted)
        $invitation->accept($user);

        // Clear pending invite token from session
        $request->session()->forget('invite_token');

        // Set current workspace session
        session(['current_workspace_id' => $invitation->workspace_id]);

        if ($request->expectsJson()) {
            $redirect = $user->onboarding_completed ? route('dashboard') : route('onboarding.profile');
            return response()->json(['message' => 'Invitation accepted successfully.', 'redirect' => $redirect]);
        }

        if (!$user->onboarding_completed) {
            return redirect()->route('onboarding.profile')
                ->with('success', "Welcome! Invitation accepted. Please complete your profile to get started.");
        }

        return redirect()->intended(route('dashboard'))
            ->with('success', "Welcome to {$invitation->workspace->name}!");
    }
}
