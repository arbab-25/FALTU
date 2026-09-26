/** Recycler incoming intake queue. */
import { useEffect, useState } from 'react';
import { MapPin, Truck } from 'lucide-react';
import { api } from '@/services/api';
import type { RecyclerOverview } from '@/types';
import { formatKg } from '@/utils/format';
import { Empty, StatusBadge, MaterialChip } from '@/components/ui';

export default function RecyclerIntake() {
  const [data, setData] = useState<RecyclerOverview | null>(null);

  useEffect(() => {
    api.get<RecyclerOverview>('/recycler/overview').then(setData).catch(() => void 0);
  }, []);

  if (!data) return <div className="skeleton h-64" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Incoming Material</h1>
        <p className="text-[13px] text-ink-soft">Batches arriving from collectors · demo queue</p>
      </div>

      {data.incoming.length === 0 ? (
        <Empty icon={Truck} title="Queue is empty" description="Completed pickups will appear here for processing." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.incoming.map((p) => (
            <div key={p.id} className="card card-hover p-5">
              <div className="flex items-start justify-between">
                <p className="num text-[14px] font-bold text-ink">{p.code}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-soft"><MapPin size={11} /> {p.zone}</p>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {p.items.map((it) => <MaterialChip key={it.category} category={it.category} size="sm" />)}
              </div>
              <p className="num mt-3 text-[13px] font-semibold text-brand-700">{formatKg(p.actual_weight || p.estimated_weight || 0)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card p-6">
        <h2 className="mb-3 font-display text-[16px] font-bold text-ink">Demo facility network</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.centers.map((c) => (
            <div key={c.id} className="rounded-xl border border-neutral-200 p-4">
              <p className="text-[13.5px] font-bold text-ink">{c.name}</p>
              <p className="mt-0.5 text-[12px] text-ink-soft">{c.zone}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
