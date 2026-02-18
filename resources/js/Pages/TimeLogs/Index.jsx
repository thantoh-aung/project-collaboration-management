import MainLayout from '@/Layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter,
  Play,
  Pause,
  Square,
  Clock,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';

export default function TimeLogsIndex() {
  // Mock data - replace with real API calls
  const timeLogs = [
    {
      id: 1,
      task: 'Design homepage mockup',
      project: 'Website Redesign',
      user: 'John Doe',
      duration: 120, // minutes
      startTime: '2024-02-01T09:00:00',
      endTime: '2024-02-01T11:00:00',
      description: 'Created wireframes and initial mockups',
      billable: true,
      hourlyRate: 75
    },
    {
      id: 2,
      task: 'API integration',
      project: 'Mobile App Development',
      user: 'Jane Smith',
      duration: 180,
      startTime: '2024-02-01T13:00:00',
      endTime: '2024-02-01T16:00:00',
      description: 'Implemented authentication endpoints',
      billable: true,
      hourlyRate: 85
    },
    {
      id: 3,
      task: 'Client meeting',
      project: 'Marketing Campaign',
      user: 'Mike Johnson',
      duration: 60,
      startTime: '2024-02-01T10:00:00',
      endTime: '2024-02-01T11:00:00',
      description: 'Weekly status call with client',
      billable: true,
      hourlyRate: 100
    },
  ];

  const activeTimer = {
    id: null,
    task: 'Code review',
    project: 'Website Redesign',
    startTime: '2024-02-01T14:30:00',
    duration: 45 // minutes so far
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.floor((end - start) / (1000 * 60));
    return formatTime(duration);
  };

  const calculateEarnings = (duration, rate) => {
    return (duration / 60) * rate;
  };

  return (
    <MainLayout title="Time Tracking">
      <div className="space-y-6">
        {/* Active Timer */}
        <Card className="border-indigo-300 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Active Timer
            </CardTitle>
            <CardDescription>Currently tracking time on a task</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{activeTimer.task}</h3>
                <p className="text-sm text-muted-foreground">{activeTimer.project}</p>
                <p className="text-lg font-mono mt-2">{formatTime(activeTimer.duration)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-md shadow-red-500/30">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Timer */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Start tracking time on a task</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input placeholder="What are you working on?" className="flex-1" />
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all duration-300">
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Time Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">24.5h</div>
                  <div className="text-sm text-muted-foreground">This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-gradient-to-tr from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">$1,875</div>
                  <div className="text-sm text-muted-foreground">Billable</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-gradient-to-tr from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <CheckSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">18</div>
                  <div className="text-sm text-muted-foreground">Tasks Tracked</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-sm text-muted-foreground">Billable Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Logs List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Time Logs</CardTitle>
                <CardDescription>Recent time entries and activities</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search logs..." className="pl-10 w-64" />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-md shadow-indigo-500/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md">
                  {/* Time Info */}
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatTime(log.duration)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.startTime).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Task Info */}
                  <div className="flex-1">
                    <h3 className="font-medium">{log.task}</h3>
                    <p className="text-sm text-muted-foreground">{log.project}</p>
                    <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.user}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.startTime).toLocaleTimeString()} - {new Date(log.endTime).toLocaleTimeString()}
                      </span>
                      <Badge variant={log.billable ? 'default' : 'secondary'} className="text-xs">
                        {log.billable ? 'Billable' : 'Non-billable'}
                      </Badge>
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="text-right">
                    <div className="font-medium">
                      ${calculateEarnings(log.duration, log.hourlyRate).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${log.hourlyRate}/hr
                    </div>
                  </div>

                  {/* Actions */}
                  <Button variant="ghost" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
