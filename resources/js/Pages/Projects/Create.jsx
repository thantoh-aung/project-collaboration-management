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

  // Handle workspace context errors
  if (error) {
    return (
      <MainLayout title="Create Project">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Workspace Error</h3>
          <p className="text-gray-400 mb-4">
            {error.message || 'Failed to load workspace information.'}
          </p>
          <Button onClick={() => window.location.reload()}>
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
    start_date: new Date().toISOString().split('T')[0], // Default to today
    due_date: '',
    members: [],
  });

  const submit = (e) => {
    e.preventDefault();
    
    // Debug logging
    console.log('🔍 Creating project with data:', data);
    console.log('🔍 Status being submitted:', data.status);
    
    post('/projects', {
      onSuccess: () => {
        console.log('🔍 Project created successfully!');
        router.visit('/projects');
      },
      onError: (errors) => {
        console.error('🔍 Form errors:', errors);
      },
    });
  };

  // Get workspace users from props
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
            <Card>
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
                <Skeleton className="h-10 w-full" />
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
          <div className="mx-auto w-24 h-24 bg-gray-900/30 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Workspace Selected</h3>
          <p className="text-gray-400">Please select a workspace to create projects.</p>
        </div>
      </MainLayout>
    );
  }

  if (!hasPermission('create_projects')) {
    return (
      <MainLayout title="Create Project">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-yellow-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Access Denied</h3>
            <p className="text-gray-400 mb-4">Only workspace admins can create projects.</p>
            <Button onClick={() => router.visit('/projects')}>
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
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">Create New Project</h1>
              <p className="text-sm text-gray-400">
                Set up a new project in {currentWorkspace.name}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
            <CardHeader className="border-b border-slate-600">
              <CardTitle className="text-gray-900">Project Details</CardTitle>
              <CardDescription className="text-gray-400">
                Fill in the basic information for your project
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={submit} className="space-y-6">
                {/* Essential Information */}
                <div className="border-l-4 border-l-blue-600 pl-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Essential Information</h3>
                  <div className="space-y-4">
                    {/* Project Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                        Project Name <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Enter project name"
                        className={`h-11 bg-slate-700 border-slate-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-white ${errors.name ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                        required
                      />
                      {errors.name && (
                        <p className="text-sm text-red-400 mt-1">{errors.name}</p>
                      )}
                      <p className="text-xs text-gray-400">Give your project a clear, descriptive name</p>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Start Date */}
                      <div className="space-y-2">
                        <Label htmlFor="start_date" className="text-sm font-medium text-gray-300">
                          Start Date <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={data.start_date}
                          onChange={(e) => {
                            setData('start_date', e.target.value);
                            // Validate due date when start date changes
                            if (data.due_date && new Date(e.target.value) > new Date(data.due_date)) {
                              setData('due_date', '');
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]} // Can't select past dates
                          className={`h-11 bg-slate-700 border-slate-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-white ${errors.start_date ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                          required
                        />
                        {errors.start_date && (
                          <p className="text-sm text-red-400 mt-1">{errors.start_date}</p>
                        )}
                        <p className="text-xs text-gray-500">When the project begins</p>
                      </div>

                      {/* Due Date */}
                      <div className="space-y-2">
                        <Label htmlFor="due_date" className="text-sm font-medium text-gray-300">
                          Due Date <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={data.due_date}
                          onChange={(e) => setData('due_date', e.target.value)}
                          min={data.start_date || new Date().toISOString().split('T')[0]} // Must be after start date
                          className={`h-11 bg-slate-700 border-slate-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-white ${errors.due_date ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                          required
                        />
                        {errors.due_date && (
                          <p className="text-sm text-red-400 mt-1">{errors.due_date}</p>
                        )}
                        <p className="text-xs text-gray-400">Project completion target</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Information */}
                <div className="border-l-4 border-l-gray-300 pl-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
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
                        className={`bg-slate-700 border-slate-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-white resize-none ${errors.description ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-400 mt-1">{errors.description}</p>
                      )}
                      <p className="text-xs text-gray-500">Help team members understand the project purpose</p>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-300">
                        Status
                      </Label>
                      <Select
                        value={data.status}
                        onValueChange={(value) => setData('status', value)}
                      >
                        <SelectTrigger className="h-11 bg-slate-700 border-slate-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600 shadow-lg shadow-blue-600/20">
                          <SelectItem value="active" className="hover:bg-slate-700/50 text-white">🟢 Active</SelectItem>
                          <SelectItem value="on_hold" className="hover:bg-slate-700/50 text-white">⏸️ On Hold</SelectItem>
                          <SelectItem value="planning" className="hover:bg-slate-700/50 text-white">📋 Planning</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.status && (
                        <p className="text-sm text-red-400 mt-1">{errors.status}</p>
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
                  <div className="border border-slate-600 rounded-xl p-4 space-y-3 bg-slate-700/30">
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((member) => (
                        <Badge key={member.id} variant="secondary" className="flex items-center gap-1 bg-slate-800 border-slate-600">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs bg-gray-100">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {member.name}
                          <button
                            type="button"
                            onClick={() => removeMember(member.id)}
                            className="ml-1 hover:text-red-400 transition-colors"
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
                      <SelectTrigger className="h-11 bg-slate-700 border-slate-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-white">
                        <SelectValue placeholder="Add team member..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600 shadow-lg shadow-blue-600/20">
                        {members
                          .filter(m => !selectedMembers.find(sm => sm.id === m.id))
                          .filter(m => m.id !== auth?.user?.id) // Exclude current user (creator)
                          .map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()} className="hover:bg-slate-700/50">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="text-xs bg-slate-700">
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                {member.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400">Add team members who will work on this project</p>
                  </div>
                </div>

                
                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-600">
                  <Link href="/projects">
                    <Button type="button" variant="outline" className="border-slate-600 text-gray-400 hover:bg-slate-700">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={processing} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
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
