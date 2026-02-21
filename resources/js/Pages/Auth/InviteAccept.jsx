import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, CheckCircle, AlertCircle, ArrowLeft, Building, Calendar, User } from 'lucide-react';

export default function InviteAccept({ auth, invitation, error }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(error || '');
  const [messageType, setMessageType] = useState(error ? 'error' : '');

  const handleAccept = async () => {
    if (!auth?.user) {
      try {
        await axios.post('/store-invite-token', { token: invitation.token });
        await new Promise(resolve => setTimeout(resolve, 100));
        router.visit(route('login'), { method: 'get', data: { invite: invitation.token } });
      } catch {
        setMessage('Failed to process invitation. Please try again.');
        setMessageType('error');
      }
      return;
    }
    setLoading(true); setMessage('');
    router.post(route('invites.accept', invitation.token), {}, {
      onSuccess: () => { },
      onError: (errors) => { setMessage(errors.error || 'Failed to accept invitation.'); setMessageType('error'); setLoading(false); },
    });
  };

  if (error || !invitation) {
    return (
      <>
        <Head title="Invalid Invitation" />
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F8FAFC]">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center mb-8">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
              <h2 className="mt-6 text-3xl font-extrabold text-[#0F172A]">Invalid Invitation</h2>
              <p className="mt-2 text-sm text-[#94A3B8]">{error}</p>
            </div>
            <Card className="shadow-sm border-[#E2E8F0] bg-white">
              <CardContent className="pt-6">
                <Button variant="secondary" className="w-full" asChild>
                  <Link href={route('login')}><ArrowLeft className="h-4 w-4 mr-2" />Back to Login</Link>
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
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F8FAFC]">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-[#4F46E5] rounded-2xl flex items-center justify-center shadow-sm">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-[#0F172A]">You're Invited!</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">Join <span className="font-semibold text-[#0F172A]">{invitation.workspace.name}</span> on CollabTool</p>
          </div>

          <Card className="shadow-sm border-[#E2E8F0] bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F172A]"><Building className="h-5 w-5 text-[#4F46E5]" />{invitation.workspace.name}</CardTitle>
              <CardDescription className="text-[#94A3B8]">{invitation.workspace.description || 'No description provided.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-[#94A3B8]" /><span className="text-[#94A3B8]">Invited by:</span><span className="font-medium text-[#0F172A]">{invitation.inviter.name}</span></div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#94A3B8]" /><span className="text-[#94A3B8]">Email:</span><span className="font-medium text-[#0F172A]">{invitation.email}</span></div>
                <div className="flex items-center gap-2"><Badge className="bg-indigo-50 text-[#4F46E5] border-indigo-200">{invitation.role}</Badge><span className="text-[#94A3B8]">role</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#94A3B8]" /><span className="text-[#94A3B8]">Expires:</span><span className="font-medium text-[#0F172A]">{new Date(invitation.expires_at).toLocaleDateString()}</span></div>
              </div>

              <hr className="border-[#E2E8F0]" />

              {!auth?.user ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-[#94A3B8]">You need to create an account to join this workspace</p>
                  <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white" onClick={handleAccept}>Create Account to Join</Button>
                  <p className="text-xs text-[#94A3B8]">Already have an account? You'll be able to sign in instead.</p>
                </div>
              ) : auth.user.email === invitation.email ? (
                <div className="text-center space-y-3">
                  <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white" onClick={handleAccept} disabled={loading} size="lg">
                    {loading ? 'Joining Workspace...' : 'Join Workspace'}
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-sm text-red-500">This invitation is for <strong>{invitation.email}</strong>, but you're logged in as <strong>{auth.user.email}</strong>.</p>
                  <Button variant="secondary" className="w-full" asChild><Link href={route('logout')}>Log Out & Sign In Again</Link></Button>
                </div>
              )}

              {message && (
                <Alert className={messageType === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                  <div className="flex items-center">
                    {messageType === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <AlertDescription className="ml-2 text-sm">{message}</AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" asChild className="text-[#94A3B8] hover:text-[#64748B]">
              <Link href={route('login')}><ArrowLeft className="h-4 w-4 mr-2" />Back to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
