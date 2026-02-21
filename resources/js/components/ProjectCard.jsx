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
  ArrowRight,
  Archive
} from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/Context/WorkspaceContext';
import UserProfileLink from '@/Components/UserProfileLink';

export default function ProjectCard({ project }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { hasPermission } = useWorkspace();
  const { props } = usePage();
  const currentUser = props.auth?.user;

  const canManageProject = hasPermission('manage_projects') || currentUser?.id === project.created_by;

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

  const getStatusConfig = (status) => {
    const configs = {
      planning: { color: 'bg-slate-100 text-slate-600', icon: <Target className="h-3 w-3" />, label: 'Planning' },
      active: { color: 'bg-indigo-50 text-indigo-600', icon: <TrendingUp className="h-3 w-3" />, label: 'In Progress' },
      on_hold: { color: 'bg-amber-50 text-amber-600', icon: <Clock className="h-3 w-3" />, label: 'On Hold' },
      completed: { color: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle className="h-3 w-3" />, label: 'Completed' },
      complete: { color: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle className="h-3 w-3" />, label: 'Completed' },
      archived: { color: 'bg-slate-100 text-slate-500', icon: <Archive className="h-3 w-3" />, label: 'Archived' },
    };
    return configs[status] || configs.active;
  };

  const status = getStatusConfig(project.status);

  const completionPercentage = project.tasks_count > 0
    ? Math.round((project.completed_tasks_count || 0) / project.tasks_count * 100)
    : 0;

  const getProgressStyles = () => {
    if (completionPercentage === 100) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
    if (completionPercentage >= 75) return 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]';
    if (completionPercentage >= 50) return 'bg-blue-400';
    if (completionPercentage >= 25) return 'bg-amber-400';
    return 'bg-slate-300';
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 cursor-pointer border-slate-200/60 bg-white",
        "hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:border-indigo-200/60",
        "flex flex-col h-full rounded-2xl"
      )}
      onClick={() => router.visit(project.tasksPageUrl || `/projects/${project.id}/tasks`)}
    >
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header Section */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <FolderOpen className="h-5.5 w-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-[15px] leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", status.color)}>
                  {status.icon}
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          <div
            ref={menuRef}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in duration-200">
                {canManageProject && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); router.visit(`/projects/${project.id}/edit`); }}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 flex items-center gap-2.5 transition-colors text-slate-700 font-medium"
                    >
                      <Edit className="h-4 w-4 text-indigo-500" />
                      Edit Project
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); router.visit(`/projects/${project.id}/tasks`); }}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 flex items-center gap-2.5 transition-colors text-slate-700 font-medium"
                    >
                      <Eye className="h-4 w-4 text-emerald-500" />
                      View Details
                    </button>
                    <div className="my-1.5 border-t border-slate-100" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); if (confirm('Delete project?')) router.delete(`/projects/${project.id}`); }}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-red-50 flex items-center gap-2.5 transition-colors text-red-600 font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Project
                    </button>
                  </>
                )}
                {!canManageProject && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); router.visit(`/projects/${project.id}/tasks`); }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 flex items-center gap-2.5 transition-colors text-slate-700 font-medium"
                  >
                    <Eye className="h-4 w-4 text-emerald-500" />
                    View Details
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-6">
          {project.description || 'Develop and manage your projects with ease using our collaborative tools.'}
        </p>

        {/* Progress Bar Container */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Progress</span>
            <div className="flex items-center gap-1">
              <span className="text-[14px] font-bold text-slate-900">{completionPercentage}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner p-px">
            <div
              className={cn("h-full rounded-full transition-all duration-1000 ease-out", getProgressStyles())}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Members and Deadlines */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2.5">
            {project.team_members?.slice(0, 4).map((member, index) => (
              <UserProfileLink key={index} userId={member.id}>
                <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-slate-100 transition-transform hover:scale-110 hover:z-10 shadow-sm">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback className="text-[11px] bg-slate-500 text-white font-bold">
                    {member.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </UserProfileLink>
            ))}
            {project.team_members && project.team_members.length > 4 && (
              <div className="h-8 w-8 rounded-full bg-slate-50 border-2 border-white ring-1 ring-slate-100 flex items-center justify-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-500">
                  +{project.team_members.length - 4}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                {project.due_date ? new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Stats */}
      <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 group-hover:text-amber-600 transition-colors">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>{project.completed_tasks_count || 0}/{project.tasks_count || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
              <Users className="h-3.5 w-3.5" />
              <span>{project.team_members_count || 0} Members</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-indigo-600 group-hover:translate-x-1 transition-transform">
            <span className="font-bold">Enter</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Card>
  );
}