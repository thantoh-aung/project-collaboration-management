import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useWorkspace } from '@/Context/WorkspaceContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  Calendar,
  Users,
  Filter,
  MoreHorizontal,
  User,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import ErrorBoundary from '@/Components/ErrorBoundary';
import EnhancedTaskDetailDrawer from '@/Components/EnhancedTaskDetailDrawer';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ProjectWorkspace() {
  return (
    <ErrorBoundary>
      <ProjectWorkspaceContent />
    </ErrorBoundary>
  );
}

function ProjectWorkspaceContent() {
  const { props, auth } = usePage();
  const { currentWorkspace, userRole, loading, error, hasPermission } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    assigned_to_user_id: '',
    due_on: '',
    group_id: ''
  });

  const project = props.project;
  const canCreateTasks = hasPermission('create_tasks');
  const canEditTasks = hasPermission('edit_tasks');
  
  // Check if user can edit a specific task
  const canEditTask = (task) => {
    // Admins can edit any task
    if (auth?.user?.role === 'admin' || canEditTasks) return true;
    
    // Clients cannot edit tasks
    if (auth?.user?.role === 'client') return false;
    
    // Members can edit tasks if:
    // 1. Task is unassigned (assigned_to_user_id is null)
    // 2. Task is assigned to them
    // 3. Task was created by them
    const assignedUserId = task.assigned_to_user_id;
    const currentUserId = auth?.user?.id;
    const createdById = task.created_by_user_id;
    
    // Unassigned tasks can be edited by all team members
    if (assignedUserId == null) {
      return true;
    }
    
    // Assigned tasks can only be edited by the assigned user or creator
    return assignedUserId == currentUserId || createdById == currentUserId;
  };
  
  // Filter team members to exclude clients (only team members can be assigned tasks)
  const assignableMembers = project?.members?.filter(member => member.pivot?.role !== 'client') || [];

  // Handle workspace context errors
  if (error) {
    return (
      <MainLayout title={project?.name || 'Project'}>
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Workspace Error</h3>
          <p className="text-gray-500 mb-4">
            {error.message || 'Failed to load workspace information.'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (loading || loadingTasks) {
    return (
      <MainLayout title={project?.name || 'Project'}>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          
          {/* Kanban Board Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-16" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <Card key={j} className="p-3">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-3/4" />
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentWorkspace) {
    return (
      <MainLayout title={project?.name || 'Project'}>
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Workspace Selected</h3>
          <p className="text-gray-500 mb-4">Please select a workspace to view projects.</p>
          <Button onClick={() => router.visit('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Load tasks and groups
  useEffect(() => {
    if (project?.id && currentWorkspace?.id) {
      loadProjectData();
    }
  }, [project?.id, currentWorkspace?.id]);

  const loadProjectData = async () => {
    try {
      setLoadingTasks(true);

      if (!currentWorkspace?.id) {
        return;
      }
      
      // Load tasks
      const tasksResponse = await fetch(`/api/workspaces/${currentWorkspace.id}/projects/${project.id}/tasks`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        console.log('📋 Tasks API Response:', tasksData);
        console.log('📋 Tasks Array:', tasksData.tasks);
        setTasks(tasksData.tasks || []);
      } else {
        console.error('❌ Tasks API failed:', tasksResponse.status, tasksResponse.statusText);
      }

      // Load groups
      const groupsResponse = await fetch(`/api/workspaces/${currentWorkspace.id}/projects/${project.id}/groups`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        console.log('📁 Groups API Response:', groupsData);
        console.log('📁 Groups Array:', groupsData.groups);
        setGroups(groupsData.groups || []);
        // Set default group for new tasks
        if (groupsData.groups?.length > 0) {
          setTaskForm(prev => ({ ...prev, group_id: String(groupsData.groups[0].id) }));
        }
      } else {
        console.error('❌ Groups API failed:', groupsResponse.status, groupsResponse.statusText);
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Find the task being moved
    const task = tasks.find(t => String(t.id) === String(draggableId));
    if (!task) return;
    
    // Check if user can edit this specific task
    if (!canEditTask(task)) {
      console.log('🔍 Drag denied: User cannot edit this task');
      return;
    }

    const newGroupId = parseInt(destination.droppableId, 10);
    const newOrderColumn = destination.index;

    // Optimistic update
    const newTasks = tasks.map(t => {
      if (t.id !== task.id) return t;
      return {
        ...t,
        group_id: newGroupId,
        order_column: newOrderColumn,
      };
    });
    setTasks(newTasks);

    // Update on server
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          group_id: newGroupId,
          order_column: newOrderColumn
        })
      });

      if (!response.ok) {
        // Revert optimistic update if server fails
        loadProjectData();
      } else {
        loadProjectData();
      }
    } catch (error) {
      console.error('Failed to update task position:', error);
      loadProjectData();
    }
  };

  const handleCreateTask = async () => {
    if (!canCreateTasks) return;
    const optimisticTask = {
      id: `temp-${Date.now()}`,
      ...taskForm,
      project_id: project.id,
      assigned_to_user: taskForm.assigned_to_user_id ? { id: taskForm.assigned_to_user_id, name: '', avatar: null } : null,
      task_group: groups.find(g => g.id === taskForm.group_id),
      order_column: (tasksByGroup[taskForm.group_id]?.length || 0) * 1000,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setTasks(prev => [...prev, optimisticTask]);
    setTaskForm({
      name: '',
      description: '',
      assigned_to_user_id: '',
      due_on: '',
      group_id: groups[0]?.id || ''
    });
    setIsTaskDialogOpen(false);

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...taskForm,
          project_id: project.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const { task } = await response.json();
      // Replace optimistic task with real one
      setTasks(prev => prev.map(t => t.id === optimisticTask.id ? task : t));
    } catch (error) {
      console.error('Failed to create task:', error);
      // Remove optimistic task and reload
      setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
      loadProjectData();
    }
  };

  // Group tasks by group_id
  const tasksByGroup = {};
  groups.forEach(group => {
    tasksByGroup[group.id] = tasks
      .filter(task => task.group_id === group.id)
      .sort((a, b) => (a.order_column ?? 0) - (b.order_column ?? 0));
  });

  console.log('🎯 State Check:', {
    tasksCount: tasks.length,
    groupsCount: groups.length,
    tasksByGroup,
    tasks,
    groups
  });

  return (
    <MainLayout title={project?.name || 'Project'}>
      <Head title={`${project?.name} - CollabTool`} />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{project?.name}</h1>
            <p className="text-sm text-gray-500">{project?.description}</p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary" className="text-xs">
                {project?.status?.replace('_', ' ') || 'Active'}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                Created {new Date(project?.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                {project?.team_members?.length || 0} members
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'board' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('board')}
            >
              Board
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            {canCreateTasks && (
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add a new task to your project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Title</Label>
                      <Input
                        id="name"
                        value={taskForm.name}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter task title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={taskForm.description}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter task description"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="assignee">Assignee</Label>
                        <Select value={taskForm.assigned_to_user_id} onValueChange={(value) => setTaskForm(prev => ({ ...prev, assigned_to_user_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {project?.members?.map(member => (
                              <SelectItem key={member.id} value={String(member.id)}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="due_on">Due Date</Label>
                        <Input
                          id="due_on"
                          type="date"
                          value={taskForm.due_on}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, due_on: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group">Column</Label>
                      <Select value={taskForm.group_id} onValueChange={(value) => setTaskForm(prev => ({ ...prev, group_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={String(group.id)}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTask}>
                      Create Task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Tasks</span>
                <span className="text-2xl font-bold text-gray-900">{tasks.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Completed</span>
                <span className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.completed_at).length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">In Progress</span>
                <span className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => !t.completed_at).length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Overdue</span>
                <span className="text-2xl font-bold text-red-600">
                  {tasks.filter(t => t.due_on && new Date(t.due_on) < new Date() && !t.completed_at).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DEBUG PANEL - Remove after fixing */}
        <Card className="bg-yellow-50 border-2 border-yellow-400">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-yellow-900">🔍 DEBUG INFO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Tasks Count: <span className="text-lg">{tasks.length}</span></p>
                <p className="font-semibold">Groups Count: <span className="text-lg">{groups.length}</span></p>
              </div>
              <div>
                <p className="font-semibold">Tasks by Group:</p>
                {Object.keys(tasksByGroup).map(groupId => (
                  <p key={groupId}>Group {groupId}: {tasksByGroup[groupId]?.length || 0} tasks</p>
                ))}
              </div>
            </div>
            {tasks.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer font-semibold">First Task Data</summary>
                <pre className="mt-2 p-2 bg-white rounded text-[10px] overflow-auto max-h-40">
                  {JSON.stringify(tasks[0], null, 2)}
                </pre>
              </details>
            )}
            {groups.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer font-semibold">First Group Data</summary>
                <pre className="mt-2 p-2 bg-white rounded text-[10px] overflow-auto max-h-40">
                  {JSON.stringify(groups[0], null, 2)}
                </pre>
              </details>
            )}
            {tasks.length === 0 && groups.length === 0 && (
              <p className="text-red-600 font-bold">⚠️ NO DATA LOADED - Check console for API errors</p>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Kanban Board */}
          {viewMode === 'board' && (
            <div className="lg:col-span-3">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                  {groups.map((group) => (
                    <Card key={group.id} className="border border-gray-200 bg-gray-50">
                      <CardHeader className="pb-2 bg-white border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold text-gray-700">{group.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                              {tasksByGroup[group.id]?.length || 0}
                            </Badge>
                            {canCreateTasks && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setTaskForm(prev => ({ ...prev, group_id: String(group.id) }));
                                  setIsTaskDialogOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <Droppable droppableId={String(group.id)} isDropDisabled={!canEditTasks && !tasks.some(task => canEditTask(task))}>
                        {(provided, snapshot) => (
                          <CardContent
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-3 min-h-[200px] p-3 ${
                              snapshot.isDraggingOver ? 'bg-gray-50' : ''
                            }`}
                          >
                            {tasksByGroup[group.id]?.map((task, index) => (
                              <Draggable key={task.id} draggableId={String(task.id)} index={index} isDragDisabled={!canEditTask(task)}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`${
                                      snapshot.isDragging ? 'opacity-50' : ''
                                    }`}
                                  >
                                    <Card 
                                      className="cursor-pointer hover:shadow-md transition-shadow bg-white border border-gray-200"
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setShowTaskDetail(true);
                                      }}
                                    >
                                      <CardContent className="p-3 space-y-2">
                                        <div className="flex items-start justify-between">
                                          <h4 className="text-sm font-medium leading-tight">{task.name}</h4>
                                          {canEditTask(task) && (
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="sm" 
                                                  className="h-6 w-6 p-0"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedTask(task);
                                                  setShowTaskDetail(true);
                                                }}>
                                                  Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                  className="text-red-600"
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Are you sure you want to delete this task?')) {
                                                      try {
                                                        await fetch(`/api/workspaces/${currentWorkspace.id}/tasks/${task.id}`, {
                                                          method: 'DELETE',
                                                          headers: {
                                                            'X-Requested-With': 'XMLHttpRequest',
                                                          }
                                                        });
                                                        loadProjectData();
                                                      } catch (error) {
                                                        console.error('Failed to delete task:', error);
                                                      }
                                                    }
                                                  }}
                                                >
                                                  Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          )}
                                        </div>
                                        {task.description && (
                                          <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          {task.assigned_to_user && (
                                            <div className="flex items-center gap-1">
                                              <Avatar className="h-5 w-5">
                                                <AvatarImage src={task.assigned_to_user.avatar_url} />
                                                <AvatarFallback className="text-[10px]">
                                                  {task.assigned_to_user.name?.charAt(0)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <span>{task.assigned_to_user.name}</span>
                                            </div>
                                          )}
                                          {task.due_on && (
                                            <div className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              <span>{new Date(task.due_on).toLocaleDateString()}</span>
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {(!tasksByGroup[group.id] || tasksByGroup[group.id].length === 0) && (
                              <div className="text-center text-gray-400 py-8">
                                <p className="text-sm">No tasks</p>
                              </div>
                            )}
                            {provided.placeholder}
                          </CardContent>
                        )}
                      </Droppable>
                    </Card>
                  ))}
                </div>
              </DragDropContext>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>All tasks in the project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{task.name}</h4>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <Badge variant="outline">{task.task_group?.name}</Badge>
                            {task.assigned_to_user && (
                              <span>Assigned to {task.assigned_to_user.name}</span>
                            )}
                            {task.due_on && (
                              <span>Due {new Date(task.due_on).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        {canEditTasks && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        <p className="text-sm">No tasks yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
                <CardDescription>
                  Refine your task view
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Info */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Project Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <Badge variant="secondary" className="text-xs">
                        {project?.status?.replace('_', ' ') || 'Active'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Created</span>
                      <span className="text-sm text-gray-900">
                        {new Date(project?.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Team Size</span>
                      <span className="text-sm text-gray-900">
                        {project?.team_members?.length || 0} members
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                    {hasPermission('manage_users') && (
                      <Button variant="outline" size="sm" className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Invite Members
                      </Button>
                    )}
                  </div>
                </div>

                {/* Groups */}
                {groups.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Columns</h4>
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center justify-between">
                          <span className="text-sm">{group.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {tasksByGroup[group.id]?.length || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Members */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Team Members</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Unassigned</span>
                    </div>
                    {/* Add actual team members here */}
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Due Date</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="overdue" />
                      <Label htmlFor="overdue" className="text-sm">Overdue</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="due-today" />
                      <Label htmlFor="due-today" className="text-sm">Due Today</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="due-week" />
                      <Label htmlFor="due-week" className="text-sm">Due This Week</Label>
                    </div>
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Labels</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">Bug</Badge>
                    <Badge variant="outline" className="text-xs">Feature</Badge>
                    <Badge variant="outline" className="text-xs">Enhancement</Badge>
                    <Badge variant="outline" className="text-xs">Urgent</Badge>
                    <Badge variant="outline" className="text-xs">Documentation</Badge>
                    <Badge variant="outline" className="text-xs">Review</Badge>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Priority</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="priority-high" className="rounded" />
                      <Label htmlFor="priority-high" className="text-sm">High</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="priority-medium" className="rounded" />
                      <Label htmlFor="priority-medium" className="text-sm">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="priority-low" className="rounded" />
                      <Label htmlFor="priority-low" className="text-sm">Low</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Task Detail Drawer */}
      <EnhancedTaskDetailDrawer
        task={selectedTask}
        open={showTaskDetail}
        onClose={() => {
          setShowTaskDetail(false);
          setSelectedTask(null);
          loadProjectData(); // Reload tasks after closing drawer
        }}
        teamMembers={assignableMembers}
        taskGroups={groups}
        projectId={project?.id}
      />
    </MainLayout>
  );
}
