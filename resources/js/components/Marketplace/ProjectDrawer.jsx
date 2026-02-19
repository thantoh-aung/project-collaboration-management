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
            <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
                    <h2 className="text-lg font-semibold text-white">Project Details</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                        </div>
                    ) : !project ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Project not found
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Project Header */}
                            <div className="flex items-start gap-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg shadow-emerald-500/20 overflow-hidden">
                                    {project.avatar || user?.avatar_url ? (
                                        <img src={project.avatar || user?.avatar_url} alt={user?.name} className="h-16 w-16 rounded-full object-cover" />
                                    ) : (
                                        user?.name?.charAt(0)?.toUpperCase() || 'P'
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{project.title}</h3>
                                    <p className="text-sm text-gray-300 line-clamp-2">{project.description}</p>
                                </div>
                            </div>

                            {/* Status & Type */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${project.status === 'open' ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' : project.status === 'in_progress' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' : 'bg-gray-600/20 text-gray-300 border-gray-500/30'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${project.status === 'open' ? 'bg-emerald-600' : project.status === 'in_progress' ? 'bg-blue-600' : 'bg-gray-600'}`} />
                                    {project.status === 'open' ? 'Open' : project.status === 'in_progress' ? 'In Progress' : 'Closed'}
                                </span>
                            </div>

                            {/* Budget */}
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm font-semibold text-gray-900">Budget</span>
                                <p className="text-gray-300">
                                    {budgetDisplay()}
                                </p>
                            </div>

                            {/* Deadline */}
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-blue-400" />
                                <span className="text-xs text-gray-400">{deadline ? new Date(deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : 'Flexible'}</span>
                            </div>

                            {/* Skills Required */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="text-sm font-semibold text-gray-900">Skills Required</span>
                            </div>
                            <div className="flex gap-2">
                                {skills.length > 0 && (
                                    skills.map((skill, i) => (
                                        <SkillBadge key={i} skill={skill} />
                                    ))
                                )}
                            </div>

                            {/* Client Info */}
                            <div className="mt-4">
                                <h4 className="text-sm font-semibold text-white mb-2">Client</h4>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg shadow-emerald-500/20 overflow-hidden">
                                        {user?.avatar_url ? (
                                            <img src={user?.avatar_url} alt={user?.name} className="h-10 w-10 rounded-full object-cover" />
                                        ) : (
                                            user?.name?.charAt(0)?.toUpperCase() || 'C'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{user?.name}</h3>
                                        <p className="text-sm text-gray-400">{project.client_name || 'Client Name'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Posted Date */}
                            <div className="mt-4">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Calendar className="h-4 w-4 text-blue-400" />
                                    <span className="text-xs text-gray-400">{new Date(project.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-700">
                                {canMessage && (
                                    <Button
                                        type="button"
                                        onClick={handleMessage}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-blue-500/30 font-medium"
                                    >
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        Message Client
                                    </Button>
                                )}
                                <div className="flex gap-3 ml-auto">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        className="rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
