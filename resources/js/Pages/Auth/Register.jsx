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
        color: 'from-blue-500 to-blue-600',
        shadow: 'shadow-blue-500/30',
        border: 'border-blue-500/30',
        bg: 'bg-blue-600/20',
    },
    {
        value: 'freelancer',
        label: 'Freelancer',
        description: 'I want to offer my services and find clients',
        icon: Code,
        color: 'from-purple-500 to-purple-600',
        shadow: 'shadow-purple-500/30',
        border: 'border-purple-500/30',
        bg: 'bg-purple-600/20',
    },
];

export default function Register({ invitation, flash }) {
    console.log('🔍 Register Component - Invitation:', invitation);
    console.log('🔍 Register Component - Flash:', flash);
    
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
        usage_type: invitation ? 'team_member' : '', // Skip selection for invitations
    });

    // Password strength checker
    const checkPasswordStrength = (password) => {
        let strength = 0;
        const feedback = [];
        
        if (password.length >= 8) {
            strength += 20;
        } else {
            feedback.push('At least 8 characters');
        }
        
        if (/[a-z]/.test(password)) {
            strength += 20;
        } else {
            feedback.push('One lowercase letter');
        }
        
        if (/[A-Z]/.test(password)) {
            strength += 20;
        } else {
            feedback.push('One uppercase letter');
        }
        
        if (/\d/.test(password)) {
            strength += 20;
        } else {
            feedback.push('One number');
        }
        
        if (/[@$!%*?&]/.test(password)) {
            strength += 20;
        } else {
            feedback.push('One special character (@$!%*?&)');
        }
        
        setPasswordStrength(strength);
        setPasswordFeedback(feedback);
    };

    // Update password strength when password changes
    useEffect(() => {
        if (data.password) {
            checkPasswordStrength(data.password);
        } else {
            setPasswordStrength(0);
            setPasswordFeedback([]);
        }
    }, [data.password]);

    // Refresh CSRF token every 2 minutes to prevent 419 errors
    useEffect(() => {
        // Refresh immediately on mount
        window.axios.get('/sanctum/csrf-cookie').then(() => {
            // CSRF token refreshed
        });
        
        // Then refresh every 2 minutes
        const interval = setInterval(() => {
            window.axios.get('/sanctum/csrf-cookie').then(() => {
                // CSRF token refreshed
            });
        }, 2 * 60 * 1000); // 2 minutes

        return () => clearInterval(interval);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <>
            <Head title="Sign Up - CollabTool" />
            <div className="min-h-screen bg-slate-900 text-white flex">
                {/* Left Side - Branding Area */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-emerald-600 rounded-2xl m-4 text-white p-12 flex-col justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-20 -left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    </div>
                    <div className="max-w-md mx-auto relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                                <Users className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold">CollabTool</h1>
                        </div>
                        
                        <blockquote className="text-2xl font-light mb-6 italic">
                            "Simplified Collaboration for Modern Teams"
                        </blockquote>
                        <p className="text-slate-300 mb-8 text-lg">
                            Experience the future of project management with our intuitive platform designed for seamless teamwork and exceptional results.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                <span className="text-slate-200">Unlimited projects and tasks</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                <span className="text-slate-200">Real-time collaboration</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                <span className="text-slate-200">Advanced time tracking</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                <span className="text-slate-200">Detailed reporting & analytics</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                <span className="text-slate-200">No credit card required</span>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex -space-x-2">
                                    <div className="h-8 w-8 rounded-full bg-purple-400 border-2 border-white/20"></div>
                                    <div className="h-8 w-8 rounded-full bg-purple-400 border-2 border-white/20"></div>
                                    <div className="h-8 w-8 rounded-full bg-pink-400 border-2 border-white/20"></div>
                                </div>
                                <span className="text-sm text-slate-200">Join 10,000+ teams</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map((star) => (
                                    <svg key={star} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                                <span className="text-sm text-slate-200 ml-1">4.9/5 rating</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Registration Form */}
                <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
                    <div className="w-full max-w-lg">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <div className="h-10 w-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">CollabTool</span>
                            </div>
                            {invitation ? (
                                <>
                                    <h2 className="text-3xl font-bold tracking-tighter text-white mb-2">Join Your Team</h2>
                                    <p className="text-gray-400">
                                        You were invited to join <span className="font-semibold text-blue-400">{invitation.workspace?.name}</span> as a <span className="font-semibold text-blue-400">{invitation.role}</span>
                                    </p>
                                </>
                            ) : step === 1 ? (
                                <>
                                    <h2 className="text-3xl font-bold tracking-tighter text-white mb-2">How will you use CollabTool?</h2>
                                    <p className="text-gray-400">Choose your role to get started</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-3xl font-bold tracking-tighter text-white mb-2">Create Your Account</h2>
                                    <p className="text-gray-400">
                                        Signing up as <span className="font-semibold text-blue-400 capitalize">{data.usage_type?.replace('_', ' ')}</span>
                                        <button onClick={() => setStep(1)} className="ml-2 text-sm text-gray-400 hover:text-blue-400 underline">Change</button>
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Step indicators */}
                        {!invitation && (
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <div className={`h-2 w-12 rounded-full transition-all ${step >= 1 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-600'}`} />
                                <div className={`h-2 w-12 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-600'}`} />
                            </div>
                        )}

                        {flash?.info && (
                            <div className="mb-6 p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                                <p className="text-purple-400 text-sm">{flash.info}</p>
                            </div>
                        )}

                        {errors.usage_type && (
                            <div className="mb-4 p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
                                <p className="text-red-400 text-sm">{errors.usage_type}</p>
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
                                            className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg ${
                                                isSelected
                                                    ? `${type.border} ${type.bg} shadow-lg ${type.shadow}`
                                                    : 'border-slate-600 bg-slate-800 hover:border-slate-500 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-r ${type.color} flex items-center justify-center shadow-lg ${type.shadow}`}>
                                                    <Icon className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white text-lg">{type.label}</h3>
                                                    <p className="text-sm text-gray-400 mt-0.5">{type.description}</p>
                                                </div>
                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? type.border + ' bg-white' : 'border-slate-600'}`}>
                                                    {isSelected && <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${type.color}`} />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-400">
                                        Already have an account?{' '}
                                        <Link href={route('login')} className="text-blue-400 hover:text-blue-300 font-medium">
                                            Sign in here
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Registration form */}
                        {(step === 2 || invitation) && (
                            <>
                                <Card className="bg-slate-800 border-slate-700 shadow-xl shadow-blue-500/10">
                                    <CardContent className="p-8">
                                        <form onSubmit={submit} className="space-y-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="first_name" className="text-sm font-medium text-gray-300">First Name</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input id="first_name" type="text" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} placeholder="John" className="pl-10 h-11 bg-slate-700 border-slate-600 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-400" />
                                                    </div>
                                                    {errors.first_name && <p className="text-red-400 text-xs">{errors.first_name}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="last_name" className="text-sm font-medium text-gray-300">Last Name</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input id="last_name" type="text" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} placeholder="Doe" className="pl-10 h-11 bg-slate-700 border-slate-600 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-400" />
                                                    </div>
                                                    {errors.last_name && <p className="text-red-400 text-xs">{errors.last_name}</p>}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-sm font-medium text-gray-300">Email</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="john@company.com" disabled={!!invitation} className="pl-10 h-11 bg-slate-700 border-slate-600 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-800 disabled:text-gray-500 placeholder-gray-400" />
                                                </div>
                                                {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                                            </div>


                                            <div className="space-y-2">
                                                <Label htmlFor="password" className="text-sm font-medium text-gray-300">Password</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input 
                                                        id="password" 
                                                        type={showPassword ? 'text' : 'password'} 
                                                        value={data.password} 
                                                        onChange={(e) => setData('password', e.target.value)} 
                                                        placeholder="••••••••" 
                                                        className="pl-10 pr-10 h-11 bg-slate-700 border-slate-600 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-400" 
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowPassword(!showPassword)} 
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                                
                                                {/* Password Strength Indicator */}
                                                {data.password && (
                                                    <div className="mt-2">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs text-gray-400">Password Strength</span>
                                                            <span className={`text-xs font-medium ${
                                                                passwordStrength <= 40 ? 'text-red-400' :
                                                                passwordStrength <= 60 ? 'text-yellow-400' :
                                                                passwordStrength <= 80 ? 'text-blue-400' :
                                                                'text-emerald-400'
                                                            }`}>
                                                                {passwordStrength <= 40 ? 'Weak' :
                                                                 passwordStrength <= 60 ? 'Fair' :
                                                                 passwordStrength <= 80 ? 'Good' :
                                                                 'Strong'}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-600 rounded-full h-2">
                                                            <div 
                                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                                    passwordStrength <= 40 ? 'bg-red-500' :
                                                                    passwordStrength <= 60 ? 'bg-yellow-500' :
                                                                    passwordStrength <= 80 ? 'bg-blue-500' :
                                                                    'bg-emerald-500'
                                                                }`}
                                                                style={{ width: `${passwordStrength}%` }}
                                                            />
                                                        </div>
                                                        {passwordFeedback.length > 0 && (
                                                            <div className="mt-2 text-xs text-gray-400">
                                                                <p className="font-medium mb-1">Password must contain:</p>
                                                                <ul className="space-y-1">
                                                                    {passwordFeedback.map((item, index) => (
                                                                        <li key={index} className="flex items-center gap-1">
                                                                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-300">Confirm Password</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input id="password_confirmation" type={showConfirmPassword ? 'text' : 'password'} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} placeholder="••••••••" className="pl-10 pr-10 h-11 bg-slate-700 border-slate-600 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-400" />
                                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300">
                                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                                {errors.password_confirmation && <p className="text-red-400 text-xs">{errors.password_confirmation}</p>}
                                            </div>

                                            <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300" disabled={processing}>
                                                {processing ? 'Creating account...' : 'Create Your Free Account'}
                                            </Button>
                                        </form>

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-400">
                                        Already have an account?{' '}
                                        <Link href={route('login')} className="text-blue-400 hover:text-blue-300 font-medium">Sign in here</Link>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                            </>
                        )}

                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center gap-4 text-xs text-gray-500">
                                <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30">✓ SSL Secured</Badge>
                                <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-500/30">✓ GDPR Compliant</Badge>
                                <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 border-purple-500/30">✓ Free to Start</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
