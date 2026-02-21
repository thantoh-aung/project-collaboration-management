import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Users,
  Mail,
  Settings,
  Save,
  UserPlus,
  Trash2,
  Crown,
  Shield,
  Eye
} from 'lucide-react';
import { useWorkspace } from '@/Context/WorkspaceContext';

export default function WorkspaceSettings() {
  const { props } = usePage();
  const { workspace, members, pendingInvitations } = props;
  const { currentWorkspace, hasPermission } = useWorkspace();
  const canManageSettings = hasPermission('manage_settings');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: workspace.name,
    description: workspace.description || '',
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canManageSettings) return;
    setLoading(true);
    setMessage('');

    router.patch(
      route('workspaces.settings.update', workspace.id),
      formData,
      {
        onSuccess: () => { setMessage('Workspace settings updated successfully!'); setMessageType('success'); },
        onError: () => { setMessage('Failed to update workspace settings.'); setMessageType('error'); },
        onFinish: () => setLoading(false),
      }
    );
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-amber-600" />;
      case 'member': return <Shield className="h-4 w-4 text-[#4F46E5]" />;
      case 'client': return <Eye className="h-4 w-4 text-[#64748B]" />;
      default: return <Users className="h-4 w-4 text-[#64748B]" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-amber-50 text-amber-700';
      case 'member': return 'bg-[rgba(79,70,229,0.08)] text-[#4F46E5]';
      case 'client': return 'bg-[#F1F5F9] text-[#64748B]';
      default: return 'bg-[#F1F5F9] text-[#64748B]';
    }
  };

  return (
    <>
      <Head title="Workspace Settings - CollabTool" />

      <MainLayout title="Workspace Settings">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-[#4F46E5]" />
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Workspace Settings</h1>
              <p className="text-[#64748B]">Manage your workspace configuration</p>
            </div>
          </div>

          {message && (
            <Alert className={messageType === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={messageType === 'success' ? 'text-emerald-700' : 'text-red-600'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Workspace Details */}
          <Card className="bg-white border border-[#E2E8F0]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                <Settings className="h-5 w-5 text-[#4F46E5]" />
                Workspace Details
              </CardTitle>
              <CardDescription className="text-[#64748B]">
                Update your workspace information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!canManageSettings && (
                <Alert className="mb-4 border-amber-200 bg-amber-50">
                  <AlertDescription className="text-amber-700">
                    You don't have permission to update workspace settings.
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#0F172A] mb-1">
                    Workspace Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!canManageSettings}
                    required
                    className="bg-white border-[#E2E8F0] text-[#0F172A]"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[#0F172A] mb-1">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Describe your workspace..."
                    disabled={!canManageSettings}
                    className="bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]"
                  />
                </div>

                <Button type="submit" disabled={loading || !canManageSettings} className="mt-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                  {loading ? 'Saving...' : (
                    <><Save className="h-4 w-4 mr-2" />Save Changes</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>


          {/* Members */}
          <Card className="bg-white border border-[#E2E8F0]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                <Users className="h-5 w-5 text-[#4F46E5]" />
                Team Members
              </CardTitle>
              <CardDescription className="text-[#64748B]">
                Manage workspace members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-[rgba(79,70,229,0.08)] rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-[#4F46E5]">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[#0F172A]">{member.name}</p>
                        <p className="text-sm text-[#64748B]">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.pivot?.role)}
                      <Badge className={getRoleBadgeColor(member.pivot?.role)}>
                        {member.pivot?.role || 'member'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {pendingInvitations && pendingInvitations.length > 0 && (
            <Card className="bg-white border border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                  <Mail className="h-5 w-5 text-amber-500" />
                  Pending Invitations
                </CardTitle>
                <CardDescription className="text-[#64748B]">
                  Users who have been invited but haven't accepted yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium text-[#0F172A]">{invitation.email}</p>
                          <p className="text-sm text-[#64748B]">
                            Invited {new Date(invitation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(invitation.role)}
                        <Badge className={getRoleBadgeColor(invitation.role)}>
                          {invitation.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </>
  );
}
