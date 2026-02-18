import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Mail, ArrowLeft } from 'lucide-react';

export default function PendingInvitation() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <Head title="Pending Invitation" />

            <div className="w-full max-w-md">
                <Card className="bg-white/90 backdrop-blur-xl border-gray-200/80 shadow-xl shadow-indigo-500/10">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                            <Clock className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Pending Invitation
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Your account is ready but you need an invitation to access a workspace
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-medium text-indigo-900">What happens next?</h4>
                                    <p className="text-sm text-indigo-700 mt-1">
                                        An administrator will send you an invitation email to join a workspace. 
                                        Once you accept the invitation, you'll have full access to the platform.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">While you wait, you can:</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                                    Check your email for the invitation
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                                    Contact your workspace administrator
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                                    Log out and log back in to check status
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/logout">
                                    Log Out
                                </Link>
                            </Button>
                            
                            <Button variant="ghost" asChild className="w-full">
                                <Link href="/login">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Login
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
