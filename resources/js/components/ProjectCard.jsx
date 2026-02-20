import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useRef, useState } from 'react';
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
  TrendingUp,
  Target,
  ArrowRight
} from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/Context/WorkspaceContext';

export default function ProjectCard({ project }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { hasPermission, userRole } = useWorkspace();
  const { props } = usePage();
  const currentUser = props.auth?.user;

  // Check if current user can manage projects (admin or creator)
  const canManageProject = hasPermission('manage_projects') || currentUser?.id === project.created_by;

  // Debug: Log the project status
  console.log('🔍 ProjectCard - Project status:', project.status);
  console.log('🔍 ProjectCard - User role:', userRole);
  console.log('🔍 ProjectCard - Current user ID:', currentUser?.id);
  console.log('🔍 ProjectCard - Project created by:', project.created_by);
  console.log('🔍 ProjectCard - Has manage_projects permission:', hasPermission('manage_projects'));
  console.log('🔍 ProjectCard - Can manage project:', canManageProject);
  console.log('🔍 ProjectCard - Status type:', typeof project.status);
  console.log('🔍 ProjectCard - Status length:', project.status?.length);
  
  // Check for possible variations
  if (project.status === 'completed') {
    console.log('🔍 Status is EXACTLY "completed"');
  } else if (project.status === 'complete') {
    console.log('🔍 Status is "complete" (missing "d")');
  } else if (project.status?.includes('complete')) {
    console.log('🔍 Status contains "complete":', project.status);
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Helper functions (kept as is)
  const getStatusColor = (status) => {
    const colors = {
      planning: 'from-slate-600 to-slate-700',
      active: 'from-blue-600 to-purple-600',
      on_hold: 'from-amber-600 to-orange-600',
      completed: 'from-emerald-600 to-green-600',
      complete: 'from-emerald-600 to-green-600', // Fallback for missing "d"
      archived: 'from-slate-600 to-slate-700',
    };
    
    // Debug: Check if status is completed
    if (status === 'completed') {
      console.log('🔍 COMPLETED STATUS DETECTED! Using green gradient');
    } else if (status === 'complete') {
      console.log('🔍 COMPLETE STATUS DETECTED! Using green gradient');
    }
    
    const result = colors[status] || colors.active;
    console.log('🔍 getStatusColor - status:', status, 'result:', result);
    return result;
  };

  const getStatusBgColor = (status) => {
    const colors = {
      planning: 'bg-slate-800',
      active: 'bg-blue-600/20',
      on_hold: 'bg-amber-600/20',
      completed: 'bg-emerald-600/20',
      complete: 'bg-emerald-600/20', // Fallback for missing "d"
      archived: 'bg-slate-800',
    };
    return colors[status] || colors.active;
  };

  const getStatusTextColor = (status) => {
    const colors = {
      planning: 'text-slate-300',
      active: 'text-blue-300',
      on_hold: 'text-amber-300',
      completed: 'text-emerald-300',
      complete: 'text-emerald-300', // Fallback for missing "d"
      archived: 'text-slate-300',
    };
    return colors[status] || colors.active;
  };

  const getStatusIcon = (status) => {
    if (status === 'completed' || status === 'complete') return <CheckCircle className="h-3 w-3" />;
    if (status === 'active') return <TrendingUp className="h-3 w-3" />;
    if (status === 'on_hold') return <Clock className="h-3 w-3" />;
    if (status === 'planning') return <Target className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    router.visit(`/projects/${project.id}/tasks`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    router.visit(`/projects/${project.id}/edit`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (confirm('Are you sure you want to delete this project?')) {
      router.delete(`/projects/${project.id}`);
    }
  };

  const completionPercentage = project.tasks_count > 0 
    ? Math.round((project.completed_tasks_count || 0) / project.tasks_count * 100)
    : 0;

  return (
    <Card 
      className={cn(
        "group relative transition-all duration-500 cursor-pointer", // Removed overflow-hidden to let menu show
        "bg-slate-800 border-slate-700 shadow-lg hover:shadow-2xl hover:shadow-blue-600/20",
        "hover:-translate-y-2 rounded-2xl w-[320px] h-[280px]",
        "before:absolute before:inset-0 before:bg-gradient-to-br",
        `before:from-transparent before:to-${getStatusColor(project.status).split(' ')[0].replace('from-', '')}/5`,
        "before:opacity-20 group-hover:opacity-100 before:transition-opacity before:rounded-2xl"
      )}
      onClick={() => router.visit(project.tasksPageUrl || `/projects/${project.id}/tasks`)}
    >
      {/* Header section with overflow-hidden specifically for the gradient and shapes */}
      <div className={cn(
        "h-24 bg-gradient-to-br relative overflow-hidden rounded-t-2xl",
        getStatusColor(project.status)
      )}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
        </div>
        
        <div className="absolute top-3 right-3">
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
            getStatusBgColor(project.status),
            getStatusTextColor(project.status)
          )}>
            {getStatusIcon(project.status)}
            <span className="capitalize">{project.status?.replace('_', ' ') || 'Active'}</span>
          </div>
        </div>

        <div className="absolute bottom-3 left-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3 relative">
        <div className="space-y-1">
          <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">
            {project.name}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2">
            {project.description || 'No description available'}
          </p>
        </div>

        {project.tasks_count > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Progress</span>
              <span className="font-medium text-white">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  completionPercentage === 100 ? "bg-gradient-to-r from-emerald-600 to-green-600" :
                  completionPercentage >= 75 ? "bg-gradient-to-r from-blue-600 to-purple-600" :
                  completionPercentage >= 50 ? "bg-gradient-to-r from-amber-600 to-orange-600" :
                  "bg-gradient-to-r from-slate-600 to-slate-700"
                )}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            {project.team_members_count !== undefined && (
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="h-3 w-3" />
                <span>{project.team_members_count}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-gray-600">
              <CheckCircle className="h-3 w-3" />
              <span>{project.completed_tasks_count || 0}/{project.tasks_count || 0}</span>
            </div>
          </div>
          {project.due_date && (
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Team Members */}
        {project.team_members && project.team_members.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {project.team_members.slice(0, 4).map((member, index) => (
                <Avatar key={index} className="h-6 w-6 border-2 border-white">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium">
                    {member.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.team_members.length > 4 && (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-[9px] font-medium text-gray-600">
                    +{project.team_members.length - 4}
                  </span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-500">
              {project.team_members.length} {project.team_members.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            size="sm"
            className="h-8 px-3 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all"
            onClick={handleOpen}
          >
            Open <ArrowRight className="h-3 w-3 ml-1" />
          </Button>

          {/* Dropdown menu - different options based on user permissions */}
          <div 
            ref={menuRef} 
            className="relative"
            onClick={(e) => e.stopPropagation()} 
          >
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 hover:bg-gray-100 rounded-lg",
                isMenuOpen && "bg-gray-100"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </Button>

            {isMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-[100] py-1 animate-in fade-in zoom-in duration-200">
                {/* Admins and creators see full menu */}
                {canManageProject && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2 text-blue-500" />
                      Edit Project
                    </button>
                    <button
                      onClick={handleOpen}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2 text-emerald-500" />
                      View Tasks
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </button>
                  </>
                )}
                
                {/* Team members and clients see only View Tasks */}
                {!canManageProject && (
                  <button
                    onClick={handleOpen}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2 text-emerald-500" />
                    View Tasks
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}