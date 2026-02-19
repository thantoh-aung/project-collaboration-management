<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use App\Models\TaskGroup;

class TaskController extends Controller
{
    private function getCurrentWorkspace(Request $request)
    {
        return $request->attributes->get('currentWorkspace')
            ?? $request->attributes->get('workspace');
    }

    /**
     * Store a newly created task.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $workspace = $this->getCurrentWorkspace($request);
        $userRole = $request->attributes->get('userRole') ?? $request->attributes->get('user_role');

        if ($userRole === 'client') {
            return response()->json(['error' => 'Clients cannot create tasks'], 403);
        }

        abort_unless($user && $user->can('create', Task::class), 403);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to_user_id' => 'nullable|exists:users,id',
            'due_on' => 'nullable|date',
            'group_id' => 'nullable|exists:task_groups,id',
            'project_id' => 'required|exists:projects,id',
        ]);

        $project = Project::query()->findOrFail($validated['project_id']);

        if (!$workspace || $project->workspace_id !== $workspace->id) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        abort_unless($user->can('view', $project), 403);

        // Verify the group belongs to the project
        if (!empty($validated['group_id'])) {
            $group = TaskGroup::query()
                ->where('id', $validated['group_id'])
                ->where('project_id', $validated['project_id'])
                ->whereNull('archived_at')
                ->first();

            if (!$group) {
                return response()->json(['error' => 'Invalid group for this project'], 400);
            }
        }

        // Validate task due date against project due date
        if (!empty($validated['due_on']) && $project->due_date) {
            $taskIdDueDate = \Carbon\Carbon::parse($validated['due_on']);
            $projectDueDate = \Carbon\Carbon::parse($project->due_date);
            
            if ($taskIdDueDate->gt($projectDueDate)) {
                return response()->json([
                    'error' => 'Task due date cannot be after project due date (' . $projectDueDate->format('Y-m-d') . ').'
                ], 422);
            }
        }

        $groupId = $validated['group_id'] ?? null;

        // Get the highest order_column in the group
        $maxOrder = Task::query()
            ->where('project_id', $validated['project_id'])
            ->where('group_id', $groupId)
            ->whereNull('archived_at')
            ->max('order_column');

        $taskId = Task::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'assigned_to_user_id' => $validated['assigned_to_user_id'],
            'due_on' => $validated['due_on'],
            'group_id' => $groupId,
            'project_id' => $validated['project_id'],
            'order_column' => ((int) ($maxOrder ?? -1)) + 1,
            'created_by_user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'task' => $taskId->load([
                'assignedToUser:id,name,avatar',
                'taskGroup:id,name,project_id',
            ]),
        ]);
    }

    /**
     * Update the specified task.
     */
    public function update(Request $request, $workspace, $task)
    {
        \Log::info('API Task Update Called', [
            'task_id' => $task,
            'user_id' => $request->user()->id,
            'user_email' => $request->user()->email,
            'workspace_id' => $this->getCurrentWorkspace($request)?->id,
            'user_role' => $request->attributes->get('userRole') ?? $request->attributes->get('user_role'),
            'request_data' => $request->all(),
            'headers' => $request->headers->all(),
        ]);

        $user = $request->user();
        $workspace = $this->getCurrentWorkspace($request);
        $userRole = $request->attributes->get('userRole') ?? $request->attributes->get('user_role');

        if ($userRole === 'client') {
            return response()->json(['error' => 'Clients cannot update tasks'], 403);
        }

        // Find the task within the workspace context
        $task = Task::where('id', $task)
            ->whereHas('project', function ($query) use ($workspace) {
                $query->where('workspace_id', $workspace->id);
            })
            ->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        // Debug logging for permission check
        \Log::info('API Task Update Permission Check', [
            'task_id' => $task->id,
            'task_name' => $task->name,
            'assigned_to_user_id' => $task->assigned_to_user_id,
            'user_id' => $user->id,
            'user_email' => $user->email,
            'workspace_id' => $workspace->id,
            'workspace_role_from_request' => $userRole,
            'workspace_role_from_attributes' => $request->attributes->get('userRole'),
            'workspace_role_from_attributes_alt' => $request->attributes->get('user_role'),
            'all_request_attributes' => $request->attributes->all(),
            'project_id' => $task->project_id,
            'workspace_user_relation' => $workspace ? $workspace->workspaceUsers()->where('user_id', $user->id)->first()?->toArray() : null
        ]);

        abort_unless($user && $user->can('update', $task), 403);

        $task->loadMissing('project');
        if (!$workspace || $task->project->workspace_id !== $workspace->id) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        $validated = $request->validate([
            'group_id' => 'sometimes|nullable|exists:task_groups,id',
            'order_column' => 'sometimes|required|integer|min:0',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'assigned_to_user_id' => 'sometimes|nullable|exists:users,id',
            'due_on' => 'sometimes|nullable|date',
            'completed' => 'sometimes|boolean',
        ]);

        // Validate task due date against project due date
        if (array_key_exists('due_on', $validated) && !empty($validated['due_on']) && $task->project->due_date) {
            $taskDueDate = \Carbon\Carbon::parse($validated['due_on']);
            $projectDueDate = \Carbon\Carbon::parse($task->project->due_date);
            
            if ($taskDueDate->gt($projectDueDate)) {
                return response()->json([
                    'error' => 'Task due date cannot be after project due date (' . $projectDueDate->format('Y-m-d') . ').'
                ], 422);
            }
        }

        // Check if user is trying to reassign the task
        if (array_key_exists('assigned_to_user_id', $validated) && $validated['assigned_to_user_id'] != $task->assigned_to_user_id) {
            // Only admins can reassign tasks
            $workspace = $task->project->workspace;
            $workspaceRole = $workspace ? $workspace->getUserRole($user) : null;
            
            if ($workspaceRole !== 'admin' && !$user->hasRole('admin')) {
                return response()->json(['error' => 'Only admins can reassign tasks.'], 403);
            }
        }

        // If updating group_id, verify it belongs to the same project
        if (array_key_exists('group_id', $validated) && $validated['group_id'] !== null) {
            $group = TaskGroup::query()
                ->where('id', $validated['group_id'])
                ->where('project_id', $task->project_id)
                ->whereNull('archived_at')
                ->first();

            if (!$group) {
                return response()->json(['error' => 'Invalid group for this project'], 400);
            }
        }

        $newGroupId = array_key_exists('group_id', $validated)
            ? $validated['group_id']
            : $task->group_id;

        // If updating order_column (and/or group_id), reorder other tasks
        if (array_key_exists('order_column', $validated)) {
            $this->reorderTasks($task, $newGroupId, (int) $validated['order_column']);
        } elseif (array_key_exists('group_id', $validated) && $newGroupId !== $task->group_id) {
            $maxOrder = Task::query()
                ->where('project_id', $task->project_id)
                ->where('group_id', $newGroupId)
                ->whereNull('archived_at')
                ->max('order_column');

            $validated['order_column'] = ((int) ($maxOrder ?? -1)) + 1;
        }

        $task->update($validated);

        \Log::info('API Task Update Success', [
            'task_id' => $task->id,
            'task_name' => $task->name,
            'updated_fields' => array_keys($validated),
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'task' => $task->fresh()->load([
                'assignedToUser:id,name,avatar',
                'taskGroup:id,name,project_id',
            ]),
        ]);
    }

