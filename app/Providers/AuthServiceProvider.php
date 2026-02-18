<?php

namespace App\Providers;

use App\Models\User;
use App\Models\Workspace;
use App\Models\Comment;
use App\Policies\WorkspacePolicy;
use App\Policies\TaskPolicy;
use App\Policies\CommentPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Workspace::class => WorkspacePolicy::class,
        \App\Models\Project::class => \App\Policies\ProjectPolicy::class,
        \App\Models\Task::class => TaskPolicy::class,
        Comment::class => CommentPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // Grant abilities based on workspace-level role (stored in workspace_users table).
        // Workspace admins get all abilities. Members get task/project abilities.
        // Clients are read-only (handled by policies returning false).
        Gate::before(function (User $user, string $ability) {
            // Check Spatie admin role first (legacy support)
            if ($user->hasRole('admin')) {
                return true;
            }

            // Check workspace-level admin role from session context
            $workspaceId = session('current_workspace_id');
            if ($workspaceId) {
                $wsRole = \App\Models\WorkspaceUser::where('workspace_id', $workspaceId)
                    ->where('user_id', $user->id)
                    ->value('role');

                // Workspace admins get all abilities
                if ($wsRole === 'admin') {
                    return true;
                }

                // Workspace members get task/project/comment abilities
                if ($wsRole === 'member') {
                    $memberAbilities = [
                        'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign',
                        'tasks.archive', 'tasks.restore', 'tasks.delete',
                        'projects.view', 'projects.create', 'projects.edit',
                        'time-logs.view', 'time-logs.create', 'time-logs.edit',
                    ];
                    if (in_array($ability, $memberAbilities)) {
                        return true;
                    }
                }

                // Clients: only view abilities
                if ($wsRole === 'client') {
                    $clientAbilities = ['tasks.view', 'projects.view', 'time-logs.view'];
                    if (in_array($ability, $clientAbilities)) {
                        return true;
                    }
                }
            }

            return null;
        });
    }
}
