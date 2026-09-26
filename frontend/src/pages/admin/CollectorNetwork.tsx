/** Admin: collector network overview. */
import { useEffect, useState } from 'react';
import { BadgeCheck, Search, Star, Truck } from 'lucide-react';
import { api } from '@/services/api';
import { MaterialChip } from '@/components/ui';

interface Row {
  id: number; name: string; zone: string; business_name: string;
  rating: number; completed_pickups: number; vehicle: string;
  available: number; materials: string; verified: number;
}

export default function CollectorNetwork() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get<{ collectors: Row[] }>('/collectors')
      .then((d) => setRows(d.collectors))
      .catch(() => setRows([]));
  }, []);

  const filtered = (rows || []).filter((r) =>
    !q || r.name.toLowerCase().includes(q.toLowerCase()) ||
    (r.business_name || '').toLowerCase().includes(q.toLowerCase()) ||
    r.zone.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Collector Network</h1>
          <p className="text-[13px] text-ink-soft">{rows?.length ?? 0} collector profiles across Ahmedabad</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or zone…"
            className="input w-64 pl-9" aria-label="Search collectors" />
        </div>
      </div>

      {!rows ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-36" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, 60).map((c) => (
            <div key={c.id} className="card card-hover p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-bold text-ink">{c.business_name || c.name}</p>
                  <p className="text-[12px] text-ink-soft">{c.name} · {c.zone}</p>
                </div>
                <span className={`badge ${c.available ? 'bg-brand-50 text-brand-700' : 'bg-neutral-100 text-neutral-500'}`}>
                  {c.available ? 'Available' : 'Busy'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-soft">
                <span className="flex items-center gap-1 text-amber-600"><Star size={12} fill="currentColor" /> {Number(c.rating).toFixed(1)}</span>
                <span className="flex items-center gap-1"><Truck size={12} /> {c.vehicle}</span>
                <span>{c.completed_pickups.toLocaleString('en-IN')} pickups</span>
                {c.verified ? <span className="flex items-center gap-1 text-sky-600"><BadgeCheck size={12} /> Verified</span> : null}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {(c.materials || '').split(',').filter(Boolean).slice(0, 5).map((m) => (
                  <MaterialChip key={m} category={m.toLowerCase().replace(' ', '-')} name={m} size="sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
