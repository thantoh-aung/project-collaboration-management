import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function NewPassword({ token, email }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordFeedback, setPasswordFeedback] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    // Password strength checker
    const checkPasswordStrength = (password) => {
        let strength = 0;
        const feedback = [];
        
        if (password.length >= 8) {
            strength += 25;
        } else {
            feedback.push('At least 8 characters');
        }
        
        if (/[a-z]/.test(password)) {
            strength += 25;
        } else {
            feedback.push('One lowercase letter');
        }
        
        if (/[A-Z]/.test(password)) {
            strength += 25;
        } else {
            feedback.push('One uppercase letter');
        }
        
        if (/\d/.test(password)) {
            strength += 25;
        } else {
            feedback.push('One number');
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

    // Refresh CSRF token on component mount
    useEffect(() => {
        const refreshCSRFToken = async () => {
            if (typeof window !== 'undefined' && window.axios) {
                try {
                    await window.axios.get('/sanctum/csrf-cookie');
                    console.log('CSRF token refreshed for password reset');
                } catch (error) {
                    console.warn('CSRF token refresh failed:', error);
                }
            }
        };
        
        refreshCSRFToken();
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        console.log('=== Password Reset Submission Started ===');
        console.log('Form data:', {
            email: data.email,
            token: data.token ? 'present' : 'missing',
            password: data.password ? 'present' : 'missing',
            password_confirmation: data.password_confirmation ? 'present' : 'missing'
        });
        
        try {
            // Refresh CSRF token before submission
            if (typeof window !== 'undefined' && window.axios) {
                console.log('Refreshing CSRF token...');
                await window.axios.get('/sanctum/csrf-cookie');
                console.log('CSRF token refreshed successfully');
            }
            
            // Submit the form
            console.log('Submitting form to:', route('password.update', { token: data.token }));
            post(route('password.update', { token: data.token }), {
                onSuccess: (page) => {
                    console.log('Password reset successful!', page);
                    console.log('=== Password Reset Completed Successfully ===');
                },
                onError: (errors) => {
                    console.error('=== Password Reset Errors ===');
                    console.error('Full error object:', errors);
                    console.error('Error keys:', Object.keys(errors));
                    
                    // Log specific errors
                    Object.keys(errors).forEach(key => {
                        console.error(`${key}: ${errors[key]}`);
                    });
                    
                    // Handle CSRF or session errors
                    if (errors?.message?.includes('419') || errors?.message?.includes('CSRF') || errors?.message?.includes('session has expired')) {
                        alert('Session expired. Please refresh the page and try again.');
                    } else if (errors?.email) {
                        alert('Email error: ' + errors.email);
                    } else if (errors?.password) {
                        alert('Password error: ' + errors.password);
                    } else if (errors?.token) {
                        alert('Token error: ' + errors.token);
                    } else {
                        alert('Reset failed: ' + JSON.stringify(errors));
                    }
                },
                onProgress: (progress) => {
                    console.log('Upload progress:', progress);
                },
                onFinish: () => {
                    console.log('Request finished');
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('=== Submission Error ===');
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            setIsSubmitting(false);
            
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                alert(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
            } else if (error.request) {
                console.error('No response received:', error.request);
                alert('Network error: No response from server. Please check your connection.');
            } else {
                alert('An error occurred: ' + error.message);
            }
        }
    };

    return (
        <>
            <Head title="Reset Password" />
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
                <Card className="w-full max-w-md bg-white/90 backdrop-blur-xl border-gray-200/80 shadow-xl shadow-indigo-500/10">
                    <CardHeader className="text-center">
                        <CardTitle>Reset Password</CardTitle>
                        <CardDescription>
                            Enter your new password below
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Enter your email"
                                    readOnly
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter your new password"
                                        className="pr-10"
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
                                    <p className="text-sm text-destructive">{errors.password}</p>
                                )}
                                
                                {/* Password Strength Indicator */}
                                {data.password && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-600">Password Strength</span>
                                            <span className={`text-xs font-medium ${
                                                passwordStrength <= 25 ? 'text-red-600' :
                                                passwordStrength <= 50 ? 'text-yellow-600' :
                                                passwordStrength <= 75 ? 'text-blue-600' :
                                                'text-green-600'
                                            }`}>
                                                {passwordStrength <= 25 ? 'Weak' :
                                                 passwordStrength <= 50 ? 'Fair' :
                                                 passwordStrength <= 75 ? 'Good' :
                                                 'Strong'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                    passwordStrength <= 25 ? 'bg-red-500' :
                                                    passwordStrength <= 50 ? 'bg-yellow-500' :
                                                    passwordStrength <= 75 ? 'bg-blue-500' :
                                                    'bg-green-500'
                                                }`}
                                                style={{ width: `${passwordStrength}%` }}
                                            />
                                        </div>
                                        {passwordFeedback.length > 0 && (
                                            <div className="mt-2 text-xs text-gray-600">
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
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Confirm your new password"
                                        className="pr-10"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="text-sm text-destructive">{errors.password_confirmation}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl border-0 transition-all duration-300" disabled={processing || isSubmitting}>
                                {processing || isSubmitting ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
