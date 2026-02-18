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

    const { data, setData, post, processing, errors, reset } = useForm({
        title: profile?.title || '',
        bio: profile?.bio || '',
        skills: profile?.skills || [],
        portfolio_links: profile?.portfolio_links || [],
        github_link: profile?.github_link || '',
        linkedin_link: profile?.linkedin_link || '',
        website_link: profile?.website_link || '',
        rate_min: profile?.rate_min || '',
        rate_max: profile?.rate_max || '',
        rate_currency: profile?.rate_currency || 'USD',
        availability: profile?.availability || 'available',
        country: profile?.country || '',
        timezone: profile?.timezone || '',
        avatar: null,
    });

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
        
        // Refresh CSRF token before submission
        try {
            await window.axios.get('/sanctum/csrf-cookie');
        } catch (error) {
            console.warn('CSRF token refresh failed before submission:', error);
        }
        
        // Client-side validation for essential fields
        const errors = {};
        
        // Essential fields validation
        if (!data.title?.trim()) {
            errors.title = 'Professional title is required';
        }
        
        if (!data.bio?.trim()) {
            errors.bio = 'Bio is required';
        } else if (data.bio.trim().length < 50) {
            errors.bio = 'Bio must be at least 50 characters';
        }
        
        if (!data.skills?.length) {
            errors.skills = 'At least one skill is required';
        }
        
        if (!data.country?.trim()) {
            errors.country = 'Country is required';
        }
        
        if (!data.timezone?.trim()) {
            errors.timezone = 'Timezone is required';
        }
        
        if (!data.availability?.trim()) {
            errors.availability = 'Availability status is required';
        }
        
        // Rate validation (optional but if provided, must be valid and positive)
        if (data.rate_min !== '' && data.rate_min !== null && data.rate_min !== undefined) {
            const minRate = parseFloat(data.rate_min);
            if (isNaN(minRate) || minRate < 0) {
                errors.rate_min = 'Minimum rate must be 0 or greater';
            }
        }
        
        if (data.rate_max !== '' && data.rate_max !== null && data.rate_max !== undefined) {
            const maxRate = parseFloat(data.rate_max);
            if (isNaN(maxRate) || maxRate < 0) {
                errors.rate_max = 'Maximum rate must be 0 or greater';
            }
        }
        
        if (data.rate_min && data.rate_max && data.rate_min !== '' && data.rate_max !== '') {
            const min = parseFloat(data.rate_min);
            const max = parseFloat(data.rate_max);
            if (min >= max) {
                errors.rate_max = 'Maximum rate must be greater than minimum rate';
            }
        }
        
        // Portfolio links validation (optional - only validate if provided)
        if (data.portfolio_links && data.portfolio_links.length > 0) {
            data.portfolio_links.forEach((link, index) => {
                if (link.title?.trim() && !link.url?.trim()) {
                    errors[`portfolio_links_${index}_url`] = 'Portfolio link URL is required when title is provided';
                }
                if (link.url?.trim() && !link.title?.trim()) {
                    errors[`portfolio_links_${index}_title`] = 'Portfolio link title is required when URL is provided';
                }
                if (link.url?.trim() && !isValidUrl(link.url)) {
                    errors[`portfolio_links_${index}_url`] = 'Please enter a valid URL';
                }
            });
        }
        
        // Social links validation (GitHub and LinkedIn are required)
        if (!data.github_link?.trim()) {
            errors.github_link = 'GitHub profile is required';
        } else if (!isValidUrl(data.github_link)) {
            errors.github_link = 'Please enter a valid GitHub URL';
        }
        
        if (!data.linkedin_link?.trim()) {
            errors.linkedin_link = 'LinkedIn profile is required';
        } else if (!isValidUrl(data.linkedin_link)) {
            errors.linkedin_link = 'Please enter a valid LinkedIn URL';
        }
        
        // Website link is optional but if provided, must be valid
        if (data.website_link?.trim() && !isValidUrl(data.website_link)) {
            errors.website_link = 'Please enter a valid website URL';
        }
        
        // If there are validation errors, show them and prevent submission
        if (Object.keys(errors).length > 0) {
            // Create a temporary errors object to display validation messages
            const tempErrors = { ...errors };
            
            // Display each error
            Object.entries(tempErrors).forEach(([field, message]) => {
                // Create error elements or use a notification system
                console.error(`${field}: ${message}`);
            });
            
            // For now, let's use browser's alert as a simple validation display
            // In production, you might want to use a toast/notification system
            alert('Please fill in all required fields:\n\n' + 
                  Object.entries(tempErrors)
                      .map(([field, message]) => `• ${message}`)
                      .join('\n'));
            
            return;
        }
        
        // If validation passes, submit the form
        post(route('marketplace.profile.update'), {
            forceFormData: true,
            onError: async (errors) => {
                console.error('Form submission errors:', errors);
                
                // Handle CSRF errors more gracefully
                if (errors?.message?.includes('419') || errors?.message?.includes('CSRF') || errors?.error?.includes('419') || errors?.error?.includes('CSRF')) {
                    // Try to refresh CSRF token and retry once
                    try {
                        await window.axios.get('/sanctum/csrf-cookie');
                        // Retry the submission
                        setTimeout(() => {
                            post(route('marketplace.profile.update'), {
                                forceFormData: true,
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
                console.log('Profile updated successfully');
            }
        });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('avatar', file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const addSkill = () => {
        const skill = newSkill.trim();
        if (skill && !data.skills.includes(skill)) {
            setData('skills', [...data.skills, skill]);
            setNewSkill('');
        }
    };

    const removeSkill = (index) => {
        setData('skills', data.skills.filter((_, i) => i !== index));
    };

    const addPortfolioLink = () => {
        setData('portfolio_links', [...data.portfolio_links, { title: '', url: '' }]);
    };

    const updatePortfolioLink = (index, field, value) => {
        const updated = [...data.portfolio_links];
        updated[index] = { ...updated[index], [field]: value };
        setData('portfolio_links', updated);
    };

    const removePortfolioLink = (index) => {
        setData('portfolio_links', data.portfolio_links.filter((_, i) => i !== index));
    };

    const togglePublish = () => {
        if (isPublished) {
            router.post(route('marketplace.profile.unpublish'));
        } else {
            router.post(route('marketplace.profile.publish'));
        }
    };

    return (
        <MarketplaceLayout>
            <Head title="My Freelancer Profile" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">My Freelancer Profile</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {isPublished ? 'Your profile is live on the marketplace.' : 'Your profile is in draft mode. Publish it to appear in the marketplace.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className={isPublished ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-gray-100 text-gray-600 border-0'}>
                            {isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        <Button variant="outline" onClick={togglePublish} className="rounded-xl">
                            {isPublished ? <><EyeOff className="h-4 w-4 mr-1.5" />Unpublish</> : <><Eye className="h-4 w-4 mr-1.5" />Publish</>}
                        </Button>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Profile Photo</h2>
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-lg shadow-indigo-500/20">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
                                    ) : (
                                        profile?.user?.name?.charAt(0)?.toUpperCase() || 'F'
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

                    {/* Title */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Basic Info</h2>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Professional Title *</Label>
                                <Input value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="e.g. Full-Stack Developer" className="mt-1.5 h-11 rounded-xl border-gray-200" />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Bio *</Label>
                                <Textarea value={data.bio} onChange={(e) => setData('bio', e.target.value)} placeholder="Tell clients about yourself, your experience, and what you offer... (minimum 50 characters)" rows={5} className="mt-1.5 rounded-xl border-gray-200" />
                                {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
                                <p className="text-xs text-gray-500 mt-1">{data.bio?.length || 0} / 50 characters minimum</p>
                            </div>
                            <CountryTimezoneSelector
                            value={{ country: data.country, timezone: data.timezone }}
                            onChange={(value) => {
                                setData('country', value.country);
                                setData('timezone', value.timezone);
                            }}
                            disabled={processing}
                        />
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Skills *</h2>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {data.skills.map((skill, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {skill}
                                    <button type="button" onClick={() => removeSkill(i)} className="hover:text-red-500 ml-0.5"><X className="h-3 w-3" /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add a skill..." className="h-9 rounded-lg border-gray-200 text-sm" />
                            <Button type="button" variant="outline" size="sm" onClick={addSkill} className="rounded-lg"><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
                        </div>
                    </div>

                    {/* Rate */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Rate & Availability</h2>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Min Rate ($/hr)</Label>
                                <Input type="number" value={data.rate_min} onChange={(e) => setData('rate_min', e.target.value)} placeholder="25" className="mt-1.5 h-11 rounded-xl border-gray-200" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Max Rate ($/hr)</Label>
                                <Input type="number" value={data.rate_max} onChange={(e) => setData('rate_max', e.target.value)} placeholder="100" className="mt-1.5 h-11 rounded-xl border-gray-200" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Currency</Label>
                                <select value={data.rate_currency} onChange={(e) => setData('rate_currency', e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm">
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="MMK">MMK</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Availability *</Label>
                            <select value={data.availability} onChange={(e) => setData('availability', e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm">
                                <option value="available">Available</option>
                                <option value="limited">Limited</option>
                                <option value="unavailable">Unavailable</option>
                            </select>
                        </div>
                    </div>

                    {/* Portfolio */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Portfolio Links <span className="text-gray-400 font-normal">(Optional)</span></h2>
                        <div className="space-y-3 mb-3">
                            {data.portfolio_links.map((link, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <Input value={link.title} onChange={(e) => updatePortfolioLink(i, 'title', e.target.value)} placeholder="Title" className="h-9 rounded-lg border-gray-200 text-sm flex-1" />
                                    <Input value={link.url} onChange={(e) => updatePortfolioLink(i, 'url', e.target.value)} placeholder="https://..." className="h-9 rounded-lg border-gray-200 text-sm flex-[2]" />
                                    <button type="button" onClick={() => removePortfolioLink(i)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addPortfolioLink} className="rounded-lg">
                            <Plus className="h-3.5 w-3.5 mr-1" />Add Link
                        </Button>
                    </div>

                    {/* Social Links */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Social Links</h2>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Github className="h-4 w-4" /> GitHub *</Label>
                                <Input value={data.github_link} onChange={(e) => setData('github_link', e.target.value)} placeholder="https://github.com/username" className="mt-1.5 h-11 rounded-xl border-gray-200" />
                                {errors.github_link && <p className="text-red-500 text-xs mt-1">{errors.github_link}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Linkedin className="h-4 w-4" /> LinkedIn *</Label>
                                <Input value={data.linkedin_link} onChange={(e) => setData('linkedin_link', e.target.value)} placeholder="https://linkedin.com/in/username" className="mt-1.5 h-11 rounded-xl border-gray-200" />
                                {errors.linkedin_link && <p className="text-red-500 text-xs mt-1">{errors.linkedin_link}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Globe className="h-4 w-4" /> Portfolio Website <span className="text-gray-400 font-normal">(Optional)</span></Label>
                                <Input value={data.website_link} onChange={(e) => setData('website_link', e.target.value)} placeholder="https://myportfolio.com" className="mt-1.5 h-11 rounded-xl border-gray-200" />
                                {errors.website_link && <p className="text-red-500 text-xs mt-1">{errors.website_link}</p>}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">* GitHub and LinkedIn profiles are required for verification</p>
                    </div>

                    {/* Save */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/30">
                            <Save className="h-4 w-4 mr-2" />{processing ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>
                </form>
            </div>
        </MarketplaceLayout>
    );
}
