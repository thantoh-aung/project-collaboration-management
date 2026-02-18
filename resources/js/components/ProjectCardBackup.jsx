import { Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  FolderOpen,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useWorkspace } from '@/Context/WorkspaceContext';
import { cn } from '@/lib/utils';

export default function ProjectCard({ project }) {
  const { hasPermission } = useWorkspace();

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
    return colors[status] || colors.active;
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle className="h-3 w-3" />;
    if (status === 'active') return <TrendingUp className="h-3 w-3" />;
    if (status === 'on_hold') return <Clock className="h-3 w-3" />;
    return null;
  };

  const handleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.visit(`/projects/${project.id}/tasks`);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.visit(`/projects/${project.id}/edit`);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      router.delete(`/projects/${project.id}`);
    }
  };

  return (
    <Link href={project.tasksPageUrl || `/projects/${project.id}/tasks`}>
      <Card 
        className={`hover:shadow-md transition-all duration-200 cursor-pointer bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 w-[350px]`}
      >
        {/* Minimalist top border */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700" />

        <CardHeader className="pb-3 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {project.name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                  {project.description || 'No description'}
                </CardDescription>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpen}>
                  <Eye className="h-4 w-4 mr-2" />
                  Open Project
                </DropdownMenuItem>
                {hasPermission('edit_projects') && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                )}
                {hasPermission('delete_projects') && (
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {getStatusIcon(project.status)}
              <span className="ml-1">{project.status || 'active'}</span>
            </span>
            {project.due_date && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Due: {new Date(project.due_date).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Project Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
              {project.team_members_count !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{project.team_members_count}</span>
                </div>
              )}
              {project.tasks_count !== undefined && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">{project.completed_tasks_count || 0}/{project.tasks_count}</span>
                </div>
              )}
            </div>
          </div>

          {/* Team Members Avatars */}
          {project.team_members && project.team_members.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex -space-x-2">
                {project.team_members.slice(0, 3).map((member, index) => (
                  <Avatar key={index} className="h-6 w-6 border-2 border-white dark:border-gray-900">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {member.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.team_members.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      +{project.team_members.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
