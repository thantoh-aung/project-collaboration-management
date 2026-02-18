import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, Calendar, DollarSign, MapPin, Clock, MessageCircle, Loader2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SkillBadge from './SkillBadge';

const budgetTypeMap = {
    fixed: 'Fixed Price',
    hourly: 'Hourly',
    milestone: 'Milestone',
};

export default function ProjectDrawer({ projectId, onClose }) {
    const { auth } = usePage().props;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;
        setLoading(true);
        window.axios.get(`/marketplace/api/projects/${projectId}`)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [projectId]);

    if (!projectId) return null;

    const project = data?.project;
    const user = project?.user;
    // Ensure skills is always an array, even if it comes as a JSON string
    const skills = project?.skills_required 
        ? (Array.isArray(project.skills_required) 
            ? project.skills_required 
            : (typeof project.skills_required === 'string' ? JSON.parse(project.skills_required || '[]') : []))
        : [];
    const deadline = project?.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : null;

    // Check if current user can message this client
    const canMessage = auth?.user?.usage_type === 'freelancer' && auth?.user?.id !== user?.id;

    const budgetDisplay = () => {
        if (!project) return '';
        if (project.budget_min && project.budget_max) {
            return `$${Number(project.budget_min).toLocaleString()} – $${Number(project.budget_max).toLocaleString()}`;
        }
        if (project.budget_min) return `$${Number(project.budget_min).toLocaleString()}+`;
        if (project.budget_max) return `Up to $${Number(project.budget_max).toLocaleString()}`;
        return 'Budget not set';
    };

    const handleMessage = () => {
        if (project && user) {
            router.post(route('marketplace.chats.store'), {
                client_id: user.id,
                context: `Regarding project: ${project.title}`,
            });
        }
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <h2 className="text-lg font-semibold text-gray-900">Project Details</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/80 transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : !project ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">Project not found</div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Status + Type */}
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    {project.status === 'open' ? 'Open' : project.status === 'in_progress' ? 'In Progress' : 'Closed'}
                                </span>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                    {budgetTypeMap[project.budget_type] || 'Fixed Price'}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl font-bold text-gray-900">{project.title}</h3>

                            {/* Client Info */}
                            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                        user?.name?.charAt(0)?.toUpperCase() || 'C'
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{user?.name || 'Client'}</p>
                                    <p className="text-xs text-gray-500">Project Owner</p>
                                </div>
                            </div>

                            {/* Budget & Deadline */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Budget</p>
                                    <p className="text-lg font-bold text-gray-900">{budgetDisplay()}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{project.budget_currency || 'USD'}</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Deadline</p>
                                    {deadline ? (
                                        <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                            <Calendar className="h-4 w-4 text-blue-500" /> {deadline}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">No deadline</p>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{project.description}</p>
                            </div>

                            {/* Skills Required */}
                            {skills.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Skills Required</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, i) => (
                                            <SkillBadge key={i} skill={skill} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Location */}
                            {(project.country || project.timezone) && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location Preference</p>
                                    {project.country && (
                                        <p className="text-sm text-gray-700 flex items-center gap-1">
                                            <MapPin className="h-3.5 w-3.5 text-gray-400" /> {project.country}
                                        </p>
                                    )}
                                    {project.timezone && (
                                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {project.timezone}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Posted Date */}
                            <p className="text-xs text-gray-400">
                                Posted {new Date(project.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                {project && canMessage && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-white">
                        <Button
                            onClick={handleMessage}
                            className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/30 font-medium"
                        >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message Client
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
