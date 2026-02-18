import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MoreHorizontal,
  Calendar,
  User,
  Plus,
  GripVertical,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const TaskCard = ({ task, onToggleComplete, onQuickAction }) => {
  const [showActions, setShowActions] = useState(false);
  
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  
  return (
    <div
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-move"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Checkbox
            checked={task.completed}
            onCheckedChange={onToggleComplete}
            className="h-4 w-4"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium truncate ${task.completed ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h4>
          
          <div className="flex items-center gap-2 mt-2">
            {task.assignee && (
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            {task.dueDate && (
              <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.labels.map((label) => (
                <Badge
                  key={label.id}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {showActions && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onQuickAction('edit', task)}
          >
            <span className="sr-only">Edit</span>
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onQuickAction('delete', task)}
          >
            <span className="sr-only">Delete</span>
            🗑️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onQuickAction('details', task)}
          >
            <span className="sr-only">Details</span>
            👁️
          </Button>
        </div>
      )}
    </div>
  );
};

const TaskColumn = ({ column, tasks, onToggleComplete, onQuickAction }) => {
  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              {column.title}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onQuickAction={onQuickAction}
            />
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-sm">No tasks yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TaskKanban = ({ initialTasks, onTaskUpdate }) => {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [columns] = useState([
    {
      id: 'todo',
      title: 'To Do',
      color: '#6B7280',
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: '#3B82F6',
    },
    {
      id: 'review',
      title: 'Review',
      color: '#F59E0B',
    },
    {
      id: 'done',
      title: 'Done',
      color: '#10B981',
    },
  ]);

  const getTasksByColumn = (columnId) => {
    return tasks.filter(task => task.status === columnId);
  };

  const handleToggleComplete = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
    
    if (onTaskUpdate) {
      const updatedTask = tasks.find(t => t.id === taskId);
      if (updatedTask) {
        onTaskUpdate({ ...updatedTask, completed: !updatedTask.completed });
      }
    }
  };

  const handleQuickAction = (action, task) => {
    console.log(`Quick action: ${action} on task:`, task);
    // Handle quick actions (edit, delete, details)
  };

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Task Board</h2>
        <p className="text-gray-600">Manage your tasks across different stages</p>
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <TaskColumn
            key={column.id}
            column={column}
            tasks={getTasksByColumn(column.id)}
            onToggleComplete={handleToggleComplete}
            onQuickAction={handleQuickAction}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskKanban;
