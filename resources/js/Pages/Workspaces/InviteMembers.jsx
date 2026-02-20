import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Mail, 
  UserPlus,
  Plus,
  X,
  Crown,
  Shield,
  Eye,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useWorkspace } from '@/Context/WorkspaceContext';
import MainLayout from '@/Layouts/MainLayout';

export default function InviteMembers() {
  const { props } = usePage();
  const { currentWorkspace } = useWorkspace();
  const { workspaceUsers } = props;
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Team invitations
  const [invitations, setInvitations] = useState([
    { email: '', role: 'member' }
  ]);

  // Enhanced CSRF token handling to prevent 419 errors
  useEffect(() => {
    const refreshCSRF = async () => {
      try {
        await window.axios.get('/sanctum/csrf-cookie');
      } catch (error) {
        console.warn('CSRF refresh failed:', error);
      }
    };

    // Refresh immediately on mount
    refreshCSRF();
    
    // Refresh every 90 seconds
    const interval = setInterval(refreshCSRF, 90 * 1000);

    return () => clearInterval(interval);
  }, []);

  const validateInvitations = () => {
    const newErrors = {};
    
    invitations.forEach((inv, index) => {
      if (inv.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inv.email)) {
          newErrors[`invitations.${index}.email`] = 'Please enter a valid email address';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addInvitation = () => {
    setInvitations([...invitations, { email: '', role: 'member' }]);
  };

  const removeInvitation = (index) => {
    const newInvitations = invitations.filter((_, i) => i !== index);
    setInvitations(newInvitations);
  };

  const updateInvitation = (index, field, value) => {
    const newInvitations = [...invitations];
    newInvitations[index][field] = value;
    setInvitations(newInvitations);
  };

  const removeWorkspaceMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this team member from the workspace?')) {
      return;
    }
    
    try {
      await router.delete(route('workspaces.users.remove', [currentWorkspace.id, userId]), {
        onSuccess: () => {
          // Show success message and reload the page to update member list
          setErrors({ general: 'Team member removed successfully.' });
          setTimeout(() => {
            setErrors({});
            router.reload();
          }, 2000);
        },
        onError: (errors) => {
          console.error('Failed to remove team member:', errors);
          setErrors({ general: 'Failed to remove team member. Please try again.' });
        }
      });
    } catch (error) {
      console.error('Failed to remove team member:', error);
      setErrors({ general: 'Failed to remove team member. Please try again.' });
    }
  };

  const sendInvitations = async () => {
    if (!validateInvitations()) return;
    
    setLoading(true);
    try {
      // Filter out empty invitations
      const validInvitations = invitations.filter(inv => inv.email.trim());
      
      if (validInvitations.length === 0) {
        setErrors({ general: 'Please add at least one email address' });
        return;
      }

      // Use the same approach as the old wizard - use Inertia router.post
      await router.post(`/workspaces/${currentWorkspace.id}/invite`, {
        invitations: validInvitations
      }, {
        onSuccess: () => {
          console.log('Invitations sent successfully');
          // Redirect to workspace settings with success message
          router.visit(route('workspaces.settings', currentWorkspace.id), {
            method: 'get',
            data: { success: 'Invitations sent successfully!' }
          });
        },
        onError: (errors) => {
          console.error('Invitation errors:', errors);
          setErrors(errors);
        }
      });
    } catch (error) {
      console.error('Failed to send invitations:', error);
      setErrors({ general: 'Failed to send invitations. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Head title="Invite Team Members" />
      
      <div className="min-h-screen bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-12 w-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Invite Team Members</h1>
            <p className="text-gray-400">Add team members to help you complete projects. Clients are automatically included when you create workspaces in the marketplace, so no need to invite them here.</p>
          </div>

          {/* Main Content */}
          <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Error/Success Display */}
                {errors.general && (
                  <div className={`p-4 rounded-lg border ${
                    errors.general.includes('successfully') 
                      ? 'bg-emerald-900/30 border-emerald-700' 
                      : 'bg-red-900/30 border-red-700'
                  }`}>
                    <p className={errors.general.includes('successfully') ? 'text-emerald-300' : 'text-red-300'}>
                      {errors.general}
                    </p>
                  </div>
                )}

                {/* Current Workspace Members */}
                {workspaceUsers && workspaceUsers.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-white mb-3">Current Team Members (Admins & Members)</h4>
                    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                      <div className="space-y-2">
                        {workspaceUsers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-600">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                                <span className="text-blue-300 font-medium text-sm">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-white">{member.name}</div>
                                <div className="text-sm text-gray-400">{member.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {member.workspace_role}
                              </Badge>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeWorkspaceMember(member.id)}
                                className="text-red-600 hover:bg-red-50 border-red-200"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Invitations Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    Invite Team Members
                  </h3>
                  
                  <div className="space-y-4">
                    {invitations.map((invitation, index) => (
                      <div key={index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Input
                              type="email"
                              value={invitation.email}
                              onChange={(e) => updateInvitation(index, 'email', e.target.value)}
                              placeholder="colleague@example.com"
                            />
                            {errors[`invitations.${index}.email`] && (
                              <p className="text-red-400 text-xs mt-1">{errors[`invitations.${index}.email`]}</p>
                            )}
                          </div>
                          {invitations.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeInvitation(index)}
                              className="text-red-400 hover:bg-red-900/30"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addInvitation}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Invitation
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-slate-700 bg-slate-700/30 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={sendInvitations}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? (
                      'Sending...'
                    ) : (
                      <>
                        Send Invitations
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
