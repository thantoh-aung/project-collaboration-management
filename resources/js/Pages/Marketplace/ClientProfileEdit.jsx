import { Head, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Building, Globe, Camera } from 'lucide-react';
import CountryTimezoneSelector from '@/Components/Forms/CountryTimezoneSelector';

export default function ClientProfileEdit({ profile, user }) {
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const refresh = async () => { if (window.axios) try { await window.axios.get('/sanctum/csrf-cookie'); } catch { } };
        refresh();
        const i = setInterval(refresh, 5 * 60 * 1000);
        return () => clearInterval(i);
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        company_name: profile?.company_name || '', industry: profile?.industry || '',
        country: profile?.country || '', timezone: profile?.timezone || '',
        website: profile?.website || '', avatar: null,
    });

    const handleAvatarChange = (e) => { const f = e.target.files[0]; if (f) { setData('avatar', f); setAvatarPreview(URL.createObjectURL(f)); } };

    const submit = async (e) => {
        e.preventDefault();
        try { await window.axios.get('/sanctum/csrf-cookie'); } catch { }
        const ve = {};
        if (!data.company_name?.trim()) ve.company_name = 'Company name is required';
        if (!data.industry?.trim()) ve.industry = 'Industry is required';
        if (!data.country?.trim()) ve.country = 'Country is required';
        if (!data.timezone?.trim()) ve.timezone = 'Timezone is required';
        if (Object.keys(ve).length > 0) { alert('Fix errors:\n' + Object.values(ve).map(m => `• ${m}`).join('\n')); return; }
        post(route('marketplace.client-profile.update'), {
            forceFormData: true, _method: 'PUT',
            onError: async (errors) => {
                if (errors?.message?.includes('419') || errors?.error?.includes('419')) {
                    try { await window.axios.get('/sanctum/csrf-cookie'); setTimeout(() => post(route('marketplace.client-profile.update'), { forceFormData: true, _method: 'PUT' }), 1000); } catch { alert('Session expired. Please refresh.'); }
                    return;
                }
                if (errors.error) alert(errors.error);
            },
        });
    };

    return (
        <MarketplaceLayout>
            <Head title="My Client Profile" />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[#0F172A]">My Client Profile</h1>
                    <p className="text-sm text-[#94A3B8] mt-1">This information helps freelancers understand who you are.</p>
                </div>

                <form onSubmit={submit} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 space-y-6">
                    <div>
                        <Label className="text-sm font-medium text-[#64748B]">Profile Photo</Label>
                        <div className="flex items-center gap-5 mt-2">
                            <div className="relative group">
                                <div className="h-20 w-20 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-sm">
                                    {avatarPreview ? <img src={avatarPreview} alt="Profile" className="h-20 w-20 rounded-full object-cover" /> : user?.name?.charAt(0)?.toUpperCase() || 'C'}
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

                    <div>
                        <Label className="text-sm font-medium text-[#64748B]">Company Name *</Label>
                        <div className="relative mt-1.5">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                            <Input value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} placeholder="e.g. Acme Inc." className="pl-10 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />
                        </div>
                        {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-[#64748B]">Industry *</Label>
                        <Input value={data.industry} onChange={(e) => setData('industry', e.target.value)} placeholder="e.g. Technology, Healthcare" className="mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />
                    </div>

                    <CountryTimezoneSelector value={{ country: data.country, timezone: data.timezone }} onChange={(v) => { setData('country', v.country); setData('timezone', v.timezone); }} disabled={processing} />

                    <div>
                        <Label className="text-sm font-medium text-[#64748B]">Website (Optional)</Label>
                        <div className="relative mt-1.5">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                            <Input value={data.website} onChange={(e) => setData('website', e.target.value)} placeholder="https://yourcompany.com" className="pl-10 h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A]" />
                        </div>
                        {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
                        <Button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium shadow-sm">
                            <Save className="h-4 w-4 mr-2" />{processing ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>
                </form>
            </div>
        </MarketplaceLayout>
    );
}
