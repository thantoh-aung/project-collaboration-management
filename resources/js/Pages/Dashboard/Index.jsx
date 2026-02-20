import MainLayout from '@/Layouts/MainLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useWorkspace } from '@/Context/WorkspaceContext';
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
  Calendar
} from 'lucide-react';

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
          className="text-slate-600"
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
          className="text-blue-500 transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-sm font-medium text-white">{progress}%</span>
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status) => {
  const colors = {
    'planning': 'bg-slate-700 text-slate-300 border-0',
    'active': 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-md shadow-blue-600/30',
    'on_hold': 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white border-0 shadow-md shadow-yellow-600/30',
    'completed': 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0 shadow-md shadow-emerald-600/30',
    'archived': 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-0 shadow-md shadow-red-600/30',
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
      
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        </div>
        
        <div className="relative z-10 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">Dashboard</h1>
              {/* Role Badge */}
              <Badge className={`${
                userRole === 'admin' ? 'bg-purple-600/20 text-purple-300 border-purple-500/30' :
                userRole === 'client' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' :
                'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {userRole === 'admin' ? 'Administrator' :
                 userRole === 'client' ? 'Client' :
                 'Team Member'}
              </Badge>
            </div>
            <p className="text-sm text-gray-300">
              Welcome back! Here's what's happening in your workspace.
              {!hasDashboardPermission('view_all_projects') && (
                <span className="ml-2 text-amber-400">
                  (Showing only your assigned projects and tasks)
                </span>
              )}
            </p>
          </div>
          {hasDashboardPermission('create_projects') && (
            <Button onClick={() => router.visit('/projects/create')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 border-0 transition-all duration-300 transform hover:scale-105">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {/* Workspace Members Section (Admin & Client only) */}
        {hasDashboardPermission('view_workspace_members') && workspaceMembers.length > 0 && (
          <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-lg font-semibold text-white">Workspace Members</CardTitle>
                <Badge variant="secondary">{workspaceMembers.length} members</Badge>
              </div>
              <CardDescription>
                People collaborating in this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaceMembers.slice(0, 6).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-700 to-blue-900/30 rounded-xl border border-slate-600 hover:border-blue-500 transition-all duration-300">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                    <Badge className={`${
                      member.workspace_role === 'admin' ? 'bg-purple-600/20 text-purple-300 border-purple-500/30' :
                      member.workspace_role === 'client' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' :
                      'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {member.workspace_role === 'admin' ? 'Admin' :
                       member.workspace_role === 'client' ? 'Client' :
                       'Member'}
                    </Badge>
                  </div>
                ))}
                {workspaceMembers.length > 6 && (
                  <div className="flex items-center justify-center p-3 bg-gradient-to-r from-slate-700 to-blue-900/30 rounded-xl border border-slate-600">
                    <span className="text-sm text-gray-300">+{workspaceMembers.length - 6} more members</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-bl-[40px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Projects</CardTitle>
              <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <FolderOpen className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{statistics.total_projects}</div>
              <p className="text-xs text-gray-400 mt-1">
                Active projects
              </p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-slate-800 border-slate-700 shadow-lg shadow-emerald-600/20">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-600/20 to-green-600/20 rounded-bl-[40px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Tasks</CardTitle>
              <div className="h-9 w-9 bg-gradient-to-tr from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <CheckSquare className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{statistics.total_tasks}</div>
              <div className="text-xs text-gray-400 mt-1">
                {statistics.completed_tasks} completed
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-slate-800 border-slate-700 shadow-lg shadow-purple-600/20">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-600/20 to-violet-600/20 rounded-bl-[40px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Task Progress</CardTitle>
              <div className="h-9 w-9 bg-gradient-to-tr from-purple-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <ProgressRing progress={taskProgress} />
                <p className="text-xs text-gray-400 mt-1">
                  {statistics.completed_tasks} of {statistics.total_tasks} tasks completed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Items Compact Card */}
        <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-red-600/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <CardTitle className="text-base font-semibold text-white">Overdue Items</CardTitle>
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
                  <h4 className="text-sm font-medium text-red-300">Tasks</h4>
                  {props.overdueTasks && props.overdueTasks.length > 0 && (
                    <Badge variant="destructive" className="text-xs h-5 px-1.5">
                      {props.overdueTasks.length}
                    </Badge>
                  )}
                </div>
                {props.overdueTasks && props.overdueTasks.length > 0 ? (
                  <div className="space-y-1">
                    {props.overdueTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-red-900/30 border border-red-700 rounded hover:bg-red-900/50 transition-colors cursor-pointer text-xs"
                           onClick={() => router.visit(`/projects/${task.project_id}/tasks`)}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{task.name}</p>
                            <p className="text-gray-400 truncate">{task.project?.name}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-red-300 border-red-600 text-xs h-5 px-1.5">
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                    {props.overdueTasks.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{props.overdueTasks.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3 bg-emerald-900/30 rounded border border-emerald-700">
                    <CheckSquare className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs text-emerald-300 font-medium">None overdue</p>
                  </div>
                )}
              </div>

              {/* Overdue Projects */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="h-3 w-3 text-red-500" />
                  <h4 className="text-sm font-medium text-red-300">Projects</h4>
                  {props.overdueProjects && props.overdueProjects.length > 0 && (
                    <Badge variant="destructive" className="text-xs h-5 px-1.5">
                      {props.overdueProjects.length}
                    </Badge>
                  )}
                </div>
                {props.overdueProjects && props.overdueProjects.length > 0 ? (
                  <div className="space-y-1">
                    {props.overdueProjects.slice(0, 2).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-2 bg-red-900/30 border border-red-700 rounded hover:bg-red-900/50 transition-colors cursor-pointer text-xs"
                           onClick={() => router.visit(`/projects/${project.id}`)}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{project.name}</p>
                            <p className="text-gray-400 truncate">{project.client_company?.name || 'No client'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-red-300 border-red-600 text-xs h-5 px-1.5">
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                    {props.overdueProjects.length > 2 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{props.overdueProjects.length - 2} more
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3 bg-emerald-900/30 rounded border border-emerald-700">
                    <FolderOpen className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs text-emerald-300 font-medium">None overdue</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <Card className="lg:col-span-2 bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-lg font-semibold text-white">Recent Projects</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Your latest project activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project, index) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border border-slate-600 rounded-xl hover:bg-gradient-to-r hover:from-blue-900/30 hover:to-purple-900/30 hover:border-blue-500 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                         onClick={() => router.visit(`/projects/${project.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                          <FolderOpen className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white">{project.name}</p>
                          <p className="text-xs text-gray-400">{project.client_company?.name || 'No client'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {userRole === 'member' ? 'No Assigned Projects' : 'No Projects Yet'}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {userRole === 'member' 
                      ? "You haven't been assigned to any projects yet. Contact your workspace admin to get started."
                      : "Projects will appear here once created"
                    }
                  </p>
                  {userRole === 'admin' && hasDashboardPermission('create_projects') && (
                    <Button onClick={() => router.visit('/projects/create')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-emerald-600/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-lg font-semibold text-white">Recent Tasks</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Tasks assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.map((task, index) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-slate-600 rounded-xl hover:bg-gradient-to-r hover:from-blue-900/30 hover:to-purple-900/30 hover:border-blue-500 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                         onClick={() => router.visit(`/projects/${task.project_id}/tasks`)}>
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          task.completed_at ? 'bg-emerald-500' :
                          task.status === 'in_progress' ? 'bg-indigo-500' :
                          'bg-gray-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{task.name}</p>
                          <p className="text-xs text-gray-400">{task.project?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{task.status}</Badge>
                        {task.priority && (
                          <Badge variant="outline">{task.priority}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {userRole === 'member' ? 'No Tasks in Your Projects' : 'No Tasks Yet'}
                  </h3>
                  <p className="text-gray-400 mb-4">
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
          <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-amber-600/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-400" />
                <CardTitle className="text-lg font-semibold text-white">Recent Comments</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Latest activity on your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentComments.length > 0 ? (
                <div className="space-y-3">
                  {recentComments.map((comment, index) => (
                    <div key={comment.id} className="flex items-start gap-3 p-3 bg-gradient-to-r from-slate-700 to-blue-900/30 rounded-xl border border-slate-600 hover:border-blue-500 transition-all duration-300">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.avatar_url} alt={comment.user?.name} />
                        <AvatarFallback>
                          {comment.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{comment.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{comment.body}</p>
                        <p className="text-xs text-gray-400">{comment.task?.name || 'Unknown'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {userRole === 'member' ? 'No Comments in Your Projects' : 'No Comments Yet'}
                  </h3>
                  <p className="text-gray-400">
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
      </div>
    </MainLayout>
  );
}
