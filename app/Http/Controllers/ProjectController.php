<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Database\Eloquent\Builder;

class ProjectController extends Controller
{
    /**
     * Display a listing of the projects.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Get workspace from middleware
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        if (!$workspace) {
            return Inertia::render('Projects/Index', [
                'projects' => [],
                'auth' => ['user' => $user],
                'message' => 'Please join a workspace to view projects.'
            ]);
        }

        $query = Project::with(['clientCompany', 'teamMembers'])
                       ->where('workspace_id', $workspace->id);

        // Apply role-based filtering within workspace
        if ($userRole === 'member') {
            // Team members can only see projects they're assigned to
            $query->whereHas('teamMembers', function (Builder $query) use ($user) {
                $query->where('user_id', $user->id);
            });
        }
        // Clients and admins can see all projects in workspace by default
        // No additional filtering needed for clients and admins

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function (Builder $query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhereHas('clientCompany', function (Builder $query) use ($search) {
                          $query->where('name', 'like', "%{$search}%");
                      });
            });
        }

        // Apply status filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Get projects with pagination
        $projects = $query->orderBy('created_at', 'desc')
                         ->paginate(10)
                         ->withQueryString();

        // Transform collection to separate clients and team members
        $projects->getCollection()->transform(function ($project) {
            $project->clients = $project->teamMembers->where('pivot.role', 'client')->values();
            $project->team_members = $project->teamMembers->where('pivot.role', '!=', 'client')->values();
            return $project;
        });

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'filters' => $request->only(['search', 'status']),
            'auth' => [
                'user' => $user,
                'current_workspace' => $workspace,
                'user_role' => $userRole
            ]
        ]);
    }

    /**
     * Show the form for creating a new project.
     */
    public function create()
    {
        $workspace = request()->attributes->get('currentWorkspace');
        $userRole = request()->attributes->get('userRole');

        if (!$workspace) {
            return redirect()->route('invite.accept')
                ->with('error', 'Please join a workspace to create projects.');
        }

        $this->authorize('create', [Project::class, $workspace]);

        $user = Auth::user();
        
        // Get all workspace users with their roles
        $workspaceUsers = $workspace->users()->get()->map(function($user) use ($workspace) {
            $user->workspace_role = $workspace->getUserRole($user);
            return $user;
        });

        return Inertia::render('Projects/Create', [
            'workspaceUsers' => $workspaceUsers,
            'auth' => [
                'user' => $user,
                'current_workspace' => $workspace,
                'user_role' => $userRole
            ]
        ]);
    }

    /**
     * Store a newly created project in storage.
     */
    public function store(Request $request)
    {
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        if (!$workspace) {
            return redirect()->back()
                ->with('error', 'No workspace context found.');
        }

        $this->authorize('create', [Project::class, $workspace]);

        // Custom validation for start date using server time
        $request->validate([
            'name' => 'required|string|max:255|min:3',
            'description' => 'nullable|string|max:1000',
            'status' => 'nullable|string|in:active,on_hold,planning',
            'start_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:start_date',
            'members' => 'nullable|array|max:10',
            'members.*' => 'exists:users,id',
        ], [
            'start_date.required' => 'Project start date is required.',
            'start_date.date' => 'Project start date must be a valid date.',
            'due_date.after_or_equal' => 'The due date must be on or after the start date.',
        ]);

        // Server-side validation: start_date must be today or future
        $startDate = $request->input('start_date');
        $today = now()->toDateString(); // Server date in UTC/app timezone
        
        if ($startDate < $today) {
            return redirect()->back()
                ->withInput()
                ->withErrors(['start_date' => 'Project start date must be today or later.']);
        }

        $validated = $request->only(['name', 'description', 'status', 'start_date', 'due_date', 'members']);

        // Debug logging for status
        \Log::info('Project creation debug:', [
            'request_status' => $request->input('status'),
            'validated_status' => $validated['status'] ?? 'NULL',
            'final_status' => $validated['status'] ?? 'active',
        ]);

        $project = Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'status' => $validated['status'] ?? 'active',
            'start_date' => $validated['start_date'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'workspace_id' => $workspace->id,
            'created_by' => Auth::id(),
        ]);

        \Log::info('Project created with status:', [
            'project_id' => $project->id,
            'project_status' => $project->status,
        ]);

        // Add team members (exclude creator to prevent duplicate)
        if (!empty($validated['members'])) {
            foreach ($validated['members'] as $memberId) {
                // Skip if this is the creator (will be added as admin)
                if ($memberId != Auth::id()) {
                    $project->teamMembers()->attach($memberId, ['role' => 'member']);
                    \Log::info("Added member to project: Project {$project->id}, Member {$memberId}");
                }
            }
        }

        
        // Add creator as admin
        $project->teamMembers()->attach(Auth::id(), ['role' => 'admin']);
        \Log::info("Added admin to project: Project {$project->id}, Admin " . Auth::id());

