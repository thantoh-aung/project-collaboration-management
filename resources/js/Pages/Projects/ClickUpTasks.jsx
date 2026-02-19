import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import EnhancedTaskDetailDrawer from '@/Components/EnhancedTaskDetailDrawer';
import ClickUpTaskGroup from '@/Components/ClickUpTaskGroup';
import AddGroupButton from '@/Components/AddGroupButton';
import { DragDropContext } from '@hello-pangea/dnd';
import { useWorkspace } from '@/Context/WorkspaceContext';
import ClickUpTaskList from '@/Components/ClickUpTaskList';
import { ArrowLeft, Search, Filter, LayoutGrid, List, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

export default function ClickUpTasks({ project, tasks, taskGroups, teamMembers }) {
    const { props, auth } = usePage();
    const { userRole } = useWorkspace();
    const user = auth?.user || props?.auth?.user;
    
        const [localTasks, setLocalTasks] = useState(tasks || []);
    const [localGroups, setLocalGroups] = useState(taskGroups || []);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [requireAttachment, setRequireAttachment] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('board');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        assignee: 'all',
        dueDate: 'all'
    });
    const [isDragging, setIsDragging] = useState(false);
    const [pendingMove, setPendingMove] = useState(null);
    const [dragError, setDragError] = useState(null);

    const canEditTasks = userRole !== 'client';

    // Debug logging for team members
    console.log('🔍 ClickUpTasks - Team Members Debug:', {
        teamMembers: teamMembers,
        teamMembersCount: teamMembers?.length || 0,
        teamMembersData: teamMembers?.map(m => ({
            id: m.id,
            name: m.name,
            role: m.pivot?.role,
            hasPivot: !!m.pivot
        }))
    });

    // Filter team members to exclude clients (only team members can be assigned tasks)
    const assignableMembers = teamMembers?.filter(member => member.pivot?.role !== 'client') || [];
    
    console.log('🔍 ClickUpTasks - Assignable Members Debug:', {
        assignableMembers,
        assignableMembersCount: assignableMembers.length,
        assignableMembersData: assignableMembers.map(m => ({
            id: m.id,
            name: m.name,
            role: m.pivot?.role
        }))
    });

    // Sort groups by position (Kanban ordering)
    const sortedGroups = [...(localGroups || [])].sort((a, b) => {
        // Handle missing position (fallback to order_column for backward compatibility)
        const aPos = a.position !== undefined ? a.position : a.order_column || 999;
        const bPos = b.position !== undefined ? b.position : b.order_column || 999;
        return aPos - bPos;
    });

    // Filter tasks based on search and filters
    const filteredTasks = localTasks?.filter(task => {
        // Search filter
        const matchesSearch = !searchTerm ||
            task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (!matchesSearch) return false;
        
        // Status filter
        if (filters.status !== 'all') {
            const taskGroup = localGroups.find(g => g.id === task.group_id);
            if (!taskGroup || taskGroup.name !== filters.status) return false;
        }
        
        // Priority filter
        if (filters.priority !== 'all') {
            if (task.priority !== filters.priority) return false;
        }
        
        // Assignee filter
        if (filters.assignee !== 'all') {
            if (filters.assignee === 'unassigned') {
                if (task.assigned_to_user_id) return false;
            } else {
                if (task.assigned_to_user_id != filters.assignee) return false;
            }
        }
        
        // Due date filter
        if (filters.dueDate !== 'all') {
            const dueDate = task.due_on || task.due_date;
            if (!dueDate) return false;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const taskDueDate = new Date(dueDate);
            taskDueDate.setHours(0, 0, 0, 0);
            
            switch (filters.dueDate) {
                case 'overdue':
                    if (taskDueDate >= today) return false;
                    break;
                case 'today':
                    if (taskDueDate.getTime() !== today.getTime()) return false;
                    break;
                case 'week':
                    const weekFromNow = new Date(today);
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    if (taskDueDate < today || taskDueDate > weekFromNow) return false;
                    break;
            }
        }
        
        return true;
    }) || [];

    // ─── Authorization Check ─────────────────────────────────────
    const canMoveTask = useCallback((task) => {
        // Clients cannot move tasks
        if (userRole === 'client') return false;
        
        // Admins can move any task
        if (userRole === 'admin') return true;
        
        // Members can move tasks if:
        // 1. Task is unassigned (assigned_to_user_id is null) - any team member can move
        // 2. Task is assigned to them
        // 3. Task was created by them
        if (userRole === 'member') {
            const assignedUserId = task.assigned_to_user_id;
            const currentUserId = user?.id;
            const createdById = task.created_by_user_id;
            
            // Unassigned tasks can be moved by all team members (matches drawer logic)
            if (assignedUserId == null) {
                console.log('🔍 Unassigned task - allowing move for team member', {
                    taskId: task.id,
                    taskName: task.name,
                    userId: currentUserId,
                    assignedUserId
                });
                return true;
            }
            
            // Assigned tasks can only be moved by the assigned user or creator
            return assignedUserId == currentUserId || createdById == currentUserId;
        }
        
        return false;
    }, [userRole, user]);

    // ─── Drag & Drop ───────────────────────────────────────────
    const handleDragEnd = useCallback(async (result) => {
        const { draggableId, source, destination } = result;
        
        // Reset drag error state
        setDragError(null);
        setIsDragging(false);
        
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const taskId = parseInt(draggableId);
        const originalGroupId = parseInt(source.droppableId);
        const newGroupId = parseInt(destination.droppableId);
        const newGroup = localGroups.find(g => g.id === newGroupId);
        const originalGroup = localGroups.find(g => g.id === originalGroupId);
        const task = localTasks.find(t => t.id === taskId);
        
        if (!task || !newGroup || !originalGroup) {
            console.error('❌ Invalid drag operation: missing task or group data');
            return;
        }

        // Authorization check
        if (!canMoveTask(task)) {
            setDragError('You do not have permission to move this task.');
            return;
        }

        const isComplete = newGroup.name === 'Complete';
        const isInProgress = newGroup.name === 'In Progress';
        const requiresAttachment = isInProgress || isComplete;
        const hasAttachments = task.attachments && task.attachments.length > 0;

        // Attachment validation for status changes
        if (requiresAttachment && !hasAttachments) {
            // Store pending move for later completion
            setPendingMove({
                taskId,
                originalGroupId,
                newGroupId,
                task: { ...task }
            });

            // Show task detail drawer for adding attachments
            setSelectedTask(task);
            setShowTaskDetail(true);
            setRequireAttachment(true);
            
            // Show warning message (not error)
            setDragError(`Attachment required to move task to "${newGroup.name}". Please add at least one file.`);
            return;
        }

        // Store original state for rollback
        const originalTasks = [...localTasks];
        
        // Optimistic update
        setLocalTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, group_id: newGroupId, completed: isComplete } : t
        ));

        try {
            setIsDragging(true);
            
            console.log('🔍 Drag-and-drop API call:', {
                taskId: taskId,
                taskName: task.name,
                assignedTo: task.assigned_to_user_id,
                currentUserId: user?.id,
                canMoveTask: canMoveTask(task),
                fromGroup: originalGroupId,
                toGroup: newGroupId,
                workspaceId: project.workspace_id,
                url: `/api/workspaces/${project.workspace_id}/tasks/${taskId}`,
                payload: { group_id: newGroupId, completed: isComplete }
            });

            const response = await axios.patch(`/api/workspaces/${project.workspace_id}/tasks/${taskId}`, {
                group_id: newGroupId,
                completed: isComplete,
            }, { 
                headers: { 'Accept': 'application/json' },
                timeout: 10000
            });

            console.log('✅ Drag-and-drop API success:', response.data);

            // Success - clear any pending moves
            setPendingMove(null);
            
        } catch (error) {
            console.error('❌ Failed to move task:', error.response?.data || error.message);
            console.error('❌ Full error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.config?.data
                }
            });
            
            // Rollback with animation
            setLocalTasks(originalTasks);
            
            // Show specific error message
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               'Failed to move task. Please try again.';
            
            setDragError(errorMessage);
            
            // Clear error after 3 seconds
            setTimeout(() => setDragError(null), 3000);
        } finally {
            setIsDragging(false);
        }
    }, [localGroups, localTasks, canMoveTask]);

    // ─── Complete Pending Move ───────────────────────────────────
    const completePendingMove = useCallback(async () => {
        if (!pendingMove) return;

        const { taskId, newGroupId, task } = pendingMove;
        const newGroup = localGroups.find(g => g.id === newGroupId);
        const isComplete = newGroup?.name === 'Complete';

        try {
            setIsDragging(true);
            
            await axios.patch(`/api/workspaces/${project.workspace_id}/tasks/${taskId}`, {
                group_id: newGroupId,
                completed: isComplete,
            }, { 
                headers: { 'Accept': 'application/json' },
                timeout: 10000
            });

            // Update local state
            setLocalTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, group_id: newGroupId, completed: isComplete } : t
            ));

            // Clear pending move
            setPendingMove(null);
            setRequireAttachment(false);
            
        } catch (error) {
            console.error('❌ Failed to complete pending move:', error.response?.data || error.message);
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               'Failed to move task. Please try again.';
            
            setDragError(errorMessage);
            setTimeout(() => setDragError(null), 3000);
        } finally {
            setIsDragging(false);
        }
    }, [pendingMove, localGroups]);

    // ─── Handle Drawer Close with Validation ─────────────────────
    const handleDrawerClose = useCallback(() => {
        if (pendingMove) {
            // Rollback the move if drawer is closed without completing
            setLocalTasks(prev => prev.map(t =>
                t.id === pendingMove.taskId ? { ...t, group_id: pendingMove.originalGroupId } : t
            ));
            
            setDragError('Attachment required to change task status. Task moved back to original group.');
            setTimeout(() => setDragError(null), 3000);
            
            setPendingMove(null);
            setRequireAttachment(false);
        }
        
        setShowTaskDetail(false);
        setSelectedTask(null);
    }, [pendingMove]);

    // ─── Task Click ────────────────────────────────────────────
    const handleTaskClick = useCallback((task) => {
        setSelectedTask(task);
        setShowTaskDetail(true);
    }, []);

    // ─── Toggle Complete ───────────────────────────────────────
    const handleToggleTaskComplete = useCallback(async (task) => {
        const currentGroup = localGroups.find(g => g.id === task.group_id);
        const isCompleted = task.completed || currentGroup?.name === 'Complete';
        const targetGroupName = isCompleted ? 'To Do' : 'Complete';
        const targetGroup = localGroups.find(g => g.name === targetGroupName);
        if (!targetGroup) return;

        // Optimistic
        setLocalTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, group_id: targetGroup.id, completed: !isCompleted } : t
        ));

        try {
            await axios.patch(`/api/workspaces/${project.workspace_id}/tasks/${task.id}`, {
                group_id: targetGroup.id,
                completed: !isCompleted,
            }, { headers: { 'Accept': 'application/json' } });
        } catch (error) {
            console.error('❌ Failed to toggle:', error.response?.data || error.message);
            setLocalTasks(tasks);
        }
    }, [localGroups, tasks]);

    // ─── Add Task (optimistic) ─────────────────────────────────
    const handleAddTask = useCallback(async (taskData) => {
        const tempId = `temp-${Date.now()}`;
        const tempTask = {
            id: tempId,
            name: taskData.name,
            group_id: taskData.group_id,
            project_id: project.id,
            completed: false,
            rootSubtasks: [],
            comments: [],
            attachments: [],
            assigned_to_user: null,
            created_by_user: user,
        };
        setLocalTasks(prev => [...prev, tempTask]);

        try {
            console.log('🔍 Sending task creation request:', {
                ...taskData,
                project_id: project.id,
                _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            });
            
            const response = await axios.post(`/tasks`, {
                ...taskData,
                project_id: project.id,
                _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            }, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });

            console.log('🔍 Response status:', response.status);
            console.log('🔍 Response headers:', response.headers);
            console.log('🔍 Response data:', response.data);

            const newTask = response.data.task || response.data;
            console.log('🔍 New task created:', newTask);
            console.log('🔍 Task group_id:', newTask.group_id, 'Task task_group_id:', newTask.task_group_id);
            console.log('🔍 All tasks before update:', localTasks);
            
            setLocalTasks(prev => {
                const updated = prev.map(t =>
                    t.id === tempId
                        ? { ...newTask, rootSubtasks: newTask.rootSubtasks || [], comments: [], attachments: [] }
                        : t
                );
                console.log('🔍 Updated tasks list:', updated);
                return updated;
            });
        } catch (error) {
            console.error('❌ Failed to create task:', error.response?.data || error.message);
            
            // Show validation errors to user
            if (error.response?.status === 422) {
                console.error('❌ Validation errors:', error.response.data.errors);
                // You could add a toast notification here
            }
            
            setLocalTasks(prev => prev.filter(t => t.id !== tempId));
        }
    }, [project.id, user]);

    // ─── Add Group ─────────────────────────────────────────────
    const handleAddGroup = useCallback(async (groupData) => {
        try {
            console.log('🔍 Creating group:', groupData);
            const response = await axios.post(`/groups`, {
                ...groupData,
                project_id: project.id,
                _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            }, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });

            console.log('🔍 Group creation response:', response.data);

            if (response.data.success) {
                // Optimistically add the new group to local state
                const newGroup = response.data.group;
                console.log('🔍 Adding new group to state:', newGroup);
                
                setLocalGroups(prev => {
                    const updated = [...prev, newGroup];
                    console.log('🔍 Updated groups list:', updated);
                    return updated;
                });
                
                // Show success message to user
                alert('Group created successfully!');
            } else {
                console.error('❌ Failed to create group:', response.data.message);
                alert(`Failed to create group: ${response.data.message}`);
            }
        } catch (error) {
            console.error('❌ Failed to create group:', error.response?.data || error.message);
            alert(`Failed to create group: ${error.response?.data?.message || error.message}`);
        }
    }, [project.id, project.workspace_id]);

    // ─── Rename Group ─────────────────────────────────────────────
    const handleRenameGroup = useCallback(async (groupId, newName) => {
        try {
            const response = await axios.patch(`/groups/${groupId}`, {
                name: newName,
            }, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });

            if (response.data.success) {
                const updatedGroup = response.data.group || response.data;
                setLocalGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
            } else {
                console.error('❌ Failed to rename group:', response.data.message);
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('❌ Failed to rename group:', error.response?.data || error.message);
            throw error;
        }
    }, []);

    // ─── Delete Group ─────────────────────────────────────────────
    const handleDeleteGroup = useCallback(async (groupId) => {
        try {
            // Find the group to get its tasks
            const groupToDelete = localGroups.find(g => g.id === groupId);
            if (!groupToDelete) return;

            // Move all tasks to "To Do" group
            const todoGroup = localGroups.find(g => g.name === 'To Do');
            if (todoGroup && groupToDelete.name !== 'To Do') {
                const tasksInGroup = localTasks.filter(t => t.group_id === groupId);
                for (const task of tasksInGroup) {
                    await axios.patch(`/api/workspaces/${project.workspace_id}/tasks/${task.id}`, {
                        group_id: todoGroup.id,
                    }, { headers: { 'Accept': 'application/json' } });
                }
                setLocalTasks(prev => prev.map(t => 
                    t.group_id === groupId ? { ...t, group_id: todoGroup.id } : t
                ));
            }

            // Delete the group
            const response = await axios.delete(`/groups/${groupId}`, { 
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } 
            });
            
            if (response.data.success) {
                setLocalGroups(prev => prev.filter(g => g.id !== groupId));
            } else {
                console.error('❌ Failed to delete group:', response.data.message);
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('❌ Failed to delete group:', error.response?.data || error.message);
            throw error;
        }
    }, [localGroups, localTasks]);

    // ─── Reorder Groups ───────────────────────────────────────────
    const handleReorderGroups = useCallback(async (newOrder) => {
        try {
            const response = await axios.post(`/projects/${project.id}/groups/reorder`, {
                ordered_ids: newOrder,
            }, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });

            if (response.data.success) {
                // Refresh groups to get correct ordering
                const groupsResponse = await axios.get(`/projects/${project.id}/groups`, {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                });
                setLocalGroups(groupsResponse.data.groups || groupsResponse.data);
            } else {
                console.error('❌ Failed to reorder groups:', response.data.message);
                if (response.data.errors) {
                    // Show validation errors to user
                    Object.values(response.data.errors).forEach(error => {
                        console.error('Validation error:', error);
                    });
                }
            }
        } catch (error) {
            console.error('❌ Failed to reorder groups:', error.response?.data || error.message);
        }
    }, [project.id]);

    // ─── List View Handlers ───────────────────────────────────────
    const handleStatusChange = useCallback(async (taskId, groupId) => {
        try {
            await axios.patch(`/api/workspaces/${project.workspace_id}/tasks/${taskId}`, {
                group_id: groupId,
            }, { headers: { 'Accept': 'application/json' } });
            
            setLocalTasks(prev => prev.map(t => 
                t.id === taskId ? { ...t, group_id: groupId } : t
            ));
        } catch (error) {
            console.error('❌ Failed to change status:', error.response?.data || error.message);
        }
    }, []);

    const handleAssigneeChange = useCallback(async (taskId, assigneeId) => {
        try {
            const response = await axios.patch(`/api/workspaces/${project.workspace_id}/tasks/${taskId}`, {
                assigned_to_user_id: assigneeId || null,
            }, { headers: { 'Accept': 'application/json' } });
            
            // Update local tasks with the response data (includes full assignedToUser object)
            if (response.data?.task) {
                setLocalTasks(prev => prev.map(t => 
                    t.id === taskId ? { ...t, ...response.data.task } : t
                ));
            } else {
                // Fallback: update with just the ID if response doesn't have full task
                const member = teamMembers?.find(m => m.id === assigneeId);
                setLocalTasks(prev => prev.map(t => 
                    t.id === taskId ? { 
                        ...t, 
                        assigned_to_user_id: assigneeId,
                        assignedToUser: member || null,
                        assigned_to_user: member || null
                    } : t
                ));
            }
        } catch (error) {
            console.error('❌ Failed to change assignee:', error.response?.data || error.message);
            // Show error to user
            if (error.response?.status === 403) {
                alert(error.response?.data?.message || 'You do not have permission to reassign this task.');
            }
        }
    }, [teamMembers]);

    const handleDueDateChange = useCallback(async (taskId, dueDate) => {
        try {
            await axios.patch(`/api/workspaces/${project.workspace_id}/tasks/${taskId}`, {
                due_on: dueDate,
            }, { headers: { 'Accept': 'application/json' } });
            
            setLocalTasks(prev => prev.map(t => 
                t.id === taskId ? { ...t, due_on: dueDate } : t
            ));
        } catch (error) {
            console.error('❌ Failed to change due date:', error.response?.data || error.message);
        }
    }, []);

    const handlePriorityChange = useCallback(async (taskId, priority) => {
        try {
            await axios.patch(`/api/workspaces/${project.workspace_id}/tasks/${taskId}`, {
                priority,
            }, { headers: { 'Accept': 'application/json' } });
            
            setLocalTasks(prev => prev.map(t => 
                t.id === taskId ? { ...t, priority } : t
            ));
        } catch (error) {
            console.error('❌ Failed to change priority:', error.response?.data || error.message);
        }
    }, []);

    
    // Sync selectedTask with localTasks so drawer reflects moves
    const currentSelectedTask = selectedTask
        ? localTasks.find(t => t.id === selectedTask.id) || selectedTask
        : null;

    return (
        <MainLayout title={project?.name || 'Project'}>
            <Head title={`${project?.name} - Tasks`} />

            {/* Error/Warning Toast */}
            {dragError && (
                <div className={`fixed top-4 right-4 z-50 border rounded-lg shadow-xl p-3 max-w-sm animate-in slide-in-from-right ${
                    dragError.includes('Attachment required') 
                        ? 'bg-amber-100 border-amber-300' 
                        : 'bg-red-100 border-red-300'
                }`}>
                    <div className="flex items-start gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            dragError.includes('Attachment required')
                                ? 'bg-amber-200'
                                : 'bg-red-200'
                        }`}>
                            <X className={`h-3 w-3 ${
                                dragError.includes('Attachment required')
                                    ? 'text-amber-700'
                                    : 'text-red-700'
                            }`} />
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-semibold mt-0.5 ${
                                dragError.includes('Attachment required')
                                    ? 'text-amber-900'
                                    : 'text-red-900'
                            }`}>
                                {dragError.includes('Attachment required') ? 'Attachment Required' : 'Task Move Failed'}
                            </p>
                            <p className={`text-sm mt-0.5 ${
                                dragError.includes('Attachment required')
                                    ? 'text-amber-800'
                                    : 'text-red-800'
                            }`}>
                                {dragError}
                            </p>
                        </div>
                        <button 
                            onClick={() => setDragError(null)}
                            className={`transition-colors ${
                                dragError.includes('Attachment required')
                                    ? 'text-amber-600 hover:text-amber-800'
                                    : 'text-red-600 hover:text-red-800'
                            }`}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/projects">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{project?.name}</h1>
                                <p className="text-xs text-gray-500">{viewMode === 'board' ? 'Board View' : 'List View'}</p>
                            </div>
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-8 w-56 text-sm"
                                />
                            </div>
                            <div className="flex items-center border rounded-md overflow-hidden h-8">
                                <button
                                    onClick={() => setViewMode('board')}
                                    className={`flex items-center gap-1 px-2.5 h-full text-xs font-medium transition-colors ${
                                        viewMode === 'board' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" /> Board
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-1 px-2.5 h-full text-xs font-medium transition-colors border-l ${
                                        viewMode === 'list' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    <List className="h-3.5 w-3.5" /> List
                                </button>
                            </div>
                            <DropdownMenu open={showFilterMenu} onOpenChange={setShowFilterMenu}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8">
                                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                                        Filter
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-72 bg-white border-gray-300 shadow-xl">
                                    <DropdownMenuLabel className="text-xs font-semibold">Filter Tasks</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    
                                    {/* Status Filter */}
                                    <div className="px-2 py-2">
                                        <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                                        <select 
                                            value={filters.status} 
                                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                            className="w-full text-xs border border-gray-300 bg-white rounded px-2 py-1 shadow-sm"
                                        >
                                            <option value="all">All Status</option>
                                            {sortedGroups.map(group => (
                                                <option key={group.id} value={group.name}>{group.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Priority Filter */}
                                    <div className="px-2 py-2">
                                        <label className="text-xs font-medium text-gray-700 mb-1 block">Priority</label>
                                        <select 
                                            value={filters.priority} 
                                            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                                            className="w-full text-xs border border-gray-300 bg-white rounded px-2 py-1 shadow-sm"
                                        >
                                            <option value="all">All Priorities</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="normal">Normal</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                    
                                    {/* Assignee Filter */}
                                    <div className="px-2 py-2">
                                        <label className="text-xs font-medium text-gray-700 mb-1 block">Assignee</label>
                                        <select 
                                            value={filters.assignee} 
                                            onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
                                            className="w-full text-xs border border-gray-300 bg-white rounded px-2 py-1 shadow-sm"
                                        >
                                            <option value="all">All Assignees</option>
                                            <option value="unassigned">Unassigned</option>
                                            {assignableMembers.map(member => (
                                                <option key={member.id} value={member.id}>{member.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Due Date Filter */}
                                    <div className="px-2 py-2">
                                        <label className="text-xs font-medium text-gray-700 mb-1 block">Due Date</label>
                                        <select 
                                            value={filters.dueDate} 
                                            onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
                                            className="w-full text-xs border border-gray-300 bg-white rounded px-2 py-1 shadow-sm"
                                        >
                                            <option value="all">All Due Dates</option>
                                            <option value="overdue">Overdue</option>
                                            <option value="today">Due Today</option>
                                            <option value="week">Due This Week</option>
                                        </select>
                                    </div>
                                    
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setFilters({ status: 'all', priority: 'all', assignee: 'all', dueDate: 'all' })} className="text-xs">
                                        Clear All Filters
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            {/* Views */}
            {viewMode === 'board' ? (
                <div className="p-4 bg-gradient-to-br from-gray-100/80 via-white/50 to-indigo-50/30 min-h-[calc(100vh-120px)]">
                    {canEditTasks ? (
                        <DragDropContext 
                            onDragStart={() => setIsDragging(true)}
                            onDragEnd={handleDragEnd}
                        >
                            <div
                                className="grid gap-4"
                                style={{ gridTemplateColumns: `repeat(${localGroups.length}, minmax(250px, 1fr)) auto` }}
                            >
                                {localGroups.map((group) => (
                                    <ClickUpTaskGroup
                                        key={group.id}
                                        group={group}
                                        tasks={filteredTasks}
                                        onTaskClick={handleTaskClick}
                                        onAddTask={handleAddTask}
                                        onToggleTaskComplete={handleToggleTaskComplete}
                                        onRenameGroup={handleRenameGroup}
                                        onDeleteGroup={handleDeleteGroup}
                                        canEdit={canEditTasks}
                                        canMoveTask={canMoveTask}
                                        isDragging={isDragging}
                                        teamMembers={assignableMembers}
                                    />
                                ))}
                                <AddGroupButton onAddGroup={handleAddGroup} canEdit={canEditTasks} />
                            </div>
                        </DragDropContext>
                    ) : (
                        <div
                            className="grid gap-4"
                            style={{ gridTemplateColumns: `repeat(${sortedGroups.length}, minmax(250px, 1fr))` }}
                        >
                            {sortedGroups.map((group) => (
                                <ClickUpTaskGroup
                                    key={group.id}
                                    group={group}
                                    tasks={filteredTasks}
                                    onTaskClick={handleTaskClick}
                                    onAddTask={handleAddTask}
                                    onToggleTaskComplete={handleToggleTaskComplete}
                                    onRenameGroup={handleRenameGroup}
                                    onDeleteGroup={handleDeleteGroup}
                                    canEdit={canEditTasks}
                                    teamMembers={assignableMembers}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 bg-gradient-to-br from-gray-50/50 via-white/50 to-indigo-50/20 min-h-[calc(100vh-120px)]">
                    <ClickUpTaskList
                        tasks={filteredTasks}
                        groups={localGroups}
                        teamMembers={assignableMembers}
                        canEdit={canEditTasks}
                        onTaskClick={handleTaskClick}
                        onToggleComplete={handleToggleTaskComplete}
                        onStatusChange={handleStatusChange}
                        onAssigneeChange={handleAssigneeChange}
                        onDueDateChange={handleDueDateChange}
                        onPriorityChange={handlePriorityChange}
                        projectId={project.workspace_id}
                    />
                </div>
            )}

            {/* Drawer */}
            <EnhancedTaskDetailDrawer
                task={currentSelectedTask}
                open={showTaskDetail}
                onClose={handleDrawerClose}
                onTaskUpdate={(updatedTask) => {
                    console.log('🔄 onTaskUpdate called:', {
                        taskId: updatedTask.id,
                        attachmentCount: updatedTask.attachments?.length || 0,
                        pendingMove: !!pendingMove,
                        hasAttachments: updatedTask.attachments && updatedTask.attachments.length > 0,
                        isArchived: !!updatedTask.archived_at
                    });
                    
                    // If task is archived, remove it from local state immediately
                    if (updatedTask.archived_at) {
                        console.log('🗑️ Removing archived task from UI:', updatedTask.id);
                        setLocalTasks(prev => prev.filter(t => t.id !== updatedTask.id));
                        setSelectedTask(null);
                        setShowTaskDetail(false);
                    } else {
                        // Normal task update
                        setLocalTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
                    }
                    
                    // If this was a pending move and attachments were added, complete the move
                    if (pendingMove && updatedTask.attachments && updatedTask.attachments.length > 0) {
                        console.log('✅ Completing pending move due to attachments:', {
                            taskId: updatedTask.id,
                            attachmentCount: updatedTask.attachments.length
                        });
                        completePendingMove();
                    }
                }}
                teamMembers={assignableMembers}
                taskGroups={localGroups}
                projectId={project?.id}
                requireAttachment={requireAttachment}
                onAttachmentRequired={() => setRequireAttachment(false)}
                pendingMove={pendingMove}
                isDragging={isDragging}
                currentUser={user}
                userRole={userRole}
            />
        </MainLayout>
    );
}
