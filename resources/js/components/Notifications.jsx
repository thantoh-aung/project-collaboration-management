import { useState, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Notifications = ({ notifications = [] }) => {
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Convert incoming notifications to toast format
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

  const removeNotification = (id) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id) => {
    setActiveNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const getIcon = (type) => {
    const iconMap = {
      success: <CheckCircle className="h-4 w-4 text-green-500" />,
      error: <AlertCircle className="h-4 w-4 text-red-500" />,
      warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      info: <Bell className="h-4 w-4 text-blue-500" />,
      default: <Bell className="h-4 w-4 text-gray-500" />
    };
    return iconMap[type] || iconMap.default;
  };

  const unreadCount = activeNotifications.filter(n => !n.read).length;

  return (
    <>
      {/* Notification Bell */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="fixed top-16 right-4 z-50 w-80 bg-background border rounded-lg shadow-lg max-h-96 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {activeNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {activeNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-accent cursor-pointer transition-colors",
                      !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                    onClick={() => {
                      markAsRead(notification.id);
                      // Handle navigation if needed
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground ml-2">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mt-1 -mr-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {activeNotifications.length > 0 && (
            <div className="p-3 border-t bg-muted/50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  // Mark all as read
                  setActiveNotifications(prev => 
                    prev.map(n => ({ ...n, read: true }))
                  );
                }}
              >
                Mark all as read
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Notifications;
