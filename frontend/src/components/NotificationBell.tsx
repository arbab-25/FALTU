/** Header notification dropdown. */
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, CheckCheck, Info, Leaf } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { timeAgo } from '@/utils/format';

const ICONS: Record<string, typeof Info> = {
  info: Info, success: CheckCheck, impact: Leaf, warn: AlertTriangle,
};

export default function NotificationBell() {
  const { items, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unread} unread)`}
        className="relative rounded-xl border border-neutral-200 bg-white p-2 text-neutral-600 transition hover:border-brand-300 hover:text-brand-700">
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 animate-fade-up overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
            <p className="text-[13px] font-bold text-ink">Notifications</p>
            <button type="button" onClick={() => void markAllRead()}
              className="text-[11.5px] font-semibold text-brand-600 hover:text-brand-700">
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-neutral-400">No notifications yet</p>
            )}
            {items.map((n) => {
              const Icon = ICONS[n.kind] || Info;
              return (
                <div key={n.id} className={`flex gap-2.5 border-b border-neutral-50 px-4 py-3 ${n.read ? '' : 'bg-brand-50/40'}`}>
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                    ${n.kind === 'success' ? 'bg-brand-50 text-brand-600' :
                      n.kind === 'impact' ? 'bg-emerald-50 text-emerald-600' :
                        n.kind === 'warn' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug text-ink">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">{n.body}</p>}
                    <p className="mt-1 text-[10.5px] text-neutral-400">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
