import { Head, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Building, Globe, MapPin, Camera } from 'lucide-react';
import CountryTimezoneSelector from '@/Components/Forms/CountryTimezoneSelector';

export default function ClientProfileEdit({ profile, user }) {
    // Debug: Check what user data we're receiving
    console.log('ClientProfileEdit user data:', user);
    console.log('ClientProfileEdit avatar_url:', user?.avatar_url);
    
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url ? user.avatar_url : null);
    const fileInputRef = useRef(null);

    // Enhanced CSRF token management
    useEffect(() => {
        // Ensure CSRF token is available and refresh periodically
        const refreshCSRFToken = async () => {
            if (typeof window !== 'undefined' && window.axios) {
                try {
                    await window.axios.get('/sanctum/csrf-cookie');
                } catch (error) {
                    console.warn('CSRF token refresh failed:', error);
                }
            }
        };

        // Initial refresh
        refreshCSRFToken();

        // Set up periodic refresh (every 5 minutes)
        const interval = setInterval(refreshCSRFToken, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        company_name: profile?.company_name || '',
        industry: profile?.industry || '',
        country: profile?.country || '',
        timezone: profile?.timezone || '',
        website: profile?.website || '',
        avatar: null,
    });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('avatar', file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        
        // Refresh CSRF token before submission
        try {
            await window.axios.get('/sanctum/csrf-cookie');
        } catch (error) {
            console.warn('CSRF token refresh failed before submission:', error);
        }
        
        // Client-side validation for essential fields
        const validationErrors = {};
        
        // Essential fields validation
        if (!data.company_name?.trim()) {
            validationErrors.company_name = 'Company name is required';
        }
        
        if (!data.industry?.trim()) {
            validationErrors.industry = 'Industry is required';
        }
        
        if (!data.country?.trim()) {
            validationErrors.country = 'Country is required';
        }
        
        if (!data.timezone?.trim()) {
            validationErrors.timezone = 'Timezone is required';
        }
        
        // Website is optional - no validation required
        
        // If there are validation errors, show them and prevent submission
        if (Object.keys(validationErrors).length > 0) {
            alert('Please fill in all required fields:\n\n' + 
                  Object.entries(validationErrors)
                      .map(([field, message]) => `• ${message}`)
                      .join('\n'));
            
            return;
        }
        
        // Use post with _method PUT for file upload support
        post(route('marketplace.client-profile.update'), {
            forceFormData: true,
            _method: 'PUT',
            onError: async (errors) => {
                console.error('Form submission errors:', errors);
                
                // Handle CSRF errors more gracefully
                if (errors?.message?.includes('419') || errors?.message?.includes('CSRF') || errors?.error?.includes('419') || errors?.error?.includes('CSRF')) {
                    // Try to refresh CSRF token and retry once
                    try {
                        await window.axios.get('/sanctum/csrf-cookie');
                        // Retry the submission
                        setTimeout(() => {
                            post(route('marketplace.client-profile.update'), {
                                forceFormData: true,
                                _method: 'PUT',
                                onError: (retryErrors) => {
                                    console.error('Retry submission failed:', retryErrors);
                                    alert('Session expired. Please refresh the page and try again.');
                                }
                            });
                        }, 1000);
                    } catch (csrfError) {
                        console.error('CSRF refresh failed:', csrfError);
                        alert('Session expired. Please refresh the page and try again.');
                    }
                    return;
                }
                
                // Handle other errors
                if (errors.error) {
                    alert(errors.error);
                }
            },
            onSuccess: () => {
                console.log('Client profile updated successfully');
            }
        });
    };

    return (
        <MarketplaceLayout>
            <Head title="My Client Profile" />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">My Client Profile</h1>
                    <p className="text-sm text-gray-500 mt-1">This information helps freelancers understand who you are.</p>
                </div>

                <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
                    {/* Avatar Upload */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700">Profile Photo</Label>
                        <div className="flex items-center gap-5 mt-2">
                            <div className="relative group">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-lg shadow-blue-500/20">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
                                    ) : (
                                        user?.name?.charAt(0)?.toUpperCase() || 'C'
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Camera className="h-5 w-5 text-white" />
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleAvatarChange} className="hidden" />
                            </div>
                            <div>
                                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-lg">
                                    <Camera className="h-3.5 w-3.5 mr-1.5" /> Upload Photo
                                </Button>
                                <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WebP. Max 2MB.</p>
                                {errors.avatar && <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700">Company Name *</Label>
                        <div className="relative mt-1.5">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} placeholder="e.g. Acme Inc." className="pl-10 h-11 rounded-xl border-gray-200" />
                        </div>
                        {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700">Industry *</Label>
                        <Input value={data.industry} onChange={(e) => setData('industry', e.target.value)} placeholder="e.g. Technology, Healthcare" className="mt-1.5 h-11 rounded-xl border-gray-200" />
                    </div>

                    <CountryTimezoneSelector
                        value={{ country: data.country, timezone: data.timezone }}
                        onChange={(value) => {
                            setData('country', value.country);
                            setData('timezone', value.timezone);
                        }}
                        disabled={processing}
                    />

                    <div>
                        <Label className="text-sm font-medium text-gray-700">Website (Optional)</Label>
                        <div className="relative mt-1.5">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input value={data.website} onChange={(e) => setData('website', e.target.value)} placeholder="https://yourcompany.com" className="pl-10 h-11 rounded-xl border-gray-200" />
                        </div>
                        {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <Button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/30">
                            <Save className="h-4 w-4 mr-2" />{processing ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>
                </form>
            </div>
        </MarketplaceLayout>
    );
}
