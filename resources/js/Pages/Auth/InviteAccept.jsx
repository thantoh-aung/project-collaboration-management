import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Building,
  Calendar,
  User
} from 'lucide-react';

export default function InviteAccept({ auth, invitation, error }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(error || '');
  const [messageType, setMessageType] = useState(error ? 'error' : '');

  const handleAccept = async () => {
    if (!auth?.user) {
      console.log('🔍 Storing invitation token:', invitation.token);
      
      // Store invitation token in session via API call first
      try {
        const response = await axios.post('/store-invite-token', { token: invitation.token });
        console.log('🔍 Token stored successfully:', response.data);
        
        // Wait a moment to ensure session is saved
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to login page (not register)
        console.log('🔍 Redirecting to login...');
        router.visit(route('login'), {
          method: 'get',
          data: { invite: invitation.token } // Add token as fallback
        });
      } catch (error) {
        console.error('Failed to store invitation token:', error);
        setMessage('Failed to process invitation. Please try again.');
        setMessageType('error');
      }
      return;
    }

    setLoading(true);
    setMessage('');

    router.post(
      route('invites.accept', invitation.token),
      {},
      {
        onSuccess: () => {
          // Invitation accepted - will auto-redirect to workspace dashboard
        },
        onError: (errors) => {
          setMessage(errors.error || 'Failed to accept invitation.');
          setMessageType('error');
          setLoading(false);
        },
      }
    );
  };

  if (error || !invitation) {
    return (
      <>
        <Head title="Invalid Invitation" />
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-white">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center mb-8">
              <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Invalid Invitation</h2>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
            </div>
            <Card className="shadow-lg border-gray-200">
              <CardContent className="pt-6">
                <Button variant="secondary" className="w-full" asChild>
                  <Link href={route('login')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title={`Invitation to ${invitation.workspace.name}`} />

      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              You're Invited!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join <span className="font-semibold">{invitation.workspace.name}</span> on CollabTool
            </p>
          </div>

          <Card className="shadow-lg border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {invitation.workspace.name}
              </CardTitle>
              <CardDescription>
                {invitation.workspace.description || 'No description provided.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Invited by:</span>
                  <span className="font-medium">{invitation.inviter.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{invitation.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{invitation.role}</Badge>
                  <span className="text-muted-foreground">role</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="font-medium">{new Date(invitation.expires_at).toLocaleDateString()}</span>
                </div>
              </div>

              <hr />

              {!auth?.user ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You need to create an account to join this workspace
                  </p>
                  <Button className="w-full" onClick={handleAccept}>
                    Create Account to Join
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Already have an account? You'll be able to sign in instead.
                  </p>
                </div>
              ) : auth.user.email === invitation.email ? (
                <div className="text-center space-y-3">
                  <Button
                    className="w-full"
                    onClick={handleAccept}
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? 'Joining Workspace...' : 'Join Workspace'}
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-sm text-red-600">
                    This invitation is for <strong>{invitation.email}</strong>, but you're logged in as <strong>{auth.user.email}</strong>.
                  </p>
                  <Button variant="secondary" className="w-full" asChild>
                    <Link href={route('logout')}>
                      Log Out & Sign In Again
                    </Link>
                  </Button>
                </div>
              )}

              {message && (
                <Alert className={messageType === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <div className="flex items-center">
                    {messageType === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className="ml-2">{message}</AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href={route('login')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
