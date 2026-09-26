/** Admin: all pickups across the city. */
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Pickup } from '@/types';
import { STATUS_LABELS, formatDateTime, formatINR } from '@/utils/format';
import { StatusBadge, MaterialChip } from '@/components/ui';

const FILTERS = ['all', 'pending', 'accepted', 'on_the_way', 'collected', 'completed', 'cancelled'] as const;

export default function AdminPickups() {
  const [pickups, setPickups] = useState<Pickup[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  useEffect(() => {
    api.get<{ pickups: Pickup[] }>('/pickups?scope=all&limit=300')
      .then((d) => setPickups(d.pickups))
      .catch(() => setPickups([]));
  }, []);

  const rows = (pickups || []).filter((p) => filter === 'all' || p.status === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">All Pickups</h1>
        <p className="text-[13px] text-ink-soft">City-wide request feed · newest first</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition
              ${filter === f ? 'bg-ink text-white' : 'border border-neutral-200 bg-white text-ink-soft hover:border-brand-300'}`}>
            {f === 'all' ? 'All' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {!pickups ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-12" />)}</div>
      ) : (
        <div className="card overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400" tabIndex={0} role="region" aria-label="Data table (scrollable)">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr><th className="th">ID</th><th className="th">Customer</th><th className="th">Collector</th>
                <th className="th">Materials</th><th className="th">Zone</th><th className="th">Created</th>
                <th className="th">Value</th><th className="th">Status</th></tr>
            </thead>
            <tbody>
              {rows.slice(0, 150).map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50/70">
                  <td className="td num text-[12.5px] font-semibold text-brand-700">{p.code}</td>
                  <td className="td text-[13px]">{p.customer_name}</td>
                  <td className="td text-[13px]">{p.business_name || p.collector_name || <span className="text-neutral-400">—</span>}</td>
                  <td className="td"><div className="flex flex-wrap gap-1">{p.items.slice(0, 2).map((it) => <MaterialChip key={it.category + it.id} category={it.category} size="sm" />)}</div></td>
                  <td className="td text-[12.5px] text-ink-soft">{p.zone}</td>
                  <td className="td whitespace-nowrap text-[12px] text-ink-soft">{formatDateTime(p.created_at)}</td>
                  <td className="td num text-[12.5px]">{p.final_value ? formatINR(p.final_value) : '—'}</td>
                  <td className="td"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
