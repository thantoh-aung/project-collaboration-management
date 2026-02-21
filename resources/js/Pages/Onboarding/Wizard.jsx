import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Building2, FolderPlus, Users, ArrowRight, ArrowLeft,
  Check, Plus, X, Mail, UserPlus
} from 'lucide-react';
import { useWorkspace } from '@/Context/WorkspaceContext';

function OnboardingWizardInner() {
  const { props } = usePage();
  const { currentWorkspace } = useWorkspace();
  const { workspaceUsers } = props;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [workspaceData, setWorkspaceData] = useState({
    name: currentWorkspace?.name || '',
    description: currentWorkspace?.description || '',
  });

  const [invitations, setInvitations] = useState([{ email: '', role: 'member' }]);
  const totalSteps = 2;

  const steps = [
    { id: 1, title: 'Customize Your Workspace', description: 'Set up your workspace name and description', icon: Building2 },
    { id: 2, title: 'Invite Team Members', description: 'Add team members to collaborate with', icon: Users }
  ];

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!workspaceData.name.trim()) newErrors.workspace_name = 'Workspace name is required';
    } else if (currentStep === 2) {
      invitations.forEach((inv, index) => {
        if (inv.email.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(inv.email)) newErrors[`invitation_${index}_email`] = 'Invalid email address';
        }
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveWorkspaceAndGoToInvitations = async () => {
    if (!validateStep(1)) return;
    const hasChanges = workspaceData.name !== currentWorkspace?.name || workspaceData.description !== currentWorkspace?.description;
    if (hasChanges) {
      setLoading(true);
      try {
        await router.patch(`/workspaces/${currentWorkspace.id}/settings`, {
          name: workspaceData.name, description: workspaceData.description
        }, {
          onSuccess: () => setStep(2),
          onError: (errors) => setErrors(errors)
        });
      } catch (error) { /* handle error */ }
      finally { setLoading(false); }
    } else { setStep(2); }
  };

  const saveWorkspace = async () => {
    if (!validateStep(1)) return;
    const hasChanges = workspaceData.name !== currentWorkspace?.name || workspaceData.description !== currentWorkspace?.description;
    if (!hasChanges) { setStep(2); return; }
    setLoading(true);
    try {
      await router.patch(`/workspaces/${currentWorkspace.id}`, {
        name: workspaceData.name, description: workspaceData.description,
      }, {
        onSuccess: () => setStep(2),
        onError: (errors) => setErrors(errors)
      });
    } catch (error) { /* handle error */ }
    finally { setLoading(false); }
  };

  const sendInvitations = async () => {
    if (!validateStep(2)) return;
    setLoading(true);
    try {
      const hasChanges = workspaceData.name !== currentWorkspace?.name || workspaceData.description !== currentWorkspace?.description;
      if (hasChanges) {
        await router.patch(`/workspaces/${currentWorkspace.id}/settings`, {
          name: workspaceData.name, description: workspaceData.description
        });
      }
      const validInvitations = invitations.filter(inv => inv.email.trim());
      if (validInvitations.length > 0) {
        await router.post(`/workspaces/${currentWorkspace.id}/invite`, {
          invitations: validInvitations
        }, {
          onSuccess: () => completeOnboarding(),
          onError: (errors) => setErrors(errors)
        });
      } else { completeOnboarding(); }
    } catch (error) { /* handle error */ }
    finally { setLoading(false); }
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    router.visit('/dashboard');
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
      await router.delete(`/workspaces/${currentWorkspace.id}/users/${userId}`, {
        onSuccess: () => window.location.reload(),
        onError: (error) => { /* handle error */ }
      });
    } catch (error) { /* handle error */ }
  };

  const nextStep = () => {
    if (step === 1) saveWorkspaceAndGoToInvitations();
    else if (step === 2) sendInvitations();
  };

  const prevStep = () => setStep(step - 1);
  const skipOnboarding = () => setStep(2);
  const currentStepData = steps.find(s => s.id === step);

  return (
    <>
      <Head title="Manage Workspace - CollabTool" />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <div className="relative w-full max-w-4xl h-[85vh] max-h-[90vh] flex flex-col">
          <div className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-[#E2E8F0]">
            {/* Header */}
            <div className="bg-[#4F46E5] px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Manage Workspace</h1>
                    <p className="text-indigo-200">Customize settings and invite team members</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => window.location.href = '/dashboard'} className="text-white hover:bg-white/20">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-8 py-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-4">
                {steps.map((s, index) => (
                  <>
                    <div className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300',
                      step > s.id ? 'bg-[#14B8A6] text-white'
                        : step === s.id ? 'bg-[#4F46E5] text-white ring-4 ring-[rgba(79,70,229,0.15)]'
                          : 'bg-[#F1F5F9] text-[#94A3B8]'
                    )}>
                      {step > s.id ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn('w-12 h-1 transition-all duration-300', step > s.id ? 'bg-[#14B8A6]' : 'bg-[#E2E8F0]')} />
                    )}
                  </>
                ))}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A]">{currentStepData?.title}</h3>
                <p className="text-sm text-[#94A3B8] mt-1">{currentStepData?.description}</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="px-8 py-6 flex-1 overflow-y-auto">
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#4F46E5]" />
                      Workspace Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[#64748B] mb-2">Workspace Name</label>
                        <Input
                          id="name" type="text" value={workspaceData.name}
                          onChange={(e) => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                          placeholder="Enter workspace name"
                          className="bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]"
                          required
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-[#64748B] mb-2">Description</label>
                        <Textarea
                          id="description" value={workspaceData.description}
                          onChange={(e) => setWorkspaceData({ ...workspaceData, description: e.target.value })}
                          rows={4} className="bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]"
                          placeholder="Describe your workspace purpose and goals..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#4F46E5]" />
                      Invite Team Members
                    </h3>
                    <p className="text-[#94A3B8] mb-6">
                      Add team members to help you complete projects. Clients are automatically included when you create workspaces in the marketplace, so no need to invite them here.
                    </p>

                    {workspaceUsers && workspaceUsers.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-[#0F172A] mb-3">Current Team Members (Admins & Members)</h4>
                        <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
                          <div className="space-y-2">
                            {workspaceUsers.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E2E8F0]">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-[rgba(79,70,229,0.1)] rounded-full flex items-center justify-center">
                                    <span className="text-[#4F46E5] font-medium text-sm">{member.name.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-[#0F172A]">{member.name}</div>
                                    <div className="text-sm text-[#94A3B8]">{member.email}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs border-indigo-200 text-[#4F46E5] bg-[rgba(79,70,229,0.08)]">
                                    {member.workspace_role}
                                  </Badge>
                                  <Button type="button" variant="outline" size="sm" onClick={() => removeWorkspaceMember(member.id)} className="text-red-500 hover:bg-red-50 border-red-200">
                                    <X className="h-3 w-3 mr-1" /> Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {invitations.map((invitation, index) => (
                        <div key={index} className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <Input
                                type="email" value={invitation.email}
                                onChange={(e) => updateInvitation(index, 'email', e.target.value)}
                                placeholder="colleague@example.com"
                                className="bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={invitation.role}
                                onChange={(e) => updateInvitation(index, 'role', e.target.value)}
                                className="flex-1 px-3 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                              >
                                <option value="member">Member</option>
                              </select>
                              {invitations.length > 1 && (
                                <Button type="button" variant="outline" size="icon" onClick={() => removeInvitation(index)} className="text-red-500 hover:bg-red-50 border-red-200">
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button type="button" variant="outline" onClick={addInvitation} className="w-full border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]">
                        <Plus className="h-4 w-4 mr-2" /> Add Another Invitation
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep} className="border-[#E2E8F0] text-[#64748B]">
                      <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  {step === 1 && (
                    <Button type="button" variant="outline" onClick={skipOnboarding} className="border-[#E2E8F0] text-[#64748B]">
                      Skip for now
                    </Button>
                  )}
                  <Button onClick={nextStep} disabled={loading} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                    {loading ? 'Saving...' : step === totalSteps ? (
                      <>Save & Return to Dashboard<ArrowRight className="h-4 w-4 ml-2" /></>
                    ) : (
                      <>Next<ArrowRight className="h-4 w-4 ml-2" /></>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OnboardingWizard() {
  return <OnboardingWizardInner />;
}
