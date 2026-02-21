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

  const [invitations, setInvitations] = useState([
    { email: '', role: 'member' }
  ]);

  useEffect(() => {
    const refreshCSRF = async () => {
      try { await window.axios.get('/sanctum/csrf-cookie'); } catch (error) { console.warn('CSRF refresh failed:', error); }
    };
    refreshCSRF();
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

  const addInvitation = () => setInvitations([...invitations, { email: '', role: 'member' }]);
  const removeInvitation = (index) => setInvitations(invitations.filter((_, i) => i !== index));
  const updateInvitation = (index, field, value) => {
    const newInvitations = [...invitations];
    newInvitations[index][field] = value;
    setInvitations(newInvitations);
  };

  const removeWorkspaceMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this team member from the workspace?')) return;
    try {
      await router.delete(route('workspaces.users.remove', [currentWorkspace.id, userId]), {
        onSuccess: () => {
          setErrors({ general: 'Team member removed successfully.' });
          setTimeout(() => { setErrors({}); router.reload(); }, 2000);
        },
        onError: (errors) => { setErrors({ general: 'Failed to remove team member. Please try again.' }); }
      });
    } catch (error) { setErrors({ general: 'Failed to remove team member. Please try again.' }); }
  };

  const sendInvitations = async () => {
    if (!validateInvitations()) return;
    setLoading(true);
    try {
      const validInvitations = invitations.filter(inv => inv.email.trim());
      if (validInvitations.length === 0) { setErrors({ general: 'Please add at least one email address' }); return; }

      await router.post(`/workspaces/${currentWorkspace.id}/invite`, {
        invitations: validInvitations
      }, {
        onSuccess: () => {
          router.visit(route('workspaces.settings', currentWorkspace.id), {
            method: 'get', data: { success: 'Invitations sent successfully!' }
          });
        },
        onError: (errors) => { setErrors(errors); }
      });
    } catch (error) { setErrors({ general: 'Failed to send invitations. Please try again.' }); }
    finally { setLoading(false); }
  };

  return (
    <MainLayout>
      <Head title="Invite Team Members" />

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-12 w-12 bg-[#4F46E5] rounded-xl flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Invite Team Members</h1>
            <p className="text-[#64748B]">Add team members to help you complete projects. Clients are automatically included when you create workspaces in the marketplace, so no need to invite them here.</p>
          </div>

          {/* Main Content */}
          <Card className="bg-white border border-[#E2E8F0]">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Error/Success Display */}
                {errors.general && (
                  <div className={`p-4 rounded-lg border ${errors.general.includes('successfully')
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                    }`}>
                    <p className={errors.general.includes('successfully') ? 'text-emerald-700' : 'text-red-600'}>
                      {errors.general}
                    </p>
                  </div>
                )}

                {/* Current Workspace Members */}
                {workspaceUsers && workspaceUsers.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-[#0F172A] mb-3">Current Team Members (Admins & Members)</h4>
                    <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
                      <div className="space-y-2">
                        {workspaceUsers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E2E8F0]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[rgba(79,70,229,0.08)] rounded-full flex items-center justify-center">
                                <span className="text-[#4F46E5] font-medium text-sm">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-[#0F172A]">{member.name}</div>
                                <div className="text-sm text-[#64748B]">{member.email}</div>
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
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#4F46E5]" />
                    Invite Team Members
                  </h3>

                  <div className="space-y-4">
                    {invitations.map((invitation, index) => (
                      <div key={index} className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Input
                              type="email"
                              value={invitation.email}
                              onChange={(e) => updateInvitation(index, 'email', e.target.value)}
                              placeholder="colleague@example.com"
                              className="bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]"
                            />
                            {errors[`invitations.${index}.email`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`invitations.${index}.email`]}</p>
                            )}
                          </div>
                          {invitations.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeInvitation(index)}
                              className="text-red-500 hover:bg-red-50 border-red-200"
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
                      className="w-full border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Invitation
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={loading}
                    className="border-[#E2E8F0] text-[#64748B]"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={sendInvitations}
                    disabled={loading}
                    className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                  >
                    {loading ? 'Sending...' : (
                      <>Send Invitations<ArrowRight className="h-4 w-4 ml-2" /></>
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
