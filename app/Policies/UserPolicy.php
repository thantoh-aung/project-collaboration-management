<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        // Users can always view themselves
        if ($user->id === $model->id) {
            return true;
        }

        // Admin can view all users
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('users.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('users.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        // Users can always update themselves
        if ($user->id === $model->id) {
            return true;
        }

        // Admin can update all users
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('users.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        // Users cannot delete themselves
        if ($user->id === $model->id) {
            return false;
        }

        // Admin can delete all users
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('users.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        // Only admin can restore users
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can archive the model.
     */
    public function archive(User $user, User $model): bool
    {
        // Users cannot archive themselves
        if ($user->id === $model->id) {
            return false;
        }

        // Admin can archive all users
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('users.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        // Only admin can permanently delete users
        return $user->hasRole('admin');
    }
}
