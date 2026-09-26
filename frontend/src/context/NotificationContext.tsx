/** Notification context — polls unread count and exposes list actions. */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '@/services/api';
import type { Notification } from '@/types';
import { useAuth } from './AuthContext';

interface NotifCtx {
  items: Notification[];
  unread: number;
  reload: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

const Ctx = createContext<NotifCtx | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const reload = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get<{ notifications: Notification[]; unread: number }>(
        '/notifications');
      setItems(data.notifications);
      setUnread(data.unread);
    } catch { /* silent — demo */ }
  }, [user]);

  const markAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/read');
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: 1 })));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    void reload();
    const id = window.setInterval(() => void reload(), 15000);
    return () => window.clearInterval(id);
  }, [user, reload]);

  return <Ctx.Provider value={{ items, unread, reload, markAllRead }}>{children}</Ctx.Provider>;
}

export function useNotifications(): NotifCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
