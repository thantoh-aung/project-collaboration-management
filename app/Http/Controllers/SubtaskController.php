<?php

namespace App\Http\Controllers;

use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SubtaskController extends Controller
{
    /**
     * Display a listing of the subtasks for a task.
     */
    public function index(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $task), 403);

        $subtasks = $task->subtasks()
            ->with(['assignedToUser:id,name,avatar', 'createdByUser:id,name,avatar'])
            ->orderBy('completed')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'subtasks' => $subtasks,
        ]);
    }

    /**
     * Store a newly created subtask.
     */
    public function store(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('update', $task), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'parent_id' => ['nullable', 'integer', 'exists:subtasks,id'],
            'due_at' => ['nullable', 'date'],
        ]);

        // Validate parent_id belongs to the same task
        if (isset($data['parent_id'])) {
            $parentSubtask = Subtask::find($data['parent_id']);
            if (!$parentSubtask || $parentSubtask->task_id !== $task->id) {
                return response()->json([
                    'error' => 'Invalid parent subtask',
                ], 422);
            }
        }

        $subtask = Subtask::create([
            'task_id' => $task->id,
            'created_by_user_id' => $user->id,
            ...$data,
        ]);

        $subtask->load(['assignedToUser:id,name,avatar', 'createdByUser:id,name,avatar']);

        return response()->json([
            'subtask' => $subtask,
        ], 201);
    }

    /**
     * Display the specified subtask.
     */
    public function show(Request $request, Task $task, Subtask $subtask): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $task), 403);
        abort_unless($subtask->task_id === $task->id, 404);

        $subtask->load([
            'assignedToUser:id,name,avatar',
            'createdByUser:id,name,avatar',
            'children',
        ]);

        return response()->json([
            'subtask' => $subtask,
        ]);
    }

    /**
     * Update the specified subtask.
     */
    public function update(Request $request, Task $task, Subtask $subtask): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('update', $task), 403);
        abort_unless($subtask->task_id === $task->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'parent_id' => ['nullable', 'integer', 'exists:subtasks,id'],
            'due_at' => ['nullable', 'date'],
            'completed' => ['sometimes', 'boolean'],
        ]);

        // Validate parent_id belongs to the same task and doesn't create circular reference
        if (isset($data['parent_id'])) {
            if ($data['parent_id'] === $subtask->id) {
                return response()->json([
                    'error' => 'Subtask cannot be its own parent',
                ], 422);
            }

            $parentSubtask = Subtask::find($data['parent_id']);
            if (!$parentSubtask || $parentSubtask->task_id !== $task->id) {
                return response()->json([
                    'error' => 'Invalid parent subtask',
                ], 422);
            }
        }

        $subtask->update($data);

        // If marking as completed, set completed_at
        if (isset($data['completed']) && $data['completed'] && !$subtask->completed_at) {
            $subtask->completed_at = now();
            $subtask->save();
        } elseif (isset($data['completed']) && !$data['completed'] && $subtask->completed_at) {
            $subtask->completed_at = null;
            $subtask->save();
        }

        $subtask->load(['assignedToUser:id,name,avatar', 'createdByUser:id,name,avatar']);

        return response()->json([
            'subtask' => $subtask,
        ]);
    }

    /**
     * Remove the specified subtask.
     */
    public function destroy(Request $request, Task $task, Subtask $subtask): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('update', $task), 403);
        abort_unless($subtask->task_id === $task->id, 404);

        $subtask->delete();

        return response()->json([
            'message' => 'Subtask deleted successfully',
        ]);
    }

    /**
     * Toggle subtask completion status.
     */
    public function toggleComplete(Request $request, Task $task, Subtask $subtask): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('update', $task), 403);
        abort_unless($subtask->task_id === $task->id, 404);

        if ($subtask->completed) {
            $subtask->markAsIncomplete();
        } else {
            $subtask->markAsCompleted();
        }

        $subtask->load(['assignedToUser:id,name,avatar', 'createdByUser:id,name,avatar']);

        return response()->json([
            'subtask' => $subtask,
        ]);
    }
}
