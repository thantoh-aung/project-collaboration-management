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
        // Admin can view all tasks
        if ($user->hasRole('admin')) {
            return true;
        }

        // Check if user has access to the project - if yes, they can view tasks
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
        $workspaceRole = $user->workspaceUsers()
            ->where('workspace_id', $task->project->workspace_id)
            ->value('role');
        
        // Admin can update all tasks
        if ($workspaceRole === 'admin') {
            return true;
        }

        // Clients cannot update tasks - they can only view
        if ($workspaceRole === 'client') {
            return false;
        }

        // Assigned member can update/move their own task
        return (int) $task->assigned_to_user_id === (int) $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Task $task): bool
    {
        // Admin can delete all tasks
        if ($user->hasRole('admin')) {
            return true;
        }

        // Clients cannot delete tasks - they can only view
        if ($user->hasRole('client')) {
            return false;
        }

        // Check permission and project access
        return $user->can('tasks.delete') && $user->hasProjectAccess($task->project);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Task $task): bool
    {
        // Admin can restore all tasks
        if ($user->hasRole('admin')) {
            return true;
        }

        // Check permission and project access
        return $user->can('tasks.restore') && $user->hasProjectAccess($task->project);
    }

    /**
     * Determine whether the user can archive the model.
     */
    public function archive(User $user, Task $task): bool
    {
        // Admin can archive all tasks
        if ($user->hasRole('admin')) {
            return true;
        }

        // Check permission
        if (!$user->can('tasks.archive')) {
            return false;
        }

        // Check project access
        if (!$user->hasProjectAccess($task->project)) {
            return false;
        }

        // Developers and Designers can only archive assigned tasks
        $userRoles = $user->getRoleNames()->toArray();
        if (in_array('developer', $userRoles) || in_array('designer', $userRoles)) {
            return $task->assigned_to_user_id === $user->id;
        }

        return true;
    }

    /**
     * Determine whether the user can assign the task.
     */
    public function assign(User $user, Task $task): bool
    {
        // Admin and Manager can assign tasks
        if ($user->hasRole(['admin', 'manager'])) {
            return true;
        }

        return $user->can('tasks.assign');
    }
}
