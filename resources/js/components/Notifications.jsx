import { useState, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Notifications = ({ notifications = [] }) => {
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const toasts = notifications.map(notification => ({
      id: notification.id,
      type: getNotificationType(notification.type),
      title: getNotificationTitle(notification),
      message: notification.data?.message || notification.data?.description || 'New notification',
      time: formatTime(notification.created_at),
      read: !!notification.read_at,
    }));
    setActiveNotifications(toasts);
  }, [notifications]);

  const getNotificationType = (type) => {
    const typeMap = {
      'App\\Notifications\\TaskAssigned': 'info',
      'App\\Notifications\\ProjectUpdated': 'success',
      'App\\Notifications\\CommentAdded': 'info',
      'App\\Notifications\\DeadlineReminder': 'warning',
      'App\\Notifications\\Mention': 'info',
      'App\\Notifications\\TaskOverdue': 'error',
      'default': 'info'
    };
    return typeMap[type] || 'default';
  };

  const getNotificationTitle = (notification) => {
    const titleMap = {
      'App\\Notifications\\TaskAssigned': 'New Task Assigned',
      'App\\Notifications\\ProjectUpdated': 'Project Updated',
      'App\\Notifications\\CommentAdded': 'New Comment',
      'App\\Notifications\\DeadlineReminder': 'Deadline Reminder',
      'App\\Notifications\\Mention': 'You were mentioned',
      'App\\Notifications\\TaskOverdue': 'Task Overdue',
      'default': 'Notification'
    };
    return titleMap[notification.type] || 'Notification';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const removeNotification = (id) => setActiveNotifications(prev => prev.filter(n => n.id !== id));
  const markAsRead = (id) => setActiveNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const getIcon = (type) => {
    const iconMap = {
      success: <CheckCircle className="h-4 w-4 text-emerald-500" />,
      error: <AlertCircle className="h-4 w-4 text-red-500" />,
      warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      info: <Bell className="h-4 w-4 text-[#4F46E5]" />,
      default: <Bell className="h-4 w-4 text-[#94A3B8]" />
    };
    return iconMap[type] || iconMap.default;
  };

  const unreadCount = activeNotifications.filter(n => !n.read).length;

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" className="relative border-[#E2E8F0] hover:border-[#4F46E5] hover:bg-indigo-50 text-[#64748B]" onClick={() => setIsOpen(!isOpen)}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed top-16 right-4 z-50 w-80 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-96 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
            <h3 className="font-semibold text-[#0F172A]">Notifications</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F8FAFC]"><X className="h-4 w-4" /></Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {activeNotifications.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8]"><Bell className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No notifications</p></div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {activeNotifications.map((notification) => (
                  <div key={notification.id} className={cn("p-4 hover:bg-[#F8FAFC] cursor-pointer transition-colors", !notification.read && "bg-indigo-50/50")} onClick={() => markAsRead(notification.id)}>
                    <div className="flex items-start gap-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate text-[#0F172A]">{notification.title}</p>
                          <span className="text-xs text-[#94A3B8] ml-2">{notification.time}</span>
                        </div>
                        <p className="text-sm text-[#64748B]">{notification.message}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1 text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9]" onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {activeNotifications.length > 0 && (
            <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <Button variant="ghost" size="sm" className="w-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]" onClick={() => setActiveNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
                Mark all as read
              </Button>
            </div>
          )}
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default Notifications;
