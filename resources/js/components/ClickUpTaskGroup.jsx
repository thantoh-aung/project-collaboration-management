import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import ClickUpTaskCard from './ClickUpTaskCard';

const GROUP_COLORS = {
    'To Do': {
        dot: 'bg-gray-400',
        badge: 'bg-gray-100 text-gray-700',
        border: 'border-t-gray-400',
        addBtn: 'text-gray-500 hover:text-gray-700',
        headerBg: 'from-gray-50 to-gray-100/50',
    },
    'In Progress': {
        dot: 'bg-indigo-500',
        badge: 'bg-indigo-50 text-indigo-700',
        border: 'border-t-indigo-500',
        addBtn: 'text-indigo-500 hover:text-indigo-700',
        headerBg: 'from-indigo-50 to-purple-50/50',
    },
    'Complete': {
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700',
        border: 'border-t-emerald-500',
        addBtn: 'text-emerald-500 hover:text-emerald-700',
        headerBg: 'from-emerald-50 to-green-50/50',
    },
};

const DEFAULT_COLOR = {
    dot: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700',
    border: 'border-t-purple-500',
    addBtn: 'text-purple-500 hover:text-purple-700',
    headerBg: 'from-purple-50 to-violet-50/50',
};

export default function ClickUpTaskGroup({
    group,
    tasks,
    onTaskClick,
    onAddTask,
    onToggleTaskComplete,
    onRenameGroup,
    onDeleteGroup,
    canEdit = true,
    teamMembers = []
}) {
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(group.name);
    const [isDeleting, setIsDeleting] = useState(false);

    // Check if this is a system group
    const isSystemGroup = group.type === 'system';
    
    const colors = GROUP_COLORS[group.name] || DEFAULT_COLOR;
    const groupTasks = tasks.filter(task => {
        // Handle both possible field names for group ID
        const taskId = task.group_id || task.task_group_id;
        return taskId === group.id;
    });
    
    // Debug logging
    console.log(`🔍 Group "${group.name}" (ID: ${group.id}):`);
    console.log('🔍 All tasks:', tasks.map(t => ({ 
        id: t.id, 
        name: t.name, 
        group_id: t.group_id, 
        task_group_id: t.task_group_id,
        effective_id: t.group_id || t.task_group_id
    })));
    console.log('🔍 Group tasks:', groupTasks.map(t => ({ 
        id: t.id, 
        name: t.name, 
        group_id: t.group_id, 
        task_group_id: t.task_group_id,
        effective_id: t.group_id || t.task_group_id
    })));

    const handleAddTask = async () => {
        if (!newTaskName.trim()) return;
        try {
            await onAddTask({
                name: newTaskName.trim(),
                group_id: group.id
            });
            setNewTaskName('');
            setIsAddingTask(false);
        } catch (error) {
            console.error('Failed to add task:', error);
        }
    };

    const handleRename = async () => {
        if (!renameValue.trim() || renameValue === group.name) {
            setIsRenaming(false);
            setRenameValue(group.name);
            return;
        }
        try {
            await onRenameGroup?.(group.id, renameValue.trim());
            setIsRenaming(false);
        } catch (error) {
            console.error('Failed to rename group:', error);
            setRenameValue(group.name);
            setIsRenaming(false);
        }
    };

    const handleDelete = async () => {
        try {
            await onDeleteGroup?.(group.id);
            setIsDeleting(false);
        } catch (error) {
            console.error('Failed to delete group:', error);
            setIsDeleting(false);
        }
    };

    return (
        <div className={cn('flex flex-col bg-white rounded-xl border border-gray-200/80 border-t-2 shadow-sm hover:shadow-md transition-shadow duration-300', colors.border)}>
            {/* Header */}
            <div className={cn('flex items-center justify-between px-3 py-3 bg-gradient-to-r rounded-t-xl', colors.headerBg)}>
                <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', colors.dot)} />
                    <h3 className="text-sm font-semibold text-gray-800">{group.name}</h3>
                    <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', colors.badge)}>
                        {groupTasks.length}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {canEdit && (
                        <button
                            onClick={() => setIsAddingTask(true)}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-gray-200 transition-colors">
                                <MoreHorizontal className="h-3.5 w-3.5 text-gray-500" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {!isSystemGroup && (
                                <DropdownMenuItem className="text-xs" onClick={() => setIsRenaming(true)}>
                                    <Edit className="h-3.5 w-3.5 mr-2" />
                                    Rename
                                </DropdownMenuItem>
                            )}
                            {!isSystemGroup && (
                                <DropdownMenuItem className="text-xs text-red-600" onClick={() => setIsDeleting(true)}>
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            )}
                            {isSystemGroup && (
                                <div className="px-2 py-2 text-xs text-gray-500 text-center">
                                    System group
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Inline add task form */}
            {isAddingTask && (
                <div className="mx-3 mb-2 p-2 bg-white border border-indigo-200 rounded-xl shadow-md shadow-indigo-500/10">
                    <input
                        type="text"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTask();
                            else if (e.key === 'Escape') { setIsAddingTask(false); setNewTaskName(''); }
                        }}
                        placeholder="Task name..."
                        className="w-full px-2 py-1.5 text-sm border-0 outline-none bg-transparent"
                        autoFocus
                    />
                    <div className="flex gap-1 mt-2">
                        <Button size="sm" onClick={handleAddTask} className="text-xs h-7 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-sm">Save</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setIsAddingTask(false); setNewTaskName(''); }} className="text-xs h-7 px-3">Cancel</Button>
                    </div>
                </div>
            )}

            {/* Task list - conditional drag/drop */}
            {canEdit ? (
                <Droppable droppableId={group.id.toString()}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                                'flex-1 px-3 pb-2 space-y-2 min-h-[120px] transition-colors rounded-b-lg',
                                snapshot.isDraggingOver && 'bg-indigo-50/50'
                            )}
                        >
                            {groupTasks.map((task, index) => (
                                <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                                    {(dragProvided, dragSnapshot) => (
                                        <div
                                            ref={dragProvided.innerRef}
                                            {...dragProvided.draggableProps}
                                            {...dragProvided.dragHandleProps}
                                        >
                                            <ClickUpTaskCard
                                                task={task}
                                                onClick={onTaskClick}
                                                onToggleComplete={onToggleTaskComplete}
                                                canEdit={canEdit}
                                                groupColor={group.name}
                                                isDragging={dragSnapshot.isDragging}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}

                            {/* Empty state */}
                            {groupTasks.length === 0 && !isAddingTask && !snapshot.isDraggingOver && (
                                <div className="text-center py-6">
                                    <p className="text-xs text-gray-400">No tasks</p>
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            ) : (
                <div className="flex-1 px-3 pb-2 space-y-2 min-h-[120px] rounded-b-lg">
                    {groupTasks.map((task) => (
                        <ClickUpTaskCard
                            key={task.id}
                            task={task}
                            onClick={onTaskClick}
                            onToggleComplete={onToggleTaskComplete}
                            canEdit={canEdit}
                            groupColor={group.name}
                            isDragging={false}
                        />
                    ))}
                </div>
            )}

            {/* Add Task button at bottom */}
            {canEdit && !isAddingTask && (
                <button
                    onClick={() => setIsAddingTask(true)}
                    className={cn(
                        'flex items-center gap-1 px-3 py-2 text-sm transition-colors rounded-b-lg',
                        colors.addBtn
                    )}
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Task</span>
                </button>
            )}

            {/* Rename Dialog */}
            {isRenaming && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-5 w-80 shadow-xl shadow-indigo-500/10 border border-gray-200">
                        <h3 className="text-sm font-semibold mb-3">Rename Group</h3>
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                else if (e.key === 'Escape') {
                                    setIsRenaming(false);
                                    setRenameValue(group.name);
                                }
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                        <div className="flex gap-2 mt-3">
                            <Button size="sm" onClick={handleRename} className="text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">Rename</Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                                setIsRenaming(false);
                                setRenameValue(group.name);
                            }} className="text-xs">Cancel</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {isDeleting && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-5 w-80 shadow-xl shadow-red-500/10 border border-gray-200">
                        <h3 className="text-sm font-semibold mb-2">Delete Group</h3>
                        <p className="text-xs text-gray-600 mb-4">
                            Are you sure you want to delete "{group.name}"? All tasks in this group will be moved to "To Do".
                        </p>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleDelete} className="text-xs bg-red-600 hover:bg-red-700">Delete</Button>
                            <Button variant="ghost" size="sm" onClick={() => setIsDeleting(false)} className="text-xs">Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
