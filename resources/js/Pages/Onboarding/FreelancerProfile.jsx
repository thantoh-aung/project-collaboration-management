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
        const savedData = localStorage.getItem('freelancer_onboarding_data');
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
        localStorage.setItem('freelancer_onboarding_data', JSON.stringify(dataToSave));
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
            // Display validation errors
            alert('Please fill in all required fields:\n\n' +
                Object.entries(errors)
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
                console.error('Form submission errors:', errors);

                // Handle validation errors
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat();
                    if (errorMessages.length > 0) {
                        alert('Please fix the following errors:\n\n' + errorMessages.join('\n'));
                    }
                }
            },
            onSuccess: () => {
                // Clear saved data on successful submission
                localStorage.removeItem('freelancer_onboarding_data');
            }
        });
    };

    const addSkill = () => {
        const skill = newSkill.trim();
        if (skill && !data.skills.includes(skill)) {
            setData('skills', [...data.skills, skill]);
            setNewSkill('');
        }
    };

    const removeSkill = (i) => setData('skills', data.skills.filter((_, idx) => idx !== i));

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

    return (
        <>
            <Head title="Set Up Your Freelancer Profile" />
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Code className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">CollabTool</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Set up your freelancer profile</h1>
                        <p className="text-gray-500">Tell clients about yourself. You can always edit this later.</p>
                    </div>

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-indigo-500/10 p-8 space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar preview" className="h-20 w-20 rounded-full object-cover" />
                                    ) : (
                                        <span>{profile?.user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg"
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
                                <p className="text-sm text-gray-500 mt-1">Add a professional headshot. JPG, PNG up to 2MB.</p>
                                {errors.avatar && <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Professional Title *</Label>
                            <Input value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="e.g. Full-Stack Developer, UI/UX Designer" className="mt-1.5 h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                        </div>

                        {/* Bio */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Bio</Label>
                            <Textarea value={data.bio} onChange={(e) => setData('bio', e.target.value)} placeholder="Tell clients about your experience, expertise, and what makes you stand out..." rows={4} className="mt-1.5 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>

                        {/* Skills */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Skills</Label>
                            <div className="flex flex-wrap gap-2 mt-1.5 mb-2">
                                {data.skills.map((skill, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(i)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add a skill..." className="h-9 rounded-lg border-gray-200 text-sm" />
                                <Button type="button" variant="outline" size="sm" onClick={addSkill} className="rounded-lg"><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
                            </div>
                        </div>

                        {/* Rate */}
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

                        {/* Portfolio */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-3 block">Portfolio Links <span className="text-gray-400 font-normal">(Optional)</span></Label>
                            <div className="space-y-3 mb-3">
                                {data.portfolio_links.map((link, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <Input value={link.title} onChange={(e) => updatePortfolioLink(i, 'title', e.target.value)} placeholder="Title" className="h-9 rounded-lg border-gray-200 text-sm flex-1" />
                                        <Input value={link.url} onChange={(e) => updatePortfolioLink(i, 'url', e.target.value)} placeholder="https://..." className="h-9 rounded-lg border-gray-200 text-sm flex-[2]" />
                                        <button type="button" onClick={() => removePortfolioLink(i)} className="p-1.5 text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addPortfolioLink} className="rounded-lg">
                                <Plus className="h-3.5 w-3.5 mr-1" />Add Link
                            </Button>
                        </div>

                        {/* Social Links */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-3 block">Social Links</Label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Github className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <Input value={data.github_link} onChange={(e) => setData('github_link', e.target.value)} placeholder="https://github.com/username" className="h-10 rounded-lg border-gray-200 text-sm" />
                                    <span className="text-red-500 text-xs">*</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Linkedin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <Input value={data.linkedin_link} onChange={(e) => setData('linkedin_link', e.target.value)} placeholder="https://linkedin.com/in/username" className="h-10 rounded-lg border-gray-200 text-sm" />
                                    <span className="text-red-500 text-xs">*</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <Input value={data.website_link} onChange={(e) => setData('website_link', e.target.value)} placeholder="https://myportfolio.com" className="h-10 rounded-lg border-gray-200 text-sm" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">* GitHub and LinkedIn profiles are required</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <Link href={route('onboarding.skip')} method="post" as="button" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                                Skip for now
                            </Link>
                            <Button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/30">
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
