import MainLayout from '@/Layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { useWorkspace } from '@/Context/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User } from 'lucide-react';
import { useState } from 'react';
import EnhancedTaskDetailDrawer from '@/Components/EnhancedTaskDetailDrawer';

export default function TasksIndex() {
  const { hasPermission, currentWorkspace } = useWorkspace();
  const { props } = usePage();
  
  // Safely access tasks data
  const tasksData = props.tasks || {};
  const tasks = Array.isArray(tasksData) ? tasksData : (tasksData.data || []);
  
  // State for task detail drawer
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  
  // Mock team members (in real app, this would come from props)
  const teamMembers = props.teamMembers || [];
  
  return (
    <>
      <Head title="Tasks - CollabTool" />
      
      <MainLayout title="Tasks">
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search tasks..." className="pl-10" />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            {hasPermission('create_tasks') && (
              <Link href="/tasks/create">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl border-0 transition-all duration-300">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </Link>
            )}
          </div>

          {/* Task Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{tasks.length}</div>
                <p className="text-sm text-gray-500">Total Tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'todo').length}
                </div>
                <p className="text-sm text-gray-500">To Do</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'in-progress').length}
                </div>
                <p className="text-sm text-gray-500">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <p className="text-sm text-gray-500">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Task List */}
          {tasks.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>All Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 hover:border-indigo-200 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskDetail(true);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <div>
                          <h4 className="font-medium">{task.name}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            {task.project && (
                              <Badge variant="outline" className="text-xs">
                                {task.project.name}
                              </Badge>
                            )}
                            {task.due_on && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.due_on).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {task.assignedToUser && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assignedToUser.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {task.assignedToUser.name?.split(' ').map(n => n[0]).join('') || '?'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <Badge
                          variant={
                            task.status === 'completed'
                              ? 'default'
                              : task.status === 'in-progress'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {task.status?.replace('-', ' ') || 'To Do'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Filter className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-500 mb-6">
                  Get started by creating your first task.
                </p>
                {hasPermission('create_tasks') && (
                  <Link href="/tasks/create">
                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 border-0">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Enhanced Task Detail Drawer */}
        <EnhancedTaskDetailDrawer
          task={selectedTask}
          open={showTaskDetail}
          onClose={() => {
            setShowTaskDetail(false);
            setSelectedTask(null);
          }}
          teamMembers={teamMembers}
          taskGroups={[]}
          projectId={selectedTask?.project_id}
        />
      </MainLayout>
    </>
  );
}
