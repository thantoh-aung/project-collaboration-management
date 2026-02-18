<?php

namespace App\Policies;

use App\Models\TimeLog;
use App\Models\User;

class TimeLogPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('time-logs.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, TimeLog $timeLog): bool
    {
        // Admin can view all time logs
        if ($user->hasRole('admin')) {
            return true;
        }

        // Check permission
        if (!$user->can('time-logs.view')) {
            return false;
        }

        // Users can view their own time logs
        if ($timeLog->user_id === $user->id) {
            return true;
        }

        // Manager can view all time logs in their projects
        if ($user->hasRole('manager')) {
            return $user->hasProjectAccess($timeLog->task->project);
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('time-logs.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, TimeLog $timeLog): bool
    {
        // Admin can update all time logs
        if ($user->hasRole('admin')) {
            return true;
        }

        // Check permission
        if (!$user->can('time-logs.edit')) {
            return false;
        }

        // Users can only update their own time logs
        return $timeLog->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, TimeLog $timeLog): bool
    {
        // Admin can delete all time logs
        if ($user->hasRole('admin')) {
            return true;
        }

        // Check permission
        if (!$user->can('time-logs.delete')) {
            return false;
        }

        // Users can only delete their own time logs
        return $timeLog->user_id === $user->id;
    }
}
