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
            <div className="min-h-screen bg-slate-900 text-white flex">
                {/* Left Side - Hero Section */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-emerald-600 text-white p-12 flex-col justify-center relative overflow-hidden">
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
                        
                        <h2 className="text-4xl font-bold mb-4">
                            Manage Projects Like Never Before
                        </h2>
                        <p className="text-purple-100 mb-8 text-lg">
                            Collaborate with your team, track time, manage tasks, and deliver projects on time.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Project Management</h3>
                                    <p className="text-purple-100 text-sm">Organize and track all your projects in one place</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Time Tracking</h3>
                                    <p className="text-purple-100 text-sm">Monitor time spent on tasks and generate reports</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Team Collaboration</h3>
                                    <p className="text-purple-100 text-sm">Work together seamlessly with your team members</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <div className="h-10 w-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">CollabTool</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tighter text-white mb-2">Welcome Back</h2>
                            <p className="text-gray-400">Sign in to your account to continue</p>
                        </div>

                        {status && (
                            <div className="mb-6 p-4 bg-emerald-600/20 border border-emerald-500/30 rounded-lg">
                                <p className="text-emerald-400 text-sm">{status}</p>
                            </div>
                        )}
                        
                        {error && (
                            <div className="mb-6 p-4 bg-red-600/20 border border-red-500/30 rounded-lg">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {flash?.info && (
                            <div className="mb-6 p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                                <p className="text-purple-400 text-sm">{flash.info}</p>
                            </div>
                        )}

                        {/* Invitation message */}
                        {invitation && (
                            <div className="mb-6 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-blue-300 text-sm font-medium mb-1">
                                            You've been invited to join {invitation.workspace?.name}
                                        </p>
                                        <p className="text-blue-400 text-xs">
                                            Sign in with your existing account, or create a new account below to join the workspace.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Card className="bg-slate-800 border-slate-700 shadow-xl shadow-blue-500/10">
                            <CardContent className="p-6">
                                <form onSubmit={submit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                                            Email address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="Enter your email"
                                                disabled={!!invitation}
                                                className="pl-10 h-11 bg-slate-700 border-slate-600 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:bg-slate-800 disabled:text-gray-500 placeholder-gray-400"
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-sm text-red-400 mt-1">{errors.email}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="Enter your password"
                                                className="pl-10 pr-10 h-11 bg-slate-700 border-slate-600 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-sm text-red-400 mt-1">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                            />
                                            <span className="text-sm text-gray-400">Remember me</span>
                                        </label>
                                        
                                        <Link href={route('password.request')} className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
                                        disabled={processing}
                                    >
                                        {processing ? 'Signing in...' : 'Sign in'}
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-400">
                                        Don't have an account?{' '}
                                        <Link href={route('register')} className="font-medium text-blue-400 hover:text-blue-300">
                                            Sign up
                                        </Link>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="mt-8 text-center">
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                                <Link href="#" className="hover:text-gray-300">Privacy Policy</Link>
                                <span>•</span>
                                <Link href="#" className="hover:text-gray-300">Terms of Service</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
