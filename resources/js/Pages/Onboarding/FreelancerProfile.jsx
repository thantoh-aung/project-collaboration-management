import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Code, ArrowRight, Plus, X, Sparkles, Github, Linkedin, Globe, Camera } from 'lucide-react';
import CountryTimezoneSelector from '@/Components/Forms/CountryTimezoneSelector';

export default function FreelancerProfileOnboarding({ profile }) {
    const [newSkill, setNewSkill] = useState('');

    const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || null);
    const fileInputRef = useRef(null);

    const storageKey = profile?.user?.id
        ? `freelancer_onboarding_data_user_${profile.user.id}`
        : 'freelancer_onboarding_data';

    const { data, setData, post, processing, errors, reset } = useForm({
        title: profile?.title || '',
        bio: profile?.bio || '',
        skills: profile?.skills || [],
        rate_min: profile?.rate_min || '',
        rate_max: profile?.rate_max || '',
        rate_currency: profile?.rate_currency || 'USD',
        availability: profile?.availability || 'available',
        country: profile?.country || '',
        timezone: profile?.timezone || '',
        portfolio_links: profile?.portfolio_links || [],
        github_link: profile?.github_link || '',
        linkedin_link: profile?.linkedin_link || '',
        website_link: profile?.website_link || '',
        avatar: null,
        cv: null,
    });

    const [cvFileName, setCvFileName] = useState('');
    const cvInputRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('freelancer_onboarding_data');
        }
        const savedData = typeof window !== 'undefined'
            ? localStorage.getItem(storageKey)
            : null;
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                Object.keys(parsed).forEach(key => {
                    if (key !== 'avatar') {
                        setData(key, parsed[key]);
                    }
                });
                setAvatarPreview(parsed.avatarPreview || null);
            } catch (error) {
                console.warn('Failed to load saved form data:', error);
            }
        }
    }, [storageKey]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const dataToSave = { ...data, avatarPreview };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }, [data, avatarPreview, storageKey]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('avatar', file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCvChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('cv', file);
            setCvFileName(file.name);
        }
    };

    const isValidUrl = (url) => {
        try { new URL(url); return true; } catch { return false; }
    };

    const submit = (e) => {
        e.preventDefault();
        const errors = {};
        if (!data.title?.trim()) errors.title = 'Professional title is required';
        if (!data.bio?.trim()) errors.bio = 'Bio is required';
        else if (data.bio.trim().length < 50) errors.bio = 'Bio must be at least 50 characters';
        if (!data.skills?.length) errors.skills = 'At least one skill is required';
        if (!data.country?.trim()) errors.country = 'Country is required';
        if (!data.timezone?.trim()) errors.timezone = 'Timezone is required';
        if (!data.availability?.trim()) errors.availability = 'Availability status is required';
        if (data.rate_min !== '' && data.rate_min !== null && data.rate_min !== undefined) {
            const minRate = parseFloat(data.rate_min);
            if (isNaN(minRate) || minRate < 0) errors.rate_min = 'Minimum rate must be 0 or greater';
        }
        if (data.rate_max !== '' && data.rate_max !== null && data.rate_max !== undefined) {
            const maxRate = parseFloat(data.rate_max);
            if (isNaN(maxRate) || maxRate < 0) errors.rate_max = 'Maximum rate must be 0 or greater';
        }
        if (data.rate_min && data.rate_max && data.rate_min !== '' && data.rate_max !== '') {
            if (parseFloat(data.rate_min) >= parseFloat(data.rate_max)) errors.rate_max = 'Maximum rate must be greater than minimum rate';
        }
        if (data.portfolio_links?.length > 0) {
            data.portfolio_links.forEach((link, index) => {
                if (link.title?.trim() && !link.url?.trim()) errors[`portfolio_links_${index}_url`] = 'Portfolio link URL is required when title is provided';
                if (link.url?.trim() && !link.title?.trim()) errors[`portfolio_links_${index}_title`] = 'Portfolio link title is required when URL is provided';
                if (link.url?.trim() && !isValidUrl(link.url)) errors[`portfolio_links_${index}_url`] = 'Please enter a valid URL';
            });
        }
        if (!data.github_link?.trim()) errors.github_link = 'GitHub profile is required';
        else if (!isValidUrl(data.github_link)) errors.github_link = 'Please enter a valid GitHub URL';
        if (!data.linkedin_link?.trim()) errors.linkedin_link = 'LinkedIn profile is required';
        else if (!isValidUrl(data.linkedin_link)) errors.linkedin_link = 'Please enter a valid LinkedIn URL';
        if (!data.cv) errors.cv = 'Your CV (resume) is required';
        else if (data.cv instanceof File) {
            const ext = data.cv.name.split('.').pop().toLowerCase();
            if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) errors.cv = 'CV must be a PDF, PNG, or JPG file';
        }
        if (data.website_link?.trim() && !isValidUrl(data.website_link)) errors.website_link = 'Please enter a valid website URL';
        if (Object.keys(errors).length > 0) {
            alert('Please fill in all required fields:\n\n' + Object.entries(errors).map(([, msg]) => `• ${msg}`).join('\n'));
            return;
        }
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                if ((key === 'avatar' || key === 'cv') && data[key] instanceof File) formData.append(key, data[key]);
                else if (Array.isArray(data[key])) formData.append(key, JSON.stringify(data[key]));
                else if (typeof data[key] === 'object') formData.append(key, JSON.stringify(data[key]));
                else formData.append(key, data[key]);
            }
        });
        post(route('onboarding.profile.save'), formData, {
            onError: (errors) => {
                if (errors && typeof errors === 'object') {
                    const msgs = Object.values(errors).flat();
                    if (msgs.length > 0) alert('Please fix the following errors:\n\n' + msgs.join('\n'));
                }
            },
            onSuccess: () => {
                if (typeof window !== 'undefined') localStorage.removeItem(storageKey);
            }
        });
    };

    const addSkill = () => {
        const skill = newSkill.trim();
        if (skill && !data.skills.includes(skill)) { setData('skills', [...data.skills, skill]); setNewSkill(''); }
    };
    const removeSkill = (i) => setData('skills', data.skills.filter((_, idx) => idx !== i));
    const addPortfolioLink = () => setData('portfolio_links', [...data.portfolio_links, { title: '', url: '' }]);
    const updatePortfolioLink = (index, field, value) => {
        const updated = [...data.portfolio_links]; updated[index] = { ...updated[index], [field]: value }; setData('portfolio_links', updated);
    };
    const removePortfolioLink = (index) => setData('portfolio_links', data.portfolio_links.filter((_, i) => i !== index));

    return (
        <>
            <Head title="Set Up Your Freelancer Profile" />
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
                <div className="w-full max-w-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <div className="h-10 w-10 bg-[#4F46E5] rounded-xl flex items-center justify-center shadow-sm">
                                <Code className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-[#0F172A]">CollabTool</span>
                        </div>
                        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Set up your freelancer profile</h1>
                        <p className="text-[#94A3B8]">Tell clients about yourself. You can always edit this later.</p>
                    </div>

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <div className="h-20 w-20 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-2xl font-bold border-4 border-[#E2E8F0] shadow-sm">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar preview" className="h-20 w-20 rounded-full object-cover" />
                                    ) : (
                                        <span>{profile?.user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                                    )}
                                </div>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#4F46E5] text-white flex items-center justify-center hover:bg-[#4338CA] transition-colors shadow-sm">
                                    <Camera className="h-4 w-4" />
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-[#0F172A]">Profile Photo</Label>
                                <p className="text-sm text-[#94A3B8] mt-1">Add a professional headshot. JPG, PNG up to 2MB.</p>
                                {errors.avatar && <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <Label className="text-sm font-medium text-[#0F172A]">Professional Title *</Label>
                            <Input value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="e.g. Full-Stack Developer, UI/UX Designer" className="mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8]" />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                        </div>

                        {/* Bio */}
                        <div>
                            <Label className="text-sm font-medium text-[#0F172A]">Bio</Label>
                            <Textarea value={data.bio} onChange={(e) => setData('bio', e.target.value)} placeholder="Tell clients about your experience, expertise, and what makes you stand out..." rows={4} className="mt-1.5 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8]" />
                        </div>

                        {/* Skills */}
                        <div>
                            <Label className="text-sm font-medium text-[#0F172A]">Skills</Label>
                            <div className="flex flex-wrap gap-2 mt-1.5 mb-2">
                                {data.skills.map((skill, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-[rgba(79,70,229,0.08)] text-[#4F46E5] border border-indigo-200">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(i)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add a skill..." className="h-9 rounded-lg border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8] text-sm" />
                                <Button type="button" variant="outline" size="sm" onClick={addSkill} className="rounded-lg border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
                            </div>
                        </div>

                        {/* Rate */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <Label className="text-sm font-medium text-[#0F172A]">Min Rate ($/hr)</Label>
                                <Input type="number" value={data.rate_min} onChange={(e) => setData('rate_min', e.target.value)} placeholder="25" className="mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8]" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-[#0F172A]">Max Rate ($/hr)</Label>
                                <Input type="number" value={data.rate_max} onChange={(e) => setData('rate_max', e.target.value)} placeholder="100" className="mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8]" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-[#0F172A]">Currency</Label>
                                <select value={data.rate_currency} onChange={(e) => setData('rate_currency', e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] px-3 text-sm focus:ring-2 focus:ring-[#4F46E5]">
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="MMK">MMK</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-[#0F172A]">Availability *</Label>
                            <select value={data.availability} onChange={(e) => setData('availability', e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] px-3 text-sm focus:ring-2 focus:ring-[#4F46E5]">
                                <option value="available">Available</option>
                                <option value="limited">Limited</option>
                                <option value="unavailable">Unavailable</option>
                            </select>
                        </div>

                        {/* Location */}
                        <div>
                            <Label className="text-sm font-medium text-[#0F172A]">Location & Timezone</Label>
                            <CountryTimezoneSelector
                                value={{ country: data.country, timezone: data.timezone }}
                                onChange={(value) => { setData('country', value.country); setData('timezone', value.timezone); }}
                                className="mt-1.5"
                            />
                            {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                            {errors.timezone && <p className="text-red-500 text-xs mt-1">{errors.timezone}</p>}
                        </div>

                        {/* Portfolio */}
                        <div>
                            <Label className="text-sm font-medium text-[#0F172A] mb-3 block">Portfolio Links <span className="text-[#94A3B8] font-normal">(Optional)</span></Label>
                            <div className="space-y-3 mb-3">
                                {data.portfolio_links.map((link, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-[#94A3B8] flex-shrink-0" />
                                        <Input value={link.title} onChange={(e) => updatePortfolioLink(i, 'title', e.target.value)} placeholder="Title" className="h-9 rounded-lg border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8] text-sm flex-1" />
                                        <Input value={link.url} onChange={(e) => updatePortfolioLink(i, 'url', e.target.value)} placeholder="https://..." className="h-9 rounded-lg border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8] text-sm flex-[2]" />
                                        <button type="button" onClick={() => removePortfolioLink(i)} className="p-1.5 text-[#94A3B8] hover:text-red-500"><X className="h-4 w-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addPortfolioLink} className="rounded-lg border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]">
                                <Plus className="h-3.5 w-3.5 mr-1" />Add Link
                            </Button>
                        </div>

                        {/* Social Links */}
                        <div>
                            <Label className="text-sm font-medium text-[#0F172A] mb-3 block">Social Links</Label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Github className="h-4 w-4 text-[#94A3B8] flex-shrink-0" />
                                    <Input value={data.github_link} onChange={(e) => setData('github_link', e.target.value)} placeholder="https://github.com/username" className="h-10 rounded-lg border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8] text-sm" />
                                    <span className="text-red-500 text-xs">*</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Linkedin className="h-4 w-4 text-[#94A3B8] flex-shrink-0" />
                                    <Input value={data.linkedin_link} onChange={(e) => setData('linkedin_link', e.target.value)} placeholder="https://linkedin.com/in/username" className="h-10 rounded-lg border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8] text-sm" />
                                    <span className="text-red-500 text-xs">*</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-[#94A3B8] flex-shrink-0" />
                                    <Input value={data.website_link} onChange={(e) => setData('website_link', e.target.value)} placeholder="https://myportfolio.com" className="h-10 rounded-lg border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8] text-sm" />
                                </div>
                            </div>
                            <p className="text-xs text-[#94A3B8] mt-2">* GitHub and LinkedIn profiles are required</p>
                        </div>

                        {/* CV Upload */}
                        <div className="pt-4 border-t border-[#E2E8F0]">
                            <Label className="text-sm font-medium text-[#0F172A] mb-2 block">Upload CV (Resume) *</Label>
                            <div
                                onClick={() => cvInputRef.current?.click()}
                                className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${errors.cv ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] hover:border-[#4F46E5] hover:bg-[#F8FAFC]'}`}
                            >
                                <Input ref={cvInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleCvChange} className="hidden" />
                                <Plus className={`h-8 w-8 mx-auto mb-2 ${errors.cv ? 'text-red-400' : 'text-[#94A3B8]'}`} />
                                <p className={`text-sm ${errors.cv ? 'text-red-500' : 'text-[#64748B]'}`}>
                                    {cvFileName ? `Selected: ${cvFileName}` : 'Click to upload your CV (PDF, PNG, JPG)'}
                                </p>
                                <p className="text-xs text-[#94A3B8] mt-1">Maximum file size: 5MB</p>
                            </div>
                            {errors.cv && <p className="text-red-500 text-xs mt-2 font-medium">{errors.cv}</p>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                            <Link href={route('onboarding.skip')} method="post" as="button" className="text-sm text-[#94A3B8] hover:text-[#64748B] transition-colors">
                                Skip for now
                            </Link>
                            <Button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium shadow-sm">
                                <Sparkles className="h-4 w-4 mr-2" />{processing ? 'Saving...' : 'Complete Setup'}
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
