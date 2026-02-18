import { Head, Link, useForm, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useWorkspace } from '@/Context/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Save, 
  Users, 
  Eye,
  X
} from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function ProjectEdit({ project, workspaceUsers, teamMembers }) {
  const { props } = usePage();
  const { auth } = props;
  const { currentWorkspace, userRole, loading, error, hasPermission } = useWorkspace();
  
  // Debug: Log what data we're receiving
  console.log('🔍 Project Edit Debug:', {
    project,
    teamMembers,
    workspaceUsers,
    availableMembers: workspaceUsers?.filter(u => u.id !== auth?.user?.id && (u.workspace_role === 'member' || u.workspace_role === 'admin')) || []
  });
  
  // Initialize selected members from existing project data
  const [selectedMembers, setSelectedMembers] = useState(teamMembers || []);
  
  const { data, setData, patch, processing, errors, reset } = useForm({
    name: project.name || '',
    description: project.description || '',
    status: project.status || 'active',
    start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
    due_date: project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : '',
    members: teamMembers?.map(m => m.id) || [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update form data with current selections
    const memberIds = selectedMembers.map(m => m.id || m);
    
    // Debug: Log what data is being submitted
    console.log('🔍 Submitting project data:');
    console.log('🔍 Selected members:', selectedMembers);
    console.log('🔍 Member IDs being submitted:', memberIds);
    console.log('🔍 Status being submitted:', data.status);
    
    // Create the data object directly to ensure members are included
    const submitData = {
      ...data,
      members: memberIds,
    };
    
    console.log('🔍 Final submit data:', submitData);
    
    patch(`/projects/${project.id}`, submitData, {
      onSuccess: (page) => {
        console.log('🔍 Update successful!');
        console.log('🔍 Updated project data:', page.props.project);
        // Navigate back to projects list to see updated status
        router.visit('/projects');
      },
      onError: (errors) => {
        console.error('🔍 Update failed:', errors);
      },
    });
  };

  const addMember = (user) => {
    console.log('🔍 Adding member:', user);
    console.log('🔍 Current selectedMembers before add:', selectedMembers);
    
    if (!selectedMembers.find(m => (m.id || m) === (user.id || user))) {
      const newSelectedMembers = [...selectedMembers, user];
      console.log('🔍 New selectedMembers after add:', newSelectedMembers);
      setSelectedMembers(newSelectedMembers);
    } else {
      console.log('🔍 Member already exists in selection');
    }
  };

  const removeMember = (memberId) => {
    console.log('🔍 Removing member:', memberId);
    console.log('🔍 Current selectedMembers before remove:', selectedMembers);
    
    const newSelectedMembers = selectedMembers.filter(m => (m.id || m) !== memberId);
    console.log('🔍 New selectedMembers after remove:', newSelectedMembers);
    setSelectedMembers(newSelectedMembers);
  };

  // Filter users for dropdowns
  const members = workspaceUsers?.filter(u => u.id !== auth?.user?.id && (u.workspace_role === 'member' || u.workspace_role === 'admin')) || [];

  return (
    <>
      <Head title={`Edit Project - ${project.name}`} />
      
      <MainLayout title="Edit Project">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <Link href="/projects">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Edit Project</h1>
                <p className="text-sm text-gray-500">Update project information and settings</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="bg-white border-gray-200 shadow-lg shadow-indigo-500/10">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-gray-900">Project Details</CardTitle>
              <CardDescription className="text-gray-600">
                Update the information for your project
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Essential Information */}
                <div className="border-l-4 border-l-indigo-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Essential Information</h3>
                  <div className="space-y-4">
                    {/* Project Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Project Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Enter project name"
                        className={`h-11 bg-white border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 ${errors.name ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                        required
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                      )}
                      <p className="text-xs text-gray-500">Give your project a clear, descriptive name</p>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Start Date */}
                      <div className="space-y-2">
                        <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">
                          Start Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={data.start_date}
                          onChange={(e) => {
                            setData('start_date', e.target.value);
                            if (data.due_date && new Date(e.target.value) > new Date(data.due_date)) {
                              setData('due_date', '');
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]} // Prevent past dates for new selections
                          className={`h-11 bg-white border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 ${errors.start_date ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                          required
                        />
                        {errors.start_date && (
                          <p className="text-sm text-red-600 mt-1">{errors.start_date}</p>
                        )}
                        <p className="text-xs text-gray-500">When the project begins</p>
                      </div>

                      {/* Due Date */}
                      <div className="space-y-2">
                        <Label htmlFor="due_date" className="text-sm font-medium text-gray-700">
                          Due Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={data.due_date}
                          onChange={(e) => setData('due_date', e.target.value)}
                          min={data.start_date}
                          className={`h-11 bg-white border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 ${errors.due_date ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                          required
                        />
                        {errors.due_date && (
                          <p className="text-sm text-red-600 mt-1">{errors.due_date}</p>
                        )}
                        <p className="text-xs text-gray-500">Project completion target</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Information */}
                <div className="border-l-4 border-l-gray-300 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Optional Information 
                    <Badge variant="outline" className="ml-2 text-xs">Can be added later</Badge>
                  </h3>
                  <div className="space-y-4">
                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Describe the project goals, objectives, and scope"
                        rows={4}
                        className={`bg-white border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 resize-none ${errors.description ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                      )}
                      <p className="text-xs text-gray-500">Help team members understand the project purpose</p>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select
                        value={data.status}
                        onValueChange={(value) => {
                          console.log('🔍 Status changed to:', value);
                          setData('status', value);
                        }}
                      >
                        <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 shadow-lg shadow-indigo-500/10">
                          <SelectItem value="planning" className="hover:bg-gray-50">📋 Planning</SelectItem>
                          <SelectItem value="active" className="hover:bg-gray-50">🟢 Active</SelectItem>
                          <SelectItem value="on_hold" className="hover:bg-gray-50">⏸️ On Hold</SelectItem>
                          <SelectItem value="completed" className="hover:bg-gray-50">✅ Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.status && (
                        <p className="text-sm text-red-600 mt-1">{errors.status}</p>
                      )}
                      <p className="text-xs text-gray-500">Current project status</p>
                    </div>
                  </div>
                </div>

                {/* Team Setup (Optional) */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Users className="h-4 w-4" />
                    Team Setup
                    <Badge variant="outline" className="text-xs">Optional</Badge>
                  </Label>
                  <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((member) => {
                        const memberData = typeof member === 'object' ? member : workspaceUsers?.find(u => u.id === member);
                        return memberData ? (
                          <Badge key={memberData.id} variant="secondary" className="flex items-center gap-1 bg-white border-gray-200">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={memberData.avatar} />
                              <AvatarFallback className="text-xs bg-gray-100">
                                {memberData.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {memberData.name}
                            <button
                              type="button"
                              onClick={() => removeMember(memberData.id)}
                              className="ml-1 hover:text-red-500 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    <Select onValueChange={(value) => {
                      const user = members.find(u => u.id === parseInt(value));
                      if (user) addMember(user);
                    }}>
                      <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300">
                        <SelectValue placeholder="Add team member..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 shadow-lg shadow-indigo-500/10">
                        {members
                          .filter(m => !selectedMembers.find(sm => (sm.id || sm) === m.id))
                          .map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()} className="hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="text-xs bg-gray-100">
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                {member.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Add team members who will work on this project</p>
                  </div>
                </div>

                
                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <Link href="/projects">
                    <Button type="button" variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {processing ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </>
  );
}
