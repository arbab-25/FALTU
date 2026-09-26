/** Customer personal impact page. */
import { useEffect, useState } from 'react';
import { Droplets, Flame, Info, Leaf, Recycle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/services/api';
import type { ImpactResponse } from '@/types';
import { formatKg, formatNumber } from '@/utils/format';
import { KpiCard } from '@/components/ui';

export default function CustomerImpact() {
  const [data, setData] = useState<ImpactResponse | null>(null);

  useEffect(() => {
    api.get<ImpactResponse>('/impact/mine').then(setData).catch(() => void 0);
  }, []);

  const t = data?.totals;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Your Impact</h1>
        <p className="text-[13px] text-ink-soft">Personal environmental estimates from your recycling activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Recycle} label="Waste Recycled" tone="brand" value={t ? formatKg(t.weight_kg) : '—'} />
        <KpiCard icon={Leaf} label="CO₂e Avoided (est.)" tone="blue" value={t ? formatKg(t.co2_kg) : '—'} />
        <KpiCard icon={Droplets} label="Water Saved (est.)" tone="violet" value={t ? `${formatNumber(Math.round(t.water_l))} L` : '—'} />
        <KpiCard icon={Flame} label="Energy Saved (est.)" tone="amber" value={t ? `${formatNumber(Math.round(t.energy_kwh))} kWh` : '—'} />
      </div>

      {data && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="font-display text-[16px] font-bold text-ink">By material</h2>
            <p className="mb-3 text-[12px] text-neutral-400">kg recycled · demo data</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.by_material.map((m) => ({ name: m.category, kg: Math.round(m.weight) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} kg`, 'Recycled']} />
                  <Bar dataKey="kg" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-6">
            <h2 className="font-display text-[16px] font-bold text-ink">Calculation methodology</h2>
            <div className="mt-3 flex gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
              <Info size={16} className="mt-0.5 shrink-0 text-sky-600" />
              <p className="text-[13px] leading-relaxed text-sky-800">{data.methodology}</p>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-ink-soft">
              Water and energy savings use the same approach with per-material factors
              (litres and kWh per kg). Factors are stored in backend configuration so they
              can be refined as better data becomes available.
            </p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              All figures are estimates · demo data
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
