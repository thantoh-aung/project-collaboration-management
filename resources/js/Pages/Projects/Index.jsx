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
          <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-[#0F172A] mb-2">Workspace Error</h3>
          <p className="text-[#64748B] mb-4">
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
          <div className="mx-auto w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-lg font-medium text-[#0F172A] mb-2">No Workspace Selected</h3>
          <p className="text-[#64748B] mb-4">Please select a workspace to view projects.</p>
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
          <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-[#0F172A] mb-2">Data Error</h3>
          <p className="text-[#64748B] mb-4">
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
      planning: 'bg-[#F1F5F9] text-[#64748B] border-0',
      active: 'bg-[rgba(79,70,229,0.08)] text-[#4F46E5] border-0',
      on_hold: 'bg-amber-50 text-amber-700 border-0',
      completed: 'bg-emerald-50 text-emerald-700 border-0',
      archived: 'bg-red-50 text-red-600 border-0',
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
            <h1 className="text-2xl font-bold text-[#0F172A]">Projects</h1>
            <p className="text-sm text-[#64748B] mt-1">
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
              }} className="bg-[#4F46E5] text-white hover:bg-[#4338CA] border-0">
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
              className={viewMode === 'grid' ? 'bg-[#4F46E5] text-white border-0' : 'text-[#64748B] border-[#E2E8F0] hover:border-[#4F46E5] hover:bg-[rgba(79,70,229,0.04)]'}
            >
              <Grid3X3 className="h-4 w-4 mr-1.5" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-[#4F46E5] text-white border-0' : 'text-[#64748B] border-[#E2E8F0] hover:border-[#4F46E5] hover:bg-[rgba(79,70,229,0.04)]'}
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
          <div className="text-center py-16 bg-white rounded-[10px] border border-[#E2E8F0]">
            <FolderOpen className="mx-auto h-12 w-12 text-[#CBD5E1] mb-4" />
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No Projects Found</h3>
            <p className="text-[#64748B] mb-6 max-w-md mx-auto">
              {searchTerm
                ? 'Try adjusting your search terms'
                : hasPermission('create_projects')
                  ? 'Get started by creating your first project to organize your work.'
                  : 'You haven\'t been assigned to any projects yet.'}
            </p>
            {hasPermission('create_projects') && !searchTerm && (
              <Button onClick={() => router.visit('/projects/create')} className="bg-[#4F46E5] text-white hover:bg-[#4338CA]">
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

  const getStatusConfig = (status) => {
    const configs = {
      planning: { color: 'bg-slate-100 text-slate-600', icon: <Target className="h-3 w-3" />, label: 'Planning' },
      active: { color: 'bg-indigo-50 text-indigo-600', icon: <TrendingUp className="h-3 w-3" />, label: 'In Progress' },
      on_hold: { color: 'bg-amber-50 text-amber-600', icon: <Clock className="h-3 w-3" />, label: 'On Hold' },
      completed: { color: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle className="h-3 w-3" />, label: 'Completed' },
      archived: { color: 'bg-slate-100 text-slate-500', icon: <Archive className="h-3 w-3" />, label: 'Archived' },
    };
    return configs[status] || configs.active;
  };

  const status = getStatusConfig(project.status);

  return (
    <Card
      className="group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 cursor-pointer bg-white border-slate-200/60 hover:border-indigo-200/60 rounded-xl overflow-hidden"
      onClick={() => router.visit(`/projects/${project.id}/tasks`)}
    >
      <div className="flex items-center p-4 sm:p-5 gap-4">
        <div className="hidden sm:flex h-12 w-12 bg-indigo-50 rounded-xl items-center justify-center text-indigo-600 flex-shrink-0 group-hover:scale-105 transition-transform">
          <FolderOpen className="h-6 w-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
              {project.name}
            </h3>
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", status.color)}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 line-clamp-1 max-w-2xl">
            {project.description || 'No description provided'}
          </p>
        </div>

        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Progress / Stats */}
          <div className="hidden md:flex flex-col items-end gap-1">
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {project.team_members_count || 0}</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> {project.completed_tasks_count || 0}/{project.tasks_count || 0}</div>
            </div>
            {project.due_date && (
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Calendar className="h-3 w-3" />
                <span>Due {new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
          </div>

          {/* Members Avatars */}
          <div className="flex -space-x-2">
            {project.team_members?.slice(0, 3).map((member, index) => (
              <Avatar key={index} className="h-8 w-8 border-2 border-white ring-1 ring-slate-100 shadow-sm">
                <AvatarFallback className="text-[10px] bg-slate-500 text-white font-bold">
                  {member.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600 bg-slate-50/50 hover:bg-slate-100 rounded-lg">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 rounded-xl shadow-xl py-1.5">
              <DropdownMenuItem className="px-4 py-2.5 flex items-center gap-2.5 text-slate-700 font-medium cursor-pointer" onClick={(e) => {
                e.stopPropagation();
                router.visit(`/projects/${project.id}/tasks`);
              }}>
                <Eye className="h-4 w-4 text-emerald-500" />
                View Project
              </DropdownMenuItem>
              {hasPermission('edit_projects') && (
                <DropdownMenuItem className="px-4 py-2.5 flex items-center gap-2.5 text-slate-700 font-medium cursor-pointer" onClick={(e) => {
                  e.stopPropagation();
                  router.visit(`/projects/${project.id}/edit`);
                }}>
                  <Edit className="h-4 w-4 text-indigo-500" />
                  Edit Project
                </DropdownMenuItem>
              )}
              {hasPermission('delete_projects') && (
                <DropdownMenuItem className="px-4 py-2.5 flex items-center gap-2.5 text-red-600 font-medium cursor-pointer" onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this project?')) {
                    router.delete(`/projects/${project.id}`);
                  }
                }}>
                  <Trash2 className="h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
