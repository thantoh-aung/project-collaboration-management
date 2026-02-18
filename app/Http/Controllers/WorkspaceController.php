<?php

namespace App\Http\Controllers;

use App\Models\Workspace;
use App\Models\User;
use App\Models\WorkspaceInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WorkspaceController extends Controller
{
    /**
     * Get all workspaces for the authenticated user.
     */
    public function index()
    {
        $user = Auth::user();
        $workspaces = $user->workspaces()->with('owner')->get();

        return response()->json($workspaces);
    }

    /**
     * Create a new workspace (for admin/workspace_owner registration).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $user = Auth::user();

        $workspace = Workspace::create([
            'name' => $validated['name'],
            'slug' => Workspace::generateSlug($validated['name']),
            'description' => $validated['description'],
            'color' => $validated['color'] ?? '#3B82F6',
            'owner_id' => $user->id,
            'is_active' => true,
        ]);

        // Add the user as admin of the workspace
        $workspace->addUser($user, 'admin');

        return response()->json($workspace, 201);
    }

    /**
     * Show a specific workspace.
     */
    public function show(Workspace $workspace)
    {
        $user = Auth::user();
        
        // Check if user has access to this workspace
        if (!$workspace->hasUser($user)) {
            abort(403, 'Unauthorized access to this workspace.');
        }

        $workspace->load(['users', 'projects', 'owner']);

        return response()->json($workspace);
    }

    /**
     * Update workspace settings.
     */
    public function update(Request $request, Workspace $workspace)
    {
        $user = Auth::user();
        
        // Only workspace admins can update
        if (!$workspace->isUserAdmin($user)) {
            abort(403, 'Unauthorized to update this workspace.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'settings' => 'nullable|array',
        ]);

        $workspace->update($validated);

        // Return Inertia response if it's an Inertia request
        if ($request->inertia()) {
            return back()->with('success', 'Workspace updated successfully.');
        }

        return response()->json($workspace);
    }

    /**
     * Invite users to the workspace.
     */
    public function invite(Request $request, Workspace $workspace)
    {
        $user = Auth::user();
        
        // Only workspace admins can invite users
        if (!$workspace->isUserAdmin($user)) {
            abort(403, 'Unauthorized to invite users to this workspace.');
        }

        // Handle single invitation (legacy) or multiple invitations (onboarding)
        if ($request->has('invitations')) {
            // Multiple invitations from onboarding
            $validated = $request->validate([
                'invitations' => 'required|array',
                'invitations.*.email' => 'required|email',
                'invitations.*.role' => 'required|in:member,client',
            ]);

            $invitationsSent = [];
            $errors = [];

            foreach ($validated['invitations'] as $invitationData) {
                try {
                    // Check if user is already a member
                    $existingUser = User::where('email', $invitationData['email'])->first();
                    if ($existingUser && $workspace->hasUser($existingUser)) {
                        $errors[] = "User {$invitationData['email']} is already a member of this workspace.";
                        continue;
                    }

                    // Create invitation
                    $invitation = WorkspaceInvitation::create([
                        'workspace_id' => $workspace->id,
                        'invited_by' => $user->id,
                        'email' => $invitationData['email'],
                        'role' => $invitationData['role'],
                        'token' => WorkspaceInvitation::generateToken(),
                        'expires_at' => now()->addDays(7),
                    ]);

                    // Log invitation details for debugging
                    \Log::info('Creating invitation for: ' . $invitation->email);
                    \Log::info('Invitation token: ' . $invitation->token);
                    \Log::info('Acceptance URL: ' . url('/invite/' . $invitation->token));

                    try {
                        // Send invitation email
                        \Mail::to($invitation->email)->send(new \App\Mail\WorkspaceInvitationMail($invitation));
                        \Log::info('Email sent successfully to: ' . $invitation->email);
                    } catch (\Exception $e) {
                        \Log::error('Failed to send email to ' . $invitation->email . ': ' . $e->getMessage());
                        throw $e;
                    }
                    
                    $invitationsSent[] = $invitation;
                } catch (\Exception $e) {
                    $errors[] = "Failed to invite {$invitationData['email']}: " . $e->getMessage();
                }
            }

            // Return Inertia response if it's an Inertia request
            if ($request->inertia()) {
                if (count($errors) > 0) {
                    return back()->with('error', 'Some invitations failed: ' . implode(', ', $errors));
                }
                return back()->with('success', count($invitationsSent) . ' invitations sent successfully.');
            }

            return response()->json([
                'invitations' => $invitationsSent,
                'errors' => $errors
            ]);
        } else {
            // Single invitation (legacy)
            $validated = $request->validate([
                'email' => 'required|email',
                'role' => 'required|in:member,client',
            ]);

            // Check if user is already a member
            $existingUser = User::where('email', $validated['email'])->first();
            if ($existingUser && $workspace->hasUser($existingUser)) {
                return response()->json(['error' => 'User is already a member of this workspace.'], 422);
            }

            // Create invitation
            $invitation = WorkspaceInvitation::create([
                'workspace_id' => $workspace->id,
                'invited_by' => $user->id,
                'email' => $validated['email'],
                'role' => $validated['role'],
                'token' => WorkspaceInvitation::generateToken(),
                'expires_at' => now()->addDays(7),
            ]);

            return response()->json($invitation, 201);
        }
    }

    /**
     * Accept a workspace invitation.
     */
    public function acceptInvitation(Request $request, string $token)
    {
        $invitation = WorkspaceInvitation::where('token', $token)->firstOrFail();

        if (!$invitation->isValid()) {
            abort(404, 'Invalid or expired invitation.');
        }

        $user = Auth::user();
        
        if ($user->email !== $invitation->email) {
            abort(403, 'This invitation is not for your email address.');
        }

        // Accept the invitation
        $invitation->accept($user);
        
        // Clear pending workspace status
        $user->update(['pending_workspace' => false]);
        
        // Set current workspace
        session(['current_workspace_id' => $invitation->workspace_id]);

        return response()->json(['message' => 'Invitation accepted successfully.']);
    }

    /**
     * Remove a user from workspace.
     */
    public function removeUser(Request $request, Workspace $workspace, User $user)
    {
        $currentUser = Auth::user();
        
        // Only workspace admins can remove users
        if (!$workspace->isUserAdmin($currentUser)) {
            abort(403, 'Unauthorized to remove users from this workspace.');
        }

        // Cannot remove the owner
        if ($workspace->owner_id === $user->id) {
            return response()->json(['error' => 'Cannot remove the workspace owner.'], 422);
        }

        $workspace->removeUser($user);

        return response()->json(['message' => 'User removed from workspace successfully.']);
    }

    /**
     * Show workspace selection page.
     */
    public function select()
    {
        $user = Auth::user();
        
        \Log::info('Workspace select page accessed', [
            'user_id' => $user->id,
            'current_workspace_id' => session('current_workspace_id')
        ]);

        // Get all workspaces user belongs to with full details
        $workspaces = $user->workspaces()
            ->whereHas('workspaceUsers', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['owner', 'workspaceUsers' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }])
            ->get()
            ->map(function ($workspace) use ($user) {
                $userWorkspace = $workspace->workspaceUsers->first();
                return [
                    'id' => $workspace->id,
                    'name' => $workspace->name,
                    'description' => $workspace->description,
                    'slug' => $workspace->slug,
                    'owner' => [
                        'id' => $workspace->owner->id,
                        'name' => $workspace->owner->name,
                        'email' => $workspace->owner->email,
                    ],
                    'user_role' => $userWorkspace ? $userWorkspace->role : null,
                    'joined_at' => $userWorkspace ? $userWorkspace->joined_at : null,
                    'is_current' => $workspace->id == session('current_workspace_id'),
                    'member_count' => $workspace->workspaceUsers()->count(),
                    'project_count' => $workspace->projects()->count(),
                ];
            });

        \Log::info('Workspaces loaded for selection', [
            'user_id' => $user->id,
            'workspace_count' => $workspaces->count(),
            'workspaces' => $workspaces->pluck('name', 'id')->toArray()
        ]);

        return Inertia::render('Workspaces/Select', [
            'workspaces' => $workspaces,
            'current_workspace_id' => session('current_workspace_id'),
        ]);
    }

    /**
     * Switch to a different workspace.
     */
    public function switch(Request $request, Workspace $workspace)
    {
        $user = Auth::user();
        
        \Log::info('Workspace switch attempt', [
            'user_id' => $user->id,
            'workspace_id' => $workspace->id,
            'workspace_name' => $workspace->name,
            'session_before' => session('current_workspace_id')
        ]);
        
        // Check if user is actually a member of this workspace
        if (!$workspace->hasUser($user)) {
            \Log::error('User not member of workspace', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id
            ]);
            
            if (request()->expectsJson()) {
                return response()->json(['error' => 'You are not a member of this workspace.'], 403);
            }
            abort(403, 'You are not a member of this workspace.');
        }

        // Store current workspace in session
        session(['current_workspace_id' => $workspace->id]);

        \Log::info('Workspace switched successfully', [
            'user_id' => $user->id,
            'workspace_id' => $workspace->id,
            'workspace_name' => $workspace->name,
            'session_after' => session('current_workspace_id')
        ]);

        // For Inertia requests, redirect based on user role and current page
        if ($request->header('X-Inertia')) {
            $userRole = $workspace->users()->where('user_id', $user->id)->first()->pivot->role;
            $referer = $request->header('Referer', '');
            
            // If user is on reports page, stay on reports
            if (str_contains($referer, '/reports') || str_contains($referer, '/client/reports')) {
                if ($userRole === 'client') {
                    return redirect()->route('client.reports')->with('success', "Switched to {$workspace->name}");
                }
                return redirect()->route('reports')->with('success', "Switched to {$workspace->name}");
            }
            
            // If user is a client, redirect to client reports
            if ($userRole === 'client') {
                return redirect()->route('client.reports')->with('success', "Switched to {$workspace->name}");
            }
            
            // For admin/member, redirect to dashboard
            return redirect()->route('dashboard')->with('success', "Switched to {$workspace->name}");
        }

        // For API clients
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'current_workspace_id' => $workspace->id,
            ]);
        }

        return redirect()->route('dashboard')
            ->with('success', "Switched to {$workspace->name}");
    }

    /**
     * Get current workspace for the user.
     */
    public function current()
    {
        $user = Auth::user();
        
        $workspaceId = session('current_workspace_id');
        $workspace = null;

        if ($workspaceId) {
            $workspace = $user->workspaces()->where('workspaces.id', $workspaceId)->first();
        }

        // If no current workspace or user doesn't have access, get first workspace
        if (!$workspace) {
            $workspace = $user->currentWorkspace();
            if ($workspace) {
                session(['current_workspace_id' => $workspace->id]);
            }
        }

        return response()->json($workspace);
    }

    /**
     * Display client users for the current workspace.
     */
    public function clientUsersIndex(Request $request)
    {
        $user = $request->user();
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        if (!$workspace) {
            return Inertia::render('Clients/Index', [
                'clients' => [],
                'auth' => ['user' => $user],
                'message' => 'Please join a workspace to view clients.'
            ]);
        }

        // Load workspace clients only
        $clients = $workspace->users()
            ->withPivot('role')
            ->with(['roles'])
            ->wherePivot('role', 'client')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'avatar_url' => $user->avatar_url,
                    'workspace_role' => $user->pivot->role,
                    'global_roles' => $user->roles->pluck('name'),
                    'created_at' => $user->pivot->created_at,
                ];
            });

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'auth' => [
                'user' => $user,
                'current_workspace' => $workspace,
                'user_role' => $userRole
            ]
        ]);
    }

    /**
     * Display team members for the current workspace.
     */
    public function teamIndex(Request $request)
    {
        $user = $request->user();
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        if (!$workspace) {
            return Inertia::render('Team/Index', [
                'team' => [],
                'auth' => ['user' => $user],
                'message' => 'Please join a workspace to view the team.'
            ]);
        }

        // Load workspace members only (exclude clients)
        $team = $workspace->users()
            ->withPivot('role')
            ->with(['roles'])
            ->wherePivotNotIn('role', ['client'])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'avatar_url' => $user->avatar_url,
                    'workspace_role' => $user->pivot->role,
                    'global_roles' => $user->roles->pluck('name'),
                    'created_at' => $user->pivot->created_at,
                ];
            });

        return Inertia::render('Team/Index', [
            'team' => $team,
            'auth' => [
                'user' => $user,
                'current_workspace' => $workspace,
                'user_role' => $userRole
            ]
        ]);
    }

    /**
     * List pending invitations for a workspace (admin only).
     */
    public function invitationsIndex(Request $request, Workspace $workspace)
    {
        $this->authorize('manageInvitations', $workspace);

        $invitations = $workspace->invitations()
            ->with('inviter')
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($invitations);
    }

    /**
     * Resend an invitation (admin only).
     */
    public function resendInvitation(Request $request, Workspace $workspace, WorkspaceInvitation $invitation)
    {
        $this->authorize('manageInvitations', $workspace);

        if ($invitation->workspace_id !== $workspace->id) {
            abort(404, 'Invitation not found for this workspace.');
        }

        if ($invitation->isAccepted()) {
            return response()->json(['error' => 'Invitation already accepted.'], 422);
        }

        // Update token and expiry
        $invitation->update([
            'token' => WorkspaceInvitation::generateToken(),
            'expires_at' => now()->addDays(7),
        ]);

        // Send email with invitation link
        \Mail::to($invitation->email)->send(new \App\Mail\WorkspaceInvitationMail($invitation));

        return response()->json(['message' => 'Invitation resent successfully.', 'invitation' => $invitation]);
    }

    /**
     * Cancel/delete an invitation (admin only).
     */
    public function cancelInvitation(Request $request, Workspace $workspace, WorkspaceInvitation $invitation)
    {
        $this->authorize('manageInvitations', $workspace);

        if ($invitation->workspace_id !== $workspace->id) {
            abort(404, 'Invitation not found for this workspace.');
        }

        $invitation->delete();

        return response()->json(['message' => 'Invitation canceled successfully.']);
    }

    /**
     * Show workspace settings page.
     */
    public function settings(Request $request, Workspace $workspace)
    {
        $user = Auth::user();
        
        if (!$workspace->isUserAdmin($user)) {
            abort(403, 'Only workspace admins can access settings.');
        }

        return Inertia::render('Workspaces/Settings', [
            'workspace' => $workspace,
            'members' => $workspace->users()->withPivot('role')->get(),
            'pendingInvitations' => $workspace->invitations()->whereNull('accepted_at')->get(),
        ]);
    }

    /**
     * Update workspace settings.
     */
    public function updateSettings(Request $request, Workspace $workspace)
    {
        $user = Auth::user();
        
        if (!$workspace->isUserAdmin($user)) {
            abort(403, 'Only workspace admins can update settings.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $workspace->update($validated);

        return back()->with('success', 'Workspace settings updated successfully.');
    }

    /**
     * Delete a workspace and restore chat state.
     */
    public function destroy(Request $request, Workspace $workspace)
    {
        $user = Auth::user();

        // Only workspace owners can delete workspaces
        if ($workspace->owner_id !== $user->id) {
            abort(403, 'Only workspace owners can delete workspaces.');
        }

        // Find the associated chat (if any)
        $chat = \App\Models\PreProjectChat::where('workspace_id', $workspace->id)->first();

        if ($chat) {
            // Restore chat to pre-workspace state
            $chat->update([
                'status' => 'open',
                'workspace_id' => null,
            ]);
        }

        // Delete the workspace (this will cascade delete workspace_users, projects, tasks, etc.)
        $workspace->delete();

        // Clear current workspace session if it was the deleted workspace
        if (session('current_workspace_id') == $workspace->id) {
            session()->forget('current_workspace_id');
        }

        // Determine redirect target
        $redirectRoute = $user->workspaces()->count() > 0 ? 'workspaces.select' : 'marketplace.index';

        // Return JSON response for AJAX requests
        return response()->json([
            'message' => 'Workspace deleted successfully. Chat has been restored.',
            'redirect' => route($redirectRoute)
        ]);
    }
}
