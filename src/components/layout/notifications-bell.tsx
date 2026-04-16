'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Bell, AlertTriangle, Settings2, Bot, PencilLine, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { dismissNotifications } from '@/lib/notification-dismissal';

interface UserMinutes {
  totalMinutes: number;
}

interface NotificationSettings {
  low_minutes_warning_enabled: boolean;
  low_minutes_threshold: number;
}

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'assistant_request' | 'edit_request';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

const STORAGE_KEY_PREFIX = 'hello_dismissed_notifications_';

function loadDismissed(userId: number | string): Set<string> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export default function NotificationsBell() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [userMinutes, setUserMinutes] = useState<UserMinutes | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    low_minutes_warning_enabled: true,
    low_minutes_threshold: 20
  });
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Load persisted dismissed IDs from localStorage when user is known
  useEffect(() => {
    if (user?.id) {
      setDismissed(loadDismissed(user.id));
    }
  }, [user?.id]);

  const dismiss = useCallback((ids: string[]) => {
    if (!user?.id) return;
    dismissNotifications(user.id, ids);
    setDismissed(prev => new Set(Array.from(prev).concat(ids)));
  }, [user?.id]);

  const fetchData = useCallback(async () => {
    try {
      if (isAdmin) {
        const adminRes = await fetch('/api/admin/notifications', { cache: 'no-store' });
        if (adminRes.ok) {
          const data = await adminRes.json();
          const list: Notification[] = (data.notifications || []).map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.timestamp),
            isRead: false,
            actionUrl: n.actionUrl
          }));
          setNotifications(list);
        }
      } else {
        const [minutesRes, settingsRes] = await Promise.all([
          fetch('/api/minutes/my-minutes'),
          fetch('/api/minutes/settings')
        ]);
        if (minutesRes.ok) setUserMinutes(await minutesRes.json());
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          setSettings({
            low_minutes_warning_enabled: s.low_minutes_warning_enabled !== false,
            low_minutes_threshold: s.low_minutes_threshold || 20
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch notification data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Non-admin: build low-minutes notification
  useEffect(() => {
    if (isAdmin) return;
    const list: Notification[] = [];
    if (
      userMinutes &&
      settings.low_minutes_warning_enabled &&
      userMinutes.totalMinutes < settings.low_minutes_threshold &&
      userMinutes.totalMinutes > 0
    ) {
      list.push({
        id: 'low-minutes',
        type: 'warning',
        title: 'Low Minutes Warning',
        message: `You have only ${userMinutes.totalMinutes} minutes remaining`,
        timestamp: new Date(),
        isRead: false,
        actionUrl: '/dashboard/billing'
      });
    }
    setNotifications(list);
  }, [userMinutes, settings, isAdmin]);

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));
  const hasUnread = visibleNotifications.length > 0;

  const getTimeAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getIcon = (type: Notification['type']) => {
    if (type === 'assistant_request') return <Bot className="h-4 w-4 text-violet-500" />;
    if (type === 'edit_request') return <PencilLine className="h-4 w-4 text-amber-500" />;
    return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  };

  const getIconBg = (type: Notification['type']) => {
    if (type === 'assistant_request') return 'bg-violet-500/10';
    if (type === 'edit_request') return 'bg-amber-500/10';
    return 'bg-orange-500/10';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-100 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base">Inbox</h3>
            <span className="text-sm text-muted-foreground">{visibleNotifications.length}</span>
          </div>
          {!isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.location.href = '/dashboard/settings?tab=alerts'}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-125 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visibleNotifications.length > 0 ? (
            <div className="divide-y">
              {visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'group flex items-start gap-3 px-4 py-3 transition-colors',
                    !notification.isRead && 'bg-accent/20'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn('shrink-0 rounded-full p-2 mt-0.5 cursor-pointer', getIconBg(notification.type))}
                    onClick={() => notification.actionUrl && (window.location.href = notification.actionUrl)}
                  >
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 space-y-1 cursor-pointer"
                    onClick={() => notification.actionUrl && (window.location.href = notification.actionUrl)}
                  >
                    <p className="text-sm font-medium leading-tight">{notification.title}</p>
                    <p className="text-sm text-muted-foreground leading-snug">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{getTimeAgo(notification.timestamp)}</p>
                  </div>

                  {/* Dismiss X — always visible, no hover-only */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss([notification.id]);
                    }}
                    className="shrink-0 mt-1 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center px-4">
              <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {visibleNotifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  dismiss(visibleNotifications.map(n => n.id));
                  toast.success('All notifications cleared');
                }}
              >
                Archive All
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
