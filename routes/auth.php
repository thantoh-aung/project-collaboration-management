<?php

use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GoogleSocialiteController;
use App\Http\Controllers\NewPasswordController;
use App\Http\Controllers\ResetPasswordController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\SubtaskController;
use App\Http\Controllers\TimeLogController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ClientUserController;
use App\Http\Controllers\ClientCompanyController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\OwnerCompanyController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\AiChatController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;

// Login routes
Route::get('/login', [AuthenticationController::class, 'create'])->name('login');
Route::post('/login', [AuthenticationController::class, 'store']);

// Registration routes
Route::get('/register', [AuthenticationController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthenticationController::class, 'register']);

// Pending invitation route
Route::get('/pending-invitation', function () {
    return Inertia::render('Auth/PendingInvitation');
})->name('pending-invitation');

// Password reset routes
Route::get('/password/forgot', [ResetPasswordController::class, 'create'])->name('password.request');
Route::post('/password/forgot', [ResetPasswordController::class, 'store'])->name('password.email');

// Password reset with token
Route::get('/password/new/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
Route::post('/password/new/{token}', [NewPasswordController::class, 'store'])->name('password.update');

// Guest invitation routes
Route::get('/invite/{token}', [InvitationController::class, 'show'])->name('invites.show');
Route::post('/invite/{token}', [InvitationController::class, 'accept'])->name('invites.accept');

// Store invitation token in session (for guest users)
Route::post('/store-invite-token', function (Request $request) {
    $token = $request->input('token');
    \Log::info('Storing invite token in session: ' . $token);
    
    if ($token) {
        session(['invite_token' => $token]);
        \Log::info('Token stored in session. Current session token: ' . session('invite_token'));
        \Log::info('Session ID: ' . session()->getId());
    }
    return response()->json(['success' => true, 'token_stored' => $token ? true : false]);
})->name('store.invite.token');

// Login routes
Route::get('/login', [AuthenticationController::class, 'create'])->name('login');
Route::post('/login', [AuthenticationController::class, 'store']);

// Google OAuth routes
Route::get('/auth/google', [GoogleSocialiteController::class, 'redirectToGoogle'])->name('google.login');
Route::get('/auth/google/callback', [GoogleSocialiteController::class, 'handleCallback'])->name('google.callback');


// Logout routes (authenticated only)
Route::middleware('auth')->group(function () {
    // Dashboard route
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Onboarding route (admin only)
    Route::get('/onboarding', function (Request $request) {
        $user = Auth::user();
        $workspace = $request->attributes->get('currentWorkspace');
        
        // Only workspace admins can access onboarding
        if (!$workspace || !$workspace->isUserAdmin($user)) {
            return redirect()->route('dashboard');
        }
        
        // Get current workspace users (excluding the current user and clients)
        $workspaceUsers = $workspace->users()
            ->where('users.id', '!=', $user->id)
            ->wherePivot('role', '!=', 'client')
            ->get()
            ->map(function($user) use ($workspace) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'workspace_role' => $user->pivot->role,
                ];
            });
        
        return Inertia::render('Onboarding/Wizard', [
            'workspaceUsers' => $workspaceUsers
        ]);
    })->name('onboarding.wizard')->middleware('workspace.auth');
    
    // Invite team members page (admin only)
    Route::get('/invite-members', function (Request $request) {
        $user = Auth::user();
        $workspace = $request->attributes->get('currentWorkspace');
        
        // Only workspace admins can access invitation page
        if (!$workspace || !$workspace->isUserAdmin($user)) {
            return redirect()->route('dashboard');
        }
        
        // Get current workspace users (excluding the current user and clients)
        $workspaceUsers = $workspace->users()
            ->where('users.id', '!=', $user->id)
            ->wherePivot('role', '!=', 'client')
            ->get()
            ->map(function($user) use ($workspace) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'workspace_role' => $user->pivot->role,
                ];
            });
        
        return Inertia::render('Workspaces/InviteMembers', [
            'workspaceUsers' => $workspaceUsers
        ]);
    })->name('invite.members')->middleware('workspace.auth');
    
    // Workspace endpoints
    Route::get('/workspaces', [WorkspaceController::class, 'index'])->name('workspaces.index');
    Route::get('/workspaces/select', [WorkspaceController::class, 'select'])->name('workspaces.select');
    Route::post('/workspaces/switch/{workspace}', [WorkspaceController::class, 'switch'])->name('workspaces.switch');
    Route::post('/workspaces/accept/{token}', [WorkspaceController::class, 'acceptInvitation'])->name('workspaces.accept');

    // REST API for workspace invitations (admin only)
    Route::get('/api/workspaces/{workspace}/invitations', [WorkspaceController::class, 'invitationsIndex'])->name('api.workspaces.invitations.index');
    Route::post('/api/workspaces/{workspace}/invitations/{invitation}/resend', [WorkspaceController::class, 'resendInvitation'])->name('api.workspaces.invitations.resend');
    Route::delete('/api/workspaces/{workspace}/invitations/{invitation}', [WorkspaceController::class, 'cancelInvitation'])->name('api.workspaces.invitations.cancel');
    
    // Workspace user management (admin only)
    Route::delete('/workspaces/{workspace}/users/{user}', [WorkspaceController::class, 'removeUser'])->name('workspaces.users.remove');

    
    // Workspace-scoped API (prevents cross-workspace data mixing)
    Route::middleware(['workspace.auth'])->prefix('/api/workspaces/{workspace}')->group(function () {
        // Projects API
        Route::get('/projects', [ProjectController::class, 'apiIndex'])->name('api.workspaces.projects.index');
        Route::post('/projects', [ProjectController::class, 'apiStore'])->name('api.workspaces.projects.store');
        Route::get('/projects/{project}/tasks', [ProjectController::class, 'apiTasks'])->name('api.workspaces.projects.tasks');
        Route::get('/projects/{project}/groups', [ProjectController::class, 'apiGroups'])->name('api.workspaces.projects.groups');

        // Tasks API
        Route::post('/tasks', [App\Http\Controllers\Api\TaskController::class, 'store'])->name('api.workspaces.tasks.store');
        Route::patch('/tasks/{task}', [App\Http\Controllers\Api\TaskController::class, 'update'])->name('api.workspaces.tasks.update');
        Route::delete('/tasks/{task}', [App\Http\Controllers\Api\TaskController::class, 'destroy'])->name('api.workspaces.tasks.destroy');
    });
    
    // API endpoint for frontend workspace context
    Route::get('/me/workspaces', function () {
        $user = Auth::user();
        
        // Only return workspaces where user is actually a member via workspace_users
        $workspaces = $user->workspaces()
                          ->with('owner')
                          ->whereHas('workspaceUsers', function ($query) use ($user) {
                              $query->where('user_id', $user->id);
                          })
                          ->get();

        $workspaces->each(function ($workspace) use ($user) {
            $workspace->user_role = $workspace->getUserRole($user);
        });
        
        return response()->json([
            'workspaces' => $workspaces,
            'current_workspace_id' => session('current_workspace_id')
        ]);
    })->name('me.workspaces');
    
    // Project routes (workspace protected)
    Route::middleware(['workspace.auth'])->group(function () {
        Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
        Route::get('/projects/create', [ProjectController::class, 'create'])->name('projects.create');
        Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
        // Legacy project show route - redirect to projects list (deprecated)
        Route::get('/projects/{project}', function () {
            return redirect('/projects');
        })->name('projects.show');
        Route::get('/projects/{project}/edit', [ProjectController::class, 'edit'])->name('projects.edit');
        Route::patch('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
        
        // Tasks list page
        Route::get('/tasks', [TaskController::class, 'workspaceIndex'])->name('tasks.index');
        
        // Team list page
        Route::get('/team', [WorkspaceController::class, 'teamIndex'])->name('team.index');
        
        // Clients list page
        Route::get('/clients', [WorkspaceController::class, 'clientUsersIndex'])->name('clients.index');
        
                
        // Settings page (alias to workspace settings)
        Route::get('/settings', [WorkspaceController::class, 'settings'])->name('settings.index');
        
        // Notifications page (renders with real data from controller)
        Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'page'])->name('notifications.index');
        
        // Notification API routes
        Route::get('/api/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
        Route::get('/api/notifications/unread-count', [\App\Http\Controllers\NotificationController::class, 'unreadCount']);
        Route::post('/api/notifications/{notification}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
        Route::post('/api/notifications/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
        
                
        Route::get('/projects/{project}/tasks', [TaskController::class, 'index'])->name('auth.workspaces.projects.tasks');
        Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);
        Route::post('/projects/{project}/tasks/reorder', [TaskController::class, 'reorder']);
        Route::post('/projects/{project}/groups', [GroupController::class, 'store']);
        Route::post('/projects/{project}/groups/reorder', [GroupController::class, 'reorder']);
        
        // Project management routes
        Route::get('/projects/{project}/manage', function ($project) {
            $user = Auth::user();
            $workspace = request()->attributes->get('currentWorkspace');
            $userRole = request()->attributes->get('userRole');
            
            // Only admins can manage projects
            if ($userRole !== 'admin') {
                abort(403, 'Only admins can manage projects.');
            }
            
            // Get all workspace users
            $workspaceUsers = \App\Models\User::whereHas('workspaces', function($query) use ($workspace) {
                $query->where('workspace_id', $workspace->id);
            })->get();
            
            // Get current team members and clients
            $teamMembers = $project->teamMembers()->withPivot('role')->get();
            $clients = $project->teamMembers()->wherePivot('role', 'client')->get();
            
            // Add workspace role to users
            $workspaceUsers = $workspaceUsers->map(function($user) use ($workspace) {
                $user->workspace_role = $workspace->getUserRole($user);
                return $user;
            });
            
            return Inertia::render('Projects/Manage', [
                'project' => $project,
                'workspaceUsers' => $workspaceUsers,
                'teamMembers' => $teamMembers,
                'clients' => $clients,
            ]);
        })->name('projects.manage');
        
        Route::post('/projects/{project}/members', function (\Illuminate\Http\Request $request, $project) {
            $user = Auth::user();
            $workspace = request()->attributes->get('currentWorkspace');
            $userRole = request()->attributes->get('userRole');
            
            // Only admins can add members
            if ($userRole !== 'admin') {
                abort(403, 'Only admins can add members.');
            }
            
            $data = $request->validate([
                'user_id' => 'required|exists:users,id',
                'role' => 'required|in:member,admin,client',
            ]);
            
            // Check if user is in workspace
            $memberUser = \App\Models\User::find($data['user_id']);
            if (!$workspace->hasUser($memberUser)) {
                abort(403, 'User is not in this workspace.');
            }
            
            // Add to project team
            $project->teamMembers()->syncWithoutDetaching([
                $data['user_id'] => ['role' => $data['role']]
            ]);
            
            return redirect()->back()->with('success', 'Member added successfully.');
        })->name('projects.members.store');
        
        Route::delete('/projects/{project}/members/{userId}', function ($project, $userId) {
            $user = Auth::user();
            $workspace = request()->attributes->get('currentWorkspace');
            $userRole = request()->attributes->get('userRole');
            
            // Only admins can remove members
            if ($userRole !== 'admin') {
                abort(403, 'Only admins can remove members.');
            }
            
            $project->teamMembers()->detach($userId);
            
            return redirect()->back()->with('success', 'Member removed successfully.');
        })->name('projects.members.destroy');
        
        Route::post('/projects/{project}/clients', function (\Illuminate\Http\Request $request, $project) {
            $user = Auth::user();
            $workspace = request()->attributes->get('currentWorkspace');
            $userRole = request()->attributes->get('userRole');
            
            // Only admins can add clients
            if ($userRole !== 'admin') {
                abort(403, 'Only admins can add clients.');
            }
            
            $data = $request->validate([
                'user_id' => 'required|exists:users,id',
            ]);
            
            // Check if user is a client in workspace
            $memberUser = \App\Models\User::find($data['user_id']);
            if ($workspace->getUserRole($memberUser) !== 'client') {
                abort(403, 'User is not a client in this workspace.');
            }
            
            // Add as client to project
            $project->teamMembers()->syncWithoutDetaching([
                $data['user_id'] => ['role' => 'client']
            ]);
            
            return redirect()->back()->with('success', 'Client access granted successfully.');
        })->name('projects.clients.store');
        
        Route::delete('/projects/{project}/clients/{userId}', function ($project, $userId) {
            $user = Auth::user();
            $workspace = request()->attributes->get('currentWorkspace');
            $userRole = request()->attributes->get('userRole');
            
            // Only admins can remove clients
            if ($userRole !== 'admin') {
                abort(403, 'Only admins can remove clients.');
            }
            
            $project->teamMembers()->detach($userId);
            
            return redirect()->back()->with('success', 'Client access removed successfully.');
        })->name('projects.clients.destroy');
        
        // Workspace invitation route (workspace protected)
        Route::post('/workspaces/{workspace}/invite', [WorkspaceController::class, 'invite'])->name('workspaces.invite');
        
        // Workspace settings route (admin only)
        Route::get('/workspaces/{workspace}/settings', [WorkspaceController::class, 'settings'])->name('workspaces.settings');
        Route::patch('/workspaces/{workspace}/settings', [WorkspaceController::class, 'updateSettings'])->name('workspaces.settings.update');
        Route::delete('/workspaces/{workspace}', [WorkspaceController::class, 'destroy'])->name('workspaces.destroy');
        
        // Task routes (workspace scoped)
        Route::post('/tasks', [TaskController::class, 'storeFromWorkspace']);
        Route::patch('/tasks/{task}', [TaskController::class, 'update']);
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
        Route::post('/tasks/{task}/restore', [TaskController::class, 'restore']);
        Route::post('/tasks/{task}/complete', [TaskController::class, 'complete']);
        Route::post('/tasks/{task}/move', [TaskController::class, 'move']);
        
        // Comment routes (workspace scoped via task)
        Route::get('/tasks/{task}/comments', [CommentController::class, 'index']);
        Route::post('/tasks/{task}/comments', [CommentController::class, 'store']);
        
        // Subtask routes (workspace scoped via task)
        Route::get('/tasks/{task}/subtasks', [SubtaskController::class, 'index']);
        Route::post('/tasks/{task}/subtasks', [SubtaskController::class, 'store']);
        Route::get('/tasks/{task}/subtasks/{subtask}', [SubtaskController::class, 'show']);
        Route::patch('/tasks/{task}/subtasks/{subtask}', [SubtaskController::class, 'update']);
        Route::delete('/tasks/{task}/subtasks/{subtask}', [SubtaskController::class, 'destroy']);
        Route::post('/tasks/{task}/subtasks/{subtask}/toggle', [SubtaskController::class, 'toggleComplete']);
        
        // Time log routes (workspace scoped via task)
        Route::post('/tasks/{task}/time-logs', [TimeLogController::class, 'store']);
        Route::delete('/time-logs/{timeLog}', [TimeLogController::class, 'destroy']);
        Route::post('/tasks/{task}/time-logs/start', [TimeLogController::class, 'startTimer']);
        Route::post('/time-logs/{timeLog}/stop', [TimeLogController::class, 'stopTimer']);
        
        // Attachment routes (workspace scoped via task)
        Route::post('/tasks/{task}/attachments', [AttachmentController::class, 'store']);
        Route::delete('/attachments/{attachment}', [AttachmentController::class, 'destroy']);
        
        // Group routes (workspace scoped)
        Route::post('/groups', [GroupController::class, 'storeFromWorkspace']);
        Route::patch('/groups/{taskGroup}', [GroupController::class, 'update']);
        Route::delete('/groups/{taskGroup}', [GroupController::class, 'destroy']);
        Route::post('/groups/{taskGroup}/restore', [GroupController::class, 'restore']);
        
            });
    
    // User management routes (workspace protected)
    Route::middleware(['workspace.auth'])->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/create', [UserController::class, 'create']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}/edit', [UserController::class, 'edit']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::post('/users/{user}/restore', [UserController::class, 'restore']);

        // Client company management
        Route::get('/client-companies', [ClientCompanyController::class, 'index']);
        Route::get('/client-companies/create', [ClientCompanyController::class, 'create']);
        Route::post('/client-companies', [ClientCompanyController::class, 'store']);
        Route::get('/client-companies/{clientCompany}/edit', [ClientCompanyController::class, 'edit']);
        Route::put('/client-companies/{clientCompany}', [ClientCompanyController::class, 'update']);
        Route::delete('/client-companies/{clientCompany}', [ClientCompanyController::class, 'destroy']);
        Route::post('/client-companies/{clientCompany}/restore', [ClientCompanyController::class, 'restore']);

        // Client user assignments
        Route::get('/client-users', [ClientUserController::class, 'index']);
        Route::post('/client-users', [ClientUserController::class, 'store']);
        Route::delete('/client-companies/{clientCompany}/users/{user}', [ClientUserController::class, 'destroy']);

        // Role management
        Route::get('/roles', [RoleController::class, 'index']);
        Route::get('/roles/create', [RoleController::class, 'create']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::get('/roles/{role}/edit', [RoleController::class, 'edit']);
        Route::put('/roles/{role}', [RoleController::class, 'update']);
        Route::delete('/roles/{role}', [RoleController::class, 'destroy']);

        // Label management
        Route::get('/labels', [LabelController::class, 'index']);
        Route::get('/labels/create', [LabelController::class, 'create']);
        Route::post('/labels', [LabelController::class, 'store']);
        Route::get('/labels/{label}/edit', [LabelController::class, 'edit']);
        Route::put('/labels/{label}', [LabelController::class, 'update']);
        Route::delete('/labels/{label}', [LabelController::class, 'destroy']);

        // Owner company management
        Route::get('/owner-companies', [OwnerCompanyController::class, 'index']);
        Route::get('/owner-companies/create', [OwnerCompanyController::class, 'create']);
        Route::post('/owner-companies', [OwnerCompanyController::class, 'store']);
        Route::get('/owner-companies/{ownerCompany}/edit', [OwnerCompanyController::class, 'edit']);
        Route::put('/owner-companies/{ownerCompany}', [OwnerCompanyController::class, 'update']);
        Route::delete('/owner-companies/{ownerCompany}', [OwnerCompanyController::class, 'destroy']);

                
        // AI Chat Assistant - moved to marketplace routes
        // Route::post('/api/ai/chat', [AiChatController::class, 'chat'])->name('ai.chat');
        
        // AI Data Endpoints for Level 3 Architecture
        Route::get('/api/ai/data/overdue-tasks', [AiChatController::class, 'getOverdueTasks']);
        Route::get('/api/ai/data/my-tasks', [AiChatController::class, 'getMyTasks']);
        Route::get('/api/ai/data/completed-tasks', [AiChatController::class, 'getCompletedTasks']);
        Route::get('/api/ai/data/tasks', [AiChatController::class, 'getTasks']);
        Route::get('/api/ai/data/marketplace-projects', [AiChatController::class, 'getMarketplaceProjects']);
        Route::get('/api/ai/data/workspace-projects', [AiChatController::class, 'getWorkspaceProjects']);
        Route::get('/api/ai/data/freelancers', [AiChatController::class, 'getFreelancers']);
        Route::get('/api/ai/data/chats', [AiChatController::class, 'getChats']);
    });

    Route::get('/logout', [AuthenticationController::class, 'destroy'])->name('logout');
    Route::delete('/logout', [AuthenticationController::class, 'destroy']);
});
