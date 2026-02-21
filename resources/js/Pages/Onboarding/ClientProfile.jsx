import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, ArrowRight, Sparkles, Building, Globe, Camera } from 'lucide-react';
import CountryTimezoneSelector from '@/Components/Forms/CountryTimezoneSelector';

export default function ClientProfileOnboarding({ profile, user }) {
    const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || null);
    const fileInputRef = useRef(null);
    const { data, setData, post, processing, errors } = useForm({
        company_name: profile?.company_name || '', industry: profile?.industry || '',
        country: profile?.country || '', timezone: profile?.timezone || '',
        website: profile?.website || '', avatar: null,
    });
    const storageKey = user?.id ? `client_onboarding_data_user_${user.id}` : 'client_onboarding_data';

    useEffect(() => {
        if (typeof window !== 'undefined') localStorage.removeItem('client_onboarding_data');
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                Object.keys(parsed).forEach(key => { if (key !== 'avatar') setData(key, parsed[key]); });
                setAvatarPreview(parsed.avatarPreview || null);
            } catch (error) { console.warn('Failed to load saved form data:', error); }
        }
    }, [storageKey]);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify({ ...data, avatarPreview }));
    }, [data, avatarPreview, storageKey]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) { setData('avatar', file); setAvatarPreview(URL.createObjectURL(file)); }
    };
    const isValidUrl = (url) => { try { new URL(url); return true; } catch { return false; } };

    const submit = (e) => {
        e.preventDefault();
        const ve = {};
        if (!data.company_name?.trim()) ve.company_name = 'Company name is required';
        if (!data.industry?.trim()) ve.industry = 'Industry is required';
        if (!data.country?.trim()) ve.country = 'Country is required';
        if (!data.timezone?.trim()) ve.timezone = 'Timezone is required';
        if (data.website?.trim() && !isValidUrl(data.website)) ve.website = 'Please enter a valid website URL';
        if (Object.keys(ve).length > 0) {
            alert('Please fill in all required fields:\n\n' + Object.values(ve).map(m => `• ${m}`).join('\n'));
            return;
        }
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                if (key === 'avatar' && data[key] instanceof File) formData.append(key, data[key]);
                else if (Array.isArray(data[key])) formData.append(key, JSON.stringify(data[key]));
                else if (typeof data[key] === 'object') formData.append(key, JSON.stringify(data[key]));
                else formData.append(key, data[key]);
            }
        });
        post(route('onboarding.profile.save'), formData, {
            onError: (errors) => {
                if (errors && typeof errors === 'object') {
                    const first = Object.values(errors)[0];
                    if (first) alert('Please fix: ' + first);
                } else if (errors === '419') alert('Session expired. Please try again.');
            },
            onSuccess: () => { localStorage.removeItem(storageKey); },
            preserveState: false
        });
    };

    return (
        <>
            <Head title="Set Up Your Client Profile" />
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
                <div className="w-full max-w-lg">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <div className="h-10 w-10 bg-[#4F46E5] rounded-xl flex items-center justify-center shadow-sm">
                                <Search className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-[#0F172A]">CollabTool</span>
                        </div>
                        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Set up your client profile</h1>
                        <p className="text-[#94A3B8]">Help freelancers understand who you are. You can edit this later.</p>
                    </div>

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 space-y-6">
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <div className="h-20 w-20 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-2xl font-bold border-4 border-[#E2E8F0] shadow-sm">
                                    {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="h-20 w-20 rounded-full object-cover" /> : <span>{profile?.user?.name?.charAt(0)?.toUpperCase() || 'C'}</span>}
                                </div>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#4F46E5] text-white flex items-center justify-center hover:bg-[#4338CA] transition-colors shadow-sm"><Camera className="h-4 w-4" /></button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-[#0F172A]">Profile Photo</Label>
                                <p className="text-sm text-[#94A3B8] mt-1">Add a company logo or headshot. JPG, PNG up to 2MB.</p>
                                {errors.avatar && <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>}
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-[#0F172A]">Company Name</Label>
                            <div className="relative mt-1.5">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                                <Input value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} placeholder="e.g. Acme Inc." className="pl-10 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8]" />
                            </div>
                            {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-[#0F172A]">Industry</Label>
                            <Input value={data.industry} onChange={(e) => setData('industry', e.target.value)} placeholder="e.g. Technology, Healthcare" className="mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8]" />
                            {errors.industry && <p className="text-red-500 text-xs mt-1">{errors.industry}</p>}
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-[#0F172A]">Location & Timezone</Label>
                            <CountryTimezoneSelector value={{ country: data.country, timezone: data.timezone }} onChange={(v) => { setData('country', v.country); setData('timezone', v.timezone); }} className="mt-1.5" />
                            {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                            {errors.timezone && <p className="text-red-500 text-xs mt-1">{errors.timezone}</p>}
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-[#0F172A]">Website</Label>
                            <div className="relative mt-1.5">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                                <Input value={data.website} onChange={(e) => setData('website', e.target.value)} placeholder="https://yourcompany.com" className="pl-10 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8]" />
                            </div>
                            {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                            <Link href={route('onboarding.skip')} method="post" as="button" className="text-sm text-[#94A3B8] hover:text-[#64748B] transition-colors">Skip for now</Link>
                            <Button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium shadow-sm">
                                <Sparkles className="h-4 w-4 mr-2" />{processing ? 'Saving...' : 'Complete Setup'}<ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
