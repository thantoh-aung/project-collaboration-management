import { Head, Link, useForm, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CreateTaskModal from '@/Components/CreateTaskModal';
import EnhancedTaskDetailDrawer from '@/Components/EnhancedTaskDetailDrawer';
import TaskCard from '@/Components/TaskCard';
import { useWorkspace } from '@/Context/WorkspaceContext';
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
  Search, 
  Filter, 
  Calendar, 
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Paperclip,
  MessageSquare,
  Users,
  Timer,
  Tag
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Task Card Component
function SortableTaskCard({ task, index, onClick, labelColors, formatTime }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-1.5 cursor-pointer hover:shadow-sm transition-all border-l-2 border-l-transparent hover:border-l-blue-500 ${
        isDragging ? 'shadow-md opacity-50' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-2 relative">
        {/* Drag Handle - separated from click area */}
        <div 
          {...attributes}
          {...listeners}
          className="absolute top-1 right-1 p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
          </svg>
        </div>
        
        <h4 className="font-medium text-xs mb-1.5 line-clamp-2 leading-tight pr-6">{task.name}</h4>
        
        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {task.labels.slice(0, 2).map((label, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className={`text-[10px] h-4 px-1 ${labelColors[label] || 'bg-gray-100 text-gray-800'}`}
              >
                {label}
              </Badge>
            ))}
            {task.labels.length > 2 && (
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                +{task.labels.length - 2}
              </Badge>
            )}
          </div>
        )}
        
        {/* Bottom info */}
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5">
            {task.assignedToUser && (
              <Avatar className="h-4 w-4">
                <AvatarImage src={task.assignedToUser.avatar_url} />
                <AvatarFallback className="text-[8px]">
                  {task.assignedToUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}
            
            {task.time_estimate && (
              <div className="flex items-center gap-0.5 text-gray-500">
                <Timer className="h-2.5 w-2.5" />
                <span>{formatTime(task.time_estimate)}</span>
              </div>
            )}
            
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center gap-0.5 text-gray-500">
                <Paperclip className="h-2.5 w-2.5" />
                <span>{task.attachments.length}</span>
              </div>
            )}
            
            {task.subscribers && task.subscribers.length > 0 && (
              <div className="flex items-center gap-0.5 text-gray-500">
                <Users className="h-2.5 w-2.5" />
                <span>{task.subscribers.length}</span>
              </div>
            )}
          </div>
          
          {task.due_on && (
            <div className="flex items-center gap-0.5 text-gray-500">
              <Calendar className="h-2.5 w-2.5" />
              <span>{new Date(task.due_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectTasks({ project, tasks, taskGroups, teamMembers }) {
  const { userRole, user } = useWorkspace();
  const canCreateTasks = userRole !== 'client'; // Admin and Member can create, Client cannot
  
  // Filter team members to exclude clients (only team members can be assigned tasks)
  const assignableMembers = teamMembers?.filter(member => member.pivot?.role !== 'client') || [];
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [localTasks, setLocalTasks] = useState(tasks);
  
  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);
  
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    description: '',
    assigned_to_user_id: '',
    due_on: '',
    status: 'todo',
    time_estimate: '',
    labels: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(`/projects/${project.id}/tasks`, {
      onSuccess: () => {
        reset();
        setShowCreateForm(false);
      }
    });
  };

  // Use actual task groups from database
  const taskGroupsList = taskGroups || [];
  
  const taskStatuses = [
    { id: 'todo', name: 'To Do', color: 'bg-gray-100 text-gray-800', icon: Clock },
    { id: 'in-progress', name: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    { id: 'in-review', name: 'In Review', color: 'bg-purple-100 text-purple-800', icon: Users },
    { id: 'qa', name: 'QA', color: 'bg-orange-100 text-orange-800', icon: CheckCircle },
    { id: 'done', name: 'Done', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { id: 'deployed', name: 'Deployed', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
  ];

  const labelColors = {
    bug: 'bg-red-100 text-red-800',
    feature: 'bg-green-100 text-green-800',
    improvement: 'bg-blue-100 text-blue-800',
    urgent: 'bg-yellow-100 text-yellow-800',
    documentation: 'bg-purple-100 text-purple-800',
  };

  // Filter tasks based on search and filters
  const filteredTasks = localTasks?.filter(task => {
    // Search filter
    const matchesSearch = !searchTerm || 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Assignee filter
    const matchesAssignee = filterAssignee === 'all' || 
      (filterAssignee === 'unassigned' && !task.assigned_to_user_id) ||
      (task.assigned_to_user_id?.toString() === filterAssignee);
    
    // Status filter (for non-group mode)
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    
    return matchesSearch && matchesAssignee && matchesStatus;
  }) || [];

  // Group tasks by task group (if using groups) or by status
  const useTaskGroups = taskGroupsList.length > 0;
  
  console.log('🔍 Projects/Tasks.jsx Debug:', {
    totalTasks: localTasks?.length,
    filteredTasks: filteredTasks.length,
    taskGroups: taskGroupsList,
    useTaskGroups,
    firstTask: localTasks?.[0],
    firstGroup: taskGroupsList[0]
  });
  
  console.log('📋 All Tasks:', localTasks);
  console.log('📁 All Groups:', taskGroupsList);
  
  if (localTasks?.length > 0) {
    localTasks.forEach((task, idx) => {
      console.log(`Task ${idx + 1}:`, {
        id: task.id,
        name: task.name,
        group_id: task.group_id,
        task_group: task.task_group,
        status: task.status
      });
    });
  }
  
  const tasksByGroup = useTaskGroups 
    ? taskGroupsList.reduce((acc, group, index) => {
        // For the first group, include both assigned tasks and unassigned tasks
        if (index === 0) {
          acc[group.id] = filteredTasks.filter(task => 
            task.group_id === group.id || task.group_id === null
          );
        } else {
          acc[group.id] = filteredTasks.filter(task => task.group_id === group.id);
        }
        console.log(`📊 Group ${group.id} (${group.name}): ${acc[group.id].length} tasks`);
        return acc;
      }, {})
    : taskStatuses.reduce((acc, status) => {
        acc[status.id] = filteredTasks.filter(task => task.status === status.id);
        return acc;
      }, {});

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const taskId = parseInt(active.id);
    const newGroupId = parseInt(over.id);
    
    console.log('🔄 Drag & Drop:', { taskId, newGroupId, activeId: active.id, overId: over.id });
    
    // Validate group ID
    const validGroupIds = taskGroups.map(g => g.id);
    if (!validGroupIds.includes(newGroupId)) {
      console.error('❌ Invalid group ID:', newGroupId, 'Valid groups:', validGroupIds);
      return;
    }
    
    // Find the task being moved
    const task = localTasks.find(t => t.id === taskId);
    if (!task || task.group_id === newGroupId) return;
    
    console.log('📝 Moving task:', task.name, 'from group', task.group_id, 'to group', newGroupId);
    
    // Optimistic update
    const updatedTasks = localTasks.map(t => 
      t.id === taskId ? { ...t, group_id: newGroupId } : t
    );
    setLocalTasks(updatedTasks);
    
    // Update backend
    try {
      const response = await axios.patch(`/tasks/${taskId}`, {
        group_id: newGroupId
      });
      console.log('✅ Task updated successfully:', response.data);
    } catch (error) {
      console.error('❌ Failed to update task:', error.response?.data || error.message);
      // Revert on error
      setLocalTasks(tasks);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const formatTime = (minutes) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <>
      <Head title={`Tasks - ${project.name} - CollabTool`} />
      
      <MainLayout title={`Tasks - ${project.name}`}>
        <div className="h-full flex flex-col">
          {/* Compact Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Link href="/projects">
                  <Button variant="ghost" size="sm" className="h-8">
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
                  <p className="text-xs text-gray-500">{tasks?.length || 0} tasks</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    Filter
                  </Button>
                  {showFilters && (
                    <>
                      {/* Backdrop to close filter on outside click */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowFilters(false)}
                      />
                      <div 
                        className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium mb-1.5 block">Assignee</Label>
                            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Members</SelectItem>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {assignableMembers?.map(member => (
                                  <SelectItem key={member.id} value={member.id.toString()}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs flex-1"
                              onClick={() => {
                                setFilterAssignee('all');
                                setFilterStatus('all');
                              }}
                            >
                              Clear
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-7 text-xs flex-1"
                              onClick={() => setShowFilters(false)}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {canCreateTasks && (
                  <Button 
                    size="sm" 
                    className="h-8"
                    onClick={() => {
                      setSelectedGroupId(taskGroups?.[0]?.id || null);
                      setShowCreateModal(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    New Task
                  </Button>
                )}
              </div>
            </div>

            {/* Compact Stats */}
            <div className="flex gap-6 px-1">
              <div>
                <div className="text-xl font-bold text-gray-900">{localTasks?.length || 0}</div>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              {useTaskGroups ? (
                <>
                  {taskGroupsList.slice(0, 3).map((group) => (
                    <div key={group.id}>
                      <div className="text-xl font-bold text-gray-900">
                        {localTasks?.filter(t => t.group_id === group.id).length || 0}
                      </div>
                      <p className="text-xs text-gray-500">{group.name}</p>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      {localTasks?.filter(t => t.status === 'todo').length || 0}
                    </div>
                    <p className="text-xs text-gray-500">To Do</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      {localTasks?.filter(t => t.status === 'in-progress').length || 0}
                    </div>
                    <p className="text-xs text-gray-500">In Progress</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      {localTasks?.filter(t => ['done', 'deployed'].includes(t.status)).length || 0}
                    </div>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Compact Search */}
          <div className="mb-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                className="pl-8 h-8 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Kanban Board */}
          <div className="flex-1 overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className={`grid gap-3 min-w-[1200px]`} style={{ gridTemplateColumns: `repeat(${useTaskGroups ? taskGroupsList.length : taskStatuses.length}, minmax(240px, 1fr))` }}>
                {useTaskGroups ? (
                  // Render columns based on task groups from database
                  taskGroupsList.map((group) => {
                    const groupTasks = tasksByGroup[group.id] || [];
                    
                    return (
                      <div key={group.id} className="flex flex-col h-full">
                        <div className="flex items-center gap-1.5 mb-2 px-1">
                          <h3 className="font-medium text-xs text-gray-700 uppercase tracking-wide">{group.name}</h3>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {groupTasks.length}
                          </Badge>
                        </div>
                        
                        <div className="flex-1 min-h-[400px] p-1.5 rounded-md bg-gray-50/50">
                          <SortableContext
                            items={groupTasks.map(t => t.id.toString())}
                            strategy={verticalListSortingStrategy}
                          >
                            {groupTasks.map((task, index) => (
                              <SortableTaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowTaskDetail(true);
                                }}
                                labelColors={labelColors}
                                formatTime={formatTime}
                              />
                            ))}
                          </SortableContext>
                          
                          {/* Quick Add Button - Only for Admin/Member */}
                          {canCreateTasks && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-1 h-7 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                              onClick={() => {
                                setSelectedGroupId(group.id);
                                setShowCreateModal(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add task
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Fallback to status-based columns
                  taskStatuses.map((status) => {
                    const StatusIcon = status.icon;
                    const statusTasks = tasksByGroup[status.id] || [];
                    
                    return (
                      <div key={status.id} className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <StatusIcon className="h-4 w-4" />
                          <h3 className="font-medium text-sm">{status.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {statusTasks.length}
                          </Badge>
                        </div>
                        
                        <div className="flex-1 min-h-[400px] p-2 rounded-lg bg-gray-50">
                          <SortableContext
                            items={statusTasks.map(t => t.id.toString())}
                            strategy={verticalListSortingStrategy}
                          >
                            {statusTasks.map((task, index) => (
                              <SortableTaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowTaskDetail(true);
                                }}
                                labelColors={labelColors}
                                formatTime={formatTime}
                              />
                            ))}
                          </SortableContext>
                          
                          {/* Quick Add Button - Only for Admin/Member */}
                          {canCreateTasks && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2 text-gray-500 hover:text-gray-700"
                              onClick={() => {
                                setSelectedGroupId(null);
                                setShowCreateModal(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add task
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </DndContext>
          </div>
        </div>

        {/* Create Task Modal */}
        <CreateTaskModal
          open={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedGroupId(null);
          }}
          projectId={project.id}
          groupId={selectedGroupId || taskGroupsList[0]?.id}
          projectMembers={teamMembers || []}
          onSuccess={() => {
            router.reload({ only: ['tasks'] });
          }}
        />

        {/* Enhanced Task Detail Drawer */}
        <EnhancedTaskDetailDrawer
          task={selectedTask}
          open={showTaskDetail}
          onClose={() => {
            setShowTaskDetail(false);
            setSelectedTask(null);
            router.reload({ only: ['tasks'] });
          }}
          teamMembers={assignableMembers}
          taskGroups={taskGroupsList}
          projectId={project.id}
        />
      </MainLayout>
    </>
  );
}
