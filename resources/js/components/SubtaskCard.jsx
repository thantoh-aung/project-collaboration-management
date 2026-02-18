import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, Circle, MessageSquare, Paperclip, User, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SubtaskCard({ subtask, canEdit, onToggleComplete, onAssigneeChange }) {
  const isCompleted = subtask.completed;
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-all",
      isCompleted ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 hover:border-gray-400"
    )}>
      {/* Completion checkbox */}
      <button
        onClick={() => onToggleComplete?.(subtask)}
        className={cn(
          "flex-shrink-0 transition-colors",
          isCompleted ? "text-green-500" : "text-gray-300 hover:text-gray-500"
        )}
        disabled={!canEdit}
      >
        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      </button>

      {/* Subtask info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium truncate",
            isCompleted && "text-gray-500 line-through"
          )}>
            {subtask.name}
          </span>
        </div>
        
        {/* Subtask icons */}
        <div className="flex items-center gap-3 mt-1">
          {/* Assignee icon */}
          {subtask.assigned_to_user && (
            <div className="flex items-center gap-1" title={subtask.assigned_to_user.name}>
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                  {subtask.assigned_to_user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          {/* Status indicator */}
          <div className="flex items-center gap-1">
            {isCompleted ? (
              <CheckCircle2 className="h-3 w-3 text-green-500" title="Completed" />
            ) : (
              <Circle className="h-3 w-3 text-gray-400" title="Not completed" />
            )}
          </div>
          
          {/* Due date icon */}
          {subtask.due_at && (
            <div className="flex items-center gap-1" title={`Due: ${new Date(subtask.due_at).toLocaleDateString()}`}>
              <Calendar className="h-3 w-3 text-gray-400" />
            </div>
          )}
          
          {/* Comments count (placeholder - would need comments relationship) */}
          <div className="flex items-center gap-1 text-gray-400">
            <MessageSquare className="h-3 w-3" />
            <span className="text-xs">0</span>
          </div>
          
          {/* Attachments count (placeholder - would need attachments relationship) */}
          <div className="flex items-center gap-1 text-gray-400">
            <Paperclip className="h-3 w-3" />
            <span className="text-xs">0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
