import { Head, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Lock, Mail, User, Briefcase, Users, Building, CheckCircle, Search, Code, UserCheck } from 'lucide-react';

const usageTypes = [
    {
        value: 'client',
        label: 'Client',
        description: 'I want to hire freelancers for my projects',
        icon: Search,
        accentColor: '#4F46E5',
        bgColor: 'bg-[rgba(79,70,229,0.08)]',
        borderClass: 'border-[#4F46E5]',
    },
    {
        value: 'freelancer',
        label: 'Freelancer',
        description: 'I want to offer my services and find clients',
        icon: Code,
        accentColor: '#14B8A6',
        bgColor: 'bg-[rgba(20,184,166,0.08)]',
        borderClass: 'border-[#14B8A6]',
    },
];

export default function Register({ invitation, flash }) {
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordFeedback, setPasswordFeedback] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        email: invitation?.email || '',
        password: '',
        password_confirmation: '',
        job_title: '',
        usage_type: invitation ? 'freelancer' : '',
    });

    const checkPasswordStrength = (password) => {
        let strength = 0;
        const feedback = [];

        if (password.length >= 8) { strength += 20; } else { feedback.push('At least 8 characters'); }
        if (/[a-z]/.test(password)) { strength += 20; } else { feedback.push('One lowercase letter'); }
        if (/[A-Z]/.test(password)) { strength += 20; } else { feedback.push('One uppercase letter'); }
        if (/\d/.test(password)) { strength += 20; } else { feedback.push('One number'); }
        if (/[@$!%*?&]/.test(password)) { strength += 20; } else { feedback.push('One special character (@$!%*?&)'); }

        setPasswordStrength(strength);
        setPasswordFeedback(feedback);
    };

    useEffect(() => {
        if (data.password) { checkPasswordStrength(data.password); }
        else { setPasswordStrength(0); setPasswordFeedback([]); }
    }, [data.password]);

    useEffect(() => {
        window.axios.get('/sanctum/csrf-cookie').then(() => { });
        const interval = setInterval(() => {
            window.axios.get('/sanctum/csrf-cookie').then(() => { });
        }, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <>
            <Head title="Sign Up - CollabTool" />
            <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
                {/* Left Side - Branding Area */}
                <div className="hidden lg:flex lg:w-1/2 bg-[#4F46E5] rounded-2xl m-4 text-white p-12 flex-col justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-20 -left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    </div>
                    <div className="max-w-md mx-auto relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Users className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold">CollabTool</h1>
                        </div>

                        <blockquote className="text-2xl font-light mb-6 italic">
                            "Simplified Collaboration for Modern Teams"
                        </blockquote>
                        <p className="text-indigo-100 mb-8 text-lg">
                            Experience the future of project management with our intuitive platform designed for seamless teamwork and exceptional results.
                        </p>

                        <div className="space-y-4">
                            {['Unlimited projects and tasks', 'Real-time collaboration', 'Advanced time tracking', 'Detailed reporting & analytics', 'No credit card required'].map((item) => (
                                <div key={item} className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-300" />
                                    <span className="text-indigo-100">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-white/10 rounded-xl border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex -space-x-2">
                                    <div className="h-8 w-8 rounded-full bg-indigo-300 border-2 border-white/20"></div>
                                    <div className="h-8 w-8 rounded-full bg-indigo-200 border-2 border-white/20"></div>
                                    <div className="h-8 w-8 rounded-full bg-teal-300 border-2 border-white/20"></div>
                                </div>
                                <span className="text-sm text-indigo-100">Join 10,000+ teams</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg key={star} className="h-4 w-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                                <span className="text-sm text-indigo-100 ml-1">4.9/5 rating</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Registration Form */}
                <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC]">
                    <div className="w-full max-w-lg">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <div className="h-10 w-10 bg-[#4F46E5] rounded-xl flex items-center justify-center">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-[#0F172A]">CollabTool</span>
                            </div>
                            {invitation ? (
                                <>
                                    <h2 className="text-3xl font-bold tracking-tighter text-[#0F172A] mb-2">Join Your Team</h2>
                                    <p className="text-[#64748B]">
                                        You were invited to join <span className="font-semibold text-[#4F46E5]">{invitation.workspace?.name}</span>.
                                        All invited users register as <span className="font-semibold text-[#4F46E5]">Freelancers</span>.
                                    </p>
                                </>
                            ) : step === 1 ? (
                                <>
                                    <h2 className="text-3xl font-bold tracking-tighter text-[#0F172A] mb-2">How will you use CollabTool?</h2>
                                    <p className="text-[#64748B]">Choose your role to get started</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-3xl font-bold tracking-tighter text-[#0F172A] mb-2">Create Your Account</h2>
                                    <p className="text-[#64748B]">
                                        Signing up as <span className="font-semibold text-[#4F46E5] capitalize">{data.usage_type?.replace('_', ' ')}</span>
                                        <button onClick={() => setStep(1)} className="ml-2 text-sm text-[#94A3B8] hover:text-[#4F46E5] underline">Change</button>
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Step indicators */}
                        {!invitation && (
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <div className={`h-2 w-12 rounded-full transition-all ${step >= 1 ? 'bg-[#4F46E5]' : 'bg-[#E2E8F0]'}`} />
                                <div className={`h-2 w-12 rounded-full transition-all ${step >= 2 ? 'bg-[#4F46E5]' : 'bg-[#E2E8F0]'}`} />
                            </div>
                        )}

                        {flash?.info && (
                            <div className="mb-6 p-4 bg-[rgba(79,70,229,0.05)] border border-[rgba(79,70,229,0.2)] rounded-lg">
                                <p className="text-[#4F46E5] text-sm">{flash.info}</p>
                            </div>
                        )}

                        {errors.usage_type && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{errors.usage_type}</p>
                            </div>
                        )}

                        {/* Step 1: Choose usage type */}
                        {!invitation && step === 1 && (
                            <div className="space-y-4">
                                {usageTypes.map((type) => {
                                    const Icon = type.icon;
                                    const isSelected = data.usage_type === type.value;
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => {
                                                setData('usage_type', type.value);
                                                setStep(2);
                                            }}
                                            className={`w-full p-5 rounded-[10px] border-2 text-left transition-all duration-200 hover:shadow-md ${isSelected
                                                ? `${type.borderClass} ${type.bgColor}`
                                                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center`} style={{ backgroundColor: type.accentColor }}>
                                                    <Icon className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-[#0F172A] text-lg">{type.label}</h3>
                                                    <p className="text-sm text-[#64748B] mt-0.5">{type.description}</p>
                                                </div>
                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? type.borderClass + ' bg-white' : 'border-[#CBD5E1]'}`}>
                                                    {isSelected && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: type.accentColor }} />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-[#64748B]">
                                        Already have an account?{' '}
                                        <Link href={route('login')} className="text-[#4F46E5] hover:text-[#4338CA] font-medium">
                                            Sign in here
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Registration form */}
                        {(step === 2 || invitation) && (
                            <>
                                <Card className="bg-white border border-[#E2E8F0]">
                                    <CardContent className="p-8">
                                        <form onSubmit={submit} className="space-y-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="first_name" className="text-sm font-medium text-[#0F172A]">First Name</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                                                        <Input id="first_name" type="text" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} placeholder="John" className="pl-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-lg focus:border-[#4F46E5] focus:ring-2 focus:ring-[rgba(79,70,229,0.15)] placeholder-[#94A3B8]" />
                                                    </div>
                                                    {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="last_name" className="text-sm font-medium text-[#0F172A]">Last Name</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                                                        <Input id="last_name" type="text" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} placeholder="Doe" className="pl-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-lg focus:border-[#4F46E5] focus:ring-2 focus:ring-[rgba(79,70,229,0.15)] placeholder-[#94A3B8]" />
                                                    </div>
                                                    {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name}</p>}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-sm font-medium text-[#0F172A]">Email</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="john@company.com" disabled={!!invitation} className="pl-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-lg focus:border-[#4F46E5] focus:ring-2 focus:ring-[rgba(79,70,229,0.15)] disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] placeholder-[#94A3B8]" />
                                                </div>
                                                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password" className="text-sm font-medium text-[#0F172A]">Password</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={data.password}
                                                        onChange={(e) => setData('password', e.target.value)}
                                                        placeholder="••••••••"
                                                        className="pl-10 pr-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-lg focus:border-[#4F46E5] focus:ring-2 focus:ring-[rgba(79,70,229,0.15)] placeholder-[#94A3B8]"
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>

                                                {/* Password Strength Indicator */}
                                                {data.password && (
                                                    <div className="mt-2">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs text-[#94A3B8]">Password Strength</span>
                                                            <span className={`text-xs font-medium ${passwordStrength <= 40 ? 'text-red-500' :
                                                                passwordStrength <= 60 ? 'text-amber-500' :
                                                                    passwordStrength <= 80 ? 'text-[#4F46E5]' :
                                                                        'text-emerald-600'
                                                                }`}>
                                                                {passwordStrength <= 40 ? 'Weak' :
                                                                    passwordStrength <= 60 ? 'Fair' :
                                                                        passwordStrength <= 80 ? 'Good' :
                                                                            'Strong'}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength <= 40 ? 'bg-red-500' :
                                                                    passwordStrength <= 60 ? 'bg-amber-500' :
                                                                        passwordStrength <= 80 ? 'bg-[#4F46E5]' :
                                                                            'bg-emerald-500'
                                                                    }`}
                                                                style={{ width: `${passwordStrength}%` }}
                                                            />
                                                        </div>
                                                        {passwordFeedback.length > 0 && (
                                                            <div className="mt-2 text-xs text-[#94A3B8]">
                                                                <p className="font-medium mb-1">Password must contain:</p>
                                                                <ul className="space-y-1">
                                                                    {passwordFeedback.map((item, index) => (
                                                                        <li key={index} className="flex items-center gap-1">
                                                                            <div className="w-1 h-1 bg-[#94A3B8] rounded-full" />
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password_confirmation" className="text-sm font-medium text-[#0F172A]">Confirm Password</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                                                    <Input id="password_confirmation" type={showConfirmPassword ? 'text' : 'password'} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} placeholder="••••••••" className="pl-10 pr-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-lg focus:border-[#4F46E5] focus:ring-2 focus:ring-[rgba(79,70,229,0.15)] placeholder-[#94A3B8]" />
                                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                                {errors.password_confirmation && <p className="text-red-500 text-xs">{errors.password_confirmation}</p>}
                                            </div>

                                            <Button type="submit" className="w-full h-12 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-lg transition-colors" disabled={processing}>
                                                {processing ? 'Creating account...' : 'Create Your Free Account'}
                                            </Button>
                                        </form>

                                        <div className="mt-6 text-center">
                                            <p className="text-sm text-[#64748B]">
                                                Already have an account?{' '}
                                                <Link href={route('login')} className="text-[#4F46E5] hover:text-[#4338CA] font-medium">Sign in here</Link>
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center gap-4 text-xs text-[#94A3B8]">
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600">✓ SSL Secured</Badge>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-600">✓ GDPR Compliant</Badge>
                                <Badge variant="secondary" className="bg-[rgba(79,70,229,0.08)] text-[#4F46E5]">✓ Free to Start</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
