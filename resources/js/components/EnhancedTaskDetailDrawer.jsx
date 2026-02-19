import { useState, useRef, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { X, User, Calendar, Tag, Paperclip, MessageSquare, Trash2, Upload, Download, Clock, Activity, AtSign, Send, Loader2, FileText } from 'lucide-react';
import { useWorkspace } from '@/Context/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function EnhancedTaskDetailDrawer({
    task,
    open,
    onClose,
    onTaskUpdate,
    teamMembers = [],
    taskGroups = [],
    projectId,
    requireAttachment = false,
    onAttachmentRequired,
    pendingMove = null,
    isDragging = false,
    currentUser,
    userRole
}) {
    const { props } = usePage();
    // Use passed props or fallback to workspace context
    const workspaceUser = useWorkspace();
    const { currentWorkspace } = workspaceUser;
    const finalUserRole = userRole || workspaceUser.userRole;
    const finalCurrentUser = currentUser || workspaceUser.user;
    const [localTask, setLocalTask] = useState(task);

    // Sync localTask with task prop when it changes
    useEffect(() => {
        console.log('🔍 Task prop changed, syncing localTask:', {
            oldTaskId: localTask?.id,
            newTaskId: task?.id,
            newTaskName: task?.name,
            newAssignedTo: task?.assigned_to_user_id
        });
        setLocalTask(task);
    }, [task]);

    // Get current user ID from page props as fallback
    const currentUserId = finalCurrentUser?.id || props.auth?.user?.id;

    // Real App Standard Permissions
    const isAdmin = finalUserRole === 'admin' || finalUserRole === 'project_owner';

    // Debug: Log what we have
    console.log('🔍 Enhanced Drawer Debug:', {
        finalUserRole,
        finalCurrentUser,
        currentUserId,
        propsAuthUser: props.auth?.user,
        task,
        localTask
    });

    // Simplified permission logic - use currentUserId from page props if workspace context fails
    const isAssignedMember = localTask?.assigned_to_user_id === currentUserId;

    // Debug logging
    console.log('🔍 Task Permission Debug:', {
        taskId: localTask?.id,
        taskName: localTask?.name,
        assignedToUserId: localTask?.assigned_to_user_id,
        currentUserId: currentUserId,
        finalUserRole: finalUserRole,
        isAdmin: isAdmin,
        isAssignedMember: isAssignedMember
    });

    const canReassign = isAdmin; // Only Admin/Project Owner can reassign
    const canChangePriority = isAdmin; // Only Admin/Project Owner can change priority
    const canChangeDueDate = isAdmin; // Only Admin/Project Owner can change due date

    // New permission logic for status and attachments
    let canUpdateStatus = false;
    let canUploadAttachments = false;

    if (isAdmin) {
        // Admins can always update status and upload attachments
        canUpdateStatus = true;
        canUploadAttachments = true;
    } else if (finalUserRole === 'member') {
        // For members: check if task is assigned
        if (!localTask?.assigned_to_user_id) {
            // Unassigned tasks: any member can update
            canUpdateStatus = true;
            canUploadAttachments = true;
        } else {
            // Assigned tasks: only assigned member can update
            canUpdateStatus = isAssignedMember;
            canUploadAttachments = isAssignedMember;
        }
    }

    const canComment = true; // All authenticated users can comment
    const isReadOnly = finalUserRole === 'client' || (!isAdmin && !isAssignedMember && !canUpdateStatus && !canUploadAttachments && !canComment);

    console.log('🔍 Permission Results:', {
        canReassign,
        canChangePriority,
        canChangeDueDate,
        canUpdateStatus,
        canUploadAttachments,
        canComment,
        isReadOnly
    });

    console.log('🔍 EnhancedTaskDetailDrawer - Team Members Prop Debug:', {
        teamMembers,
        teamMembersCount: teamMembers?.length || 0,
        teamMembersData: teamMembers?.map(m => ({
            id: m.id,
            name: m.name,
            role: m.pivot?.role,
            hasPivot: !!m.pivot
        }))
    });

    const [commentText, setCommentText] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const fileInputRef = useRef(null);
    const commentInputRef = useRef(null);
    const debounceRef = useRef(null);
    const commentsEndRef = useRef(null);

    // Sync from parent
    useEffect(() => {
        if (task) setLocalTask(task);
    }, [task]);

    // Scroll to latest comment
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localTask?.comments?.length]);

    // ─── Debounced task update ──────────────────────────────────
    const updateTask = useCallback((updates) => {
        if (!localTask) return;

        // Permission checks for specific fields
        if (updates.assigned_to_user_id !== undefined && !canReassign) return;
        if (updates.priority !== undefined && !canChangePriority) return;
        if (updates.due_date !== undefined && !canChangeDueDate) return;
        if (updates.group_id !== undefined && !canUpdateStatus) return;
        if (updates.description !== undefined && isReadOnly) return;

        // Optimistic local update
        const updated = { ...localTask, ...updates };
        setLocalTask(updated);
        onTaskUpdate?.(updated);

        // Debounce the API call (500ms)
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const url = `/tasks/${localTask.id}`;
                console.log('🔍 Task Update URL:', url);
                console.log('🔍 Task Update Data:', updates);
                const response = await axios.patch(url, updates, {
                    headers: { 'Accept': 'application/json' }
                });
                console.log('✅ Task updated successfully');

                // Update local task with server response if available
                if (response.data?.task) {
                    setLocalTask(prev => ({ ...prev, ...response.data.task }));
                    onTaskUpdate?.(response.data.task);
                }
            } catch (error) {
                console.error('❌ Failed to update task:', error.response?.data || error.message);
                setLocalTask(task); // revert
            }
        }, 500);
    }, [localTask, task, canReassign, canChangePriority, canChangeDueDate, canUpdateStatus, isReadOnly, onTaskUpdate]);

    // ─── Status change (group move) — immediate, no debounce ───
    const handleStatusChange = useCallback(async (groupId) => {
        if (!canUpdateStatus || !localTask) return;
        const gid = parseInt(groupId);

        console.log('🔍 Status change attempt:', {
            currentTaskId: localTask?.id,
            currentTaskName: localTask?.name,
            currentAssignedTo: localTask?.assigned_to_user_id,
            currentUserId: currentUserId,
            isAssignedMember: localTask?.assigned_to_user_id === currentUserId,
            newGroupId: gid,
            workspaceId: currentWorkspace?.id || workspaceUser.currentWorkspace?.id
        });

        const group = taskGroups.find(g => g.id === parseInt(gid));
        if (!group) {
            console.error('❌ Group not found:', gid);
            return;
        }

        const isComplete = group.name === 'Complete';
        const requiresAttachment = (group.name === 'In Progress' || isComplete);
        const hasAttachments = localTask.attachments && localTask.attachments.length > 0;

        // Attachment validation for status changes
        if (requiresAttachment && !hasAttachments) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'fixed top-4 right-4 z-50 border rounded-lg shadow-xl p-3 max-w-sm animate-in slide-in-from-right bg-amber-100 border-amber-300';
            errorDiv.innerHTML = `
                <div class="flex items-start gap-2">
                    <div class="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg class="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-amber-800">Attachment required</p>
                        <p class="text-xs text-amber-700 mt-1">Please add at least one file before moving to "${group.name}".</p>
                    </div>
                </div>
            `;
            document.body.appendChild(errorDiv);
            setTimeout(() => {
                errorDiv.remove();
            }, 4000);

            return;
        }

        const updated = { ...localTask, group_id: gid, completed: isComplete };
        setLocalTask(updated);
        onTaskUpdate?.(updated);

        try {
            console.log('🔍 Making API call:', {
                url: `/api/workspaces/${currentWorkspace?.id || workspaceUser.currentWorkspace?.id}/tasks/${localTask.id}`,
                taskId: localTask.id,
                payload: { group_id: gid, completed: isComplete }
            });

            const response = await axios.patch(`/api/workspaces/${currentWorkspace?.id || workspaceUser.currentWorkspace?.id}/tasks/${localTask.id}`, {
                group_id: gid,
                completed: isComplete,
            }, { headers: { 'Accept': 'application/json' } });

            console.log('✅ Status change successful:', response.data);

            // Update local state with server response if available
            if (response.data?.task) {
                const updatedTask = { ...updated, ...response.data.task };
                setLocalTask(updatedTask);
                onTaskUpdate?.(updatedTask);
            }

        } catch (error) {
            console.error('❌ Failed to change status:', error.response?.data || error.message);

            // Revert local state on error
            setLocalTask(task);
            onTaskUpdate?.(task);

            // Check for backend validation errors
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to change status';

            // Create a temporary error message element
            const errorDiv = document.createElement('div');
            const isAttachmentError = errorMessage.includes('attachment') || errorMessage.includes('required');

            errorDiv.className = `fixed top-4 right-4 z-50 border rounded-lg shadow-xl p-3 max-w-sm animate-in slide-in-from-right ${isAttachmentError ? 'bg-amber-100 border-amber-300' : 'bg-red-100 border-red-300'
                }`;

            errorDiv.innerHTML = `
                <div class="flex items-start gap-2">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isAttachmentError ? 'bg-amber-200' : 'bg-red-200'
                }">
                        <svg class="h-3 w-3 ${isAttachmentError ? 'text-amber-700' : 'text-red-700'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold mt-0.5 ${isAttachmentError ? 'text-amber-900' : 'text-red-900'
                }">
                            ${isAttachmentError ? 'Attachment Required' : 'Status Change Failed'}
                        </p>
                        <p class="text-sm mt-0.5 ${isAttachmentError ? 'text-amber-800' : 'text-red-800'
                }">
                            ${isAttachmentError ? 'Attachment required to change task status. Please add at least one file.' : errorMessage}
                        </p>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" class="transition-colors ${isAttachmentError ? 'text-amber-600 hover:text-amber-800' : 'text-red-600 hover:text-red-800'
                }">
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            `;
            document.body.appendChild(errorDiv);

            // Auto-remove after 4 seconds
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 4000);
        }
    }, [localTask, task, taskGroups, isReadOnly, onTaskUpdate]);

    // ─── Comment submission ─────────────────────────────────────
    const handleCommentSubmit = useCallback(async () => {
        if (!commentText.trim() || isSubmitting || !localTask) return;
        setIsSubmitting(true);

        // Optimistic comment
        const tempComment = {
            id: `temp-${Date.now()}`,
            body: commentText.trim(),
            user: currentUser || { name: 'You' },
            created_at: new Date().toISOString(),
        };
        setLocalTask(prev => ({
            ...prev,
            comments: [...(prev.comments || []), tempComment],
        }));
        setCommentText('');

        try {
            const response = await axios.post(`/tasks/${localTask.id}/comments`, {
                body: tempComment.body,
            }, { headers: { 'Accept': 'application/json' } });

            const real = response.data.comment || response.data;
            setLocalTask(prev => ({
                ...prev,
                comments: (prev.comments || []).map(c => c.id === tempComment.id ? { ...real, user: real.user || currentUser } : c),
            }));
        } catch (error) {
            console.error('❌ Failed to post comment:', error.response?.data || error.message);
            // Remove temp comment
            setLocalTask(prev => ({
                ...prev,
                comments: (prev.comments || []).filter(c => c.id !== tempComment.id),
            }));
        } finally {
            setIsSubmitting(false);
        }
    }, [commentText, isSubmitting, localTask, currentUser]);

    // ─── File upload ────────────────────────────────────────────
    const handleFileUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file || uploadingFile || !localTask) return;
        setUploadingFile(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`/tasks/${localTask.id}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' },
            });
            const att = response.data.attachment || response.data;

            // Update local state
            const updatedTask = {
                ...localTask,
                attachments: [...(localTask.attachments || []), att],
            };
            setLocalTask(updatedTask);

            // Immediately update parent state to sync attachment data
            if (onTaskUpdate) {
                onTaskUpdate(updatedTask);
            }

            console.log('✅ Attachment uploaded and parent state synced:', {
                taskId: localTask.id,
                attachmentCount: updatedTask.attachments.length,
                pendingMove: !!pendingMove
            });

        } catch (error) {
            console.error('❌ Failed to upload file:', error.response?.data || error.message);
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            // Clear attachment requirement if upload was successful
            if (requireAttachment && onAttachmentRequired) {
                onAttachmentRequired();
            }
        }
    }, [uploadingFile, localTask, onTaskUpdate, requireAttachment, onAttachmentRequired, pendingMove]);

    // ─── Delete attachment ──────────────────────────────────────
    const handleDeleteAttachment = useCallback(async (attachmentId) => {
        if (isReadOnly) return;
        setLocalTask(prev => ({
            ...prev,
            attachments: (prev.attachments || []).filter(a => a.id !== attachmentId),
        }));
        try {
            await axios.delete(`/attachments/${attachmentId}`, { headers: { 'Accept': 'application/json' } });
        } catch (error) {
            console.error('Failed to delete attachment:', error);
        }
    }, [isReadOnly]);

    // ─── Delete task ────────────────────────────────────────────
    const handleDeleteTask = useCallback(async () => {
        if (!localTask || !confirm('Are you sure you want to delete this task?')) return;

        // Optimistic: remove task from local state immediately
        onTaskUpdate?.({ ...localTask, archived_at: new Date().toISOString() });

        try {
            await axios.delete(`/tasks/${localTask.id}`, { headers: { 'Accept': 'application/json' } });
            console.log('✅ Task deleted successfully');
            onClose();
        } catch (error) {
            console.error('Failed to delete task:', error);
            // Revert the optimistic update on error
            onTaskUpdate?.({ ...localTask, archived_at: null });
        }
    }, [localTask, onClose, onTaskUpdate]);

    // ─── @mentions ──────────────────────────────────────────────
    const handleCommentChange = (e) => {
        const value = e.target.value;
        setCommentText(value);
        setShowMentions(value.slice(-1) === '@');
    };

    const insertMention = (userName) => {
        setCommentText(prev => prev + userName + ' ');
        setShowMentions(false);
        commentInputRef.current?.focus();
    };

    if (!localTask) return null;

    const currentGroupName = taskGroups.find(g => g.id === localTask.group_id)?.name || 'To Do';

    return (
        <>
            {/* Backdrop */}
            {open && (
                <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={isDragging ? undefined : onClose} />
            )}

            {/* Drawer */}
            <div className={cn(
                "fixed inset-y-0 right-0 z-50 w-full sm:w-[640px] bg-white shadow-2xl transform transition-transform duration-200 ease-out overflow-hidden flex flex-col",
                open ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Loading Overlay */}
                {isDragging && (
                    <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                            <p className="text-sm text-gray-600">Updating task...</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b bg-white">
                    <div className="flex items-center gap-2">
                        <Activity className={cn('h-5 w-5', currentGroupName === 'Complete' ? 'text-green-500' : 'text-gray-400')} />
                        <h2 className="text-base font-semibold text-gray-900 truncate max-w-[400px]">{localTask.name}</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Attachment Requirement Warning */}
                {requireAttachment && (
                    <div className="mx-5 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Paperclip className="h-3 w-3 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-amber-800">
                                    {pendingMove ? 'Complete Task Move' : 'Attachment Required'}
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    {pendingMove
                                        ? `Add at least one attachment to complete moving this task to "${taskGroups.find(g => g.id === pendingMove.newGroupId)?.name}".`
                                        : 'This task needs at least one attachment before it can be moved to "In Progress" or "Complete".'}
                                </p>
                                {pendingMove && (
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded hover:bg-amber-200 transition-colors"
                                        >
                                            Add Attachment
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="text-xs text-amber-700 hover:text-amber-900 transition-colors"
                                        >
                                            Cancel Move
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b px-5 bg-gray-50/50">
                    {['details', 'activity'].map(tab => (
                        <button
                            key={tab}
                            className={cn(
                                "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
                                activeTab === tab
                                    ? "border-indigo-600 text-indigo-700"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'activity' && <Activity className="h-3.5 w-3.5 inline mr-1" />}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'details' ? (
                        <div className="p-5 space-y-5">
                            {/* Task Name */}
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Task Name</label>
                                {isReadOnly ? (
                                    <h3 className="text-base font-semibold">{localTask.name}</h3>
                                ) : (
                                    <Input
                                        value={localTask.name || ''}
                                        onChange={(e) => updateTask({ name: e.target.value })}
                                        className="font-medium"
                                        placeholder="Task name"
                                    />
                                )}
                            </div>

                            {/* Meta Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Status */}
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        <Clock className="h-3 w-3 inline mr-1" />Status
                                    </label>
                                    {!canUpdateStatus ? (
                                        <>
                                            {console.log('❌ Status disabled - canUpdateStatus:', canUpdateStatus, 'isAssignedMember:', isAssignedMember, 'isAdmin:', isAdmin)}
                                            <Badge variant="secondary">{currentGroupName}</Badge>
                                        </>
                                    ) : (
                                        <>
                                            {console.log('✅ Status enabled - canUpdateStatus:', canUpdateStatus, 'isAssignedMember:', isAssignedMember, 'isAdmin:', isAdmin)}
                                            <Select value={localTask.group_id?.toString()} onValueChange={handleStatusChange}>
                                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-white border-gray-300 shadow-xl">
                                                    {taskGroups.map(g => (
                                                        <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </>
                                    )}
                                </div>

                                {/* Assignee */}
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        <User className="h-3 w-3 inline mr-1" />Assignee
                                    </label>
                                    {!canReassign ? (
                                        localTask.assigned_to_user ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">{localTask.assigned_to_user.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{localTask.assigned_to_user.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">Not assigned</span>
                                        )
                                    ) : (
                                        <Select
                                            value={localTask.assigned_to_user_id?.toString()}
                                            onValueChange={async (v) => {
                                                const uid = parseInt(v);
                                                const member = teamMembers.find(m => m.id === uid);

                                                if (!member) return;

                                                // Optimistic update
                                                setLocalTask(prev => ({
                                                    ...prev,
                                                    assigned_to_user_id: uid,
                                                    assigned_to_user: member,
                                                    assignedToUser: member
                                                }));

                                                // Make API call to update backend
                                                try {
                                                    const url = `/tasks/${localTask.id}`;
                                                    console.log('🔍 Assignee Update URL:', url);
                                                    console.log('🔍 Assignee Update Data:', { assigned_to_user_id: uid });
                                                    const response = await axios.patch(url, {
                                                        assigned_to_user_id: uid
                                                    }, {
                                                        headers: { 'Accept': 'application/json' }
                                                    });

                                                    console.log('✅ Assignee updated successfully:', response.data);

                                                    // Update with server response to ensure consistency
                                                    if (response.data?.task) {
                                                        setLocalTask(prev => ({ ...prev, ...response.data.task }));
                                                        onTaskUpdate?.(response.data.task);
                                                    }
                                                } catch (error) {
                                                    console.error('❌ Failed to update assignee:', error.response?.data || error.message);

                                                    // Revert optimistic update on error
                                                    setLocalTask(task);

                                                    if (error.response?.status === 403) {
                                                        alert(error.response?.data?.message || 'You do not have permission to reassign this task.');
                                                    } else if (error.response?.status === 404) {
                                                        alert('Task not found. Please refresh the page.');
                                                    } else {
                                                        alert('Failed to update assignee. Please try again.');
                                                    }
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select team member to assign" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-gray-300 shadow-xl">
                                                {teamMembers.map(m => (
                                                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        <Calendar className="h-3 w-3 inline mr-1" />Due Date
                                    </label>
                                    {!canChangeDueDate ? (
                                        <span className="text-sm">{localTask.due_on ? new Date(localTask.due_on).toLocaleDateString() : 'No due date'}</span>
                                    ) : (
                                        <Input type="date" value={localTask.due_on ? localTask.due_on.split('T')[0]?.split(' ')[0] : ''} onChange={(e) => updateTask({ due_on: e.target.value || null })} className="h-9" />
                                    )}
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        <Tag className="h-3 w-3 inline mr-1" />Priority
                                    </label>
                                    {!canChangePriority ? (
                                        <Badge variant={localTask.priority === 'high' ? 'destructive' : localTask.priority === 'medium' ? 'default' : 'secondary'}>
                                            {localTask.priority || 'Normal'}
                                        </Badge>
                                    ) : (
                                        <Select value={localTask.priority || 'normal'} onValueChange={(v) => updateTask({ priority: v })}>
                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-white border-gray-300 shadow-xl">
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Description</label>
                                {isReadOnly ? (
                                    <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg min-h-[80px]">
                                        {localTask.description || 'No description'}
                                    </div>
                                ) : (
                                    <Textarea
                                        value={localTask.description || ''}
                                        onChange={(e) => updateTask({ description: e.target.value })}
                                        placeholder="Add a description..."
                                        rows={4}
                                        className="resize-none"
                                    />
                                )}
                            </div>


                            {/* Attachments */}
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                                    <Paperclip className="h-3 w-3 inline mr-1" />
                                    Attachments ({localTask.attachments?.length || 0})
                                </label>

                                {localTask.attachments?.length > 0 && (
                                    <div className="space-y-1.5 mb-3">
                                        {localTask.attachments.map((att) => (
                                            <div key={att.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 text-sm">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <Paperclip className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">{att.filename || att.original_name || 'File'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                                                        <a href={`/storage/${att.path}`} download><Download className="h-3.5 w-3.5" /></a>
                                                    </Button>
                                                    {canUploadAttachments && (
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => handleDeleteAttachment(att.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {canUploadAttachments && (
                                    <>
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
                                            {uploadingFile ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                                            {uploadingFile ? 'Uploading...' : 'Upload File'}
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Comments */}
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                                    <MessageSquare className="h-3 w-3 inline mr-1" />
                                    Comments ({localTask.comments?.length || 0})
                                </label>

                                <div className="space-y-3 mb-3 max-h-[300px] overflow-y-auto">
                                    {localTask.comments?.length > 0 ? (
                                        localTask.comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-2.5">
                                                <Avatar className="h-7 w-7 flex-shrink-0">
                                                    <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700 font-medium">
                                                        {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="font-medium text-sm text-gray-800">{comment.user?.name || 'Unknown'}</span>
                                                        <span className="text-[11px] text-gray-400">
                                                            {new Date(comment.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">{comment.body}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 text-center py-3">No comments yet</p>
                                    )}
                                    <div ref={commentsEndRef} />
                                </div>

                                {/* Add Comment */}
                                {canComment && (
                                    <div className="relative">
                                        {showMentions && (
                                            <div className="absolute bottom-full mb-1 w-full bg-white border rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
                                                {teamMembers.map(m => (
                                                    <button key={m.id} className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => insertMention(m.name)}>
                                                        <AtSign className="h-3 w-3 text-gray-400" />{m.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <Textarea
                                                ref={commentInputRef}
                                                value={commentText}
                                                onChange={handleCommentChange}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); } }}
                                                placeholder="Write a comment... (@ to mention)"
                                                rows={2}
                                                className="resize-none flex-1 text-sm"
                                            />
                                            <Button size="sm" onClick={handleCommentSubmit} disabled={!commentText.trim() || isSubmitting} className="self-end h-8 px-3">
                                                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Activity Tab */
                        <div className="p-5">
                            <div className="space-y-4">
                                {/* Show comments as activity */}
                                {localTask.comments?.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                        <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">{comment.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm"><span className="font-medium">{comment.user?.name}</span> commented</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{comment.body}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{new Date(comment.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex gap-3">
                                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Activity className="h-3.5 w-3.5 text-gray-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm"><span className="font-medium">Task created</span> by {localTask.created_by_user?.name || 'Unknown'}</p>
                                        <p className="text-[11px] text-gray-400">{localTask.created_at ? new Date(localTask.created_at).toLocaleString() : ''}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isReadOnly && (
                    <div className="border-t px-5 py-3 bg-gray-50/80 flex items-center justify-between">
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8" onClick={handleDeleteTask}>
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
                        </Button>
                        <Button size="sm" variant="outline" onClick={onClose} className="h-8">Close</Button>
                    </div>
                )}
            </div>
        </>
    );
}
