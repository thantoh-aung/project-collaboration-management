import { Calendar, DollarSign, MapPin, Clock, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import SkillBadge from './SkillBadge';
import { usePage, router } from '@inertiajs/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import UserProfileLink from '../UserProfileLink';

const budgetTypeMap = {
    fixed: 'Fixed Price',
    hourly: 'Hourly',
    milestone: 'Milestone',
};

export default function ProjectCard({ project, onClick }) {
    const { auth } = usePage().props;
    const user = project.user;
    const isOwner = auth?.user?.id === project.user_id;

    const skills = Array.isArray(project.skills_required)
        ? project.skills_required
        : (typeof project.skills_required === 'string' ? JSON.parse(project.skills_required || '[]') : []);
    const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

    const handleEdit = (e) => {
        e.stopPropagation();
        window.location.href = `/marketplace/projects/${project.id}/edit`;
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            router.delete(`/marketplace/projects/${project.id}`, {
                onError: (errors) => {
                    if (errors.permission) alert('You don\'t have permission to delete this project.');
                    else if (errors.not_found) alert('Project not found or has already been deleted.');
                    else alert('Error deleting project. Please try again.');
                },
                preserveState: false,
                preserveScroll: false,
            });
        }
    };

    const budgetDisplay = () => {
        if (project.budget_min && project.budget_max) {
            return `$${Number(project.budget_min).toLocaleString()}–$${Number(project.budget_max).toLocaleString()}`;
        }
        if (project.budget_min) return `$${Number(project.budget_min).toLocaleString()}+`;
        if (project.budget_max) return `Up to $${Number(project.budget_max).toLocaleString()}`;
        return 'Budget not set';
    };

    return (
        <div
            onClick={() => onClick && onClick(project)}
            className="block bg-white rounded-xl border border-[#E2E8F0] hover:shadow-md hover:border-[rgba(20,184,166,0.3)] transition-all duration-200 overflow-hidden cursor-pointer group"
        >
            <div className="p-5">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {project.status === 'open' ? 'Open' : project.status === 'in_progress' ? 'In Progress' : 'Closed'}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#64748B]">{budgetTypeMap[project.budget_type] || 'Fixed Price'}</span>
                        {isOwner && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-[#F1F5F9]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32 bg-white border border-[#E2E8F0] shadow-lg rounded-lg">
                                    <DropdownMenuItem onClick={handleEdit} className="cursor-pointer text-[#0F172A]">
                                        <Edit className="h-3 w-3 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-500">
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-[#0F172A] mb-1.5 line-clamp-2 group-hover:text-[#14B8A6] transition-colors">
                    {project.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#64748B] line-clamp-2 mb-3">{project.description}</p>

                {/* Skills */}
                {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {skills.slice(0, 4).map((skill, i) => (
                            <SkillBadge key={i} skill={skill} />
                        ))}
                        {skills.length > 4 && (
                            <span className="text-xs text-[#94A3B8] self-center">+{skills.length - 4}</span>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                    <span className="text-sm font-semibold text-[#0F172A]">
                        <DollarSign className="h-3.5 w-3.5 inline -mt-0.5 text-[#14B8A6]" />
                        {budgetDisplay()}
                    </span>
                    {deadline && (
                        <span className="flex items-center gap-1 text-xs text-[#64748B]">
                            <Calendar className="h-3 w-3" />{deadline}
                        </span>
                    )}
                </div>

                {/* Client Info */}
                <UserProfileLink userId={project.user_id || user?.id} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#E2E8F0]">
                        <div className="h-6 w-6 rounded-full bg-[#14B8A6] flex items-center justify-center text-white text-xs font-medium flex-shrink-0 overflow-hidden shadow-sm hover:opacity-90 transition-opacity">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                                user?.name?.charAt(0)?.toUpperCase() || 'C'
                            )}
                        </div>
                        <span className="text-xs text-[#64748B] truncate hover:text-[#4F46E5] transition-colors">{user?.name || 'Client'}</span>
                    </div>
                </UserProfileLink>
            </div>
        </div>
    );
}
