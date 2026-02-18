import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MessageSquare, Paperclip, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function TaskCard({ task, onClick, isDragging }) {
  const isOverdue = task.due_on && new Date(task.due_on) < new Date() && !task.completed_at;
  
  return (
    <Card
      className={cn(
        "p-3 cursor-pointer hover:shadow-md transition-all duration-200 bg-white border border-gray-200",
        isDragging && "opacity-50 rotate-2",
        isOverdue && "border-l-4 border-l-red-500"
      )}
      onClick={onClick}
    >
      {/* Task Title */}
      <h4 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
        {task.name}
      </h4>

      {/* Description Preview */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.slice(0, 3).map((label, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs px-2 py-0"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </Badge>
          ))}
          {task.labels.length > 3 && (
            <Badge variant="secondary" className="text-xs px-2 py-0">
              +{task.labels.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {/* Due Date & Metadata */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {task.due_on && (
            <div className={cn(
              "flex items-center gap-1",
              isOverdue && "text-red-500 font-medium"
            )}>
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.due_on), 'MMM d')}</span>
            </div>
          )}
          
          {task.comments_count > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{task.comments_count}</span>
            </div>
          )}
          
          {task.attachments_count > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments_count}</span>
            </div>
          )}

          {task.estimation && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{Math.round(task.estimation / 60)}h</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assigned_to_user && (
          <Avatar className="h-6 w-6 border-2 border-white">
            <AvatarImage src={task.assigned_to_user.avatar_url} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-violet-500 text-white">
              {task.assigned_to_user.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </Card>
  );
}
