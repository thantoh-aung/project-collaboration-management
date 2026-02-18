import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    CheckCircle2, Circle, MessageSquare, Paperclip, ChevronDown, ChevronRight,
    Calendar, Plus, User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

const STATUS_COLORS = {
    'To Do': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
    'In Progress': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    'Complete': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
};
const DEFAULT_STATUS = { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' };

const PRIORITY_COLORS = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    normal: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-600',
};

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d - now;
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: true };
    if (days === 0) return { label: 'Today', overdue: false };
    if (days === 1) return { label: 'Tomorrow', overdue: false };
    return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false };
}

// ─── Inline Status Picker ──────────────────────────────────
function StatusCell({ task, groups, canEdit, onStatusChange }) {
    const group = groups.find(g => g.id === task.group_id);
    const groupName = group?.name || 'Unknown';
    const colors = STATUS_COLORS[groupName] || DEFAULT_STATUS;

    if (!canEdit) {
        return (
            <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium', colors.bg, colors.text)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
                {groupName}
            </span>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium cursor-pointer hover:ring-1 hover:ring-gray-300 transition-all', colors.bg, colors.text)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
                    {groupName}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36 z-50">
                {groups.map(g => {
                    const c = STATUS_COLORS[g.name] || DEFAULT_STATUS;
                    return (
                        <DropdownMenuItem
                            key={g.id}
                            className="text-xs"
                            onClick={() => onStatusChange(task.id, g.id)}
                        >
                            <span className={cn('w-2 h-2 rounded-full mr-2', c.dot)} />
                            {g.name}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ─── Inline Assignee Picker ────────────────────────────────
function AssigneeCell({ task, teamMembers, canEdit, onAssigneeChange }) {
    const assignee = task.assigned_to_user || task.assignedToUser;

    if (!canEdit) {
        return assignee ? (
            <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                    <AvatarImage src={assignee.avatar_url} />
                    <AvatarFallback className="text-[9px]">{assignee.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-700 truncate max-w-[80px]">{assignee.name}</span>
            </div>
        ) : <span className="text-xs text-gray-400">—</span>;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 hover:bg-gray-100 rounded px-1 py-0.5 transition-colors cursor-pointer">
                    {assignee ? (
                        <>
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={assignee.avatar_url} />
                                <AvatarFallback className="text-[9px]">{assignee.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-700 truncate max-w-[80px]">{assignee.name}</span>
                        </>
                    ) : (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <UserIcon className="h-3 w-3" /> Assign
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 z-50">
                <DropdownMenuItem className="text-xs text-gray-400" onClick={() => onAssigneeChange(task.id, null)}>
                    Unassign
                </DropdownMenuItem>
                {(teamMembers || []).map(m => (
                    <DropdownMenuItem key={m.id} className="text-xs" onClick={() => onAssigneeChange(task.id, m.id)}>
                        <Avatar className="h-4 w-4 mr-2">
                            <AvatarImage src={m.avatar_url} />
                            <AvatarFallback className="text-[8px]">{m.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {m.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ─── Inline Due Date Picker ────────────────────────────────
function DueDateCell({ task, canEdit, onDueDateChange }) {
    const dateInfo = formatDate(task.due_on || task.due_date);

    if (!canEdit) {
        return dateInfo.label ? (
            <span className={cn('text-xs', dateInfo.overdue ? 'text-red-600 font-medium' : 'text-gray-600')}>
                {dateInfo.label}
            </span>
        ) : <span className="text-xs text-gray-400">—</span>;
    }

    return (
        <div className="relative">
            <input
                type="date"
                defaultValue={task.due_on ? task.due_on.split('T')[0] : (task.due_date ? task.due_date.split('T')[0] : '')}
                onChange={(e) => onDueDateChange(task.id, e.target.value || null)}
                className={cn(
                    'text-xs bg-transparent border-0 outline-none cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 w-[110px]',
                    dateInfo.overdue ? 'text-red-600 font-medium' : 'text-gray-600'
                )}
            />
        </div>
    );
}

// ─── Inline Priority Picker ────────────────────────────────
function PriorityCell({ task, canEdit, onPriorityChange }) {
    if (!canEdit) {
        return task.priority ? (
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded capitalize', PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal)}>
                {task.priority}
            </span>
        ) : <span className="text-xs text-gray-300">—</span>;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded capitalize cursor-pointer hover:ring-1 hover:ring-gray-300 transition-all',
                    task.priority ? PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal : 'text-gray-300 bg-gray-50'
                )}>
                    {task.priority || 'Set Priority'}
                    {task.priority && <ChevronDown className="h-2.5 w-2.5 ml-1 opacity-50" />}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32 z-50">
                {['low', 'normal', 'medium', 'high'].map(priority => (
                    <DropdownMenuItem
                        key={priority}
                        className="text-xs capitalize"
                        onClick={() => onPriorityChange(task.id, priority)}
                    >
                        <span className={cn('w-2 h-2 rounded-full mr-2', {
                            'bg-red-500': priority === 'high',
                            'bg-orange-500': priority === 'medium',
                            'bg-blue-500': priority === 'normal',
                            'bg-gray-400': priority === 'low',
                        })} />
                        {priority}
                    </DropdownMenuItem>
                ))}
                {task.priority && (
                    <DropdownMenuItem className="text-xs text-gray-400" onClick={() => onPriorityChange(task.id, null)}>
                        Clear Priority
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ─── Activity Cell (read-only with quick actions) ───────────────
function ActivityCell({ task, canEdit, onTaskClick }) {
    const commentCount = task.comments_count || task.comments?.length || 0;
    const attachmentCount = task.attachments_count || task.attachments?.length || 0;

    return (
        <div className="flex items-center gap-3 text-gray-400">
            {canEdit && (
                <button
                    onClick={() => onTaskClick(task)}
                    className="flex items-center gap-0.5 text-[11px] hover:text-purple-600 transition-colors"
                    title="Add comment"
                >
                    <MessageSquare className="h-3 w-3" /> {commentCount || '+'}
                </button>
            )}
            {!canEdit && commentCount > 0 && (
                <span className="flex items-center gap-0.5 text-[11px]">
                    <MessageSquare className="h-3 w-3" /> {commentCount}
                </span>
            )}
            {canEdit && (
                <button
                    onClick={() => onTaskClick(task)}
                    className="flex items-center gap-0.5 text-[11px] hover:text-purple-600 transition-colors"
                    title="Add attachment"
                >
                    <Paperclip className="h-3 w-3" /> {attachmentCount || '+'}
                </button>
            )}
            {!canEdit && attachmentCount > 0 && (
                <span className="flex items-center gap-0.5 text-[11px]">
                    <Paperclip className="h-3 w-3" /> {attachmentCount}
                </span>
            )}
            {commentCount === 0 && attachmentCount === 0 && (
                <span className="text-xs text-gray-300">—</span>
            )}
        </div>
    );
}

// ─── Task Row ──────────────────────────────────────────────
function TaskRow({ task, groups, teamMembers, canEdit, onTaskClick, onToggleComplete, onStatusChange, onAssigneeChange, onDueDateChange, onPriorityChange }) {
    const group = groups.find(g => g.id === task.group_id);
    const isCompleted = task.completed || group?.name === 'Complete';
    const commentCount = task.comments_count || task.comments?.length || 0;
    const attachmentCount = task.attachments_count || task.attachments?.length || 0;
    const subtaskCount = task.rootSubtasks?.length || 0;

    return (
        <tr className="group border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
            {/* Checkbox + Name */}
            <td className="py-2 px-3">
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={(e) => { e.stopPropagation(); if (canEdit) onToggleComplete(task); }}
                        className={cn('flex-shrink-0 transition-colors', isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-gray-500')}
                    >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </button>
                    <span
                        className={cn('text-sm cursor-pointer hover:text-purple-600 transition-colors truncate max-w-[280px]', isCompleted && 'line-through text-gray-400')}
                        onClick={() => onTaskClick(task)}
                    >
                        {task.name}
                    </span>
                    {subtaskCount > 0 && (
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{subtaskCount} sub</span>
                    )}
                </div>
            </td>

            {/* Status */}
            <td className="py-2 px-3">
                <StatusCell task={task} groups={groups} canEdit={canEdit} onStatusChange={onStatusChange} />
            </td>

            {/* Assignee */}
            <td className="py-2 px-3">
                <AssigneeCell task={task} teamMembers={teamMembers} canEdit={canEdit} onAssigneeChange={onAssigneeChange} />
            </td>

            {/* Due Date */}
            <td className="py-2 px-3">
                <DueDateCell task={task} canEdit={canEdit} onDueDateChange={onDueDateChange} />
            </td>

            {/* Priority */}
            <td className="py-2 px-3">
                <PriorityCell task={task} canEdit={canEdit} onPriorityChange={onPriorityChange} />
            </td>

            {/* Activity */}
            <td className="py-2 px-3">
                <ActivityCell task={task} canEdit={canEdit} onTaskClick={onTaskClick} />
            </td>
        </tr>
    );
}

// ─── Group Header Row ───────────────────────────────────────
function GroupHeaderRow({ group, tasks, canEdit, onAddTask }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const groupTasks = tasks.filter(t => t.group_id === group.id);
    const colors = STATUS_COLORS[group.name] || DEFAULT_STATUS;

    const handleAdd = async () => {
        if (!newTaskName.trim()) return;
        await onAddTask({ name: newTaskName.trim(), group_id: group.id });
        setNewTaskName('');
        setIsAdding(false);
    };

    return (
        <>
            {/* Group Header */}
            <tr className="bg-gray-50/50 border-b border-gray-200">
                <td colSpan={6} className="px-3 py-2">
                    <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', colors.dot)} />
                        <span className="text-xs font-semibold text-gray-700">{group.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{groupTasks.length}</span>
                        {canEdit && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="ml-auto p-0.5 rounded hover:bg-gray-200 transition-colors"
                            >
                                <Plus className="h-3 w-3 text-gray-400" />
                            </button>
                        )}
                    </div>
                </td>
            </tr>

            {/* Inline add */}
            {isAdding && (
                <tr>
                    <td colSpan={6} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                            <input
                                type="text"
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAdd();
                                    if (e.key === 'Escape') { setIsAdding(false); setNewTaskName(''); }
                                }}
                                placeholder="Task name..."
                                className="flex-1 text-sm border-0 outline-none bg-transparent"
                                autoFocus
                            />
                            <Button size="sm" onClick={handleAdd} className="h-6 text-xs px-2">Add</Button>
                            <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setNewTaskName(''); }} className="h-6 text-xs px-2">Cancel</Button>
                        </div>
                    </td>
                </tr>
            )}

            {/* Add task row */}
            {canEdit && !isAdding && groupTasks.length === 0 && (
                <tr>
                    <td colSpan={6}>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors w-full"
                        >
                            <Plus className="h-3 w-3" /> Add task
                        </button>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Main List View ────────────────────────────────────────
export default function ClickUpTaskList({
    tasks,
    groups,
    teamMembers,
    canEdit,
    onTaskClick,
    onToggleComplete,
    onAddTask,
    onUpdateTask,
    onStatusChange,
    onAssigneeChange,
    onDueDateChange,
    onPriorityChange,
}) {
    const handleStatusChange = async (taskId, newGroupId) => {
        // Use parent handler if available, otherwise use internal logic
        if (onStatusChange) {
            return onStatusChange(taskId, newGroupId);
        }
        
        const group = groups.find(g => g.id === newGroupId);
        const isComplete = group?.name === 'Complete';
        onUpdateTask?.({ id: taskId, group_id: newGroupId, completed: isComplete });
        try {
            await axios.patch(`/tasks/${taskId}`, { group_id: newGroupId, completed: isComplete }, { headers: { 'Accept': 'application/json' } });
        } catch (e) { console.error('Failed to update status:', e); }
    };

    const handleAssigneeChange = async (taskId, userId) => {
        // Use parent handler if available, otherwise use internal logic
        if (onAssigneeChange) {
            return onAssigneeChange(taskId, userId);
        }
        
        const member = (teamMembers || []).find(m => m.id === userId);
        onUpdateTask?.({ id: taskId, assigned_to_user_id: userId, assigned_to_user: member || null, assignedToUser: member || null });
        try {
            await axios.patch(`/tasks/${taskId}`, { assigned_to_user_id: userId }, { headers: { 'Accept': 'application/json' } });
        } catch (e) { console.error('Failed to update assignee:', e); }
    };

    const handleDueDateChange = async (taskId, date) => {
        // Use parent handler if available, otherwise use internal logic
        if (onDueDateChange) {
            return onDueDateChange(taskId, date);
        }
        
        onUpdateTask?.({ id: taskId, due_on: date });
        try {
            await axios.patch(`/tasks/${taskId}`, { due_on: date }, { headers: { 'Accept': 'application/json' } });
        } catch (e) { console.error('Failed to update due date:', e); }
    };

    const handlePriorityChange = async (taskId, priority) => {
        // Use parent handler if available, otherwise use internal logic
        if (onPriorityChange) {
            return onPriorityChange(taskId, priority);
        }
        
        onUpdateTask?.({ id: taskId, priority });
        try {
            await axios.patch(`/tasks/${taskId}`, { priority }, { headers: { 'Accept': 'application/json' } });
        } catch (e) { console.error('Failed to update priority:', e); }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 w-[35%]">Task</th>
                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 w-[13%]">Status</th>
                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 w-[15%]">Assignee</th>
                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 w-[13%]">Due Date</th>
                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 w-[10%]">Priority</th>
                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 w-[14%]">Activity</th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map(group => {
                        const groupTasks = tasks.filter(t => t.group_id === group.id);
                        return (
                            <React.Fragment key={group.id}>
                                <GroupHeaderRow 
                                    group={group} 
                                    tasks={tasks} 
                                    canEdit={canEdit} 
                                    onAddTask={onAddTask} 
                                />
                                {groupTasks.map(task => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        groups={groups}
                                        teamMembers={teamMembers}
                                        canEdit={canEdit}
                                        onTaskClick={onTaskClick}
                                        onToggleComplete={onToggleComplete}
                                        onStatusChange={handleStatusChange}
                                        onAssigneeChange={handleAssigneeChange}
                                        onDueDateChange={handleDueDateChange}
                                        onPriorityChange={handlePriorityChange}
                                    />
                                ))}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            {/* Empty state */}
            {tasks.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No tasks yet</p>
                </div>
            )}
        </div>
    );
}
