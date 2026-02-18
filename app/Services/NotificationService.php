<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Task;
use App\Models\User;

class NotificationService
{
    /**
     * Notify when a task is assigned to someone.
     */
    public static function taskAssigned(Task $task, User $actor): void
    {
        if (!$task->assigned_to_user_id || $task->assigned_to_user_id === $actor->id) {
            return;
        }

        Notification::notify(
            $task->assigned_to_user_id,
            'task_assigned',
            'Task Assigned to You',
            "{$actor->name} assigned you to \"{$task->name}\"",
            [
                'task_id' => $task->id,
                'project_id' => $task->project_id,
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
            ]
        );
    }

    /**
     * Notify project members when a comment is added.
     */
    public static function commentAdded(Task $task, User $actor, string $commentBody): void
    {
        $project = $task->project;
        if (!$project) return;

        // Notify task assignee and project members (except the actor)
        $userIds = collect();

        // Task assignee
        if ($task->assigned_to_user_id && $task->assigned_to_user_id !== $actor->id) {
            $userIds->push($task->assigned_to_user_id);
        }

        // Task creator
        if ($task->created_by_user_id && $task->created_by_user_id !== $actor->id) {
            $userIds->push($task->created_by_user_id);
        }

        $preview = mb_strlen($commentBody) > 80 ? mb_substr($commentBody, 0, 80) . '...' : $commentBody;

        foreach ($userIds->unique() as $userId) {
            Notification::notify(
                $userId,
                'comment_added',
                'New Comment',
                "{$actor->name} commented on \"{$task->name}\": {$preview}",
                [
                    'task_id' => $task->id,
                    'project_id' => $task->project_id,
                    'actor_id' => $actor->id,
                    'actor_name' => $actor->name,
                ]
            );
        }
    }

    /**
     * Notify when an attachment is added.
     */
    public static function attachmentAdded(Task $task, User $actor, string $filename): void
    {
        $userIds = collect();

        if ($task->assigned_to_user_id && $task->assigned_to_user_id !== $actor->id) {
            $userIds->push($task->assigned_to_user_id);
        }
        if ($task->created_by_user_id && $task->created_by_user_id !== $actor->id) {
            $userIds->push($task->created_by_user_id);
        }

        foreach ($userIds->unique() as $userId) {
            Notification::notify(
                $userId,
                'attachment_added',
                'New Attachment',
                "{$actor->name} attached \"{$filename}\" to \"{$task->name}\"",
                [
                    'task_id' => $task->id,
                    'project_id' => $task->project_id,
                    'actor_id' => $actor->id,
                    'actor_name' => $actor->name,
                ]
            );
        }
    }

    /**
     * Notify when task status changes (moved between groups).
     */
    public static function statusChanged(Task $task, User $actor, string $newStatus): void
    {
        $userIds = collect();

        if ($task->assigned_to_user_id && $task->assigned_to_user_id !== $actor->id) {
            $userIds->push($task->assigned_to_user_id);
        }
        if ($task->created_by_user_id && $task->created_by_user_id !== $actor->id) {
            $userIds->push($task->created_by_user_id);
        }

        foreach ($userIds->unique() as $userId) {
            Notification::notify(
                $userId,
                'status_changed',
                'Task Status Changed',
                "{$actor->name} moved \"{$task->name}\" to {$newStatus}",
                [
                    'task_id' => $task->id,
                    'project_id' => $task->project_id,
                    'actor_id' => $actor->id,
                    'actor_name' => $actor->name,
                    'new_status' => $newStatus,
                ]
            );
        }
    }
}
