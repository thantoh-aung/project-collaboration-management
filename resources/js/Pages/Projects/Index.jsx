import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useWorkspace } from '@/Context/WorkspaceContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ProjectCard from '@/Components/ProjectCard';
import {
  MoreHorizontal,
  Plus,
  Search,
  Calendar,
  Users,
  ChevronDown,
  Grid3X3,
  List,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Edit,
  Trash2,
  Archive,
  UserPlus,
  FolderOpen,
  Eye
} from 'lucide-react';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { cn } from '@/lib/utils';

export default function ProjectsIndex() {
  const { props } = usePage();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const projects = props.projects?.data || [];

  return (
    <ErrorBoundary>
      <ProjectsIndexContent
        projects={projects}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        setViewMode={setViewMode}
        props={props}
      />
    </ErrorBoundary>
  );
}

function ProjectsIndexContent({ projects, searchTerm, setSearchTerm, viewMode, setViewMode, props }) {
  const { currentWorkspace, userRole, loading, error, hasPermission } = useWorkspace();

  // Handle workspace context errors
  if (error) {
    return (
      <MainLayout title="Projects">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Workspace Error</h3>
          <p className="text-gray-400 mb-4">
            {error.message || 'Failed to load workspace information.'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout title="Projects">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-8 w-20" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentWorkspace) {
    return (
      <MainLayout title="Projects">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-yellow-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Workspace Selected</h3>
          <p className="text-gray-400 mb-4">Please select a workspace to view projects.</p>
          <Button onClick={() => router.visit('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Validate projects data
  if (!Array.isArray(projects)) {
    console.error('Projects data is not an array:', projects);
    return (
      <MainLayout title="Projects">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Data Error</h3>
          <p className="text-gray-400 mb-4">
            Failed to load projects data. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </MainLayout>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-slate-700 text-slate-300 border-0',
      active: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-sm shadow-blue-600/30',
      on_hold: 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white border-0 shadow-sm shadow-yellow-600/30',
      completed: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0 shadow-sm shadow-emerald-600/30',
      archived: 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-0 shadow-sm shadow-red-600/30',
    };
    return colors[status] || colors.planning;
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <MainLayout title="Projects">
      <Head title="Projects - CollabTool" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">Projects</h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage and track all your team projects
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission('create_projects') && (
              <Button onClick={() => {
                // Use setTimeout to avoid flushSync issues
                setTimeout(() => {
                  router.visit('/projects/create');
                }, 0);
              }} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 border-0 transition-all duration-300">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            )}
          </div>
        </div>

        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-md shadow-blue-600/30' : 'hover:border-blue-500 hover:bg-blue-900/30'}
            >
              <Grid3X3 className="h-4 w-4 mr-1.5" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-md shadow-blue-600/30' : 'hover:border-blue-500 hover:bg-blue-900/30'}
            >
              <List className="h-4 w-4 mr-1.5" />
              List
            </Button>
          </div>
        </div>

        {/* Projects Display */}
        {filteredProjects.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <ProjectListItem key={project.id} project={project} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-slate-800 rounded-lg border border-slate-700">
            <div className="mx-auto w-16 w-16 bg-gradient-to-br from-purple-600/20 to-violet-600/20 rounded-full p-4 text-purple-400" />
            <h3 className="text-lg font-semibold text-white mb-2">No Projects Found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm
                ? 'Try adjusting your search terms'
                : hasPermission('create_projects')
                  ? 'Get started by creating your first project to organize your work.'
                  : 'You haven\'t been assigned to any projects yet.'}
            </p>
            {hasPermission('create_projects') && !searchTerm && (
              <Button onClick={() => router.visit('/projects/create')} className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </div>
        )}
        </div>
      </MainLayout>
  );
}

// Project List Item Component
function ProjectListItem({ project }) {
  const { hasPermission } = useWorkspace();

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-slate-700 text-slate-300',
      active: 'bg-blue-600/20 text-blue-300',
      on_hold: 'bg-yellow-600/20 text-yellow-300',
      completed: 'bg-emerald-600/20 text-emerald-300',
      archived: 'bg-red-600/20 text-red-300',
    };
    return colors[status] || colors.active;
  };
  return (
    <Card
      className="hover:shadow-lg hover:shadow-blue-600/20 transition-shadow cursor-pointer bg-slate-800 border-slate-700"
      onClick={() => router.visit(`/projects/${project.id}/tasks`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <CardDescription className="text-sm">
                {project.description || 'No description'}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                router.visit(`/projects/${project.id}/tasks`);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                Open Project
              </DropdownMenuItem>
              {hasPermission('edit_projects') && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  router.visit(`/projects/${project.id}/edit`);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
              )}
              {hasPermission('delete_projects') && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this project?')) {
                    router.delete(`/projects/${project.id}`);
                  }
                }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            {/* Team Members */}
            {(project.team_members && project.team_members.length > 0) && (
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  {project.team_members.slice(0, 3).map((member, index) => (
                    <div
                      key={`team-${index}`}
                      className="w-5 h-5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-medium text-blue-700"
                      title={`${member.name} (${member.pivot?.role || 'member'})`}
                    >
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {project.team_members.length > 3 && (
                    <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-medium text-blue-600">
                      +{project.team_members.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Clients */}
            {(project.clients && project.clients.length > 0) && (
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  {project.clients.slice(0, 2).map((client, index) => (
                    <div
                      key={`client-${index}`}
                      className="w-5 h-5 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-xs font-medium text-green-700"
                      title={`${client.name} (client)`}
                    >
                      {client.name?.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {project.clients.length > 2 && (
                    <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-xs font-medium text-green-600">
                      +{project.clients.length - 2}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Task count */}
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>{project.completed_tasks_count || 0}</span>
            </div>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
        {project.due_date && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
            <Calendar className="h-4 w-4" />
            Due: {new Date(project.due_date).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
