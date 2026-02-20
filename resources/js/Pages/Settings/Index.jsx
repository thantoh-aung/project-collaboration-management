import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Users, Shield, Bell, Database } from 'lucide-react';

export default function SettingsIndex({ auth }) {
  return (
    <>
      <Head title="Settings" />
      
      <MainLayout title="Settings">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">Settings</h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage settings for {auth?.current_workspace?.name}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Workspace Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input 
                      id="workspace-name" 
                      defaultValue={auth?.current_workspace?.name}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="workspace-description">Description</Label>
                    <Input 
                      id="workspace-description" 
                      placeholder="Enter workspace description"
                      defaultValue=""
                    />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Team Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Invite Team Members</h4>
                        <p className="text-sm text-gray-400">Send invitations to join your workspace</p>
                      </div>
                      <Button>Invite</Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Manage Roles</h4>
                        <p className="text-sm text-gray-400">Configure user roles and permissions</p>
                      </div>
                      <Button variant="secondary">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email Notifications</h4>
                        <p className="text-sm text-gray-400">Receive email updates about your projects</p>
                      </div>
                      <Button variant="secondary">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">In-App Notifications</h4>
                        <p className="text-sm text-gray-400">Get notified about important updates</p>
                      </div>
                      <Button variant="secondary">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-400">Add an extra layer of security</p>
                      </div>
                      <Button variant="secondary">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Session Management</h4>
                        <p className="text-sm text-gray-400">Manage active sessions</p>
                      </div>
                      <Button variant="secondary">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Data & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Export Data</h4>
                        <p className="text-sm text-gray-400">Download your workspace data</p>
                      </div>
                      <Button variant="secondary">Export</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Delete Workspace</h4>
                        <p className="text-sm text-gray-400">Permanently delete workspace</p>
                      </div>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
