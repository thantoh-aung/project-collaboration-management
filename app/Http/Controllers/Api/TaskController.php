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

        $groupId = $validated['group_id'] ?? null;

        // Get the highest order_column in the group
        $maxOrder = Task::query()
            ->where('project_id', $validated['project_id'])
            ->where('group_id', $groupId)
            ->whereNull('archived_at')
            ->max('order_column');

        $task = Task::create([
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
            'task' => $task->load([
                'assignedToUser:id,name,avatar',
                'taskGroup:id,name,project_id',
            ]),
        ]);
    }

    /**
     * Update the specified task.
     */
    public function update(Request $request, Task $task)
    {
        $user = $request->user();
        $workspace = $this->getCurrentWorkspace($request);
        $userRole = $request->attributes->get('userRole') ?? $request->attributes->get('user_role');

        if ($userRole === 'client') {
            return response()->json(['error' => 'Clients cannot update tasks'], 403);
        }

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
        ]);

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
    private function reorderTasks(Task $task, $newGroupId, int $newOrderColumn)
    {
        $oldGroupId = $task->group_id;
        $oldOrderColumn = $task->order_column;

        if ($newGroupId !== null) {
            $newGroupId = (int) $newGroupId;
        }

        // If moving to a different group
        if ($oldGroupId !== $newGroupId) {
            // Decrease order_column of tasks in old group that were after this task
            Task::query()
                ->where('project_id', $task->project_id)
                ->where('group_id', $oldGroupId)
                ->whereNull('archived_at')
                ->where('order_column', '>', $oldOrderColumn)
                ->decrement('order_column');

            // Increase order_column of tasks in new group that are at or after new order_column
            Task::query()
                ->where('project_id', $task->project_id)
                ->where('group_id', $newGroupId)
                ->whereNull('archived_at')
                ->where('order_column', '>=', $newOrderColumn)
                ->increment('order_column');
        } else {
            // Moving within the same group
            if ($newOrderColumn > $oldOrderColumn) {
                // Moving down: decrement tasks between old and new order
                Task::query()
                    ->where('project_id', $task->project_id)
                    ->where('group_id', $oldGroupId)
                    ->whereNull('archived_at')
                    ->where('order_column', '>', $oldOrderColumn)
                    ->where('order_column', '<=', $newOrderColumn)
                    ->decrement('order_column');
            } else {
                // Moving up: increment tasks between new and old order
                Task::query()
                    ->where('project_id', $task->project_id)
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
    public function destroy(Task $task)
    {
        $user = request()->user();
        $workspace = $this->getCurrentWorkspace(request());
        $userRole = request()->attributes->get('userRole') ?? request()->attributes->get('user_role');

        if ($userRole === 'client') {
            return response()->json(['error' => 'Clients cannot delete tasks'], 403);
        }

        abort_unless($user && $user->can('archive', $task), 403);

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
