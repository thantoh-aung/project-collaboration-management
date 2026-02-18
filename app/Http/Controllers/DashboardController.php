<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Get workspace from middleware
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        \Log::info('Dashboard Data', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'workspace_id' => $workspace->id,
            'workspace_name' => $workspace->name,
            'user_role' => $userRole,
            'user_usage_type' => $user->usage_type
        ]);

        if (!$workspace) {
            return redirect()->route('workspaces.select');
        }

        $projectsQuery = Project::query()
            ->where('workspace_id', $workspace->id)
            ->whereNull('archived_at');

        // Filter projects based on user role in workspace
        if ($userRole === 'admin') {
            // Admins can see all projects in workspace
            \Log::info('Showing all projects for admin', ['user_id' => $user->id]);
        } elseif ($userRole === 'client') {
            // Clients can see all projects in the workspace
            \Log::info('Showing all projects for client', ['user_id' => $user->id]);
        } elseif ($userRole === 'member') {
            // Team members can only see projects they're assigned to
            $projectsQuery->whereHas('teamMembers', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            });
            \Log::info('Filtering projects for team member - only assigned projects', ['user_id' => $user->id]);
        }

        $allProjectsCount = Project::where('workspace_id', $workspace->id)->whereNull('archived_at')->count();
        $filteredProjectsCount = (clone $projectsQuery)->count();
        
        \Log::info('Projects count', [
            'all_projects' => $allProjectsCount,
            'filtered_projects' => $filteredProjectsCount,
            'user_role' => $userRole
        ]);

        $recentProjects = (clone $projectsQuery)
            ->with(['clientCompany', 'teamMembers'])
            ->latest()
            ->take(5)
            ->get();

        \Log::info('Recent projects', [
            'count' => $recentProjects->count(),
            'projects' => $recentProjects->pluck('name', 'id')->toArray()
        ]);

        $tasksQuery = Task::query()
            ->whereNull('archived_at')
            ->whereHas('project', function ($q) use ($workspace, $userRole, $user) {
                $q->where('workspace_id', $workspace->id)
                  ->whereNull('archived_at');

                if ($userRole === 'admin') {
                    // Admins can see all tasks in workspace
                    \Log::info('Showing all tasks for admin', ['user_id' => $user->id]);
                } elseif ($userRole === 'client') {
                    // Clients can see all tasks in the workspace
                    \Log::info('Showing all tasks for client', ['user_id' => $user->id]);
                } elseif ($userRole === 'member') {
                    // Team members can only see tasks from projects they're assigned to
                    $q->whereHas('teamMembers', function ($q2) use ($user) {
                        $q2->where('user_id', $user->id);
                    });
                    \Log::info('Filtering tasks for team member - only from assigned projects', ['user_id' => $user->id]);
                }
            });

        $allTasksCount = Task::whereNull('archived_at')
            ->whereHas('project', function ($q) use ($workspace) {
                $q->where('workspace_id', $workspace->id)->whereNull('archived_at');
            })->count();
        $filteredTasksCount = (clone $tasksQuery)->count();
        
        \Log::info('Tasks count', [
            'all_tasks' => $allTasksCount,
            'filtered_tasks' => $filteredTasksCount,
            'user_role' => $userRole
        ]);

        $recentTasks = (clone $tasksQuery)
            ->with(['project:id,name'])
            ->latest()
            ->take(5)
            ->get();

        \Log::info('Recent tasks', [
            'count' => $recentTasks->count(),
            'tasks' => $recentTasks->pluck('name', 'id')->toArray()
        ]);

        $commentsQuery = Comment::query()
            ->whereHas('task.project', function ($q) use ($workspace, $userRole, $user) {
                $q->where('workspace_id', $workspace->id)
                  ->whereNull('archived_at');

                if ($userRole === 'admin') {
                    // Admins can see all comments in workspace
                    \Log::info('Showing all comments for admin', ['user_id' => $user->id]);
                } elseif ($userRole === 'client') {
                    // Clients can see all comments in the workspace
                    \Log::info('Showing all comments for client', ['user_id' => $user->id]);
                } elseif ($userRole === 'member') {
                    // Team members can only see comments from projects they're assigned to
                    $q->whereHas('teamMembers', function ($q2) use ($user) {
                        $q2->where('user_id', $user->id);
                    });
                    \Log::info('Filtering comments for team member - only from assigned projects', ['user_id' => $user->id]);
                }
            });

        $recentComments = (clone $commentsQuery)
            ->with([
                'user:id,name,avatar',
                'task:id,name,project_id',
            ])
            ->latest()
            ->take(5)
            ->get();

        \Log::info('Recent comments', [
            'count' => $recentComments->count(),
            'comments' => $recentComments->pluck('content', 'id')->toArray()
        ]);

        $totalTasks = (clone $tasksQuery)->count();
        $completedTasks = (clone $tasksQuery)->whereNotNull('completed_at')->count();

        $statistics = [
            'total_projects' => (clone $projectsQuery)->count(),
            'total_tasks' => $totalTasks,
            'total_comments' => (clone $commentsQuery)->count(),
            'completed_tasks' => $completedTasks,
            'in_progress_tasks' => $totalTasks - $completedTasks,
            'progress_percentage' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0,
        ];

        // Get workspace members for admin and client views
        $workspaceMembers = [];
        if (in_array($userRole, ['admin', 'client'])) {
            $workspaceMembers = $workspace->users()
                ->withPivot('role', 'joined_at')
                ->get()
                ->map(function ($user) use ($workspace) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'avatar' => $user->avatar,
                        'workspace_role' => $workspace->getUserRole($user),
                        'joined_at' => $user->pivot->joined_at,
                    ];
                });
        }

        // Get user permissions based on role
        $userPermissions = $this->getUserPermissions($userRole);

        \Log::info('Dashboard statistics', $statistics);
        \Log::info('Workspace members count', ['count' => $workspaceMembers->count()]);
        \Log::info('User permissions', $userPermissions);

        return Inertia::render('Dashboard/Index', [
            'recentProjects' => $recentProjects,
            'recentTasks' => $recentTasks,
            'recentComments' => $recentComments,
            'statistics' => $statistics,
            'workspaceMembers' => $workspaceMembers,
            'userPermissions' => $userPermissions,
            'auth' => [
                'user' => $user,
                'current_workspace' => $workspace,
                'user_role' => $userRole
            ]
        ]);
    }

    /**
     * Get user permissions based on workspace role
     */
    private function getUserPermissions(string $role): array
    {
        $permissions = [
            'admin' => [
                'view_all_projects' => true,
                'view_all_tasks' => true,
                'view_all_comments' => true,
                'view_workspace_members' => true,
                'create_projects' => true,
                'edit_projects' => true,
                'delete_projects' => true,
                'manage_members' => true,
                'view_analytics' => true,
                'export_data' => true,
            ],
            'client' => [
                'view_all_projects' => true,
                'view_all_tasks' => true,
                'view_all_comments' => true,
                'view_workspace_members' => true,
                'create_projects' => false,
                'edit_projects' => false,
                'delete_projects' => false,
                'manage_members' => false,
                'view_analytics' => true,
                'export_data' => false,
            ],
            'member' => [
                'view_all_projects' => false, // Only assigned projects
                'view_all_tasks' => false,    // Only tasks from assigned projects
                'view_all_comments' => false, // Only comments from assigned projects
                'view_workspace_members' => false,
                'create_projects' => false,
                'edit_projects' => false,
                'delete_projects' => false,
                'manage_members' => false,
                'view_analytics' => false, // Only personal analytics
                'export_data' => false,
            ],
        ];

        return $permissions[$role] ?? [];
    }
}
