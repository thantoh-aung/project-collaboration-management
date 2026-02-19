<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('tasks.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Task $task): bool
    {
        // Get workspace role for this task's project
        $workspace = $task->project->workspace;
        $workspaceRole = $workspace ? $workspace->getUserRole($user) : null;
        
        // Admin can view all tasks
        if ($workspaceRole === 'admin' || $user->hasRole('admin')) {
            return true;
        }

        // If task is unassigned (assigned_to_user_id is null), all project team members can view it
        if ($task->assigned_to_user_id === null) {
            if ($workspaceRole === 'member') {
                return $task->project->teamMembers()->where('user_id', $user->id)->exists();
            }
            if ($workspaceRole === 'client') {
                return $user->hasProjectAccess($task->project);
            }
        }

        // If task is assigned, only the assigned member (and admin) can view it
        if ($workspaceRole === 'member') {
            return (int) $task->assigned_to_user_id === (int) $user->id 
                || (int) $task->created_by_user_id === (int) $user->id;
        }

        // Clients can view all tasks (read-only access)
        if ($workspaceRole === 'client') {
            return $user->hasProjectAccess($task->project);
        }

        // Default: check project access
        return $user->hasProjectAccess($task->project);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('tasks.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Task $task): bool
    {
        // Get workspace role for this task's project
        $workspace = $task->project->workspace;
        $workspaceRole = $workspace ? $workspace->getUserRole($user) : null;
        
        // Fallback: try to get role from request context if workspace getUserRole fails
        if ($workspaceRole === null && $workspace) {
            $request = request();
            if ($request) {
                $workspaceRole = $request->attributes->get('userRole') 
                    ?? $request->attributes->get('user_role');
                
                \Log::info('TaskPolicy::update - Using fallback role from request', [
                    'task_id' => $task->id,
                    'user_id' => $user->id,
                    'workspace_getUserRole_result' => $workspace ? $workspace->getUserRole($user) : null,
                    'fallback_role' => $workspaceRole
                ]);
            }
        }
        
        \Log::info('TaskPolicy::update - Initial check', [
            'task_id' => $task->id,
            'task_name' => $task->name,
            'user_id' => $user->id,
            'user_email' => $user->email,
            'workspace_id' => $workspace?->id,
            'workspace_role' => $workspaceRole,
            'assigned_to_user_id' => $task->assigned_to_user_id,
            'created_by_user_id' => $task->created_by_user_id,
            'user_has_admin_role' => $user->hasRole('admin'),
            'workspace_user_relation' => $workspace ? $workspace->workspaceUsers()->where('user_id', $user->id)->first()?->toArray() : null
        ]);
        
        // Admin can update all tasks
        if ($workspaceRole === 'admin' || $user->hasRole('admin')) {
            \Log::info('TaskPolicy::update - Admin access granted', [
                'task_id' => $task->id,
                'workspace_role' => $workspaceRole,
                'user_has_admin_role' => $user->hasRole('admin')
            ]);
            return true;
        }

        // Clients cannot update tasks - they can only view
        if ($workspaceRole === 'client') {
            \Log::info('TaskPolicy::update - Client access denied', [
                'task_id' => $task->id,
                'workspace_role' => $workspaceRole
            ]);
            return false;
        }

        // If task is unassigned (assigned_to_user_id is null), all project team members can update it
        if ($task->assigned_to_user_id === null) {
            if ($workspaceRole === 'member') {
                // Check if user is a team member of the project
                $isTeamMember = $task->project->teamMembers()->where('user_id', $user->id)->exists();
                \Log::info('TaskPolicy::update - Unassigned task check', [
                    'task_id' => $task->id,
                    'task_name' => $task->name,
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'workspace_role' => $workspaceRole,
                    'is_team_member' => $isTeamMember,
                    'project_id' => $task->project_id,
                    'project_team_members' => $task->project->teamMembers()->pluck('user_id')->toArray(),
                    'result' => $isTeamMember
                ]);
                return $isTeamMember;
            }
        }

        // If task is assigned, only the assigned member can update it
        if ($workspaceRole === 'member') {
            $isAssignedUser = (int) $task->assigned_to_user_id === (int) $user->id;
            $isCreator = (int) $task->created_by_user_id === (int) $user->id;
            $result = $isAssignedUser || $isCreator;
            
            \Log::info('TaskPolicy::update - Assigned task check', [
                'task_id' => $task->id,
                'task_name' => $task->name,
                'user_id' => $user->id,
                'user_email' => $user->email,
                'workspace_role' => $workspaceRole,
                'assigned_to_user_id' => $task->assigned_to_user_id,
                'created_by_user_id' => $task->created_by_user_id,
                'is_assigned_user' => $isAssignedUser,
                'is_creator' => $isCreator,
                'result' => $result
            ]);
            
            return $result;
        }

        \Log::warning('TaskPolicy::update - No permission match found', [
            'task_id' => $task->id,
            'user_id' => $user->id,
            'workspace_role' => $workspaceRole,
            'assigned_to_user_id' => $task->assigned_to_user_id
        ]);

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Task $task): bool
    {
        // Get workspace role for this task's project
        $workspace = $task->project->workspace;
        $workspaceRole = $workspace ? $workspace->getUserRole($user) : null;
        
        // Admin can delete all tasks
        if ($workspaceRole === 'admin' || $user->hasRole('admin')) {
            return true;
        }

        // Clients cannot delete tasks - they can only view
        if ($workspaceRole === 'client') {
            return false;
        }

        // If task is unassigned (assigned_to_user_id is null), all project team members can delete it
        if ($task->assigned_to_user_id === null) {
            if ($workspaceRole === 'member') {
                // Check if user is a team member of the project
                $isTeamMember = $task->project->teamMembers()->where('user_id', $user->id)->exists();
                \Log::info('Unassigned task delete check', [
                    'task_id' => $task->id,
                    'task_name' => $task->name,
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'workspace_role' => $workspaceRole,
                    'is_team_member' => $isTeamMember,
                    'project_id' => $task->project_id,
                    'project_team_members' => $task->project->teamMembers()->pluck('user_id')->toArray()
                ]);
                return $isTeamMember;
            }
        }

        // If task is assigned, only the assigned member can delete it
        if ($workspaceRole === 'member') {
            return (int) $task->assigned_to_user_id === (int) $user->id 
                || (int) $task->created_by_user_id === (int) $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Task $task): bool
    {
        // Get workspace role for this task's project
        $workspace = $task->project->workspace;
        $workspaceRole = $workspace ? $workspace->getUserRole($user) : null;
        
        // Admin can restore all tasks
        if ($workspaceRole === 'admin' || $user->hasRole('admin')) {
            return true;
        }

        // Clients cannot restore tasks
        if ($workspaceRole === 'client') {
            return false;
        }

        // If task is unassigned (assigned_to_user_id is null), all project team members can restore it
        if ($task->assigned_to_user_id === null) {
            if ($workspaceRole === 'member') {
                return $task->project->teamMembers()->where('user_id', $user->id)->exists();
            }
        }

        // If task is assigned, only the assigned member can restore it
        if ($workspaceRole === 'member') {
            return (int) $task->assigned_to_user_id === (int) $user->id 
                || (int) $task->created_by_user_id === (int) $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can archive the model.
     */
    public function archive(User $user, Task $task): bool
    {
        // Get workspace role for this task's project
        $workspace = $task->project->workspace;
        $workspaceRole = $workspace ? $workspace->getUserRole($user) : null;
        
        // Admin can archive all tasks
        if ($workspaceRole === 'admin' || $user->hasRole('admin')) {
            return true;
        }

        // Clients cannot archive tasks
        if ($workspaceRole === 'client') {
            return false;
        }

        // If task is unassigned (assigned_to_user_id is null), all project team members can archive it
        if ($task->assigned_to_user_id === null) {
            if ($workspaceRole === 'member') {
                return $task->project->teamMembers()->where('user_id', $user->id)->exists();
            }
        }

        // If task is assigned, only the assigned member can archive it
        if ($workspaceRole === 'member') {
            return (int) $task->assigned_to_user_id === (int) $user->id 
                || (int) $task->created_by_user_id === (int) $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can assign the task.
     */
    public function assign(User $user, Task $task): bool
    {
        // Get workspace role for this task's project
        $workspace = $task->project->workspace;
        $workspaceRole = $workspace ? $workspace->getUserRole($user) : null;
        
        // Admin can assign tasks
        if ($workspaceRole === 'admin' || $user->hasRole('admin')) {
            return true;
        }

        // Only admins can reassign tasks (members cannot change assignments)
        return false;
    }
}
