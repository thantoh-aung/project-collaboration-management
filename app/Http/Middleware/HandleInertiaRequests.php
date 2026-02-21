<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class HandleInertiaRequests extends Middleware
{
    private function getWorkspacePermissions(?string $userRole): array
    {
        $permissions = [
            'admin' => [
                'view_projects', 'create_projects', 'edit_projects', 'delete_projects',
                'view_users', 'manage_users', 'view_clients', 'manage_clients',
                'view_reports', 'manage_settings',
                'view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks',
            ],
            'member' => [
                'view_projects', 'view_tasks', 'create_tasks', 'edit_tasks',
                'view_time_logs', 'create_time_logs',
                'view_users',
            ],
            'client' => [
                'view_projects', 'view_reports',
                'view_tasks', 'view_users',
            ],
        ];

        if (!$userRole) {
            return [];
        }

        return $permissions[$userRole] ?? [];
    }

    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = Auth::user();
        
        // Debug avatar URL
        if ($user) {
            \Log::info('Auth user avatar debug', [
                'user_id' => $user->id,
                'avatar' => $user->avatar,
                'avatar_url_original' => $user->avatar_url,
                'avatar_url_fixed' => $user->avatar_url ? str_replace('http://localhost', 'http://127.0.0.1:8000', $user->avatar_url) : $user->avatar_url,
            ]);
        }
        
        // Get workspace context from middleware
        $currentWorkspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');
        $workspacePermissions = $this->getWorkspacePermissions($userRole);

        return [
            ...parent::share($request),
            'csrf_token' => csrf_token(),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'avatar_url' => $user->avatar_url ? str_replace('http://localhost', 'http://127.0.0.1:8000', $user->avatar_url) : $user->avatar_url,
                    'job_title' => $user->job_title,
                    'role' => $user->role,
                    'usage_type' => $user->usage_type,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ] : null,
                'current_workspace' => $currentWorkspace,
                'user_role' => $userRole,
                'workspace_permissions' => $workspacePermissions,
            ],
            'unread_message_count' => $user ? $this->getUnreadMessageCount($user) : 0,
            'notifications' => $user ? $this->getLatestNotifications($user) : [],
            'roles' => $this->getSharedRoles(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
        ];
    }

    /**
     * Get unread message count for the authenticated user.
     *
     * @param \App\Models\User $user
     * @return int
     */
    protected function getUnreadMessageCount($user): int
    {
        try {
            $totalUnread = 0;

            // 1. Pre-project messages
            if (DB::getSchemaBuilder()->hasTable('pre_project_messages')) {
                $totalUnread += \App\Models\PreProjectMessage::whereHas('chat', function ($query) use ($user) {
                    $query->where('client_id', $user->id)
                          ->orWhere('freelancer_id', $user->id);
                })
                ->where('sender_id', '!=', $user->id)
                ->whereNull('read_at')
                ->count();
            }

            // 2. Collaboration messages
            if (DB::getSchemaBuilder()->hasTable('collaboration_messages')) {
                $totalUnread += \App\Models\CollaborationMessage::whereHas('collaboration', function ($query) use ($user) {
                    $query->where('user_one_id', $user->id)
                          ->orWhere('user_two_id', $user->id);
                })
                ->where('sender_id', '!=', $user->id)
                ->whereNull('read_at')
                ->count();
            }

            return $totalUnread;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get latest notifications for the authenticated user.
     *
     * @param \App\Models\User $user
     * @return array
     */
    protected function getLatestNotifications($user): array
    {
        try {
            // Check if notifications table exists
            if (!DB::getSchemaBuilder()->hasTable('notifications')) {
                return [];
            }

            return $user->unreadNotifications()
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => class_basename($notification->type),
                        'data' => $notification->data,
                        'read_at' => $notification->read_at?->toIso8601String(),
                        'created_at' => $notification->created_at->toIso8601String(),
                    ];
                })
                ->toArray();
        } catch (\Exception $e) {
            // If there's any error (table doesn't exist, etc.), return empty array
            return [];
        }
    }

    /**
     * Get shared roles list.
     *
     * @return array
     */
    protected function getSharedRoles(): array
    {
        try {
            return Role::all()->pluck('name')->toArray();
        } catch (\Exception $e) {
            // If roles table doesn't exist yet, return empty array
            return [];
        }
    }
}