    /**
     * Reorder tasks when moving between groups or changing position
     */
    private function reorderTasks(Task $taskId, $newGroupId, int $newOrderColumn)
    {
        $oldGroupId = $taskId->group_id;
        $oldOrderColumn = $taskId->order_column;

        if ($newGroupId !== null) {
            $newGroupId = (int) $newGroupId;
        }

        // If moving to a different group
        if ($oldGroupId !== $newGroupId) {
            // Decrease order_column of tasks in old group that were after this task
            Task::query()
                ->where('project_id', $taskId->project_id)
                ->where('group_id', $oldGroupId)
                ->whereNull('archived_at')
                ->where('order_column', '>', $oldOrderColumn)
                ->decrement('order_column');

            // Increase order_column of tasks in new group that are at or after new order_column
            Task::query()
                ->where('project_id', $taskId->project_id)
                ->where('group_id', $newGroupId)
                ->whereNull('archived_at')
                ->where('order_column', '>=', $newOrderColumn)
                ->increment('order_column');
        } else {
            // Moving within the same group
            if ($newOrderColumn > $oldOrderColumn) {
                // Moving down: decrement tasks between old and new order
                Task::query()
                    ->where('project_id', $taskId->project_id)
                    ->where('group_id', $oldGroupId)
                    ->whereNull('archived_at')
                    ->where('order_column', '>', $oldOrderColumn)
                    ->where('order_column', '<=', $newOrderColumn)
                    ->decrement('order_column');
            } else {
                // Moving up: increment tasks between new and old order
                Task::query()
                    ->where('project_id', $taskId->project_id)
                    ->where('group_id', $oldGroupId)
                    ->whereNull('archived_at')
                    ->where('order_column', '>=', $newOrderColumn)
                    ->where('order_column', '<', $oldOrderColumn)
                    ->increment('order_column');
            }
        }
    }

    /**
     * Remove the specified task.
     */
    public function destroy(Request $request, $workspace, $task)
    {
        $user = $request->user();
        $workspace = $this->getCurrentWorkspace($request);
        $userRole = $request->attributes->get('userRole') ?? $request->attributes->get('user_role');

        if ($userRole === 'client') {
            return response()->json(['error' => 'Clients cannot delete tasks'], 403);
        }

        // Find the task within the workspace context
        $task = Task::where('id', $task)
            ->whereHas('project', function ($query) use ($workspace) {
                $query->where('workspace_id', $workspace->id);
            })
            ->first();

        if (!$taskId) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        $task->loadMissing('project');
        if (!$workspace || $task->project->workspace_id !== $workspace->id) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        $oldGroupId = $task->group_id;
        $oldOrderColumn = $task->order_column;

        $task->archived_at = now();
        $task->save();

        // Reorder remaining tasks in the group
        Task::query()
            ->where('project_id', $task->project_id)
            ->where('group_id', $oldGroupId)
            ->whereNull('archived_at')
            ->where('order_column', '>', $oldOrderColumn)
            ->decrement('order_column');

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully'
        ]);
    }
}
