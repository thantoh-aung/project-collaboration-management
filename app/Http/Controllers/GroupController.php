<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TaskGroup;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class GroupController extends Controller
{
    /**
     * Store a newly created custom task group.
     */
    public function store(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $project), 403);
        
        // Check workspace-level permissions
        $workspace = $project->workspace;
        $role = $workspace->getUserRole($user);
        abort_unless($role === 'admin' || $role === 'member', 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        try {
            // Create custom group at the correct position (between In Progress and Complete)
            $group = TaskGroup::createCustomGroup($project->id, $data['name']);

            return response()->json([
                'success' => true,
                'message' => 'Custom group created successfully',
                'group' => $group
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create custom group: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created custom task group from workspace context.
     */
    public function storeFromWorkspace(Request $request): JsonResponse
    {
        \Log::info('GroupController storeFromWorkspace called', [
            'request_data' => $request->all(),
            'user_id' => Auth::id(),
            'workspace_id' => $request->attributes->get('currentWorkspace')?->id,
            'user_role' => $request->attributes->get('userRole')
        ]);
        
        $user = Auth::user();
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        abort_unless($workspace && ($userRole === 'admin' || $userRole === 'member'), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'project_id' => ['required', 'exists:projects,id'],
        ]);

        try {
            // Verify user has access to the project
            $project = Project::findOrFail($data['project_id']);
            abort_unless($project->workspace_id === $workspace->id, 403);
            abort_unless($userRole === 'admin' || $project->teamMembers()->where('user_id', $user->id)->exists(), 403);

            // Create custom group at the correct position
            $group = TaskGroup::createCustomGroup($project->id, $data['name']);

            \Log::info('Task group created successfully', [
                'group_id' => $group->id,
                'group_name' => $group->name,
                'project_id' => $group->project_id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Custom group created successfully',
                'group' => $group
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

        abort_unless($user && $user->can('view', $taskGroup->project), 403);
        
        // Check workspace-level permissions
        $workspace = $taskGroup->project->workspace;
        $role = $workspace->getUserRole($user);
        abort_unless($role === 'admin' || $role === 'member', 403);

        // Check if group can be renamed (only custom groups)
        if (!$taskGroup->canBeRenamed()) {
            return response()->json([
                'success' => false,
                'message' => 'System groups cannot be renamed'
            ], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $taskGroup->update(['name' => $data['name']]);

        return response()->json([
            'success' => true,
            'message' => 'Group updated successfully',
            'group' => $taskGroup
        ]);
    }

    /**
     * Remove the specified task group.
     */
    public function destroy(Request $request, TaskGroup $taskGroup): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $taskGroup->project), 403);
        
        // Check workspace-level permissions
        $workspace = $taskGroup->project->workspace;
        $role = $workspace->getUserRole($user);
        abort_unless($role === 'admin' || $role === 'member', 403);

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
     * Restore the specified task group.
     */
    public function restore(Request $request, TaskGroup $taskGroup): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $taskGroup->project), 403);
        
        // Check workspace-level permissions
        $workspace = $taskGroup->project->workspace;
        $role = $workspace->getUserRole($user);
        abort_unless($role === 'admin' || $role === 'member', 403);

        $taskGroup->archived_at = null;
        $taskGroup->save();

        return response()->json([
            'success' => true,
            'message' => 'Group restored successfully',
            'group' => $taskGroup
        ]);
    }

    /**
     * Reorder task groups with validation.
     */
    public function reorder(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $project), 403);
        
        // Check workspace-level permissions
        $workspace = $project->workspace;
        $role = $workspace->getUserRole($user);
        abort_unless($role === 'admin' || $role === 'member', 403);

        $data = $request->validate([
            'ordered_ids' => ['required', 'array'],
            'ordered_ids.*' => ['integer'],
        ]);

        // Convert ordered_ids to positions array
        $positions = [];
        foreach ($data['ordered_ids'] as $index => $groupId) {
            $positions[$groupId] = $index + 1; // Positions start from 1
        }

        try {
            $result = TaskGroup::reorderGroups($project->id, $positions);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to reorder groups',
                    'errors' => $result['errors']
                ], 422);
            }

            // Return updated groups in order
            $updatedGroups = TaskGroup::where('project_id', $project->id)
                ->ordered()
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Groups reordered successfully',
                'groups' => $updatedGroups
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
    public function index(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $project), 403);

        try {
            $taskGroups = TaskGroup::where('project_id', $project->id)
                ->ordered()
                ->get()
                ->load(['tasks' => function ($query) {
                    $query->with(['assignedToUser', 'taskGroup']);
                }]);

            return response()->json([
                'success' => true,
                'groups' => $taskGroups
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch task groups: ' . $e->getMessage()
            ], 500);
        }
    }
}
