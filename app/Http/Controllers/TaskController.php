<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\TaskGroup;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function workspaceIndex(Request $request)
    {
        $user = Auth::user();
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        if (!$workspace) {
            return Inertia::render('Tasks/Index', [
                'tasks' => [],
                'auth' => ['user' => $user],
                'message' => 'Please join a workspace to view tasks.'
            ]);
        }

        $query = Task::with(['project', 'assignedToUser', 'taskGroup'])
            ->whereHas('project', function ($q) use ($workspace) {
                $q->where('workspace_id', $workspace->id);
            })
            ->whereNull('archived_at');

        // Apply role-based filtering
        if ($userRole === 'admin') {
            // Admin can see all tasks - no filtering needed
        } elseif ($userRole === 'client') {
            // Clients can see all tasks in projects they have access to
            $query->whereHas('project.teamMembers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } elseif ($userRole === 'member') {
            // Members can see:
            // 1. Unassigned tasks (assigned_to_user_id is null) in projects they're team members of
            // 2. Tasks assigned to them
            // 3. Tasks they created
            $query->where(function ($q) use ($user) {
                $q->whereNull('assigned_to_user_id') // Unassigned tasks
                    ->whereHas('project.teamMembers', function ($subQ) use ($user) {
                        $subQ->where('user_id', $user->id);
                    })
                  ->orWhere('assigned_to_user_id', $user->id) // Assigned to them
                  ->orWhere('created_by_user_id', $user->id); // Created by them
            });
        }

        $tasks = $query->latest()->paginate(20);

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'auth' => [
                'user' => $user,
                'current_workspace' => $workspace,
                'user_role' => $userRole
            ]
        ]);
    }

    public function storeFromWorkspace(Request $request)
    {
        \Log::info('TaskController storeFromWorkspace called', [
            'request_data' => $request->all(),
            'user_id' => Auth::id(),
            'workspace_id' => $request->attributes->get('currentWorkspace')?->id,
            'user_role' => $request->attributes->get('userRole')
        ]);
        
        $user = Auth::user();
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        if (!$workspace) {
            return response()->json(['error' => 'No workspace selected'], 400);
        }

        // Check permissions
        if ($userRole === 'client') {
            return response()->json(['error' => 'Clients cannot create tasks'], 403);
        }

        // Map old frontend group IDs to new database IDs before validation
        // Also handle direct database IDs (21, 22, 23)
        $groupMapping = [
            1 => 21, // To Do
            2 => 22, // In Progress  
            3 => 23, // Complete
            21 => 21, // To Do (direct)
            22 => 22, // In Progress (direct)
            23 => 23, // Complete (direct)
        ];
        
        $requestData = $request->all();
        if (isset($requestData['group_id']) && isset($groupMapping[$requestData['group_id']])) {
            $originalGroupId = $requestData['group_id'];
            $requestData['group_id'] = $groupMapping[$requestData['group_id']];
            \Log::info('Processed group_id', [
                'original_group_id' => $originalGroupId,
                'final_group_id' => $requestData['group_id']
            ]);
            // Update the request with mapped data
            $request->merge($requestData);
        }

        try {
            $data = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'project_id' => ['required', 'integer', 'exists:projects,id'],
                'group_id' => ['nullable', 'integer', 'exists:task_groups,id,project_id,' . $requestData['project_id']],
                'assigned_to_user_id' => ['nullable', 'integer', 'exists:users,id'],
                'due_on' => ['nullable', 'date'],
                'status' => ['nullable', 'string', 'in:todo,in-progress,completed'],
            ]);

            // Custom validation: Check if task due date exceeds project due date
            if (!empty($data['due_on'])) {
                $project = \App\Models\Project::find($data['project_id']);
                if ($project && $project->due_date) {
                    $taskDueDate = \Carbon\Carbon::parse($data['due_on']);
                    $projectDueDate = \Carbon\Carbon::parse($project->due_date);
                    
                    if ($taskDueDate->gt($projectDueDate)) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'due_on' => "Task due date cannot be after project due date ({$projectDueDate->format('Y-m-d')})."
                        ]);
                    }
                }
            }

            \Log::info('Task creation data received', [
                'validated_data' => $data,
                'group_id' => $data['group_id'] ?? 'null',
                'project_id' => $data['project_id']
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Task validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            $errorMessages = [];
            foreach ($e->errors() as $field => $messages) {
                $errorMessages = array_merge($errorMessages, $messages);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed: ' . implode(', ', $errorMessages)
            ], 422);
        }

        // Verify project belongs to workspace and user has access
        $project = \App\Models\Project::where('id', $data['project_id'])
            ->where('workspace_id', $workspace->id)
            ->firstOrFail();

        if ($userRole !== 'admin') {
            // Check if user is a team member of the project
            if (!$project->teamMembers()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'You do not have access to this project'], 403);
            }
        }

        try {
            $task = new Task();
            $task->fill($data);
            $task->created_by_user_id = $user->id;
            
            // Automatically assign task to creator if not already assigned
            if (!isset($data['assigned_to_user_id']) || empty($data['assigned_to_user_id'])) {
                $task->assigned_to_user_id = $user->id;
            }
            
            $task->save();

            \Log::info('Task created successfully', [
                'task_id' => $task->id,
                'task_name' => $task->name,
                'project_id' => $task->project_id,
                'created_by_user_id' => $task->created_by_user_id,
                'assigned_to_user_id' => $task->assigned_to_user_id,
                'creator_id' => $user->id
            ]);

            // Dispatch event for real-time report updates
            broadcast(new \App\Events\TaskCreated($task))->toOthers();

            return response()->json([
                'success' => true,
                'message' => 'Task created successfully',
                'task' => $task->load(['assignedToUser:id,name,avatar', 'taskGroup:id,name']),
                'event' => 'taskCreated'
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Task creation failed', [
                'error' => $e->getMessage(),
                'data' => $data,
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create task: ' . $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request, Project $project)
    {
        $user = $request->user();
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        // Check if user has access to this project
        if (!$workspace || $project->workspace_id !== $workspace->id) {
            abort(403, 'You do not have access to this project.');
        }

        // Check permissions based on role
        if ($userRole === 'member') {
            if (!$project->teamMembers()->where('user_id', $user->id)->exists()) {
                abort(403, 'You do not have access to this project.');
            }
        }
        // Clients and admins can access all projects in workspace by default
        // No additional permission check needed for clients and admins

        $includeArchived = (bool) $request->boolean('include_archived', false);
        $groupId = $request->input('group_id');

        $query = Task::query()
            ->where('project_id', $project->id)
            ->when(!$includeArchived, fn ($q) => $q->whereNull('archived_at'))
            ->when($groupId !== null, fn ($q) => $q->where('group_id', $groupId))
            ->with([
                'assignedToUser:id,name,avatar',
                'createdByUser:id,name,avatar',
                'taskGroup:id,name,project_id',
                'rootSubtasks' => function ($query) {
                    $query->with(['assignedToUser:id,name,avatar', 'children'])
                          ->orderBy('completed')
                          ->orderBy('created_at');
                },
                'comments' => function ($query) {
                    $query->with('user:id,name,avatar')->orderBy('created_at', 'asc');
                },
                'attachments',
            ])
            ->withCount(['comments', 'attachments'])
            ->orderBy('order_column');

        // Apply strict task-level permissions for members
        if ($userRole === 'member') {
            // Members can see:
            // 1. Unassigned tasks (assigned_to_user_id is null) in projects they're team members of
            // 2. Tasks assigned to them
            // 3. Tasks they created
            $query->where(function ($q) use ($user, $project) {
                $q->whereNull('assigned_to_user_id') // Unassigned tasks
                    ->whereHas('project.teamMembers', function ($subQ) use ($user) {
                        $subQ->where('user_id', $user->id);
                    })
                  ->orWhere('assigned_to_user_id', $user->id) // Assigned to them
                  ->orWhere('created_by_user_id', $user->id); // Created by them
            });
        }
        // Admin and client can see all tasks (no filtering needed)

        $tasks = $query->get();
        
        // Get team members for assignment dropdown
        $teamMembers = $project->teamMembers()->withPivot('role')->get();

        // Get task groups from database
        $taskGroups = TaskGroup::where('project_id', $project->id)
            ->orderBy('position')
            ->get();

        return Inertia::render('Projects/ClickUpTasks', [
            'project' => $project,
            'tasks' => $tasks,
            'taskGroups' => $taskGroups,
            'teamMembers' => $teamMembers,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $user = $request->user();
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        // Check if user has access to this project
        if (!$workspace || $project->workspace_id !== $workspace->id) {
            abort(403, 'You do not have access to this project.');
        }

        // Only admins and members can create tasks
        if ($userRole === 'client') {
            abort(403, 'Clients cannot create tasks.');
        }

        // Members must be team members of the project to create tasks
        if ($userRole === 'member') {
            if (!$project->teamMembers()->where('user_id', $user->id)->exists()) {
                abort(403, 'You must be a team member to create tasks.');
            }
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'group_id' => ['nullable', 'integer', 'exists:task_groups,id'],
            'assigned_to_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'due_on' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:todo,in-progress,in-review,qa,done,deployed'],
            'time_estimate' => ['nullable', 'integer', 'min:0'],
            'labels' => ['nullable', 'array'],
            'labels.*' => ['string'],
            'billable' => ['nullable', 'boolean'],
            'hidden_from_clients' => ['nullable', 'boolean'],
        ]);

        if (!empty($data['due_on'])) {
            $projectDueDate = $project->due_date ? \Carbon\Carbon::parse($project->due_date) : null;
            $taskDueDate = \Carbon\Carbon::parse($data['due_on']);

            if ($projectDueDate && $taskDueDate->gt($projectDueDate)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'due_on' => "Task due date cannot be after project due date ({$projectDueDate->format('Y-m-d')})."
                ]);
            }
        }

        // Validate that assigned user is a team member of the project
        if (!empty($data['assigned_to_user_id'])) {
            if (!$project->teamMembers()->where('user_id', $data['assigned_to_user_id'])->exists()) {
                abort(403, 'Assigned user must be a team member of the project.');
            }
        }

        if (isset($data['group_id'])) {
            $group = TaskGroup::query()->where('project_id', $project->id)->whereNull('archived_at')->findOrFail($data['group_id']);
        }

        $task = new Task();
        $task->fill($data);
        $task->project_id = $project->id;
        $task->created_by_user_id = $user->id;
        
        // Convert time estimate from hours to minutes if provided
        if (isset($data['time_estimate'])) {
            $task->time_estimate = $data['time_estimate'] * 60; // Convert to minutes
        }

        if (!array_key_exists('billable', $data)) {
            $task->billable = true;
        }

        if (!array_key_exists('hidden_from_clients', $data)) {
            $task->hidden_from_clients = false;
        }

        $task->save();

        // Load relationships for the response
        $task->load(['assignedToUser:id,name,avatar', 'createdByUser:id,name,avatar', 'taskGroup:id,name,project_id']);
        
        // Ensure group_id is available in the response
        $task->makeVisible(['group_id']);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'task' => $task,
            ], 201);
        }

        return redirect()
            ->route('auth.workspaces.projects.tasks', $project->id)
            ->with('success', 'Task created successfully.');
    }

    public function update(Request $request, Task $task)
    {
        $user = $request->user();

        abort_unless($user && $user->can('update', $task), 403);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'group_id' => ['nullable', 'integer', 'exists:task_groups,id'],
            'assigned_to_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'due_on' => ['nullable', 'date'],
            'priority' => ['nullable', 'string', 'in:low,normal,medium,high'],
            'billable' => ['nullable', 'boolean'],
            'hidden_from_clients' => ['nullable', 'boolean'],
            'completed' => ['nullable', 'boolean'],
        ]);

        // Custom validation: Check if task due date exceeds project due date
        if (array_key_exists('due_on', $data) && !empty($data['due_on'])) {
            $project = \App\Models\Project::find($task->project_id);
            if ($project && $project->due_date) {
                $taskDueDate = \Carbon\Carbon::parse($data['due_on']);
                $projectDueDate = \Carbon\Carbon::parse($project->due_date);
                
                if ($taskDueDate->gt($projectDueDate)) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'due_on' => "Task due date cannot be after project due date ({$projectDueDate->format('Y-m-d')})."
                    ]);
                }
            }
        }

        if (array_key_exists('group_id', $data) && $data['group_id'] !== null) {
            $group = TaskGroup::query()->where('project_id', $task->project_id)->whereNull('archived_at')->findOrFail($data['group_id']);
            abort_unless($user->can('view', $group->project), 403);

            // Auto-set completed_at based on group name
            if (strtolower($group->name) === 'complete') {
                $task->completed_at = $task->completed_at ?? now();
            } else {
                $task->completed_at = null;
            }
        }

        // Handle explicit completed flag
        if (array_key_exists('completed', $data)) {
            $task->completed_at = $data['completed'] ? ($task->completed_at ?? now()) : null;
            unset($data['completed']);
        }

        // Check if user is trying to reassign the task
        if (isset($data['assigned_to_user_id']) && $data['assigned_to_user_id'] != $task->assigned_to_user_id) {
            // Only admins can reassign tasks
            $workspace = $task->project->workspace;
            $workspaceRole = $workspace ? $workspace->getUserRole($user) : null;
            
            \Log::info('Task reassignment attempt', [
                'user_id' => $user->id,
                'workspace_role' => $workspaceRole,
                'task_id' => $task->id,
                'old_assignee' => $task->assigned_to_user_id,
                'new_assignee' => $data['assigned_to_user_id'],
            ]);
            
            if ($workspaceRole !== 'admin' && !$user->hasRole('admin')) {
                abort(403, 'Only admins can reassign tasks.');
            }
        }

        // Detect changes for notifications (before updating)
        $oldAssignee = $task->assigned_to_user_id;
        $oldGroupId = $task->group_id;

        // Update the task
        $task->fill($data);
        $task->save();

        // Refresh the task to get latest data
        $task->refresh();
        
        \Log::info('Task updated successfully', [
            'task_id' => $task->id,
            'assigned_to_user_id' => $task->assigned_to_user_id,
            'created_by_user_id' => $task->created_by_user_id,
            'priority' => $task->priority,
            'updated_by' => $user->id,
        ]);

        // Trigger notifications
        if (isset($data['assigned_to_user_id']) && $data['assigned_to_user_id'] != $oldAssignee) {
            NotificationService::taskAssigned($task, $user);
        }
        if (isset($data['group_id']) && $data['group_id'] != $oldGroupId) {
            $newGroup = TaskGroup::find($data['group_id']);
            if ($newGroup) {
                NotificationService::statusChanged($task, $user, $newGroup->name);
            }
        }

        // Dispatch event for real-time report updates
        broadcast(new \App\Events\TaskUpdated($task))->toOthers();

        // Return fresh task with all relationships
        $freshTask = $task->fresh()->load([
            'assignedToUser:id,name,avatar',
            'createdByUser:id,name,avatar',
            'taskGroup:id,name,project_id'
        ]);

        return response()->json([
            'task' => $freshTask,
            'event' => 'taskUpdated'
        ]);
    }

    public function destroy(Request $request, Task $task)
    {
        $user = $request->user();

        abort_unless($user && $user->can('archive', $task), 403);

        $task->archived_at = now();
        $task->save();

        return response()->json([
            'task' => $task,
        ]);
    }

    public function restore(Request $request, Task $task)
    {
        $user = $request->user();

        abort_unless($user && $user->can('restore', $task), 403);

        $task->archived_at = null;
        $task->save();

        return response()->json([
            'task' => $task,
        ]);
    }

    public function complete(Request $request, Task $task)
    {
        $user = $request->user();

        abort_unless($user && $user->can('update', $task), 403);

        $task->completed_at = $task->completed_at ?? now();
        $task->save();

        return response()->json([
            'task' => $task,
        ]);
    }

    public function reorder(Request $request, Project $project)
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $project), 403);
        abort_unless($user->can('tasks.edit') || $user->hasRole('admin'), 403);

        $data = $request->validate([
            'ordered_ids' => ['required', 'array'],
            'ordered_ids.*' => ['integer'],
        ]);

        $taskIds = $data['ordered_ids'];

        $count = Task::query()
            ->where('project_id', $project->id)
            ->whereIn('id', $taskIds)
            ->count();

        abort_unless($count === count($taskIds), 422);

        Task::setNewOrder($taskIds);

        return response()->json([
            'status' => 'ok',
        ]);
    }

    public function move(Request $request, Task $task)
    {
        $user = $request->user();

        abort_unless($user && $user->can('update', $task), 403);

        $data = $request->validate([
            'group_id' => ['nullable', 'integer', 'exists:task_groups,id'],
        ]);

        $targetGroupId = $data['group_id'] ?? null;

        if ($targetGroupId !== null) {
            $group = TaskGroup::query()->where('project_id', $task->project_id)->whereNull('archived_at')->findOrFail($targetGroupId);
            abort_unless($user->can('view', $group->project), 403);
        }

        $nextOrder = Task::query()
            ->where('project_id', $task->project_id)
            ->where('group_id', $targetGroupId)
            ->whereNull('archived_at')
            ->max('order_column');

        $task->group_id = $targetGroupId;
        $task->order_column = ((int) ($nextOrder ?? 0)) + 1;

        // Auto-set completed_at based on target group name
        if ($targetGroupId !== null) {
            $targetGroup = TaskGroup::find($targetGroupId);
            if ($targetGroup && strtolower($targetGroup->name) === 'complete') {
                $task->completed_at = $task->completed_at ?? now();
            } else {
                $task->completed_at = null;
            }
        }

        $task->save();

        return response()->json([
            'task' => $task,
        ]);
    }
}
