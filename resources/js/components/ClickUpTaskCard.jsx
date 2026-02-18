import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, Circle, MessageSquare, Paperclip, Calendar, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClickUpTaskCard({ 
    task, 
    onClick, 
    onToggleComplete, 
    canEdit = true,
    groupColor = 'To Do',
    isDragging = false
}) {
    const isCompleted = task.completed || groupColor === 'Complete';
    const commentCount = task.comments_count || task.comments?.length || 0;
    const attachmentCount = task.attachments_count || task.attachments?.length || 0;
    const subtaskCount = task.rootSubtasks?.length || 0;
    const completedSubtasks = task.rootSubtasks?.filter(s => s.completed)?.length || 0;

    const getStatusColor = () => {
        switch (groupColor) {
            case 'In Progress': return 'text-indigo-500 hover:text-indigo-600';
            case 'Complete': return 'text-emerald-500 hover:text-emerald-600';
            default: return 'text-gray-400 hover:text-gray-600';
        }
    };

    const getCompletedColor = () => 'text-emerald-500';

    return (
        <div
            className={cn(
                'group bg-white border border-gray-200/80 rounded-xl p-3 cursor-pointer transition-all duration-200',
                'hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5',
                isDragging && 'shadow-xl shadow-indigo-500/15 border-indigo-300 rotate-1 opacity-90',
                isCompleted && 'opacity-70'
            )}
            onClick={() => onClick(task)}
        >
            {/* Row 1: Status icon + Task name */}
            <div className="flex items-start gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (canEdit) onToggleComplete?.(task);
                    }}
                    className={cn('flex-shrink-0 mt-0.5 transition-colors', isCompleted ? getCompletedColor() : getStatusColor())}
                >
                    {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <Circle className="h-4 w-4" />
                    )}
                </button>
                <span className={cn(
                    'flex-1 text-sm font-medium leading-snug',
                    isCompleted && 'line-through text-gray-400'
                )}>
                    {task.name}
                </span>
            </div>

            {/* Row 2: Meta icons */}
            <div className="flex items-center gap-3 mt-2 ml-6">
                {/* Assignee */}
                {task.assigned_to_user && (
                    <div className="flex items-center gap-1" title={task.assigned_to_user.name}>
                        <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700 font-medium">
                                {task.assigned_to_user.name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                )}

                {/* Due date */}
                {task.due_on && (
                    <div className="flex items-center gap-1 text-xs text-gray-500" title={new Date(task.due_on).toLocaleDateString()}>
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(task.due_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                )}

                {/* Comment count */}
                {commentCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare className="h-3 w-3" />
                        <span>{commentCount}</span>
                    </div>
                )}

                {/* Attachment count */}
                {attachmentCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Paperclip className="h-3 w-3" />
                        <span>{attachmentCount}</span>
                    </div>
                )}

                {/* Subtask progress */}
                {subtaskCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{completedSubtasks}/{subtaskCount}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
