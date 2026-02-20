import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, MessageSquare, Paperclip, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

const typeConfig = {
  task_assigned: { icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-900/30' },
  comment_added: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-900/30' },
  attachment_added: { icon: Paperclip, color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
  status_changed: { icon: ArrowRightLeft, color: 'text-orange-400', bg: 'bg-orange-900/30' },
};

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function NotificationsIndex() {
  const { props } = usePage();
  const [items, setItems] = useState(props.notifications || []);

  const markAsRead = async (id) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    try { await axios.post(`/api/notifications/${id}/read`); } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    try { await axios.post('/api/notifications/mark-all-read'); } catch (e) { console.error(e); }
  };

  const handleClick = (notification) => {
    if (!notification.read_at) markAsRead(notification.id);
    const data = notification.data || {};
    if (data.project_id) {
      router.visit(`/projects/${data.project_id}/tasks`);
    }
  };

  const unreadCount = items.filter(n => !n.read_at).length;

  return (
    <>
      <Head title="Notifications" />
      <MainLayout title="Notifications">
        <div className="min-h-screen bg-slate-900 text-white">
          {/* Animated Background Elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          </div>
          
          <div className="relative z-10 max-w-3xl mx-auto py-6 px-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">Notifications</h1>
                <p className="text-sm text-gray-300">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead} className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white">Mark all as read</Button>
              )}
            </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700 shadow-lg shadow-blue-600/20">
                <CardContent className="p-12 text-center">
                  <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-1">No notifications</h3>
                  <p className="text-gray-400 text-sm">You're all caught up!</p>
                </CardContent>
              </Card>
            ) : (
              items.map((n) => {
                const cfg = typeConfig[n.type] || typeConfig.task_assigned;
                const Icon = cfg.icon;
                return (
                  <Card
                    key={n.id}
                    className={cn(
                      "transition-all hover:shadow-lg hover:shadow-blue-600/20 cursor-pointer bg-slate-800 border-slate-700",
                      !n.read_at && "border-l-4 border-l-purple-500 bg-purple-900/20"
                    )}
                    onClick={() => handleClick(n)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-full flex-shrink-0", cfg.bg)}>
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-sm font-medium text-white">{n.title}</h4>
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{timeAgo(n.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-300">{n.message}</p>
                        </div>
                        {!n.read_at && <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
        </div>
      </MainLayout>
    </>
  );
}
