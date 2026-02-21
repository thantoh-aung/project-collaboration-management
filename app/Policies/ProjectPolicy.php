<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use App\Models\Workspace;

class ProjectPolicy
{
    /**
     * Determine whether the user can view the project.
     */
    public function view(User $user, Project $project): bool
    {
        $workspace = $project->workspace;
        if (!$workspace->hasUser($user)) {
            return false;
        }

        $role = $workspace->getUserRole($user);
        if ($role === 'admin' || $role === 'member') {
            return true;
        }

        if ($role === 'client') {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create projects.
     */
    public function create(User $user, Workspace $workspace): bool
    {
        $role = $workspace->getUserRole($user);
        return $role === 'admin';
    }

    /**
     * Determine whether the user can update the project.
     */
    public function update(User $user, Project $project): bool
    {
        $workspace = $project->workspace;
        if (!$workspace->hasUser($user)) {
            return false;
        }

        $role = $workspace->getUserRole($user);
        if ($role === 'admin') {
            return true;
        }

        // Members can edit if they are team members
        if ($role === 'member') {
            return $project->teamMembers()->where('user_id', $user->id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can delete the project.
     */
    public function delete(User $user, Project $project): bool
    {
        $workspace = $project->workspace;
        return $workspace->getUserRole($user) === 'admin';
    }
}
