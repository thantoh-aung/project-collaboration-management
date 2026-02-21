<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AuthenticationController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request)
    {
        // Check if user is coming from invitation
        $inviteToken = $request->session()->get('invite_token');
        
        // Fallback: check if token is in URL parameter
        if (!$inviteToken && $request->has('invite')) {
            $inviteToken = $request->get('invite');
            // Store it in session for future requests
            if ($inviteToken) {
                session(['invite_token' => $inviteToken]);
            }
        }
        
        $invitation = null;
        
        if ($inviteToken) {
            $invitation = \App\Models\WorkspaceInvitation::where('token', $inviteToken)
                ->where('expires_at', '>', now())
                ->with(['workspace.owner', 'inviter'])
                ->first();
            \Log::info('Login page - invitation found: ' . ($invitation ? 'YES' : 'NO'));
        }

        return Inertia::render('Auth/Login', [
            'invitation' => $invitation,
        ]);
    }

    /**
     * Handle login request.
     */
    public function store(LoginRequest $request)
    {
        $request->authenticate();

        // Regenerate the session ID to prevent fixation
        $request->session()->regenerate();

        $user = Auth::user();
        
        \Log::info('User login attempt', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'user_role' => $user->role
        ]);
        
        // Check if user is logging in via invitation
        $inviteToken = $request->session()->get('invite_token');
        if ($inviteToken) {
            \Log::info('Processing invitation during login', ['token' => $inviteToken]);
            
            $invitation = \App\Models\WorkspaceInvitation::where('token', $inviteToken)
                ->where('expires_at', '>', now())
                ->first();
                
            if ($invitation && $invitation->email === $user->email) {
                \Log::info('Accepting invitation during login', [
                    'user_id' => $user->id,
                    'workspace_id' => $invitation->workspace_id,
                    'role' => $invitation->role
                ]);
                
                // Accept the invitation
                $invitation->workspace->addUser($user, $invitation->role);
                $invitation->delete();
                
                // Clear invitation token
                $request->session()->forget('invite_token');
                
                // Set current workspace to the invited workspace
                session(['current_workspace_id' => $invitation->workspace_id]);
                
                // If freelancer onboarding not completed, redirect to onboarding
                if ($user->usage_type === 'freelancer' && !$user->onboarding_completed) {
                    return redirect()->route('onboarding.profile')->with('info', 'Please complete your freelancer profile to gain full access.');
                }
                
                return redirect()->route('dashboard')->with('success', 'Welcome! You\'ve joined the workspace successfully.');
            }
        }
        
        // Check if user owns any workspace
        $ownedWorkspaces = \App\Models\Workspace::where('owner_id', $user->id)->get();
        
        // Fetch all workspaces user belongs to (for navigation)
        $userWorkspaces = $user->workspaces()
            ->whereHas('workspaceUsers', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['owner', 'workspaceUsers' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }])
            ->get();

        \Log::info('User workspaces found', [
            'user_id' => $user->id,
            'owned_workspaces' => $ownedWorkspaces->count(),
            'total_workspaces' => $userWorkspaces->count(),
            'workspaces' => $userWorkspaces->pluck('name', 'id')->toArray()
        ]);

        // Check if user is logging in via invitation
        $inviteToken = $request->session()->get('invite_token');
        
        if ($inviteToken) {
            // Handle invitation acceptance
            $invitation = WorkspaceInvitation::where('token', $inviteToken)
                ->where('email', $user->email)
                ->where('expires_at', '>', now())
                ->with('workspace')
                ->first();
                
            if ($invitation) {
                $invitation->accept($user);

                $workspace = $invitation->workspace;
                
                // Clear invite token from session
                $request->session()->forget('invite_token');
                
                // Set current workspace
                session(['current_workspace_id' => $workspace->id]);
                
                // If freelancer onboarding not completed, redirect to onboarding
                if ($user->usage_type === 'freelancer' && !$user->onboarding_completed) {
                    return redirect()->route('onboarding.profile')->with('info', 'Please complete your freelancer profile to gain full access.');
                }
                
                return redirect()->route('dashboard')
                    ->with('success', "Welcome! You've joined '{$workspace->name}'.");
            }
        }

        // Handle workspace selection for regular login
        if ($userWorkspaces->isEmpty()) {
            // No workspaces — route based on usage_type
            if ($user->usage_type === 'client' || $user->usage_type === 'freelancer') {
                // Clients/Freelancers go to marketplace (no workspace needed)
                if (!$user->onboarding_completed) {
                    return redirect()->route('onboarding.profile');
                }
                return redirect()->route('marketplace.home');
            }

            if ($user->usage_type === 'team_member') {
                return redirect()->route('pending-invitation');
            }

            // Legacy users (no usage_type) — create workspace for backward compatibility
            $workspace = Workspace::create([
                'name' => $user->name . "'s Workspace",
                'slug' => Workspace::generateSlug($user->name . "'s Workspace"),
                'description' => 'Personal workspace for ' . $user->name,
                'owner_id' => $user->id,
                'join_code' => Workspace::generateJoinCode(),
                'is_active' => true,
            ]);

            $workspace->addUser($user, 'admin');
            session(['current_workspace_id' => $workspace->id]);

            return redirect()->route('onboarding.wizard')
                ->with('success', "Welcome! Your workspace has been created.");
        } elseif ($userWorkspaces->count() === 1) {
            // Auto-select single workspace
            $workspace = $userWorkspaces->first();
            session(['current_workspace_id' => $workspace->id]);
            
            \Log::info('Auto-selected single workspace', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
                'workspace_name' => $workspace->name
            ]);
            
            return redirect()->route('dashboard');
        } else {
            // Multiple workspaces - prioritize user's own workspace
            $ownWorkspace = $userWorkspaces->firstWhere('owner_id', $user->id);
            
            if ($ownWorkspace) {
                // Auto-select user's own workspace
                session(['current_workspace_id' => $ownWorkspace->id]);
                
                \Log::info('Auto-selected user\'s own workspace', [
                    'user_id' => $user->id,
                    'workspace_id' => $ownWorkspace->id,
                    'workspace_name' => $ownWorkspace->name
                ]);
                
                return redirect()->route('dashboard');
            } else {
                // No own workspace (shouldn't happen with new logic) - show selector
                \Log::info('Redirecting to workspace selector', [
                    'user_id' => $user->id,
                    'workspace_count' => $userWorkspaces->count()
                ]);
                
                return redirect()->route('workspaces.select');
            }
        }
    }

    /**
     * Handle logout request.
     */
    public function destroy(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    /**
     * Show the registration page.
     */
    public function showRegister(Request $request)
    {
        // Check if user is registering via invitation
        $inviteToken = $request->session()->get('invite_token');
        
        // Fallback: check if token is in URL parameter
        if (!$inviteToken && $request->has('invite')) {
            $inviteToken = $request->get('invite');
            // Store it in session for future requests
            if ($inviteToken) {
                session(['invite_token' => $inviteToken]);
            }
        }
        
        \Log::info('Register page - invite_token from session: ' . $inviteToken);
        \Log::info('Register page - Session ID: ' . $request->session()->getId());
        \Log::info('Register page - All session data: ' . json_encode($request->session()->all()));
        \Log::info('Register page - URL invite parameter: ' . $request->get('invite'));
        
        $invitation = null;
        
        if ($inviteToken) {
            $invitation = \App\Models\WorkspaceInvitation::where('token', $inviteToken)
                ->where('expires_at', '>', now())
                ->with(['workspace.owner', 'inviter'])
                ->first();
            \Log::info('Register page - invitation found: ' . ($invitation ? 'YES' : 'NO'));
            if ($invitation) {
                \Log::info('Register page - invitation email: ' . $invitation->email);
                \Log::info('Register page - invitation workspace: ' . $invitation->workspace->name);
            }
        }

        return Inertia::render('Auth/Register', [
            'invitation' => $invitation,
        ]);
    }

    /**
     * Handle registration request.
     */
    public function register(RegisterRequest $request)
    {
        $fullName = trim($request->first_name . ' ' . $request->last_name);
        
        // Check if user is registering via invitation
        $inviteToken = $request->session()->get('invite_token');
        
        if ($inviteToken) {
            // INVITATION-BASED REGISTRATION
            // Skip account_type selection, default to team_member, accept invitation
            $user = User::create([
                'name' => $fullName,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'team_member', // Legacy role, keeping for now
                'job_title' => $request->job_title,
                'phone' => $request->phone,
                'usage_type' => 'freelancer', // ALL invited users are Freelancers by default
                'onboarding_completed' => false,
            ]);

            Auth::login($user);
            
            // Regenerate the session ID to prevent fixation
            $request->session()->regenerate();

            // Accept invitation and assign workspace role from invitation
            $invitation = WorkspaceInvitation::where('token', $inviteToken)
                ->where('email', $user->email)
                ->where('expires_at', '>', now())
                ->with('workspace')
                ->first();
                
            if ($invitation) {
                $invitation->accept($user); // This assigns workspace_role = invitation.role
                $workspace = $invitation->workspace;
                $request->session()->forget('invite_token');
                session(['current_workspace_id' => $workspace->id]);
                
                // New Requirement: They must complete Freelancer Onboarding Profile
                return redirect()->route('onboarding.profile')
                    ->with('success', "Welcome! You've joined '{$workspace->name}'. Please complete your freelancer profile to get started.");
            }
        } else {
            // PUBLIC REGISTRATION (No Invitation)
            // User chooses account_type (Client | Freelancer)
            $user = User::create([
                'name' => $fullName,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'team_member',
                'job_title' => $request->job_title,
                'phone' => $request->phone,
                'usage_type' => $request->usage_type, // Client or Freelancer
            ]);

            Auth::login($user);
            
            // Regenerate the session ID to prevent fixation
            $request->session()->regenerate();

            // Route based on usage_type → marketplace
            // Client or Freelancer → onboarding profile setup
            return redirect()->route('onboarding.profile')
                ->with('success', 'Welcome! Let\'s set up your profile to get started.');
        }
    }
}
