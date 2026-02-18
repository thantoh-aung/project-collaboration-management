import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, ArrowRight, Sparkles, Building, Globe, MapPin, Camera } from 'lucide-react';
import CountryTimezoneSelector from '@/Components/Forms/CountryTimezoneSelector';

export default function ClientProfileOnboarding({ profile }) {
    const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || null);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        company_name: profile?.company_name || '',
        industry: profile?.industry || '',
        country: profile?.country || '',
        timezone: profile?.timezone || '',
        website: profile?.website || '',
        avatar: null,
    });

    // Simple CSRF token refresh on component mount
    useEffect(() => {
        if (typeof window !== 'undefined' && window.axios) {
            window.axios.get('/sanctum/csrf-cookie').catch(() => {
                // Silently ignore CSRF refresh errors
            });
        }
    }, []);



    // Form data persistence
    useEffect(() => {
        // Load saved form data from localStorage
        const savedData = localStorage.getItem('client_onboarding_data');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Restore form data (except avatar file)
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
    }, []);

    // Auto-save form data to localStorage
    useEffect(() => {
        const dataToSave = { ...data, avatarPreview };
        localStorage.setItem('client_onboarding_data', JSON.stringify(dataToSave));
    }, [data, avatarPreview]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('avatar', file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    // Helper function to validate URLs
    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        
        // Refresh CSRF token and meta tag before submission
        if (typeof window !== 'undefined' && window.axios) {
            try {
                await window.axios.get('/sanctum/csrf-cookie');
                // Update the meta tag with fresh token
                const response = await window.axios.get('/sanctum/csrf-cookie');
                const newToken = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('XSRF-TOKEN='))
                    ?.split('=')[1];
                if (newToken) {
                    const metaTag = document.querySelector('meta[name="csrf-token"]');
                    if (metaTag) {
                        metaTag.setAttribute('content', decodeURIComponent(newToken));
                    }
                }
            } catch (error) {
                // Continue even if CSRF refresh fails
            }
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

        // Website is optional but if provided, must be valid
        if (data.website?.trim() && !isValidUrl(data.website)) {
            validationErrors.website = 'Please enter a valid website URL';
        }

        // If there are validation errors, show them and prevent submission
        if (Object.keys(validationErrors).length > 0) {
            alert('Please fill in all required fields:\n\n' +
                Object.entries(validationErrors)
                    .map(([field, message]) => `• ${message}`)
                    .join('\n'));

            return;
        }

        // Ensure CSRF token is included in form data
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                if (key === 'avatar' && data[key] instanceof File) {
                    formData.append(key, data[key]);
                } else if (Array.isArray(data[key])) {
                    formData.append(key, JSON.stringify(data[key]));
                } else if (typeof data[key] === 'object') {
                    formData.append(key, JSON.stringify(data[key]));
                } else {
                    formData.append(key, data[key]);
                }
            }
        });

        // Add CSRF token to FormData (get fresh from cookie)
        const getFreshCsrfToken = () => {
            const cookieValue = document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];
            return cookieValue ? decodeURIComponent(cookieValue) : null;
        };

        const csrfToken = getFreshCsrfToken();
        if (csrfToken) {
            formData.append('_token', csrfToken);
        }

        // Use direct post with proper error handling and file upload support
        post(route('onboarding.profile.save'), formData, {
            onError: (errors) => {
                console.error('Client profile submission errors:', errors);

                // Handle validation errors
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.entries(errors)
                        .map(([field, message]) => `${field}: ${message}`)
                        .join('\n');
                    alert('Please fix the following errors:\n\n' + errorMessages);
                }
            },
            onSuccess: () => {
                // Clear saved form data
                localStorage.removeItem('client_onboarding_data');
            }
        });
    };

    // Form data persistence
    useEffect(() => {
        // Load saved form data from localStorage
        const savedData = localStorage.getItem('client_onboarding_data');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Restore form data (except avatar file)
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
    }, []);

    // Auto-save form data
    useEffect(() => {
        const dataToSave = {
            ...data,
            avatarPreview
        };
        localStorage.setItem('client_onboarding_data', JSON.stringify(dataToSave));
    }, [data, avatarPreview]);

    return (
        <>
            <Head title="Set Up Your Client Profile" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
                <div className="w-full max-w-lg">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <div className="h-10 w-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Search className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">CollabTool</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Set up your client profile</h1>
                        <p className="text-gray-500">Help freelancers understand who you are. You can edit this later.</p>
                    </div>

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-blue-500/10 p-8 space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar preview" className="h-20 w-20 rounded-full object-cover" />
                                    ) : (
                                        <span>{profile?.user?.name?.charAt(0)?.toUpperCase() || 'C'}</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Profile Photo</Label>
                                <p className="text-sm text-gray-500 mt-1">Add a professional company logo or headshot. JPG, PNG up to 2MB.</p>
                                {errors.avatar && <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>}
                            </div>
                        </div>

                        {/* Company */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Company Name</Label>
                            <div className="relative mt-1.5">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} placeholder="e.g. Acme Inc." className="pl-10 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
                        </div>

                        {/* Industry */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Industry</Label>
                            <Input value={data.industry} onChange={(e) => setData('industry', e.target.value)} placeholder="e.g. Technology, Healthcare, Finance" className="mt-1.5 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                            {errors.industry && <p className="text-red-500 text-xs mt-1">{errors.industry}</p>}
                        </div>

                        {/* Location */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Location & Timezone</Label>
                            <CountryTimezoneSelector
                                value={{ country: data.country, timezone: data.timezone }}
                                onChange={(value) => {
                                    setData('country', value.country);
                                    setData('timezone', value.timezone);
                                }}
                                className="mt-1.5"
                            />
                            {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                            {errors.timezone && <p className="text-red-500 text-xs mt-1">{errors.timezone}</p>}
                        </div>

                        {/* Website */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Website</Label>
                            <div className="relative mt-1.5">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input value={data.website} onChange={(e) => setData('website', e.target.value)} placeholder="https://yourcompany.com" className="pl-10 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <Link href={route('onboarding.skip')} method="post" as="button" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                                Skip for now
                            </Link>
                            <Button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/30">
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
