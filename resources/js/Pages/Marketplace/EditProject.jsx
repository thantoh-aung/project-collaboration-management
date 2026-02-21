import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X, Briefcase, DollarSign, Calendar, Code } from 'lucide-react';

export default function EditProject({ project }) {
    const [newSkill, setNewSkill] = useState('');

    const { data, setData, put, processing, errors } = useForm({
        title: project.title || '',
        description: project.description || '',
        budget_min: project.budget_min || '',
        budget_max: project.budget_max || '',
        budget_type: project.budget_type || 'fixed',
        budget_currency: project.budget_currency || 'USD',
        deadline: project.deadline || '',
        skills_required: project.skills_required || [],
        country: project.country || 'United States',
        timezone: project.timezone || 'UTC-5',
    });

    useEffect(() => { window.axios.get('/sanctum/csrf-cookie'); }, []);

    const submit = (e) => {
        e.preventDefault();
        const errors = {};
        if (!data.title?.trim()) errors.title = 'Project title is required';
        else if (data.title.trim().length < 10) errors.title = 'Project title must be at least 10 characters';
        if (!data.description?.trim()) errors.description = 'Project description is required';
        else if (data.description.trim().length < 50) errors.description = 'Project description must be at least 50 characters';
        if (!data.skills_required?.length) errors.skills_required = 'At least one skill is required';
        if (!data.budget_min?.toString().trim()) errors.budget_min = 'Minimum budget is required';
        else if (parseFloat(data.budget_min) <= 0) errors.budget_min = 'Minimum budget must be greater than 0';
        if (!data.budget_max?.toString().trim()) errors.budget_max = 'Maximum budget is required';
        else if (parseFloat(data.budget_max) <= 0) errors.budget_max = 'Maximum budget must be greater than 0';
        if (data.budget_min && data.budget_max) { const mn = parseFloat(data.budget_min), mx = parseFloat(data.budget_max); if (mn >= mx) errors.budget_max = 'Max must be greater than min'; }
        if (!data.budget_type?.trim()) errors.budget_type = 'Budget type is required';
        if (!data.deadline?.toString().trim()) errors.deadline = 'Deadline is required';
        if (Object.keys(errors).length > 0) { alert('Please fill in all required fields:\n\n' + Object.entries(errors).map(([, m]) => `• ${m}`).join('\n')); return; }
        put(route('marketplace.projects.update', project.id));
    };

    const addSkill = () => { const s = newSkill.trim(); if (s && !data.skills_required.includes(s)) { setData('skills_required', [...data.skills_required, s]); setNewSkill(''); } };
    const removeSkill = (i) => setData('skills_required', data.skills_required.filter((_, idx) => idx !== i));

    return (
        <MarketplaceLayout>
            <Head title="Edit Project" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-[#14B8A6] flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#0F172A]">Edit Project</h1>
                    </div>
                    <p className="text-[#64748B]">Update your project details to attract the right freelancers</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Title */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <Label htmlFor="title" className="text-sm font-semibold text-[#0F172A]">Project Title *</Label>
                        <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="e.g., Build a modern e-commerce website" className="mt-2 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <Label htmlFor="description" className="text-sm font-semibold text-[#0F172A]">Description *</Label>
                        <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Describe your project requirements in detail..." className="mt-2 min-h-[150px] rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>

                    {/* Budget */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="h-4 w-4 text-[#14B8A6]" />
                            <Label className="text-sm font-semibold text-[#0F172A]">Budget *</Label>
                        </div>
                        <div className="mb-4">
                            <Label className="text-xs text-[#94A3B8] mb-1.5 block">Budget Type</Label>
                            <div className="flex gap-2">
                                {['fixed', 'hourly', 'milestone'].map((type) => (
                                    <button key={type} type="button" onClick={() => setData('budget_type', type)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${data.budget_type === type ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]'}`}>
                                        {type === 'fixed' ? 'Fixed Price' : type === 'hourly' ? 'Hourly' : 'Milestone'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="budget_min" className="text-xs text-[#94A3B8]">Min Budget ($) *</Label>
                                <Input id="budget_min" type="number" value={data.budget_min} onChange={(e) => setData('budget_min', e.target.value)} placeholder="1000" className="mt-1 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />
                            </div>
                            <div>
                                <Label htmlFor="budget_max" className="text-xs text-[#94A3B8]">Max Budget ($) *</Label>
                                <Input id="budget_max" type="number" value={data.budget_max} onChange={(e) => setData('budget_max', e.target.value)} placeholder="5000" className="mt-1 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />
                            </div>
                        </div>
                        {errors.budget_min && <p className="text-red-500 text-xs mt-1">{errors.budget_min}</p>}
                        {errors.budget_max && <p className="text-red-500 text-xs mt-1">{errors.budget_max}</p>}
                    </div>

                    {/* Deadline */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-[#4F46E5]" />
                            <Label htmlFor="deadline" className="text-sm font-semibold text-[#0F172A]">Deadline *</Label>
                        </div>
                        <select id="deadline" value={data.deadline} onChange={(e) => setData('deadline', e.target.value)} className="mt-1.5 max-w-xs h-11 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] px-3 text-sm">
                            <option value="">Select deadline...</option>
                            <option value="flexible">Flexible</option>
                            <option value="1_week">Within 1 week</option>
                            <option value="2_weeks">Within 2 weeks</option>
                            <option value="1_month">Within 1 month</option>
                            <option value="3_months">Within 3 months</option>
                            <option value="6_months">Within 6 months</option>
                        </select>
                        {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
                    </div>

                    {/* Skills Required */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Code className="h-4 w-4 text-[#4F46E5]" />
                            <Label className="text-sm font-semibold text-[#0F172A]">Skills Required *</Label>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="e.g., React, Laravel, UI/UX Design" className="flex-1 h-9 rounded-lg border-[#E2E8F0] bg-white text-[#0F172A] text-sm" />
                            <Button type="button" variant="outline" size="sm" onClick={addSkill} className="rounded-lg border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]">
                                <Plus className="h-3.5 w-3.5 mr-1" />Add
                            </Button>
                        </div>
                        {data.skills_required.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {data.skills_required.map((skill, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 bg-[rgba(79,70,229,0.08)] text-[#4F46E5] text-sm font-medium px-3 py-1 rounded-full">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(i)} className="hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                        <Button type="button" variant="outline" onClick={() => window.history.back()} className="rounded-xl border-[#E2E8F0] text-[#64748B]">Cancel</Button>
                        <Button type="submit" disabled={processing} className="flex-1 h-11 px-8 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl font-medium">
                            {processing ? 'Updating...' : 'Update Project'}
                        </Button>
                    </div>
                </form>
            </div>
        </MarketplaceLayout>
    );
}
