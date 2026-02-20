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
    if (!canManageSettings) {
      return;
    }
    setLoading(true);
    setMessage('');

    router.patch(
      route('workspaces.settings.update', workspace.id),
      formData,
      {
        onSuccess: () => {
          setMessage('Workspace settings updated successfully!');
          setMessageType('success');
        },
        onError: (errors) => {
          setMessage('Failed to update workspace settings.');
          setMessageType('error');
        },
        onFinish: () => setLoading(false),
      }
    );
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-400" />;
      case 'member':
        return <Shield className="h-4 w-4 text-blue-400" />;
      case 'client':
        return <Eye className="h-4 w-4 text-gray-400" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30';
      case 'member':
        return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
      case 'client':
        return 'bg-gray-600/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-600/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <>
      <Head title="Workspace Settings - CollabTool" />
      
      <MainLayout title="Workspace Settings">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">Workspace Settings</h1>
              <p className="text-gray-400">Manage your workspace configuration</p>
            </div>
          </div>

          {message && (
            <Alert className={messageType === 'success' ? 'border-emerald-700 bg-emerald-900/30' : 'border-red-700 bg-red-900/30'}>
              <AlertDescription className={messageType === 'success' ? 'text-emerald-300' : 'text-red-300'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Workspace Details */}
          <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Workspace Details
              </CardTitle>
              <CardDescription>
                Update your workspace information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!canManageSettings && (
                <Alert className="mb-4 border-amber-700 bg-amber-900/30">
                  <AlertDescription className="text-amber-300">
                    You don't have permission to update workspace settings.
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Workspace Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!canManageSettings}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Describe your workspace..."
                    disabled={!canManageSettings}
                  />
                </div>

                <Button type="submit" disabled={loading || !canManageSettings} className="mt-4">
                  {loading ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          
          {/* Members */}
          <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage workspace members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-300">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{member.name}</p>
                        <p className="text-sm text-gray-400">{member.email}</p>
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
            <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Pending Invitations
                </CardTitle>
                <CardDescription>
                  Users who have been invited but haven't accepted yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 bg-amber-900/30 rounded-lg border border-amber-700">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="font-medium text-white">{invitation.email}</p>
                          <p className="text-sm text-gray-400">
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
