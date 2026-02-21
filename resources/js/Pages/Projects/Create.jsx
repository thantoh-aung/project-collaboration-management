import { useForm, usePage } from '@inertiajs/react';
import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useWorkspace } from '@/Context/WorkspaceContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Briefcase,
  AlertCircle,
  Users,
  UserPlus,
  X,
  Eye
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { useState } from 'react';

export default function ProjectCreate() {
  return (
    <ErrorBoundary>
      <ProjectCreateContent />
    </ErrorBoundary>
  );
}

function ProjectCreateContent() {
  const { props } = usePage();
  const { auth } = props;
  const { currentWorkspace, userRole, loading, error, hasPermission } = useWorkspace();
  const [selectedMembers, setSelectedMembers] = useState([]);

  if (error) {
    return (
      <MainLayout title="Create Project">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-[#0F172A] mb-2">Workspace Error</h3>
          <p className="text-[#64748B] mb-4">
            {error.message || 'Failed to load workspace information.'}
          </p>
          <Button onClick={() => window.location.reload()} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            Refresh Page
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    description: '',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
    members: [],
  });

  const submit = (e) => {
    e.preventDefault();
    post('/projects', {
      onSuccess: () => { router.visit('/projects'); },
      onError: (errors) => { console.error('Form errors:', errors); },
    });
  };

  const workspaceUsers = props.workspaceUsers || [];
  const members = workspaceUsers.filter(u => u.workspace_role === 'member' || u.workspace_role === 'admin');

  const addMember = (user) => {
    if (!selectedMembers.find(m => m.id === user.id)) {
      const newMembers = [...selectedMembers, user];
      setSelectedMembers(newMembers);
      setData('members', newMembers.map(u => u.id));
    }
  };

  const removeMember = (userId) => {
    const newMembers = selectedMembers.filter(m => m.id !== userId);
    setSelectedMembers(newMembers);
    setData('members', newMembers.map(u => u.id));
  };

  if (loading) {
    return (
      <MainLayout title="Create Project">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Card className="bg-white border border-[#E2E8F0]">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-2 gap-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentWorkspace) {
    return (
      <MainLayout title="Create Project">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-[#F1F5F9] rounded-full flex items-center justify-center mb-4">
            <Briefcase className="h-12 w-12 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-medium text-[#0F172A] mb-2">No Workspace Selected</h3>
          <p className="text-[#64748B]">Please select a workspace to create projects.</p>
        </div>
      </MainLayout>
    );
  }

  if (!hasPermission('create_projects')) {
    return (
      <MainLayout title="Create Project">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-amber-500" />
            </div>
            <h3 className="text-lg font-medium text-[#0F172A] mb-2">Access Denied</h3>
            <p className="text-[#64748B] mb-4">Only workspace admins can create projects.</p>
            <Button onClick={() => router.visit('/projects')} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
              Back to Projects
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Create Project">
      <Head title="Create Project - CollabTool" />

      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Create New Project</h1>
              <p className="text-sm text-[#64748B]">
                Set up a new project in {currentWorkspace.name}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="bg-white border border-[#E2E8F0]">
            <CardHeader className="border-b border-[#E2E8F0]">
              <CardTitle className="text-[#0F172A]">Project Details</CardTitle>
              <CardDescription className="text-[#64748B]">
                Fill in the basic information for your project
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={submit} className="space-y-6">
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
                        className={`h-11 bg-white border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] ${errors.name ? 'border-red-500' : ''}`}
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
                          className={`h-11 bg-white border-[#E2E8F0] rounded-xl text-[#0F172A] ${errors.start_date ? 'border-red-500' : ''}`}
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
                          min={data.start_date || new Date().toISOString().split('T')[0]}
                          className={`h-11 bg-white border-[#E2E8F0] rounded-xl text-[#0F172A] ${errors.due_date ? 'border-red-500' : ''}`}
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
                        className={`bg-white border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] resize-none ${errors.description ? 'border-red-500' : ''}`}
                      />
                      {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                      <p className="text-xs text-[#94A3B8]">Help team members understand the project purpose</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-[#0F172A]">
                        Status
                      </Label>
                      <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                        <SelectTrigger className="h-11 bg-white border-[#E2E8F0] rounded-xl text-[#0F172A]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#E2E8F0]">
                          <SelectItem value="active" className="text-[#0F172A]">🟢 Active</SelectItem>
                          <SelectItem value="on_hold" className="text-[#0F172A]">⏸️ On Hold</SelectItem>
                          <SelectItem value="planning" className="text-[#0F172A]">📋 Planning</SelectItem>
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
                      {selectedMembers.map((member) => (
                        <Badge key={member.id} variant="secondary" className="flex items-center gap-1 bg-white border border-[#E2E8F0] text-[#0F172A]">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs bg-[rgba(79,70,229,0.08)] text-[#4F46E5]">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {member.name}
                          <button
                            type="button"
                            onClick={() => removeMember(member.id)}
                            className="ml-1 hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Select onValueChange={(value) => {
                      const user = members.find(u => u.id === parseInt(value));
                      if (user) addMember(user);
                    }}>
                      <SelectTrigger className="h-11 bg-white border-[#E2E8F0] rounded-xl text-[#0F172A]">
                        <SelectValue placeholder="Add team member..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E2E8F0]">
                        {members
                          .filter(m => !selectedMembers.find(sm => sm.id === m.id))
                          .filter(m => m.id !== auth?.user?.id)
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
                    {processing ? 'Creating...' : 'Create Project'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
