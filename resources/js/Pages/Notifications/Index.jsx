import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, MessageSquare, Paperclip, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

const typeConfig = {
  task_assigned: { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
  comment_added: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
  attachment_added: { icon: Paperclip, color: 'text-green-600', bg: 'bg-green-100' },
  status_changed: { icon: ArrowRightLeft, color: 'text-orange-600', bg: 'bg-orange-100' },
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
        <div className="max-w-3xl mx-auto py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Notifications</h1>
              <p className="text-sm text-gray-500">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>Mark all as read</Button>
            )}
          </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
                  <p className="text-gray-500 text-sm">You're all caught up!</p>
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
                      "transition-all hover:shadow-md cursor-pointer",
                      !n.read_at && "border-l-4 border-l-purple-500 bg-purple-50/20"
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
                            <h4 className="text-sm font-medium text-gray-900">{n.title}</h4>
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{timeAgo(n.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-600">{n.message}</p>
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
      </MainLayout>
    </>
  );
}