        return redirect()
            ->route('auth.workspaces.projects.tasks', $project->id)
            ->with('success', 'Project created successfully.');
    }

    /**
     * Display the specified project.
     */
    public function show(Project $project)
    {
        $workspace = request()->attributes->get('currentWorkspace');
        $userRole = request()->attributes->get('userRole');
        $user = Auth::user();
        
        // Check if project belongs to current workspace
        if (!$workspace || $project->workspace_id !== $workspace->id) {
            \Log::error('Project workspace mismatch', [
                'project_id' => $project->id,
                'project_workspace_id' => $project->workspace_id,
                'current_workspace_id' => $workspace?->id,
                'user_id' => $user->id,
            ]);
            abort(404, 'Project not found in this workspace.');
        }

        // Check permissions based on role
        if ($userRole === 'member') {
            if (!$project->teamMembers()->where('user_id', $user->id)->exists()) {
                \Log::error('Member not on project team', [
                    'project_id' => $project->id,
                    'user_id' => $user->id,
                    'userRole' => $userRole,
                    'team_members' => $project->teamMembers()->pluck('user_id')->toArray(),
                ]);
                abort(403, 'You do not have access to this project.');
            }
        }
        // Clients and admins can access all projects in workspace by default
        // No additional permission check needed for clients and admins

        $project->load(['teamMembers', 'clientCompany']);

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'auth' => [
                'user' => $user,
                'current_workspace' => $workspace,
                'user_role' => $userRole
            ]
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(Request $request, Project $project)
    {
        $user = Auth::user();
        
        // Get workspace from middleware
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        // Check if project belongs to current workspace
        if (!$workspace || $project->workspace_id !== $workspace->id) {
            abort(403, 'Project not found in this workspace.');
        }

        $this->authorize('update', $project);

        $project->load(['teamMembers', 'clientCompany']);

        // Get all workspace users with their roles
        $workspaceUsers = $workspace->users()->get()->map(function($user) use ($workspace) {
            $user->workspace_role = $workspace->getUserRole($user);
            return $user;
        });

        // Get current team members and clients
        $teamMembers = $project->teamMembers()->wherePivot('role', '!=', 'client')->get();
        $clients = $project->teamMembers()->wherePivot('role', 'client')->get();

        // Debug logging
        \Log::info('Project edit debug:', [
            'project_id' => $project->id,
            'workspace_id' => $workspace->id,
            'workspace_users' => $workspaceUsers->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'workspace_role' => $user->workspace_role
                ];
            })->toArray(),
            'current_team_members' => $project->teamMembers()->pluck('id')->toArray(),
            'current_user_id' => Auth::id(),
            'current_user_role' => $userRole,
        ]);

        return Inertia::render('Projects/Edit', [
            'project' => $project,
            'workspaceUsers' => $workspaceUsers,
            'teamMembers' => $teamMembers,
            'clients' => $clients,
            'auth' => [
                'user' => $user,
                'current_workspace' => $workspace,
                'user_role' => $userRole
            ]
        ]);
    }

    /**
     * Update the specified project in storage.
     */
    public function update(Request $request, Project $project)
    {
        $user = Auth::user();
        
        // Get workspace from middleware
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        // Check if project belongs to current workspace
        if (!$workspace || $project->workspace_id !== $workspace->id) {
            abort(403, 'Project not found in this workspace.');
        }

        $this->authorize('update', $project);

        // Custom validation for start date using server time
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'status' => 'nullable|string|in:active,on_hold,planning,completed',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'members' => 'nullable|array|max:10',
            'members.*' => 'exists:users,id',
        ], [
            'start_date.date' => 'Project start date must be a valid date.',
            'due_date.after_or_equal' => 'The due date must be on or after the start date.',
        ]);

        // Server-side validation: prevent updating start_date to past date
        // Exception: Allow admins to edit historical data for projects that already started
        $startDate = $request->input('start_date');
        if ($startDate) {
            $today = now()->toDateString(); // Server date in UTC/app timezone
            $originalStartDate = $project->start_date?->toDateString();
            
            // Only validate if start date is being changed to a past date
            if ($startDate < $today && $startDate !== $originalStartDate) {
                // Allow admins to edit historical data for existing projects
                if ($userRole !== 'admin') {
                    return redirect()->back()
                        ->withInput()
                        ->withErrors(['start_date' => 'Project start date must be today or later.']);
                }
                // For admins, only allow if project already existed with past start date
                if ($originalStartDate >= $today) {
                    return redirect()->back()
                        ->withInput()
                        ->withErrors(['start_date' => 'Cannot set project start date to past date.']);
                }
            }
        }

        $validated = $request->only(['name', 'description', 'status', 'start_date', 'due_date', 'members']);

        // Update project with validated data
        $project->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'start_date' => $validated['start_date'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
        ]);

        // Sync team members (exclude creator to prevent duplicate)
        \Log::info('Project member update debug:', [
            'project_id' => $project->id,
            'validated_members' => $validated['members'] ?? null,
            'user_id' => $user->id,
            'user_role' => $userRole,
            'current_team_members' => $project->teamMembers()->pluck('id')->toArray(),
        ]);
        
        if (!empty($validated['members'])) {
            $memberIds = array_filter($validated['members'], function($memberId) use ($user) {
                return $memberId != $user->id; // Skip creator
            });
            
            \Log::info('Processing member sync:', [
                'original_members' => $validated['members'],
                'filtered_member_ids' => $memberIds,
                'creator_id' => $user->id,
                'members_after_filter' => count($memberIds),
            ]);
            
            // Remove existing member roles and re-attach
            $project->teamMembers()->wherePivot('role', 'member')->detach();
            foreach ($memberIds as $memberId) {
                \Log::info('Attaching member to project:', ['member_id' => $memberId, 'project_id' => $project->id]);
                $project->teamMembers()->attach($memberId, ['role' => 'member']);
            }
        } else {
            \Log::info('No members provided, removing all existing member roles');
            // If no members provided, remove all existing member roles (except creator)
            $project->teamMembers()->wherePivot('role', 'member')->detach();
        }

        return redirect()
            ->route('auth.workspaces.projects.tasks', $project->id)
            ->with('success', 'Project updated successfully.');
    }

    /**
     * Remove the specified project from storage.
     */
    public function destroy(Request $request, Project $project)
    {
        $user = Auth::user();
        
        // Get workspace from middleware
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        // Check if project belongs to current workspace
        if (!$workspace || $project->workspace_id !== $workspace->id) {
            abort(403, 'Project not found in this workspace.');
        }

        $this->authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')
                         ->with('success', 'Project deleted successfully.');
    }

    /**
     * Create project via API
     */
    public function apiStore(Request $request)
    {
        $user = Auth::user();
        
        // Get workspace from middleware
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 400);
        }

        // Check permissions
        if ($userRole !== 'admin') {
            return response()->json(['error' => 'Only workspace admins can create projects'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,on_hold',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'members' => 'nullable|array',
            'members.*' => 'exists:users,id',
            'clients' => 'nullable|array',
            'clients.*' => 'exists:users,id',
        ]);

        $project = Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'status' => $validated['status'],
            'start_date' => $validated['start_date'],
            'due_date' => $validated['due_date'],
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
        ]);

        // Add team members
        if (!empty($validated['members'])) {
            foreach ($validated['members'] as $memberId) {
                $project->teamMembers()->attach($memberId, ['role' => 'member']);
            }
        }

        // Add clients (view-only)
        if (!empty($validated['clients'])) {
            foreach ($validated['clients'] as $clientId) {
                $project->teamMembers()->attach($clientId, ['role' => 'client']);
            }
        }

        // Add creator as admin
        $project->teamMembers()->attach($user->id, ['role' => 'admin']);

        // System groups are automatically created by Project model's boot() method
        // No need to create duplicate groups here

        // Inertia form submissions expect a redirect / Inertia response, not raw JSON
        if ($request->header('X-Inertia')) {
            return redirect()
                ->route('auth.workspaces.projects.tasks', $project->id)
                ->with('success', 'Project created successfully!');
        }

        return response()->json([
            'success' => true,
            'project' => $project->load(['teamMembers'])
        ]);
    }

    /**
     * Get project tasks for API
     */
    public function apiTasks(Request $request, Project $project)
    {
        $user = Auth::user();
        
        // Get workspace from middleware
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        if (!$workspace || $project->workspace_id !== $workspace->id) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        $tasks = $project->tasks()
            ->with([
                'assignedToUser:id,name,avatar',
                'taskGroup:id,name,project_id',
            ])
            ->whereNull('archived_at')
            ->orderBy('order_column')
            ->get();

        return response()->json([
            'success' => true,
            'tasks' => $tasks
        ]);
    }

    /**
     * Get project groups for API
     */
    public function apiGroups(Request $request, Project $project)
    {
        $user = Auth::user();
        
        // Get workspace from middleware
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        if (!$workspace || $project->workspace_id !== $workspace->id) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        try {
            $groups = $project->taskGroups()
                ->withCount('tasks')
                ->orderBy('position', 'asc')
                ->get();
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch task groups: ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'success' => true,
            'groups' => $groups
        ]);
    }
    /**
     * Get projects for API (for dashboard and other components)
     */
    public function apiIndex(Request $request)
    {
        $user = Auth::user();
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 400);
        }

        $query = Project::with(['clientCompany', 'teamMembers'])
            ->where('workspace_id', $workspace->id);

        if ($userRole === 'client' || $userRole === 'member') {
            $query->whereHas('teamMembers', function (Builder $query) use ($user) {
                $query->where('user_id', $user->id);
            });
        }

        $projects = $query->orderBy('created_at', 'desc')
                         ->take(10) // Limit for dashboard
                         ->get()
                         ->map(function ($project) {
                             $project->clients = $project->teamMembers->where('pivot.role', 'client')->values();
                             $project->team_members = $project->teamMembers->where('pivot.role', '!=', 'client')->values();
                             return $project;
                         });

        return response()->json($projects);
    }
}
