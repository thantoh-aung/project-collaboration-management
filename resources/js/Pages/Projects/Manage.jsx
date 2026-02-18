import { Head, Link, useForm } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  UserPlus,
  UserMinus,
  Mail,
  Shield,
  Eye
} from 'lucide-react';
import { useState } from 'react';

export default function ProjectManage({ project, workspaceUsers, teamMembers, clients }) {
  const [activeTab, setActiveTab] = useState('team');
  
  const { data, setData, post, processing, reset } = useForm({
    user_id: '',
    role: 'member',
  });

  const handleAddMember = (e) => {
    e.preventDefault();
    post(`/projects/${project.id}/members`, {
      onSuccess: () => reset(),
    });
  };

  const handleRemoveMember = (userId) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      useForm().delete(`/projects/${project.id}/members/${userId}`, {
        onSuccess: () => window.location.reload(),
      });
    }
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    post(`/projects/${project.id}/clients`, {
      onSuccess: () => reset(),
    });
  };

  const handleRemoveClient = (userId) => {
    if (confirm('Are you sure you want to remove this client?')) {
      useForm().delete(`/projects/${project.id}/clients/${userId}`, {
        onSuccess: () => window.location.reload(),
      });
    }
  };

  const availableUsers = workspaceUsers.filter(user => 
    !teamMembers.some(member => member.id === user.id) &&
    !clients.some(client => client.id === user.id)
  );

  return (
    <>
      <Head title={`Manage ${project.name} - CollabTool`} />
      
      <MainLayout title={`Manage ${project.name}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link href={`/projects/${project.id}/tasks`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Project
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Manage Project</h1>
                <p className="text-sm text-gray-500">Add team members and clients to {project.name}</p>
              </div>
            </div>

            {/* Project Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <p className="text-gray-600">{project.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{project.status}</Badge>
                    <Badge variant="secondary">{teamMembers.length} members</Badge>
                    <Badge variant="secondary">{clients.length} clients</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('team')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'team'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2 inline" />
                  Team Members
                </button>
                <button
                  onClick={() => setActiveTab('clients')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'clients'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Eye className="h-4 w-4 mr-2 inline" />
                  Client Access
                </button>
              </nav>
            </div>
          </div>

          {/* Team Members Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Add Team Member */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Add Team Member
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="user_id">Select User</Label>
                        <Select
                          value={data.user_id}
                          onValueChange={(value) => setData('user_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a user to add" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback className="text-xs">
                                      {user.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  {user.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={data.role}
                          onValueChange={(value) => setData('role', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" disabled={processing || !data.user_id}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Team
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Current Team Members */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Team Members ({teamMembers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                      <p className="text-gray-500">Add team members to start collaborating on this project.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar_url} />
                              <AvatarFallback>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{member.name}</h4>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {member.pivot?.role || 'member'}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              {/* Add Client */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Grant Client Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddClient} className="space-y-4">
                    <div>
                      <Label htmlFor="client_id">Select Client</Label>
                      <Select
                        value={data.user_id}
                        onValueChange={(value) => setData('user_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a client to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers
                            .filter(user => user.workspace_role === 'client')
                            .map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.avatar_url} />
                                  <AvatarFallback className="text-xs">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                {user.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={processing || !data.user_id}>
                      <Plus className="h-4 w-4 mr-2" />
                      Grant Access
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Current Clients */}
              <Card>
                <CardHeader>
                  <CardTitle>Clients with Access ({clients.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {clients.length === 0 ? (
                    <div className="text-center py-8">
                      <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No client access granted</h3>
                      <p className="text-gray-500">Add clients to give them view access to this project.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clients.map((client) => (
                        <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={client.avatar_url} />
                              <AvatarFallback>
                                {client.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{client.name}</h4>
                              <p className="text-sm text-gray-500">{client.email}</p>
                            </div>
                            <Badge variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              View Only
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveClient(client.id)}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Access
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </MainLayout>
    </>
  );
}
