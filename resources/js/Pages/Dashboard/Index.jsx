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
  Users
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
          className="text-gray-200"
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
          className="text-indigo-600 transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-sm font-medium">{progress}%</span>
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status) => {
  const colors = {
    'planning': 'bg-gray-100 text-gray-700 border-0',
    'active': 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-md shadow-indigo-500/30',
    'on_hold': 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 shadow-md shadow-yellow-500/30',
    'completed': 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-md shadow-emerald-500/30',
    'archived': 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-md shadow-red-500/30',
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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Dashboard</h1>
              {/* Role Badge */}
              <Badge className={`${
                userRole === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                userRole === 'client' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                'bg-green-100 text-green-800 border-green-200'
              }`}>
                {userRole === 'admin' ? 'Administrator' :
                 userRole === 'client' ? 'Client' :
                 'Team Member'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Welcome back! Here's what's happening in your workspace.
              {!hasDashboardPermission('view_all_projects') && (
                <span className="ml-2 text-amber-600">
                  (Showing only your assigned projects and tasks)
                </span>
              )}
            </p>
          </div>
          {hasDashboardPermission('create_projects') && (
            <Button onClick={() => router.visit('/projects/create')} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 border-0 transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {/* Workspace Members Section (Admin & Client only) */}
        {hasDashboardPermission('view_workspace_members') && workspaceMembers.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg font-semibold">Workspace Members</CardTitle>
                <Badge variant="secondary">{workspaceMembers.length} members</Badge>
              </div>
              <CardDescription>
                People collaborating in this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaceMembers.slice(0, 6).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl border border-gray-100">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    <Badge className={`${
                      member.workspace_role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      member.workspace_role === 'client' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      {member.workspace_role === 'admin' ? 'Admin' :
                       member.workspace_role === 'client' ? 'Client' :
                       'Member'}
                    </Badge>
                  </div>
                ))}
                {workspaceMembers.length > 6 && (
                  <div className="flex items-center justify-center p-3 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-600">+{workspaceMembers.length - 6} more members</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg stat-card-indigo">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-[40px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
              <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <FolderOpen className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{statistics.total_projects}</div>
              <p className="text-xs text-gray-500 mt-1">
                Active projects
              </p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg stat-card-emerald">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-bl-[40px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
              <div className="h-9 w-9 bg-gradient-to-tr from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckSquare className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{statistics.total_tasks}</div>
              <div className="text-xs text-gray-500 mt-1">
                {statistics.completed_tasks} completed
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg stat-card-purple">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-bl-[40px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Task Progress</CardTitle>
              <div className="h-9 w-9 bg-gradient-to-tr from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <ProgressRing progress={taskProgress} />
                <p className="text-xs text-gray-500 mt-1">
                  {statistics.completed_tasks} of {statistics.total_tasks} tasks completed
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg stat-card-amber">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-bl-[40px]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
              <div className="h-9 w-9 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{statistics.in_progress_tasks || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {statistics.total_comments || 0} comments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
              </div>
              <CardDescription>
                Your latest project activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project, index) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 hover:border-indigo-200 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                         onClick={() => router.visit(`/projects/${project.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                          <FolderOpen className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{project.name}</p>
                          <p className="text-xs text-gray-500">{project.client_company?.name || 'No client'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        {project.priority && (
                          <Badge variant="outline">{project.priority}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {userRole === 'member' ? 'No Assigned Projects' : 'No Projects Yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {userRole === 'member' 
                      ? "You haven't been assigned to any projects yet. Contact your workspace admin to get started."
                      : "Projects will appear here once created"
                    }
                  </p>
                  {userRole === 'admin' && hasDashboardPermission('create_projects') && (
                    <Button onClick={() => router.visit('/projects/create')} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-lg font-semibold">Recent Tasks</CardTitle>
              </div>
              <CardDescription>
                Tasks assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.map((task, index) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 hover:border-indigo-200 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                         onClick={() => router.visit(`/projects/${task.project_id}/tasks`)}>
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          task.completed_at ? 'bg-emerald-500' :
                          task.status === 'in_progress' ? 'bg-indigo-500' :
                          'bg-gray-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{task.name}</p>
                          <p className="text-xs text-gray-500">{task.project?.name}</p>
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
                  <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {userRole === 'member' ? 'No Tasks in Your Projects' : 'No Tasks Yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
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
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg font-semibold">Recent Comments</CardTitle>
              </div>
              <CardDescription>
                Latest activity on your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentComments.length > 0 ? (
                <div className="space-y-3">
                  {recentComments.map((comment, index) => (
                    <div key={comment.id} className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl border border-gray-100">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.avatar_url} alt={comment.user?.name} />
                        <AvatarFallback>
                          {comment.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{comment.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{comment.body}</p>
                        <p className="text-xs text-gray-500">{comment.task?.name || 'Unknown'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {userRole === 'member' ? 'No Comments in Your Projects' : 'No Comments Yet'}
                  </h3>
                  <p className="text-gray-500">
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
    </MainLayout>
  );
}
