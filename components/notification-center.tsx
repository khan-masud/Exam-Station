'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { Bell, X, Archive, Trash2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  category?: string;
  priority?: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  created_at: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) return; // Don't fetch if not authenticated
    
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.is_read).length || 0);
      } else if (response.status !== 401) {
        // Only log non-authentication errors
        console.error('[NotificationCenter] Failed to fetch, status:', response.status);
      }
    } catch (error) {
      console.error('[NotificationCenter] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });

      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeIcon = (type: string): ReactNode => {
    const icons: Record<string, ReactNode> = {
      exam: <span className="text-purple-500">📝</span>,
      system: <span className="text-blue-500">⚙️</span>,
      support: <span className="text-green-500">💬</span>,
      payment: <span className="text-amber-500">💳</span>,
      default: <span className="text-gray-500">ℹ️</span>,
    };
    return icons[type] || icons.default;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 max-h-96 p-0" align="end">
        <div className="sticky top-0 border-b bg-background p-4">
          <h2 className="font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">{notifications.length} total</p>
        </div>

        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 transition ${
                    !notification.is_read ? 'bg-blue-500/10 dark:bg-blue-500/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-lg mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <h3 className="font-medium text-sm truncate">
                            {notification.title}
                          </h3>
                          {notification.priority && (
                            <Badge
                              className={`text-xs whitespace-nowrap ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                        {notification.action_url && (
                          <a
                            href={notification.action_url}
                            className="text-xs text-primary hover:underline mt-2 inline-block"
                          >
                            {notification.action_label || 'View'}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="sticky bottom-0 border-t bg-background p-2">
          <Link href={user?.role === 'admin' ? '/admin/notifications' : '/student/notifications'} className="block">
            <Button variant="outline" className="w-full text-xs">
              View All Notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
