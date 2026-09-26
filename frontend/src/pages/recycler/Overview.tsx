/** Recycling partner overview. */
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Factory, PackageCheck, Scale, Truck } from 'lucide-react';
import { api } from '@/services/api';
import type { RecyclerOverview } from '@/types';
import { formatKg, formatNumber } from '@/utils/format';
import { KpiCard, StatusBadge, MaterialChip } from '@/components/ui';

export default function RecyclerOverview() {
  const [data, setData] = useState<RecyclerOverview | null>(null);

  useEffect(() => {
    api.get<RecyclerOverview>('/recycler/overview').then(setData).catch(() => void 0);
  }, []);

  if (!data) return <div className="space-y-4"><div className="skeleton h-24" /><div className="skeleton h-64" /></div>;

  const entries = Object.entries(data.material_totals);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Facility Overview</h1>
        <p className="text-[13px] text-ink-soft">Incoming material supply and recycling statistics · demo data</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Scale} label="This Month" tone="brand" value={formatKg(data.month_weight_kg, 0)} sub={`${data.month_batches} batches`} />
        <KpiCard icon={Factory} label="Material Categories" tone="blue" value={entries.length} sub="tracked streams" />
        <KpiCard icon={PackageCheck} label="Recycled Output" tone="violet" value={formatKg(data.flow.recycled, 0)} sub={`${Math.round((data.flow.recycled / Math.max(data.flow.collected, 1)) * 100)}% of intake (demo)`} />
        <KpiCard icon={Truck} label="Incoming Batches" tone="amber" value={data.incoming.length} sub="awaiting processing" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-[16px] font-bold text-ink">Incoming material</h2>
          <p className="mb-4 text-[12px] text-neutral-400">Cumulative by category · kg · demo data</p>
          <div className="space-y-3">
            {entries.map(([cat, w]) => {
              const max = Math.max(...entries.map(([, v]) => v), 1);
              return (
                <div key={cat}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <MaterialChip category={cat} size="sm" />
                    <span className="num font-semibold text-ink">{formatNumber(Math.round(w))} kg</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(w / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-[16px] font-bold text-ink">Weekly intake</h2>
          <p className="mb-3 text-[12px] text-neutral-400">kg per day · demo data</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weekly.map((w) => ({ d: w.date.slice(5), kg: w.weight }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} interval={1} />
                <YAxis tick={{ fontSize: 10 }} width={40} />
                <Tooltip formatter={(v) => [`${v} kg`, 'Intake']} />
                <Area type="monotone" dataKey="kg" stroke="#6366f1" fill="rgba(99,102,241,.12)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-[16px] font-bold text-ink">Incoming batches</h2>
        <p className="mb-4 text-[12px] text-neutral-400">Collected material routed to your facility</p>
        {data.incoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">No incoming batches right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead><tr><th className="th">Pickup</th><th className="th">Zone</th><th className="th">Est. weight</th><th className="th">Status</th></tr></thead>
              <tbody>
                {data.incoming.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70">
                    <td className="td num font-semibold text-ink">{p.code}</td>
                    <td className="td text-[13px] text-ink-soft">{p.zone}</td>
                    <td className="td num text-[13px]">{(p.actual_weight || p.estimated_weight || 0).toFixed(1)} kg</td>
                    <td className="td"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
