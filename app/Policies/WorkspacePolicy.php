<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Auth\Access\Response;

class WorkspacePolicy
{
    /**
     * Determine if the user can view the workspace.
     */
    public function view(User $user, Workspace $workspace): bool
    {
        return $workspace->hasUser($user);
    }

    /**
     * Determine if the user can update the workspace.
     */
    public function update(User $user, Workspace $workspace): bool
    {
        return $workspace->isUserAdmin($user);
    }

    /**
     * Determine if the user can delete the workspace.
     */
    public function delete(User $user, Workspace $workspace): bool
    {
        return $workspace->owner_id === $user->id;
    }

    /**
     * Determine if the user can manage invitations (admin only).
     */
    public function manageInvitations(User $user, Workspace $workspace): bool
    {
        return $workspace->isUserAdmin($user);
    }

    /**
     * Determine if the user can manage members (admin only).
     */
    public function manageMembers(User $user, Workspace $workspace): bool
    {
        return $workspace->isUserAdmin($user);
    }

    /**
     * Determine if the user can create projects.
     */
    public function createProjects(User $user, Workspace $workspace): bool
    {
        $role = $workspace->getUserRole($user);
        return in_array($role, ['admin', 'member']);
    }

    /**
     * Determine if the user can view all projects.
     */
    public function viewAllProjects(User $user, Workspace $workspace): bool
    {
        $role = $workspace->getUserRole($user);
        return in_array($role, ['admin', 'member']);
    }

    /**
     * Determine if the user can manage tasks.
     */
    public function manageTasks(User $user, Workspace $workspace): bool
    {
        $role = $workspace->getUserRole($user);
        return in_array($role, ['admin', 'member']);
    }
}
