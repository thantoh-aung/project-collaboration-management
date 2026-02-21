import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import {
  Building,
  Users,
  ChevronRight,
  Crown,
  User,
  Briefcase,
  Eye,
  Store
} from 'lucide-react';

export default function WorkspaceSelect({ workspaces, current_workspace_id, auth }) {
  const [switching, setSwitching] = useState(false);

  const handleWorkspaceSelect = (workspace) => {
    if (switching) return;

    if (workspace.id === current_workspace_id) {
      router.visit(route('dashboard'));
      return;
    }

    setSwitching(true);

    router.post(route('workspaces.switch', workspace.id), {}, {
      onSuccess: (page) => {
        router.visit(route('dashboard'));
      },
      onError: (errors) => {
        console.error('Switch failed', errors);
        setSwitching(false);
      }
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-amber-600" />;
      case 'member': return <Users className="h-4 w-4 text-[#4F46E5]" />;
      case 'client': return <Eye className="h-4 w-4 text-emerald-600" />;
      default: return <User className="h-4 w-4 text-[#64748B]" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-amber-50 text-amber-700';
      case 'member': return 'bg-[rgba(79,70,229,0.08)] text-[#4F46E5]';
      case 'client': return 'bg-emerald-50 text-emerald-700';
      default: return 'bg-[#F1F5F9] text-[#64748B]';
    }
  };

  return (
    <MarketplaceLayout>
      <Head title="Select Workspace" />

      <div className="bg-[#F8FAFC] text-[#0F172A] flex-1">

        <div className="py-4 px-4 sm:px-6 lg:px-8 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#0F172A]">
                Select Your Workspace
              </h2>
              <p className="mt-2 text-base text-[#64748B] max-w-xl mx-auto">
                Choose your workspace to access your projects and collaborate with your team
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-4">
              {workspaces.map((workspace) => {
                const userRole = workspace.user_role || workspace.pivot?.role || 'member';
                const isOwner = workspace.owner?.id === auth.user.id;
                const isCurrent = workspace.id === current_workspace_id;

                return (
                  <Card
                    key={workspace.id}
                    className={`group relative overflow-hidden transition-all duration-200 cursor-pointer ${isCurrent
                        ? 'border-2 border-[#4F46E5] bg-white shadow-md'
                        : 'border border-[#E2E8F0] bg-white hover:border-[rgba(79,70,229,0.3)] hover:shadow-md hover:-translate-y-0.5'
                      } ${switching ? 'cursor-not-allowed opacity-60' : ''}`}
                    onClick={() => !switching && handleWorkspaceSelect(workspace)}
                  >
                    {/* Current workspace indicator */}
                    {isCurrent && (
                      <div className="absolute top-0 right-0 bg-[#4F46E5] text-white text-xs px-3 py-1 rounded-bl-lg">
                        Current
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${isCurrent
                              ? 'bg-[#4F46E5]'
                              : 'bg-[rgba(79,70,229,0.08)] group-hover:bg-[#4F46E5]'
                            }`}>
                            <Building className={`h-6 w-6 transition-colors duration-200 ${isCurrent ? 'text-white' : 'text-[#4F46E5] group-hover:text-white'
                              }`} />
                          </div>
                          <div className="flex-1">
                            <CardTitle className={`text-lg font-semibold transition-colors duration-200 ${isCurrent ? 'text-[#4F46E5]' : 'text-[#0F172A] group-hover:text-[#4F46E5]'
                              }`}>
                              {workspace.name}
                            </CardTitle>
                            {workspace.description && (
                              <CardDescription className="text-sm text-[#64748B] mt-1 line-clamp-2">
                                {workspace.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 transition-all duration-200 ${isCurrent ? 'text-[#4F46E5]' : 'text-[#94A3B8] group-hover:text-[#4F46E5] group-hover:translate-x-1'
                          }`} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Role Badge */}
                        <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                          <span className="text-sm font-medium text-[#64748B]">Your Role:</span>
                          <Badge className={`${getRoleColor(userRole)} border-0 px-2 py-1`}>
                            <div className="flex items-center gap-1.5">
                              {getRoleIcon(userRole)}
                              <span className="capitalize font-medium">{userRole}</span>
                            </div>
                          </Badge>
                        </div>

                        {/* Owner Info */}
                        <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                          <span className="text-sm font-medium text-[#64748B]">Owner:</span>
                          <span className="text-sm font-semibold text-[#0F172A]">
                            {isOwner ? 'You' : workspace.owner?.name}
                          </span>
                        </div>

                        {/* Member Count */}
                        <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                          <span className="text-sm font-medium text-[#64748B]">Members:</span>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-[#4F46E5]" />
                            <span className="text-sm font-semibold text-[#0F172A]">
                              {workspace.member_count || 1}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                          <span className="text-sm font-medium text-[#64748B]">Status:</span>
                          <Badge className={`${workspace.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-0 px-2 py-1'
                              : 'bg-[#F1F5F9] text-[#94A3B8] border-0 px-2 py-1'
                            }`}>
                            {workspace.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        {/* Join Date */}
                        {workspace.pivot?.joined_at && (
                          <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                            <span className="text-sm font-medium text-[#64748B]">Joined:</span>
                            <span className="text-sm font-semibold text-[#0F172A]">
                              {new Date(workspace.pivot.joined_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        className={`w-full mt-6 font-semibold transition-colors ${isCurrent
                            ? 'bg-[#4F46E5] text-white border-0'
                            : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#4F46E5] hover:text-white border border-[#E2E8F0]'
                          }`}
                        disabled={switching || isCurrent}
                      >
                        {switching ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Switching...
                          </>
                        ) : (
                          <>
                            <Briefcase className="h-4 w-4 mr-2" />
                            {isCurrent ? 'Current Workspace' : 'Open Workspace'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {workspaces.length === 0 && (
              <Card className="text-center py-16 border-2 border-dashed border-[#E2E8F0] bg-white">
                <CardContent>
                  <div className="mx-auto w-16 h-16 bg-[rgba(79,70,229,0.08)] rounded-2xl flex items-center justify-center mb-6">
                    <Building className="h-8 w-8 text-[#4F46E5]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0F172A] mb-3">
                    No Workspaces Available
                  </h3>
                  <p className="text-lg text-[#64748B] mb-8 max-w-md mx-auto">
                    You haven't joined any workspaces yet. Start by browsing the marketplace to find freelancers or clients, then create a workspace together through chat.
                  </p>
                  <div className="flex justify-center">
                    <Button asChild className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                      <a href="/marketplace">
                        <Store className="h-4 w-4 mr-2" />
                        Browse Marketplace
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
