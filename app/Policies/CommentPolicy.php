<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Can view comments if they can view tasks
        return $user->can('tasks.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Comment $comment): bool
    {
        // Can view comment if they can view the task
        return $user->can('view', $comment->task);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // All authenticated users can create comments
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Comment $comment): bool
    {
        // Admin can update any comment
        if ($user->hasRole('admin')) {
            return true;
        }

        // Users can only update their own comments
        return $comment->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Comment $comment): bool
    {
        // Admin can delete any comment
        if ($user->hasRole('admin')) {
            return true;
        }

        // Users can only delete their own comments
        return $comment->user_id === $user->id;
    }
}
