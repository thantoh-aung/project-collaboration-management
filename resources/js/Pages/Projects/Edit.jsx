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
    const memberIds = selectedMembers.map(m => m.id || m);
    const submitData = { ...data, members: memberIds };

    const currentUserId = props.auth?.user?.id;
    const finalSubmitData = (memberIds.length === 1 && memberIds[0] === currentUserId)
      ? { ...submitData, members: [] }
      : submitData;

    router.patch(`/projects/${project.id}`, finalSubmitData, {
      onSuccess: () => { router.visit('/projects'); },
      onError: (errors) => { console.error('Update failed:', errors); },
    });
  };

  const addMember = (user) => {
    if (!selectedMembers.find(m => (m.id || m) === (user.id || user))) {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const removeMember = (memberId) => {
    setSelectedMembers(selectedMembers.filter(m => (m.id || m) !== memberId));
  };

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
                <Button variant="outline" size="sm" className="border-[#E2E8F0] text-[#64748B]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">Edit Project</h1>
                <p className="text-sm text-[#64748B]">Update project information and settings</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="bg-white border border-[#E2E8F0]">
            <CardHeader className="border-b border-[#E2E8F0]">
              <CardTitle className="text-[#0F172A]">Project Details</CardTitle>
              <CardDescription className="text-[#64748B]">
                Update the information for your project
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Essential Information */}
                <div className="border-l-4 border-l-[#4F46E5] pl-4">
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Essential Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-[#0F172A]">
                        Project Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Enter project name"
                        className={`h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-xl ${errors.name ? 'border-red-500' : ''}`}
                        required
                      />
                      {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                      <p className="text-xs text-[#94A3B8]">Give your project a clear, descriptive name</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_date" className="text-sm font-medium text-[#0F172A]">
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
                          min={new Date().toISOString().split('T')[0]}
                          className={`h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-xl ${errors.start_date ? 'border-red-500' : ''}`}
                          required
                        />
                        {errors.start_date && <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>}
                        <p className="text-xs text-[#94A3B8]">When the project begins</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="due_date" className="text-sm font-medium text-[#0F172A]">
                          Due Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={data.due_date}
                          onChange={(e) => setData('due_date', e.target.value)}
                          min={data.start_date}
                          className={`h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-xl ${errors.due_date ? 'border-red-500' : ''}`}
                          required
                        />
                        {errors.due_date && <p className="text-sm text-red-500 mt-1">{errors.due_date}</p>}
                        <p className="text-xs text-[#94A3B8]">Project completion target</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Information */}
                <div className="border-l-4 border-l-[#E2E8F0] pl-4">
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-4">
                    Optional Information
                    <Badge variant="outline" className="ml-2 text-xs border-[#E2E8F0] text-[#64748B]">Can be added later</Badge>
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-[#0F172A]">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Describe the project goals, objectives, and scope"
                        rows={4}
                        className={`bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl resize-none ${errors.description ? 'border-red-500' : ''}`}
                      />
                      {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                      <p className="text-xs text-[#94A3B8]">Help team members understand the project purpose</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-[#0F172A]">
                        Status
                      </Label>
                      <Select
                        value={data.status}
                        onValueChange={(value) => setData('status', value)}
                      >
                        <SelectTrigger className="h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-xl">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#E2E8F0]">
                          <SelectItem value="planning" className="text-[#0F172A]">📋 Planning</SelectItem>
                          <SelectItem value="active" className="text-[#0F172A]">🟢 Active</SelectItem>
                          <SelectItem value="on_hold" className="text-[#0F172A]">⏸️ On Hold</SelectItem>
                          <SelectItem value="completed" className="text-[#0F172A]">✅ Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.status && <p className="text-sm text-red-500 mt-1">{errors.status}</p>}
                      <p className="text-xs text-[#94A3B8]">Current project status</p>
                    </div>
                  </div>
                </div>

                {/* Team Setup */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-medium text-[#0F172A]">
                    <Users className="h-4 w-4" />
                    Team Setup
                    <Badge variant="outline" className="text-xs border-[#E2E8F0] text-[#64748B]">Optional</Badge>
                  </Label>
                  <div className="border border-[#E2E8F0] rounded-xl p-4 space-y-3 bg-[#F8FAFC]">
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((member) => {
                        const memberData = typeof member === 'object' ? member : workspaceUsers?.find(u => u.id === member);
                        return memberData ? (
                          <Badge key={memberData.id} variant="secondary" className="flex items-center gap-1 bg-white border border-[#E2E8F0] text-[#0F172A]">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={memberData.avatar} />
                              <AvatarFallback className="text-xs bg-[rgba(79,70,229,0.08)] text-[#4F46E5]">
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
                      <SelectTrigger className="h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-xl">
                        <SelectValue placeholder="Add team member..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E2E8F0]">
                        {members
                          .filter(m => !selectedMembers.find(sm => (sm.id || sm) === m.id))
                          .map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()} className="text-[#0F172A]">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="text-xs bg-[rgba(79,70,229,0.08)] text-[#4F46E5]">
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                {member.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[#94A3B8]">Add team members who will work on this project</p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-6 border-t border-[#E2E8F0]">
                  <Link href="/projects">
                    <Button type="button" variant="outline" className="border-[#E2E8F0] text-[#64748B]">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={processing} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
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
