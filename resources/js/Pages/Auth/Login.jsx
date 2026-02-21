import { Head, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Mail, Users, Briefcase, BarChart3, User, Building } from 'lucide-react';
import { useState } from 'react';

export default function Login({ status, error, flash, invitation }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: invitation?.email || '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <>
            <Head title="Sign In - CollabTool" />
            <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
                {/* Left Side - Hero Section */}
                <div className="hidden lg:flex lg:w-1/2 bg-[#4F46E5] text-white p-12 flex-col justify-center relative overflow-hidden">
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

                        <h2 className="text-4xl font-bold mb-4">
                            Manage Projects Like Never Before
                        </h2>
                        <p className="text-indigo-100 mb-8 text-lg">
                            Collaborate with your team, track time, manage tasks, and deliver projects on time.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Project Management</h3>
                                    <p className="text-indigo-100 text-sm">Organize and track all your projects in one place</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Time Tracking</h3>
                                    <p className="text-indigo-100 text-sm">Monitor time spent on tasks and generate reports</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Team Collaboration</h3>
                                    <p className="text-indigo-100 text-sm">Work together seamlessly with your team members</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC]">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <div className="h-10 w-10 bg-[#4F46E5] rounded-xl flex items-center justify-center">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-[#0F172A]">CollabTool</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tighter text-[#0F172A] mb-2">Welcome Back</h2>
                            <p className="text-[#64748B]">Sign in to your account to continue</p>
                        </div>

                        {status && (
                            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <p className="text-emerald-700 text-sm">{status}</p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {flash?.info && (
                            <div className="mb-6 p-4 bg-[rgba(79,70,229,0.05)] border border-[rgba(79,70,229,0.2)] rounded-lg">
                                <p className="text-[#4F46E5] text-sm">{flash.info}</p>
                            </div>
                        )}

                        {/* Invitation message */}
                        {invitation && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-blue-700 text-sm font-medium mb-1">
                                            You've been invited to join {invitation.workspace?.name}
                                        </p>
                                        <p className="text-blue-600 text-xs">
                                            Sign in with your existing account, or create a new account below to join the workspace.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Card className="bg-white border border-[#E2E8F0]">
                            <CardContent className="p-6">
                                <form onSubmit={submit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium text-[#0F172A]">
                                            Email address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="Enter your email"
                                                disabled={!!invitation}
                                                className="pl-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-lg focus:border-[#4F46E5] focus:ring-2 focus:ring-[rgba(79,70,229,0.15)] transition-all disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] placeholder-[#94A3B8]"
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-medium text-[#0F172A]">
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="Enter your password"
                                                className="pl-10 pr-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-lg focus:border-[#4F46E5] focus:ring-2 focus:ring-[rgba(79,70,229,0.15)] transition-all placeholder-[#94A3B8]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="rounded border-[#E2E8F0] bg-white text-[#4F46E5] focus:ring-[#4F46E5] focus:ring-2"
                                            />
                                            <span className="text-sm text-[#64748B]">Remember me</span>
                                        </label>

                                        <Link href={route('password.request')} className="text-sm text-[#4F46E5] hover:text-[#4338CA] font-medium">
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-11 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold transition-colors"
                                        disabled={processing}
                                    >
                                        {processing ? 'Signing in...' : 'Sign in'}
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-[#64748B]">
                                        Don't have an account?{' '}
                                        <Link href={route('register')} className="font-medium text-[#4F46E5] hover:text-[#4338CA]">
                                            Sign up
                                        </Link>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="mt-8 text-center">
                            <div className="flex items-center justify-center gap-4 text-xs text-[#94A3B8]">
                                <Link href="#" className="hover:text-[#64748B]">Privacy Policy</Link>
                                <span>•</span>
                                <Link href="#" className="hover:text-[#64748B]">Terms of Service</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
