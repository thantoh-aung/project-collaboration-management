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
  Building2, 
  FolderPlus, 
  Users, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Plus,
  X,
  Mail,
  UserPlus
} from 'lucide-react';
import { useWorkspace } from '@/Context/WorkspaceContext';

function OnboardingWizardInner() {
  const { props } = usePage();
  const { currentWorkspace } = useWorkspace();
  const { workspaceUsers } = props;
  
  // Form data for each step
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
    
    // Refresh every 90 seconds (more frequent to prevent timeouts)
    const interval = setInterval(refreshCSRF, 90 * 1000);

    return () => clearInterval(interval);
  }, []);
  const [errors, setErrors] = useState({});
  
  // Step 1: Workspace data
  const [workspaceData, setWorkspaceData] = useState({
    name: currentWorkspace?.name || '',
    description: currentWorkspace?.description || '',
  });
  
  // Step 2: Team invitations
  const [invitations, setInvitations] = useState([
    { email: '', role: 'member' }
  ]);

  const roleOptions = [
    { value: 'member', label: 'Member', description: 'Can create and complete tasks' }
  ];
  
  const totalSteps = 2;

  useEffect(() => {
    console.log('Onboarding Wizard initialized', {
      currentWorkspace,
      step
    });
  }, [currentWorkspace, step]);

  const steps = [
    {
      id: 1,
      title: 'Customize Your Workspace',
      description: 'Set up your workspace name and description',
      icon: Building2,
    },
    {
      id: 2,
      title: 'Invite Team Members',
      description: 'Add team members to collaborate with',
      icon: Users,
    }
  ];

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!workspaceData.name.trim()) {
        newErrors.workspace_name = 'Workspace name is required';
      }
    } else if (currentStep === 2) {
      invitations.forEach((inv, index) => {
        if (inv.email.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(inv.email)) {
            newErrors[`invitation_${index}_email`] = 'Invalid email address';
          }
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveWorkspaceAndGoToInvitations = async () => {
    if (!validateStep(1)) return;
    
    // Check if workspace data actually changed
    const hasChanges = workspaceData.name !== currentWorkspace?.name || 
                      workspaceData.description !== currentWorkspace?.description;
    
    if (hasChanges) {
      setLoading(true);
      try {
        // Refresh CSRF token before submission
        await window.axios.get('/sanctum/csrf-cookie');
        
        await router.patch(`/workspaces/${currentWorkspace.id}/settings`, {
          name: workspaceData.name,
          description: workspaceData.description
        }, {
          onSuccess: () => {
            console.log('Workspace updated successfully');
            setStep(2);
          },
          onError: (errors) => {
            setErrors(errors);
          }
        });
      } catch (error) {
        console.error('Error updating workspace:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // No changes, just go to invitations
      setStep(2);
    }
  };

  const saveWorkspace = async () => {
    if (!validateStep(1)) return;
    
    // Check if workspace data actually changed
    const hasChanges = workspaceData.name !== currentWorkspace?.name || 
                      workspaceData.description !== currentWorkspace?.description;
    
    if (!hasChanges) {
      // No changes, just advance to next step
      setStep(2);
      return;
    }
    
    setLoading(true);
    try {
      // Refresh CSRF token before submission
      await window.axios.get('/sanctum/csrf-cookie');
      
      await router.patch(`/workspaces/${currentWorkspace.id}`, {
        name: workspaceData.name,
        description: workspaceData.description,
      }, {
        onSuccess: () => {
          console.log('Workspace updated successfully');
          setStep(2);
        },
        onError: (errors) => {
          setErrors(errors);
        }
      });
    } catch (error) {
      console.error('Error updating workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitations = async () => {
    if (!validateStep(2)) return;
    
    setLoading(true);
    try {
      // First, save workspace data if changed
      const hasChanges = workspaceData.name !== currentWorkspace?.name || 
                        workspaceData.description !== currentWorkspace?.description;
      
      if (hasChanges) {
        await router.patch(`/workspaces/${currentWorkspace.id}/settings`, {
          name: workspaceData.name,
          description: workspaceData.description
        });
      }
      
      // Then send invitations
      const validInvitations = invitations.filter(inv => inv.email.trim());
      
      if (validInvitations.length > 0) {
        // Refresh CSRF token before submission
        await window.axios.get('/sanctum/csrf-cookie');
        
        await router.post(`/workspaces/${currentWorkspace.id}/invite`, {
          invitations: validInvitations
        }, {
          onSuccess: () => {
            console.log('Invitations sent successfully');
            completeOnboarding();
          },
          onError: (errors) => {
            setErrors(errors);
          }
        });
      } else {
        completeOnboarding();
      }
    } catch (error) {
      console.error('Error saving workspace or sending invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    // Mark onboarding as complete
    localStorage.setItem('onboarding_completed', 'true');
    router.visit('/dashboard');
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
      await router.delete(`/workspaces/${currentWorkspace.id}/users/${userId}`, {
        onSuccess: () => {
          console.log('Workspace member removed successfully');
          // Refresh the page to update the member list
          window.location.reload();
        },
        onError: (error) => {
          console.error('Failed to remove workspace member:', error);
        }
      });
    } catch (error) {
      console.error('Error removing workspace member:', error);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      saveWorkspaceAndGoToInvitations();
    } else if (step === 2) {
      sendInvitations();
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const skipOnboarding = () => {
    setStep(2);
  };

  const currentStepData = steps.find(s => s.id === step);
  const progressPercentage = (step / totalSteps) * 100;

  return (
    <>
      <Head title="Manage Workspace - CollabTool" />
      
      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        {/* Modal Container */}
        <div className="relative w-full max-w-4xl h-[85vh] max-h-[90vh] flex flex-col">
          {/* Modal Content */}
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Manage Workspace</h1>
                    <p className="text-blue-100">Customize settings and invite team members</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.location.href = '/dashboard'}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                {steps.map((s, index) => (
                  <>
                    <div className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300',
                      step > s.id 
                        ? 'bg-emerald-500 text-white' 
                        : step === s.id 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-100' 
                        : 'bg-gray-200 text-gray-500'
                    )}>
                      {step > s.id ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        'w-12 h-1 transition-all duration-300',
                        step > s.id ? 'bg-green-500' : 'bg-gray-200'
                      )} />
                    )}
                  </>
                ))}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentStepData?.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{currentStepData?.description}</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="px-8 py-6 flex-1 overflow-y-auto">
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Workspace Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Workspace Name
                        </label>
                        <Input
                          id="name"
                          type="text"
                          value={workspaceData.name}
                          onChange={(e) => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                          placeholder="Enter workspace name"
                          required
                        />
                        {errors.name && (
                          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <Textarea
                          id="description"
                          value={workspaceData.description}
                          onChange={(e) => setWorkspaceData({ ...workspaceData, description: e.target.value })}
                          rows={4}
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Invite Team Members
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Add team members to help you complete projects. Clients are automatically included when you create workspaces in the marketplace, so no need to invite them here.
                    </p>
                    
                    {/* Current Workspace Members */}
                    {workspaceUsers && workspaceUsers.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Current Team Members (Admins & Members)</h4>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="space-y-2">
                            {workspaceUsers.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-medium text-sm">
                                      {member.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{member.name}</div>
                                    <div className="text-sm text-gray-500">{member.email}</div>
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
                    
                    <div className="space-y-4">
                      {invitations.map((invitation, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <Input
                                type="email"
                                value={invitation.email}
                                onChange={(e) => updateInvitation(index, 'email', e.target.value)}
                                placeholder="colleague@example.com"
                              />
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={invitation.role}
                                onChange={(e) => updateInvitation(index, 'role', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="member">Member</option>
                              </select>
                              {invitations.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeInvitation(index)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  {step === 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={skipOnboarding}
                    >
                      Skip for now
                    </Button>
                  )}
                  
                  <Button
                    onClick={nextStep}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? (
                      'Saving...'
                    ) : step === totalSteps ? (
                      <>
                        Save & Return to Dashboard
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
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
