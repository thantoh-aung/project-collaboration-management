import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X, Briefcase, DollarSign, Calendar, Code } from 'lucide-react';

export default function PostProject() {
    const [newSkill, setNewSkill] = useState('');
    const [lastSaved, setLastSaved] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        budget_min: '',
        budget_max: '',
        budget_type: 'fixed',
        budget_currency: 'USD',
        deadline: '',
        skills_required: [],
        country: 'United States',
        timezone: 'UTC-5',
    });

    useEffect(() => {
        window.axios.get('/sanctum/csrf-cookie');
    }, []);

    // Form data persistence
    useEffect(() => {
        // Load saved form data from localStorage
        const savedData = localStorage.getItem('project_post_data');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Restore form data
                Object.keys(parsed).forEach(key => {
                    if (key in data) {
                        setData(key, parsed[key]);
                    }
                });
                console.log('Form data restored from localStorage');
            } catch (error) {
                console.warn('Failed to load saved form data:', error);
            }
        }
    }, []);

    // Auto-save form data to localStorage
    useEffect(() => {
        // Save all form data except sensitive fields
        const dataToSave = { ...data };
        localStorage.setItem('project_post_data', JSON.stringify(dataToSave));
        setLastSaved(new Date());
    }, [data]);

    const submit = (e) => {
        e.preventDefault();
        
        // Client-side validation for essential fields
        const errors = {};
        
        // Essential fields validation
        if (!data.title?.trim()) {
            errors.title = 'Project title is required';
        } else if (data.title.trim().length < 10) {
            errors.title = 'Project title must be at least 10 characters';
        }
        
        if (!data.description?.trim()) {
            errors.description = 'Project description is required';
        } else if (data.description.trim().length < 50) {
            errors.description = 'Project description must be at least 50 characters';
        }
        
        if (!data.skills_required?.length) {
            errors.skills_required = 'At least one skill is required';
        }
        
        // Budget validation (required fields)
        if (!data.budget_min?.trim() || data.budget_min === '') {
            errors.budget_min = 'Minimum budget is required';
        } else {
            const minBudget = parseFloat(data.budget_min);
            if (isNaN(minBudget)) {
                errors.budget_min = 'Minimum budget must be a valid number';
            } else if (minBudget <= 0) {
                errors.budget_min = 'Minimum budget must be greater than 0';
            } else if (minBudget < 5) {
                errors.budget_min = 'Minimum budget must be at least $5';
            } else if (minBudget > 999999999999.99) {
                errors.budget_min = 'Minimum budget is too large. Maximum allowed is $999,999,999,999.99';
            }
        }
        
        if (!data.budget_max?.trim() || data.budget_max === '') {
            errors.budget_max = 'Maximum budget is required';
        } else {
            const maxBudget = parseFloat(data.budget_max);
            if (isNaN(maxBudget)) {
                errors.budget_max = 'Maximum budget must be a valid number';
            } else if (maxBudget <= 0) {
                errors.budget_max = 'Maximum budget must be greater than 0';
            } else if (maxBudget < 10) {
                errors.budget_max = 'Maximum budget must be at least $10';
            } else if (maxBudget > 999999999999.99) {
                errors.budget_max = 'Maximum budget is too large. Maximum allowed is $999,999,999,999.99';
            }
        }
        
        // Budget logic validation (only if both are valid numbers)
        if (data.budget_min && data.budget_max && data.budget_min !== '' && data.budget_max !== '') {
            const minBudget = parseFloat(data.budget_min);
            const maxBudget = parseFloat(data.budget_max);
            
            if (!isNaN(minBudget) && !isNaN(maxBudget)) {
                if (minBudget >= maxBudget) {
                    errors.budget_max = 'Maximum budget must be greater than minimum budget';
                } else if (maxBudget < minBudget * 1.1) {
                    errors.budget_max = 'Maximum budget should be at least 10% higher than minimum budget';
                }
            }
        }
        
        // Budget type validation
        if (!data.budget_type?.trim()) {
            errors.budget_type = 'Budget type is required';
        }
        
        // Deadline validation
        if (!data.deadline?.trim()) {
            errors.deadline = 'Deadline is required';
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
        
        // Convert deadline text to actual date before submission
        const submissionData = { ...data };
        if (data.deadline && data.deadline !== 'flexible') {
            const deadlineDate = convertDeadlineToDate(data.deadline);
            submissionData.deadline = deadlineDate;
        } else if (data.deadline === 'flexible') {
            submissionData.deadline = null; // Flexible means no specific deadline
        }
        
        // If validation passes, submit the form
        post(route('marketplace.projects.store'), submissionData, {
            onSuccess: () => {
                // Clear saved data on successful submission
                localStorage.removeItem('project_post_data');
                console.log('Form data cleared after successful submission');
            },
            onError: (errors) => {
                console.error('Form submission errors:', errors);
                // Data is preserved in localStorage for retry
            }
        });
    };

    const addSkill = () => {
        const skill = newSkill.trim();
        if (skill && !data.skills_required.includes(skill)) {
            setData('skills_required', [...data.skills_required, skill]);
            setNewSkill('');
        }
    };

    const removeSkill = (index) => {
        setData('skills_required', data.skills_required.filter((_, i) => i !== index));
    };

    const clearFormData = () => {
        // Reset form to initial values
        setData({
            title: '',
            description: '',
            budget_min: '',
            budget_max: '',
            budget_type: 'fixed',
            budget_currency: 'USD',
            deadline: '',
            skills_required: [],
            country: 'United States',
            timezone: 'UTC-5',
        });
        setNewSkill('');
        // Clear localStorage
        localStorage.removeItem('project_post_data');
        console.log('Form data cleared');
    };

    // Helper function to convert deadline text to date
    const convertDeadlineToDate = (deadline) => {
        const today = new Date();
        let targetDate = new Date(today);
        
        switch (deadline) {
            case '1_week':
                targetDate.setDate(today.getDate() + 7);
                break;
            case '2_weeks':
                targetDate.setDate(today.getDate() + 14);
                break;
            case '1_month':
                targetDate.setMonth(today.getMonth() + 1);
                break;
            case '3_months':
                targetDate.setMonth(today.getMonth() + 3);
                break;
            case '6_months':
                targetDate.setMonth(today.getMonth() + 6);
                break;
            default:
                return null;
        }
        
        return targetDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    };

    return (
        <MarketplaceLayout>
            <Head title="Post a Project" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Briefcase className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Post a Project</h1>
                        </div>
                        {lastSaved && (
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                <span>Auto-saved</span>
                                <span>{lastSaved.toLocaleTimeString()}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-500">Describe your project and find the perfect freelancer.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Title */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Project Title *</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g., E-commerce Website Development, Mobile App Design, SEO Optimization"
                            className="mt-2 h-11"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description *</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="We need a full-stack developer to build a modern e-commerce platform with user authentication, payment integration, and admin dashboard. The project should be responsive and SEO-friendly. Experience with React, Node.js, and PostgreSQL is required."
                            className="mt-2 min-h-[150px]"
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>

                    {/* Budget */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                            <Label className="text-sm font-semibold text-gray-700">Budget *</Label>
                        </div>

                        <div className="mb-4">
                            <Label className="text-xs text-gray-500 mb-1.5 block">Budget Type</Label>
                            <div className="flex gap-2">
                                {['fixed', 'hourly'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setData('budget_type', type)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            data.budget_type === type
                                                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                                                : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                                        }`}
                                    >
                                        {type === 'fixed' ? 'Fixed Price' : 'Hourly'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="budget_min" className="text-xs text-gray-500">Min Budget ($) *</Label>
                                <Input
                                    id="budget_min"
                                    type="number"
                                    value={data.budget_min}
                                    onChange={(e) => setData('budget_min', e.target.value)}
                                    placeholder="1000"
                                    className="mt-1"
                                    min="5"
                                    max="999999999999"
                                    step="1"
                                    onWheel={(e) => e.target.blur()}
                                />
                            </div>
                            <div>
                                <Label htmlFor="budget_max" className="text-xs text-gray-500">Max Budget ($) *</Label>
                                <Input
                                    id="budget_max"
                                    type="number"
                                    value={data.budget_max}
                                    onChange={(e) => setData('budget_max', e.target.value)}
                                    placeholder="5000"
                                    className="mt-1"
                                    min="10"
                                    max="999999999999"
                                    step="1"
                                    onWheel={(e) => e.target.blur()}
                                />
                            </div>
                        </div>
                        {errors.budget_min && <p className="text-red-500 text-xs mt-1">{errors.budget_min}</p>}
                        {errors.budget_max && <p className="text-red-500 text-xs mt-1">{errors.budget_max}</p>}
                    </div>

                    {/* Deadline */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <Label htmlFor="deadline" className="text-sm font-semibold text-gray-700">Deadline *</Label>
                        </div>
                        <select
                            id="deadline"
                            value={data.deadline}
                            onChange={(e) => setData('deadline', e.target.value)}
                            className="mt-1 max-w-xs h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm"
                        >
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
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Code className="h-4 w-4 text-indigo-500" />
                            <Label className="text-sm font-semibold text-gray-700">Skills Required *</Label>
                        </div>

                        <div className="flex gap-2 mb-3">
                            <Input
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                                placeholder="e.g., React, Laravel, UI/UX Design, Digital Marketing"
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" onClick={addSkill} className="px-3">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {data.skills_required.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {data.skills_required.map((skill, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(i)} className="hover:text-red-500 transition-colors">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={clearFormData}
                            className="text-gray-500 hover:text-gray-700 rounded-xl"
                        >
                            Clear Form
                        </Button>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-11 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/30 font-medium"
                            >
                                {processing ? 'Posting...' : 'Post Project'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </MarketplaceLayout>
    );
}
