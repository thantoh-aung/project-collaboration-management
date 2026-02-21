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
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#0F172A]">Settings</h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Manage settings for {auth?.current_workspace?.name}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white border border-[#E2E8F0]">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0F172A]">
                    <Settings className="w-5 h-5 mr-2 text-[#4F46E5]" />
                    Workspace Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="workspace-name" className="text-[#0F172A]">Workspace Name</Label>
                    <Input
                      id="workspace-name"
                      defaultValue={auth?.current_workspace?.name}
                      disabled
                      className="bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workspace-description" className="text-[#0F172A]">Description</Label>
                    <Input
                      id="workspace-description"
                      placeholder="Enter workspace description"
                      defaultValue=""
                      className="bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]"
                    />
                  </div>
                  <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">Save Changes</Button>
                </CardContent>
              </Card>

              <Card className="bg-white border border-[#E2E8F0]">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0F172A]">
                    <Users className="w-5 h-5 mr-2 text-[#4F46E5]" />
                    Team Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-[#0F172A]">Invite Team Members</h4>
                        <p className="text-sm text-[#64748B]">Send invitations to join your workspace</p>
                      </div>
                      <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">Invite</Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-[#0F172A]">Manage Roles</h4>
                        <p className="text-sm text-[#64748B]">Configure user roles and permissions</p>
                      </div>
                      <Button variant="secondary" className="bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-[#E2E8F0]">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0F172A]">
                    <Bell className="w-5 h-5 mr-2 text-amber-500" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0F172A]">Email Notifications</h4>
                        <p className="text-sm text-[#64748B]">Receive email updates about your projects</p>
                      </div>
                      <Button variant="secondary" className="bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0F172A]">In-App Notifications</h4>
                        <p className="text-sm text-[#64748B]">Get notified about important updates</p>
                      </div>
                      <Button variant="secondary" className="bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-white border border-[#E2E8F0]">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0F172A]">
                    <Shield className="w-5 h-5 mr-2 text-emerald-600" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0F172A]">Two-Factor Authentication</h4>
                        <p className="text-sm text-[#64748B]">Add an extra layer of security</p>
                      </div>
                      <Button variant="secondary" className="bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0F172A]">Session Management</h4>
                        <p className="text-sm text-[#64748B]">Manage active sessions</p>
                      </div>
                      <Button variant="secondary" className="bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-[#E2E8F0]">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0F172A]">
                    <Database className="w-5 h-5 mr-2 text-[#4F46E5]" />
                    Data & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0F172A]">Export Data</h4>
                        <p className="text-sm text-[#64748B]">Download your workspace data</p>
                      </div>
                      <Button variant="secondary" className="bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]">Export</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0F172A]">Delete Workspace</h4>
                        <p className="text-sm text-[#64748B]">Permanently delete workspace</p>
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
