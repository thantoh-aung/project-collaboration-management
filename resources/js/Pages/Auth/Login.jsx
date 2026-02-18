import { Head, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Mail, Users, Briefcase, BarChart3, User, Building } from 'lucide-react';
import { useState } from 'react';

export default function Login({ status, error, flash }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showGoogleRoleModal, setShowGoogleRoleModal] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
                {/* Left Side - Hero Section */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white p-12 flex-col justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-20 -left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
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
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">CollabTool</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tighter text-gray-900 mb-2">Welcome Back</h2>
                            <p className="text-gray-600">Sign in to your account to continue</p>
                        </div>

                        {status && (
                            <div className="mb-6 p-4 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-lg">
                                <p className="text-green-800 text-sm">{status}</p>
                            </div>
                        )}
                        
                        {error && (
                            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-lg">
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        {flash?.info && (
                            <div className="mb-6 p-4 bg-purple-50/80 backdrop-blur-sm border border-purple-200/50 rounded-lg">
                                <p className="text-purple-800 text-sm">{flash.info}</p>
                            </div>
                        )}

                        <Card className="bg-white/90 backdrop-blur-xl border-gray-200/80 shadow-xl shadow-indigo-500/10">
                            <CardContent className="p-6">
                                <form onSubmit={submit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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
                                                className="pl-10 h-11 bg-white border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
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
                                                className="pl-10 pr-10 h-11 bg-white border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-600">Remember me</span>
                                        </label>
                                        
                                        <Link href={route('password.request')} className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300"
                                        disabled={processing}
                                    >
                                        {processing ? 'Signing in...' : 'Sign in'}
                                    </Button>
                                </form>

                                <div className="mt-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200/50" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <Button 
                                            variant="outline" 
                                            className="w-full h-10 bg-white border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 rounded-xl transition-all duration-300"
                                            onClick={() => setShowGoogleRoleModal(true)}
                                        >
                                            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                            </svg>
                                            Continue with Google
                                        </Button>
                                    </div>

                                    {/* Google Role Selection Modal */}
                                    {showGoogleRoleModal && (
                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                            <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
                                                <h3 className="text-lg font-semibold mb-4">Choose your account type</h3>
                                                <p className="text-gray-600 mb-6">How will you use CollabTool?</p>
                                                
                                                <div className="space-y-3">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-12 justify-start"
                                                        onClick={() => {
                                                            window.location.href = route('google.login.with.role', 'freelancer');
                                                        }}
                                                    >
                                                        <User className="h-4 w-4 mr-3" />
                                                        I'm a Freelancer
                                                        <span className="ml-auto text-xs text-gray-500">Find work & get hired</span>
                                                    </Button>
                                                    
                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-12 justify-start"
                                                        onClick={() => {
                                                            window.location.href = route('google.login.with.role', 'client');
                                                        }}
                                                    >
                                                        <Building className="h-4 w-4 mr-3" />
                                                        I'm a Client
                                                        <span className="ml-auto text-xs text-gray-500">Hire freelancers</span>
                                                    </Button>
                                                </div>
                                                
                                                <Button
                                                    variant="ghost"
                                                    className="w-full mt-6"
                                                    onClick={() => setShowGoogleRoleModal(false)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                                            </CardContent>
                        </Card>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-500">
                                Don't have an account?{' '}
                                <Link href={route('register')} className="text-indigo-600 hover:text-indigo-500 font-medium">
                                    Register
                                </Link>
                            </p>
                        </div>

                        <div className="mt-8 text-center">
                            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                                <Link href="#" className="hover:text-slate-700">Privacy Policy</Link>
                                <span>•</span>
                                <Link href="#" className="hover:text-slate-700">Terms of Service</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
