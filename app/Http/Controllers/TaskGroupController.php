<?php

namespace App\Http\Controllers;

use App\Models\TaskGroup;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class TaskGroupController extends Controller
{
    /**
     * Store a newly created custom task group.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'name' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $project = Project::findOrFail($request->project_id);

        // Check if user has permission to create groups in this project
        $this->authorizeProjectAccess($user, $project);

        try {
            // Create custom group at the correct position
            $taskGroup = TaskGroup::createCustomGroup(
                $request->project_id,
                $request->name
            );

            return response()->json([
                'success' => true,
                'message' => 'Custom group created successfully',
                'task_group' => $taskGroup->load('project')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create custom group: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified task group.
     */
    public function update(Request $request, TaskGroup $taskGroup): JsonResponse
    {
        $user = $request->user();

        // Check if user has permission to update this group
        $this->authorizeProjectAccess($user, $taskGroup->project);

        // Check if group can be renamed (only custom groups)
        if (!$taskGroup->canBeRenamed()) {
            return response()->json([
                'success' => false,
                'message' => 'System groups cannot be renamed'
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $taskGroup->update(['name' => $request->name]);

        return response()->json([
            'success' => true,
            'message' => 'Group updated successfully',
            'task_group' => $taskGroup->load('project')
        ]);
    }

    /**
     * Remove the specified task group.
     */
    public function destroy(Request $request, TaskGroup $taskGroup): JsonResponse
    {
        $user = $request->user();

        // Check if user has permission to delete this group
        $this->authorizeProjectAccess($user, $taskGroup->project);

        // Check if group can be deleted (only custom groups)
        if (!$taskGroup->canBeDeleted()) {
            return response()->json([
                'success' => false,
                'message' => 'System groups cannot be deleted'
            ], 403);
        }

        // Check if group has tasks
        if ($taskGroup->tasks()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete group that contains tasks. Move tasks to another group first.'
            ], 422);
        }

        $taskGroup->delete();

        return response()->json([
            'success' => true,
            'message' => 'Group deleted successfully'
        ]);
    }

    /**
     * Reorder task groups.
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'positions' => 'required|array',
            'positions.*' => 'integer|min:1',
        ]);

        $user = $request->user();
        $project = Project::findOrFail($request->project_id);

        // Check if user has permission to reorder groups in this project
        $this->authorizeProjectAccess($user, $project);

        try {
            $result = TaskGroup::reorderGroups($request->project_id, $request->positions);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to reorder groups',
                    'errors' => $result['errors']
                ], 422);
            }

            // Return updated groups in order
            $updatedGroups = TaskGroup::where('project_id', $request->project_id)
                ->ordered()
                ->get()
                ->load('project');

            return response()->json([
                'success' => true,
                'message' => 'Groups reordered successfully',
                'task_groups' => $updatedGroups
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder groups: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all task groups for a project in order.
     */
    public function index(Request $request, int $projectId): JsonResponse
    {
        $user = $request->user();
        $project = Project::findOrFail($projectId);

        // Check if user has permission to view groups in this project
        $this->authorizeProjectAccess($user, $project);

        $taskGroups = TaskGroup::where('project_id', $projectId)
            ->ordered()
            ->get()
            ->load(['project', 'tasks' => function ($query) {
                $query->with(['assignedToUser', 'taskGroup']);
            }]);

        return response()->json([
            'success' => true,
            'task_groups' => $taskGroups
        ]);
    }

    /**
     * Get the specified task group.
     */
    public function show(Request $request, TaskGroup $taskGroup): JsonResponse
    {
        $user = $request->user();

        // Check if user has permission to view this group
        $this->authorizeProjectAccess($user, $taskGroup->project);

        $taskGroup->load(['project', 'tasks' => function ($query) {
            $query->with(['assignedToUser', 'taskGroup']);
        }]);

        return response()->json([
            'success' => true,
            'task_group' => $taskGroup
        ]);
    }

    /**
     * Check if user has access to the project.
     */
    private function authorizeProjectAccess($user, $project): void
    {
        // Check if user is a workspace member or client of the project
        $hasAccess = $project->workspace->users()->where('users.id', $user->id)->exists() ||
                   $project->teamMembers()->where('users.id', $user->id)->exists();

        if (!$hasAccess) {
            throw new \Illuminate\Auth\Access\AuthorizationException('You do not have access to this project');
        }
    }
}
