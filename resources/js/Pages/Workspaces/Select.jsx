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

  console.log('=== WorkspaceSelect Props Debug ===');
  console.log('workspaces prop:', workspaces);
  console.log('workspaces length:', workspaces?.length);
  console.log('current_workspace_id prop:', current_workspace_id);
  console.log('auth prop:', auth);
  console.log('=====================================');

  const handleWorkspaceSelect = (workspace) => {
    if (switching) return; // Prevent multiple clicks
    
    console.log('WorkspaceSelect: Selecting workspace', workspace.name, 'ID:', workspace.id);
    
    // If this is already the current workspace, just go to dashboard
    if (workspace.id === current_workspace_id) {
      console.log('WorkspaceSelect: Already current workspace, going to dashboard');
      router.visit(route('dashboard'));
      return;
    }
    
    setSwitching(true);
    console.log('WorkspaceSelect: Switching to workspace', workspace.id);
    
    // Use direct router.post for switching
    router.post(route('workspaces.switch', workspace.id), {}, {
      onSuccess: (page) => {
        console.log('WorkspaceSelect: Switch successful, going to dashboard');
        router.visit(route('dashboard'));
      },
      onError: (errors) => {
        console.error('WorkspaceSelect: Switch failed', errors);
        setSwitching(false);
      }
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'member':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'client':
        return <Eye className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md shadow-yellow-500/30';
      case 'member':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30';
      case 'client':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-md shadow-gray-500/30';
    }
  };

  return (
    <MarketplaceLayout>
      <Head title="Select Workspace" />
      
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex-1">
                
        <div className="py-4 px-4 sm:px-6 lg:px-8 pb-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Select Your Workspace
            </h2>
            <p className="mt-2 text-base text-gray-600 max-w-xl mx-auto">
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
                  className={`group relative overflow-hidden transition-all duration-300 cursor-pointer ${
                    isCurrent 
                      ? 'border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-xl shadow-indigo-500/20 scale-105' 
                      : 'border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1'
                  } ${switching ? 'cursor-not-allowed opacity-60' : ''}`}
                  onClick={() => !switching && handleWorkspaceSelect(workspace)}
                >
                  {/* Current workspace indicator */}
                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white text-xs px-3 py-1 rounded-bl-lg">
                      Current
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isCurrent 
                            ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg' 
                            : 'bg-gradient-to-tr from-gray-100 to-gray-200 group-hover:from-indigo-100 group-hover:to-purple-100'
                        }`}>
                          <Building className={`h-6 w-6 transition-colors duration-300 ${
                            isCurrent ? 'text-white' : 'text-gray-600 group-hover:text-indigo-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                            isCurrent ? 'text-indigo-900' : 'text-gray-900 group-hover:text-indigo-700'
                          }`}>
                            {workspace.name}
                          </CardTitle>
                          {workspace.description && (
                            <CardDescription className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {workspace.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 transition-all duration-300 ${
                        isCurrent ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1'
                      }`} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Role Badge */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Your Role:</span>
                        <Badge className={`${getRoleColor(userRole)} border-0 px-2 py-1`}>
                          <div className="flex items-center gap-1.5">
                            {getRoleIcon(userRole)}
                            <span className="capitalize font-medium">{userRole}</span>
                          </div>
                        </Badge>
                      </div>

                      {/* Owner Info */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Owner:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {isOwner ? 'You' : workspace.owner?.name}
                        </span>
                      </div>

                      {/* Member Count */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Members:</span>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-indigo-600" />
                          <span className="text-sm font-semibold text-gray-900">
                            {workspace.member_count || 1}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <Badge className={`${
                          workspace.is_active 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30 border-0 px-2 py-1' 
                            : 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-md shadow-gray-500/30 border-0 px-2 py-1'
                        }`}>
                          {workspace.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Join Date */}
                      {workspace.pivot?.joined_at && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Joined:</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {new Date(workspace.pivot.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button 
                      className={`w-full mt-6 font-semibold transition-all duration-300 ${
                        isCurrent 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 border-0' 
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-indigo-100 hover:to-purple-100 hover:text-indigo-700 border border-gray-300 hover:border-indigo-300'
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
            <Card className="text-center py-16 border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white">
              <CardContent>
                <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mb-6">
                  <Building className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Workspaces Available
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                  You haven't joined any workspaces yet. Start by browsing the marketplace to find freelancers or clients, then create a workspace together through chat.
                </p>
                <div className="flex justify-center">
                  <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 border-0">
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
