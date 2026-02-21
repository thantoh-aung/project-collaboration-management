import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, Calendar, DollarSign, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SkillBadge from './SkillBadge';

const budgetTypeMap = { fixed: 'Fixed Price', hourly: 'Hourly', milestone: 'Milestone' };

export default function ProjectDrawer({ projectId, onClose }) {
    const { auth } = usePage().props;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;
        setLoading(true);
        window.axios.get(`/marketplace/api/projects/${projectId}`)
            .then(res => { setData(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [projectId]);

    if (!projectId) return null;

    const project = data?.project;
    const user = project?.user;
    const skills = project?.skills_required
        ? (Array.isArray(project.skills_required) ? project.skills_required : (typeof project.skills_required === 'string' ? JSON.parse(project.skills_required || '[]') : []))
        : [];
    const deadline = project?.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : null;
    const canMessage = auth?.user?.usage_type === 'freelancer' && auth?.user?.id !== user?.id;

    const budgetDisplay = () => {
        if (!project) return '';
        if (project.budget_min && project.budget_max) return `$${Number(project.budget_min).toLocaleString()} – $${Number(project.budget_max).toLocaleString()}`;
        if (project.budget_min) return `$${Number(project.budget_min).toLocaleString()}+`;
        if (project.budget_max) return `Up to $${Number(project.budget_max).toLocaleString()}`;
        return 'Budget not set';
    };

    const handleMessage = () => {
        if (project && user) router.post(route('marketplace.chats.store'), { client_id: user.id, context: `Regarding project: ${project.title}` });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-[#E2E8F0]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#4F46E5]">
                    <h2 className="text-lg font-semibold text-white">Project Details</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"><X className="h-5 w-5 text-white" /></button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" /></div>
                    ) : !project ? (
                        <div className="flex items-center justify-center h-64 text-[#94A3B8]">Project not found</div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Project Header */}
                            <div className="flex items-start gap-4">
                                <div className="h-14 w-14 rounded-xl bg-[#14B8A6] flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
                                    {project.avatar || user?.avatar_url ? (
                                        <img src={project.avatar || user?.avatar_url} alt={user?.name} className="h-14 w-14 rounded-xl object-cover" />
                                    ) : user?.name?.charAt(0)?.toUpperCase() || 'P'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#0F172A]">{project.title}</h3>
                                    <p className="text-sm text-[#64748B] line-clamp-2 mt-1">{project.description}</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${project.status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : project.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${project.status === 'open' ? 'bg-emerald-500' : project.status === 'in_progress' ? 'bg-blue-500' : 'bg-[#94A3B8]'}`} />
                                    {project.status === 'open' ? 'Open' : project.status === 'in_progress' ? 'In Progress' : 'Closed'}
                                </span>
                            </div>

                            {/* Budget */}
                            <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="h-4 w-4 text-[#14B8A6]" />
                                    <span className="text-sm font-semibold text-[#0F172A]">Budget</span>
                                </div>
                                <p className="text-[#64748B] text-sm">{budgetDisplay()}</p>
                            </div>

                            {/* Deadline */}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-[#4F46E5]" />
                                <span className="text-sm text-[#64748B]">{deadline || 'Flexible'}</span>
                            </div>

                            {/* Skills */}
                            {skills.length > 0 && (
                                <div>
                                    <span className="text-sm font-semibold text-[#0F172A] mb-2 block">Skills Required</span>
                                    <div className="flex flex-wrap gap-2">{skills.map((skill, i) => <SkillBadge key={i} skill={skill} />)}</div>
                                </div>
                            )}

                            {/* Client Info */}
                            <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-4">
                                <h4 className="text-sm font-semibold text-[#0F172A] mb-3">Client</h4>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-bold overflow-hidden">
                                        {user?.avatar_url ? <img src={user.avatar_url} alt={user.name} className="h-10 w-10 rounded-full object-cover" /> : user?.name?.charAt(0)?.toUpperCase() || 'C'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[#0F172A]">{user?.name}</h3>
                                        <p className="text-xs text-[#94A3B8]">{project.client_name || 'Client'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Posted Date */}
                            <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                                <Calendar className="h-4 w-4" />
                                <span>Posted {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
                                {canMessage && (
                                    <Button type="button" onClick={handleMessage} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-medium">
                                        <MessageCircle className="h-4 w-4 mr-2" />Message Client
                                    </Button>
                                )}
                                <div className="flex gap-3 ml-auto">
                                    <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-[#E2E8F0] text-[#64748B]">Close</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
