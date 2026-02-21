import MainLayout from '@/Layouts/MainLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useWorkspace } from '@/Context/WorkspaceContext';
import UserProfileLink from '@/Components/UserProfileLink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  FolderOpen,
  CheckSquare,
  TrendingUp,
  Plus,
  MessageSquare,
  Star,
  Users,
  AlertTriangle,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Progress Ring Component
const ProgressRing = ({ progress, size = 60, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-[#E2E8F0]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-[#4F46E5] transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-sm font-semibold text-[#0F172A]">{progress}%</span>
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status) => {
  const colors = {
    'planning': 'bg-[#F1F5F9] text-[#64748B] border-0',
    'active': 'bg-[rgba(79,70,229,0.08)] text-[#4F46E5] border-0',
    'on_hold': 'bg-amber-50 text-amber-700 border-0',
    'completed': 'bg-emerald-50 text-emerald-700 border-0',
    'archived': 'bg-red-50 text-red-600 border-0',
  };
  return colors[status] || colors.planning;
};

export default function Dashboard() {
  const { props } = usePage();
  const { hasPermission: workspaceHasPermission } = useWorkspace();

  // Get real data from backend
  const recentProjects = props.recentProjects || [];
  const recentTasks = props.recentTasks || [];
  const recentComments = props.recentComments || [];
  const workspaceMembers = props.workspaceMembers || [];
  const userPermissions = props.userPermissions || {};
  const statistics = props.statistics || {
    total_projects: 0,
    total_tasks: 0,
    total_comments: 0,
    completed_tasks: 0,
  };

  const taskProgress = statistics.progress_percentage || 0;
  const userRole = props.auth?.user_role || 'member';

  // Helper function to check if user has specific permission
  const hasDashboardPermission = (permission) => {
    return userPermissions[permission] === true;
  };

  return (
    <MainLayout title="Dashboard">
      <Head title="Dashboard - CollabTool" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#0F172A]">Dashboard</h1>
              {/* Role Badge */}
              <Badge className={`text-xs font-medium ${userRole === 'admin' ? 'bg-[rgba(79,70,229,0.08)] text-[#4F46E5]' :
                userRole === 'client' ? 'bg-blue-50 text-blue-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                {userRole === 'admin' ? 'Administrator' :
                  userRole === 'client' ? 'Client' :
                    'Team Member'}
              </Badge>
            </div>
            <p className="text-sm text-[#64748B]">
              Welcome back! Here's what's happening in your workspace.
              {!hasDashboardPermission('view_all_projects') && (
                <span className="ml-2 text-amber-600">
                  (Showing only your assigned projects and tasks)
                </span>
              )}
            </p>
          </div>
          {hasDashboardPermission('create_projects') && (
            <Button onClick={() => router.visit('/projects/create')} className="bg-[#4F46E5] text-white hover:bg-[#4338CA] border-0">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {/* Workspace Members Section (Admin & Client only) */}
        {hasDashboardPermission('view_workspace_members') && workspaceMembers.length > 0 && (
          <Card className="bg-white border border-[#E2E8F0]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#4F46E5]" />
                <CardTitle className="text-base font-semibold text-[#0F172A]">Workspace Members</CardTitle>
                <Badge variant="secondary" className="bg-[#F1F5F9] text-[#64748B]">{workspaceMembers.length} members</Badge>
              </div>
              <CardDescription className="text-[#64748B]">
                People collaborating in this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {workspaceMembers.slice(0, 6).map((member) => (
                  <UserProfileLink key={member.id} userId={member.id} className="w-full">
                    <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] hover:border-[rgba(79,70,229,0.3)] transition-all duration-150 w-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-[#4F46E5] text-white text-xs">
                          {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#0F172A]">{member.name}</p>
                        <p className="text-xs text-[#94A3B8]">{member.email}</p>
                      </div>
                      <Badge className={`text-xs ${member.workspace_role === 'admin' ? 'bg-[rgba(79,70,229,0.08)] text-[#4F46E5]' :
                        member.workspace_role === 'client' ? 'bg-blue-50 text-blue-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                        {member.workspace_role === 'admin' ? 'Admin' :
                          member.workspace_role === 'client' ? 'Client' :
                            'Member'}
                      </Badge>
                    </div>
                  </UserProfileLink>
                ))}
                {workspaceMembers.length > 6 && (
                  <div className="flex items-center justify-center p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <span className="text-sm text-[#64748B]">+{workspaceMembers.length - 6} more members</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white border border-[#E2E8F0]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#64748B]">Total Projects</CardTitle>
              <div className="h-9 w-9 bg-[rgba(79,70,229,0.08)] rounded-lg flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-[#4F46E5]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0F172A]">{statistics.total_projects}</div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Active projects
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#E2E8F0]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#64748B]">Total Tasks</CardTitle>
              <div className="h-9 w-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0F172A]">{statistics.total_tasks}</div>
              <div className="text-xs text-[#94A3B8] mt-1">
                {statistics.completed_tasks} completed
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#E2E8F0]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#64748B]">Task Progress</CardTitle>
              <div className="h-9 w-9 bg-[rgba(79,70,229,0.08)] rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[#4F46E5]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <ProgressRing progress={taskProgress} />
                <p className="text-xs text-[#94A3B8] mt-1">
                  {statistics.completed_tasks} of {statistics.total_tasks} tasks completed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Items Compact Card */}
        <Card className="bg-white border border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <CardTitle className="text-base font-semibold text-[#0F172A]">Overdue Items</CardTitle>
              </div>
              <Badge variant="destructive" className="text-xs">
                {(props.overdueTasks?.length || 0) + (props.overdueProjects?.length || 0)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Overdue Tasks */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-3 w-3 text-red-500" />
                  <h4 className="text-sm font-medium text-red-600">Tasks</h4>
                  {props.overdueTasks && props.overdueTasks.length > 0 && (
                    <Badge variant="destructive" className="text-xs h-5 px-1.5">
                      {props.overdueTasks.length}
                    </Badge>
                  )}
                </div>
                {props.overdueTasks && props.overdueTasks.length > 0 ? (
                  <div className="space-y-1">
                    {props.overdueTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors cursor-pointer text-xs"
                        onClick={() => router.visit(`/projects/${task.project_id}/tasks`)}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#0F172A] truncate">{task.name}</p>
                            <p className="text-[#94A3B8] truncate">{task.project?.name}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-red-600 border-red-200 text-xs h-5 px-1.5">
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                    {props.overdueTasks.length > 3 && (
                      <p className="text-xs text-[#94A3B8] text-center">
                        +{props.overdueTasks.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <CheckSquare className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs text-emerald-600 font-medium">None overdue</p>
                  </div>
                )}
              </div>

              {/* Overdue Projects */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="h-3 w-3 text-red-500" />
                  <h4 className="text-sm font-medium text-red-600">Projects</h4>
                  {props.overdueProjects && props.overdueProjects.length > 0 && (
                    <Badge variant="destructive" className="text-xs h-5 px-1.5">
                      {props.overdueProjects.length}
                    </Badge>
                  )}
                </div>
                {props.overdueProjects && props.overdueProjects.length > 0 ? (
                  <div className="space-y-1">
                    {props.overdueProjects.slice(0, 2).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-2 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors cursor-pointer text-xs"
                        onClick={() => router.visit(`/projects/${project.id}`)}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#0F172A] truncate">{project.name}</p>
                            <p className="text-[#94A3B8] truncate">{project.client_company?.name || 'No client'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-red-600 border-red-200 text-xs h-5 px-1.5">
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                    {props.overdueProjects.length > 2 && (
                      <p className="text-xs text-[#94A3B8] text-center">
                        +{props.overdueProjects.length - 2} more
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <FolderOpen className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs text-emerald-600 font-medium">None overdue</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <Card className="lg:col-span-2 bg-white border border-[#E2E8F0]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-[#4F46E5]" />
                <CardTitle className="text-base font-semibold text-[#0F172A]">Recent Projects</CardTitle>
              </div>
              <CardDescription className="text-[#64748B]">
                Your latest project activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.map((project, index) => {
                    const statusConfig = {
                      planning: { color: 'bg-slate-100 text-slate-600', label: 'Planning' },
                      active: { color: 'bg-indigo-50 text-indigo-600', label: 'In Progress' },
                      on_hold: { color: 'bg-amber-50 text-amber-600', label: 'On Hold' },
                      completed: { color: 'bg-emerald-50 text-emerald-600', label: 'Completed' },
                      archived: { color: 'bg-slate-100 text-slate-500', label: 'Archived' },
                    };
                    const status = statusConfig[project.status] || statusConfig.active;

                    return (
                      <div
                        key={project.id}
                        className="group flex items-center justify-between p-3.5 bg-white border border-slate-200/60 rounded-xl hover:shadow-md hover:border-indigo-200/60 transition-all duration-300 cursor-pointer"
                        onClick={() => router.visit(`/projects/${project.id}`)}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm">
                            <FolderOpen className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                              {project.name}
                            </p>
                            <p className="text-xs text-slate-400 font-medium truncate">
                              {project.client_company?.name || 'Internal Project'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", status.color)}>
                            {status.label}
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-[#CBD5E1] mx-auto mb-4" />
                  <h3 className="text-base font-medium text-[#0F172A] mb-2">
                    {userRole === 'member' ? 'No Assigned Projects' : 'No Projects Yet'}
                  </h3>
                  <p className="text-[#64748B] mb-4 text-sm">
                    {userRole === 'member'
                      ? "You haven't been assigned to any projects yet. Contact your workspace admin to get started."
                      : "Projects will appear here once created"
                    }
                  </p>
                  {userRole === 'admin' && hasDashboardPermission('create_projects') && (
                    <Button onClick={() => router.visit('/projects/create')} className="bg-[#4F46E5] text-white hover:bg-[#4338CA]">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card className="bg-white border border-[#E2E8F0]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-base font-semibold text-[#0F172A]">Recent Tasks</CardTitle>
              </div>
              <CardDescription className="text-[#64748B]">
                Tasks assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTasks.length > 0 ? (
                <div className="space-y-2">
                  {recentTasks.map((task, index) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] hover:border-[rgba(79,70,229,0.2)] transition-all duration-150 cursor-pointer"
                      onClick={() => router.visit(`/projects/${task.project_id}/tasks`)}>
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${task.completed_at ? 'bg-emerald-500' :
                          task.status === 'in_progress' ? 'bg-[#4F46E5]' :
                            'bg-[#CBD5E1]'
                          }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[#0F172A]">{task.name}</p>
                          <p className="text-xs text-[#94A3B8]">{task.project?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[#64748B] border-[#E2E8F0] text-xs">{task.status}</Badge>
                        {task.priority && (
                          <Badge variant="outline" className="text-[#64748B] border-[#E2E8F0] text-xs">{task.priority}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-[#CBD5E1] mx-auto mb-4" />
                  <h3 className="text-base font-medium text-[#0F172A] mb-2">
                    {userRole === 'member' ? 'No Tasks in Your Projects' : 'No Tasks Yet'}
                  </h3>
                  <p className="text-[#64748B] mb-4 text-sm">
                    {userRole === 'member'
                      ? "Tasks from your assigned projects will appear here"
                      : "Tasks will appear here once created"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Comments */}
          <Card className="bg-white border border-[#E2E8F0]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base font-semibold text-[#0F172A]">Recent Comments</CardTitle>
              </div>
              <CardDescription className="text-[#64748B]">
                Latest activity on your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentComments.length > 0 ? (
                <div className="space-y-2">
                  {recentComments.map((comment, index) => (
                    <div key={comment.id} className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] hover:border-[rgba(79,70,229,0.2)] transition-all duration-150">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.avatar_url} alt={comment.user?.name} />
                        <AvatarFallback className="bg-[#4F46E5] text-white text-xs">
                          {comment.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A]">{comment.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-[#64748B]">{comment.body}</p>
                        <p className="text-xs text-[#94A3B8]">{comment.task?.name || 'Unknown'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-[#CBD5E1] mx-auto mb-4" />
                  <h3 className="text-base font-medium text-[#0F172A] mb-2">
                    {userRole === 'member' ? 'No Comments in Your Projects' : 'No Comments Yet'}
                  </h3>
                  <p className="text-[#64748B] text-sm">
                    {userRole === 'member'
                      ? "Comments from your assigned projects will appear here"
                      : "Comments will appear here once activity happens"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout >
  );
}
