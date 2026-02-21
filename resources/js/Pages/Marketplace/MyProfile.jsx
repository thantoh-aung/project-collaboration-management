import { Head, useForm, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, EyeOff, Plus, X, Globe, Trash2, Camera, Github, Linkedin } from 'lucide-react';
import CountryTimezoneSelector from '@/Components/Forms/CountryTimezoneSelector';

export default function MyProfile({ profile }) {
    const isPublished = profile?.status === 'published';
    const [newSkill, setNewSkill] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const refreshCSRFToken = async () => {
            if (typeof window !== 'undefined' && window.axios) {
                try { await window.axios.get('/sanctum/csrf-cookie'); } catch (e) { }
            }
        };
        refreshCSRFToken();
        const interval = setInterval(refreshCSRFToken, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        title: profile?.title || '', bio: profile?.bio || '',
        skills: profile?.skills || [], portfolio_links: profile?.portfolio_links || [],
        github_link: profile?.github_link || '', linkedin_link: profile?.linkedin_link || '',
        website_link: profile?.website_link || '', rate_min: profile?.rate_min || '',
        rate_max: profile?.rate_max || '', rate_currency: profile?.rate_currency || 'USD',
        availability: profile?.availability || 'available', country: profile?.country || '',
        timezone: profile?.timezone || '', avatar: null,
    });

    const isValidUrl = (url) => { try { new URL(url); return true; } catch { return false; } };

    const submit = async (e) => {
        e.preventDefault();
        try { await window.axios.get('/sanctum/csrf-cookie'); } catch { }
        const ve = {};
        if (!data.title?.trim()) ve.title = 'Professional title is required';
        if (!data.bio?.trim()) ve.bio = 'Bio is required';
        else if (data.bio.trim().length < 50) ve.bio = 'Bio must be at least 50 characters';
        if (!data.skills?.length) ve.skills = 'At least one skill is required';
        if (!data.country?.trim()) ve.country = 'Country is required';
        if (!data.timezone?.trim()) ve.timezone = 'Timezone is required';
        if (!data.availability?.trim()) ve.availability = 'Availability status is required';
        if (data.rate_min !== '' && data.rate_min != null) { if (isNaN(parseFloat(data.rate_min)) || parseFloat(data.rate_min) < 0) ve.rate_min = 'Min rate must be 0+'; }
        if (data.rate_max !== '' && data.rate_max != null) { if (isNaN(parseFloat(data.rate_max)) || parseFloat(data.rate_max) < 0) ve.rate_max = 'Max rate must be 0+'; }
        if (data.rate_min && data.rate_max && parseFloat(data.rate_min) >= parseFloat(data.rate_max)) ve.rate_max = 'Max rate must exceed min';
        if (!data.github_link?.trim()) ve.github_link = 'GitHub profile is required';
        else if (!isValidUrl(data.github_link)) ve.github_link = 'Invalid GitHub URL';
        if (!data.linkedin_link?.trim()) ve.linkedin_link = 'LinkedIn profile is required';
        else if (!isValidUrl(data.linkedin_link)) ve.linkedin_link = 'Invalid LinkedIn URL';
        if (data.website_link?.trim() && !isValidUrl(data.website_link)) ve.website_link = 'Invalid website URL';
        if (Object.keys(ve).length > 0) { alert('Fix errors:\n' + Object.values(ve).map(m => `• ${m}`).join('\n')); return; }
        post(route('marketplace.profile.update'), {
            forceFormData: true,
            onError: async (errors) => {
                if (errors?.message?.includes('419') || errors?.error?.includes('419')) {
                    try { await window.axios.get('/sanctum/csrf-cookie'); setTimeout(() => post(route('marketplace.profile.update'), { forceFormData: true }), 1000); } catch { alert('Session expired. Please refresh.'); }
                    return;
                }
                if (errors.error) alert(errors.error);
            },
        });
    };

    const handleAvatarChange = (e) => { const f = e.target.files[0]; if (f) { setData('avatar', f); setAvatarPreview(URL.createObjectURL(f)); } };
    const addSkill = () => { const s = newSkill.trim(); if (s && !data.skills.includes(s)) { setData('skills', [...data.skills, s]); setNewSkill(''); } };
    const removeSkill = (i) => setData('skills', data.skills.filter((_, idx) => idx !== i));
    const addPortfolioLink = () => setData('portfolio_links', [...data.portfolio_links, { title: '', url: '' }]);
    const updatePortfolioLink = (i, f, v) => { const u = [...data.portfolio_links]; u[i] = { ...u[i], [f]: v }; setData('portfolio_links', u); };
    const removePortfolioLink = (i) => setData('portfolio_links', data.portfolio_links.filter((_, idx) => idx !== i));
    const togglePublish = () => { if (isPublished) router.post(route('marketplace.profile.unpublish')); else router.post(route('marketplace.profile.publish')); };

    return (
        <MarketplaceLayout>
            <Head title="My Freelancer Profile" />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0F172A]">My Freelancer Profile</h1>
                        <p className="text-sm text-[#94A3B8] mt-1">{isPublished ? 'Your profile is live on marketplace.' : 'Your profile is in draft mode.'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className={isPublished ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0]'}>{isPublished ? 'Published' : 'Draft'}</Badge>
                        <Button variant="outline" onClick={togglePublish} className="rounded-xl border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]">
                            {isPublished ? <><EyeOff className="h-4 w-4 mr-1.5" />Unpublish</> : <><Eye className="h-4 w-4 mr-1.5" />Publish</>}
                        </Button>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Avatar */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Profile Photo</h2>
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <div className="h-20 w-20 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-sm">
                                    {avatarPreview ? <img src={avatarPreview} alt="Profile" className="h-20 w-20 rounded-full object-cover" /> : profile?.user?.name?.charAt(0)?.toUpperCase() || 'F'}
                                </div>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="h-5 w-5 text-white" /></button>
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleAvatarChange} className="hidden" />
                            </div>
                            <div>
                                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-lg border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"><Camera className="h-3.5 w-3.5 mr-1.5" /> Upload Photo</Button>
                                <p className="text-xs text-[#94A3B8] mt-1.5">JPG, PNG or WebP. Max 2MB.</p>
                                {errors.avatar && <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Basic Info</h2>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-[#64748B]">Professional Title *</Label>
                                <Input value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="e.g. Full-Stack Developer" className="mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-[#64748B]">Bio *</Label>
                                <Textarea value={data.bio} onChange={(e) => setData('bio', e.target.value)} placeholder="Tell clients about yourself... (min 50 chars)" rows={5} className="mt-1.5 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />
                                {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
                                <p className="text-xs text-[#94A3B8] mt-1">{data.bio?.length || 0} / 50 minimum</p>
                            </div>
                            <CountryTimezoneSelector value={{ country: data.country, timezone: data.timezone }} onChange={(v) => { setData('country', v.country); setData('timezone', v.timezone); }} disabled={processing} />
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Skills *</h2>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {data.skills.map((skill, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-[rgba(79,70,229,0.08)] text-[#4F46E5] border border-indigo-200">
                                    {skill}<button type="button" onClick={() => removeSkill(i)} className="hover:text-red-500 ml-0.5"><X className="h-3 w-3" /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add a skill..." className="h-9 rounded-lg border-[#E2E8F0] bg-white text-[#0F172A] text-sm" />
                            <Button type="button" variant="outline" size="sm" onClick={addSkill} className="rounded-lg border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
                        </div>
                    </div>

                    {/* Rate */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Rate & Availability</h2>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div><Label className="text-sm font-medium text-[#64748B]">Min Rate ($/hr)</Label><Input type="number" value={data.rate_min} onChange={(e) => setData('rate_min', e.target.value)} placeholder="25" className="mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" /></div>
                            <div><Label className="text-sm font-medium text-[#64748B]">Max Rate ($/hr)</Label><Input type="number" value={data.rate_max} onChange={(e) => setData('rate_max', e.target.value)} placeholder="100" className="mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" /></div>
                            <div><Label className="text-sm font-medium text-[#64748B]">Currency</Label><select value={data.rate_currency} onChange={(e) => setData('rate_currency', e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] px-3 text-sm"><option value="USD">USD</option><option value="EUR">EUR</option><option value="MMK">MMK</option></select></div>
                        </div>
                        <div><Label className="text-sm font-medium text-[#64748B]">Availability *</Label><select value={data.availability} onChange={(e) => setData('availability', e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] px-3 text-sm"><option value="available">Available</option><option value="limited">Limited</option><option value="unavailable">Unavailable</option></select></div>
                    </div>

                    {/* Portfolio */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Portfolio Links <span className="text-[#94A3B8] font-normal">(Optional)</span></h2>
                        <div className="space-y-3 mb-3">
                            {data.portfolio_links.map((link, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-[#94A3B8] flex-shrink-0" />
                                    <Input value={link.title} onChange={(e) => updatePortfolioLink(i, 'title', e.target.value)} placeholder="Title" className="h-9 rounded-lg border-[#E2E8F0] bg-white text-[#0F172A] text-sm flex-1" />
                                    <Input value={link.url} onChange={(e) => updatePortfolioLink(i, 'url', e.target.value)} placeholder="https://..." className="h-9 rounded-lg border-[#E2E8F0] bg-white text-[#0F172A] text-sm flex-[2]" />
                                    <button type="button" onClick={() => removePortfolioLink(i)} className="p-1.5 text-[#94A3B8] hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addPortfolioLink} className="rounded-lg border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"><Plus className="h-3.5 w-3.5 mr-1" />Add Link</Button>
                    </div>

                    {/* Social */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Social Links</h2>
                        <div className="space-y-4">
                            <div><Label className="text-sm font-medium text-[#64748B] flex items-center gap-1.5"><Github className="h-4 w-4" /> GitHub *</Label><Input value={data.github_link} onChange={(e) => setData('github_link', e.target.value)} placeholder="https://github.com/username" className="mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />{errors.github_link && <p className="text-red-500 text-xs mt-1">{errors.github_link}</p>}</div>
                            <div><Label className="text-sm font-medium text-[#64748B] flex items-center gap-1.5"><Linkedin className="h-4 w-4" /> LinkedIn *</Label><Input value={data.linkedin_link} onChange={(e) => setData('linkedin_link', e.target.value)} placeholder="https://linkedin.com/in/username" className="mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />{errors.linkedin_link && <p className="text-red-500 text-xs mt-1">{errors.linkedin_link}</p>}</div>
                            <div><Label className="text-sm font-medium text-[#64748B] flex items-center gap-1.5"><Globe className="h-4 w-4" /> Portfolio Website <span className="text-[#94A3B8] font-normal">(Optional)</span></Label><Input value={data.website_link} onChange={(e) => setData('website_link', e.target.value)} placeholder="https://myportfolio.com" className="mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />{errors.website_link && <p className="text-red-500 text-xs mt-1">{errors.website_link}</p>}</div>
                        </div>
                        <p className="text-xs text-[#94A3B8] mt-3">* GitHub and LinkedIn profiles are required for verification</p>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium shadow-sm">
                            <Save className="h-4 w-4 mr-2" />{processing ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>
                </form>
            </div>
        </MarketplaceLayout>
    );
}
