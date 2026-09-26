/** Customer pickups list with filters. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ClipboardList, SearchX } from 'lucide-react';
import { api } from '@/services/api';
import type { Pickup } from '@/types';
import { formatDateTime, formatINR } from '@/utils/format';
import { Empty, StatusBadge, MaterialChip } from '@/components/ui';
import { useLang } from '@/context/LanguageContext';

const FILTERS = ['all', 'completed', 'pending', 'accepted', 'on_the_way', 'collected', 'cancelled'] as const;

/** filter value -> dictionary key. */
const KEY_OF: Record<(typeof FILTERS)[number], string> = {
  all: 'all', completed: 'completed', pending: 'pending', accepted: 'accepted',
  on_the_way: 'onTheWay', collected: 'collected', cancelled: 'cancelled',
};

export default function MyPickups() {
  const { t } = useLang();
  const [pickups, setPickups] = useState<Pickup[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  useEffect(() => {
    api.get<{ pickups: Pickup[] }>('/pickups?scope=mine')
      .then((d) => setPickups(d.pickups))
      .catch(() => setPickups([]));
  }, []);

  const rows = (pickups || []).filter((p) => filter === 'all' || p.status === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">{t('myPickups')}</h1>
        <p className="text-[13px] text-ink-soft">{t('everyRequest')}</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter pickups">
        {FILTERS.map((f) => (
          <button key={f} type="button" role="tab" aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition
              ${filter === f ? 'bg-ink text-white' : 'bg-white text-ink-soft border border-neutral-200 hover:border-brand-300'}`}>
            {f === 'all' ? t('all') : t(KEY_OF[f])}
            <span className="ml-1.5 text-[10.5px] opacity-60">
              {f === 'all' ? (pickups || []).length : (pickups || []).filter((p) => p.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {!pickups ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : rows.length === 0 ? (
        <Empty icon={filter === 'all' ? ClipboardList : SearchX}
          title={filter === 'all' ? t('noPickupsYet') : t('noStatusPickups')}
          description={filter === 'all' ? t('scheduleFirst')
            : t('tryDifferentFilter')}
          action={filter === 'all' ? <Link to="/app/schedule" className="btn-primary"><CalendarClock size={15} /> {t('schedulePickup')}</Link> : undefined} />
      ) : (
        <div className="card overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400" tabIndex={0} role="region" aria-label="Data table (scrollable)">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr>
                <th className="th">{t('pickupId')}</th><th className="th">{t('date')}</th><th className="th">{t('collector')}</th>
                <th className="th">{t('materials')}</th><th className="th">{t('weight')}</th><th className="th">{t('value')}</th>
                <th className="th">{t('status')}</th><th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50/70">
                  <td className="td num font-semibold text-brand-700">{p.code}</td>
                  <td className="td whitespace-nowrap text-[12.5px] text-ink-soft">{formatDateTime(p.created_at)}</td>
                  <td className="td text-[13px]">{p.business_name || p.collector_name || <span className="text-ink-soft">{t('awaiting')}</span>}</td>
                  <td className="td"><div className="flex flex-wrap gap-1">{p.items.slice(0, 3).map((it) => <MaterialChip key={`${it.category}${it.id ?? ''}`} category={it.category} size="sm" />)}{p.items.length > 3 && <span className="text-[10.5px] text-neutral-400">+{p.items.length - 3}</span>}</div></td>
                  <td className="td num text-[13px]">{(p.actual_weight || p.estimated_weight || 0).toFixed(1)} kg</td>
                  <td className="td num text-[13px] font-medium">{p.final_value ? formatINR(p.final_value) : p.estimated_value_min ? `~${formatINR(p.estimated_value_min)}` : '—'}</td>
                  <td className="td"><StatusBadge status={p.status} /></td>
                  <td className="td"><Link to={`/app/pickups/${p.id}`} className="text-[12.5px] font-semibold text-brand-700 hover:underline">{t('view')}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
