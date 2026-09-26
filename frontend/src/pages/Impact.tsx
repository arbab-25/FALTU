/** Public impact page — transparent, clearly-labelled estimates. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Flame, Leaf, Info, Recycle, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/services/api';
import type { ImpactResponse } from '@/types';
import { formatKg, formatNumber } from '@/utils/format';
import SectionTitle from '@/components/ui/SectionTitle';
import MaterialChip from '@/components/ui/MaterialChip';

export default function Impact() {
  const [data, setData] = useState<ImpactResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<ImpactResponse>('/impact/public')
      .then(setData)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
            <ArrowLeft size={16} /> Back
          </Link>
          <Link to="/login" className="btn-primary">Open Dashboard</Link>
        </div>
      </header>

      <section className="bg-gradient-to-b from-brand-50/70 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle
            kicker="Environmental Impact"
            title="Every Kilogram Accounted For."
            description="Live platform totals from the demo database. All environmental figures are estimates computed from transparent per-material factors." />
          {error && (
            <p className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
              Impact service is starting up — refresh in a moment.
            </p>
          )}
          {data && (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Recycle, label: 'Waste diverted', value: formatKg(data.totals.waste_diverted_kg, 0), tone: 'bg-brand-50 text-brand-600' },
                  { icon: Leaf, label: 'CO₂e avoided (est.)', value: formatKg(data.totals.co2_kg, 0), tone: 'bg-emerald-50 text-emerald-600' },
                  { icon: Truck, label: 'Optimized trips', value: formatNumber(data.totals.optimized_trips), tone: 'bg-sky-50 text-sky-600' },
                  { icon: Flame, label: 'Energy saved (est.)', value: `${formatNumber(Math.round(data.totals.energy_kwh))} kWh`, tone: 'bg-amber-50 text-amber-600' },
                ].map((s) => (
                  <div key={s.label} className="card p-6">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${s.tone}`}><s.icon size={21} /></span>
                    <p className="kpi num mt-4">{s.value}</p>
                    <p className="mt-1 text-[13px] font-medium text-ink-soft">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-6 lg:grid-cols-2">
                <div className="card p-6">
                  <h3 className="font-display text-lg font-bold text-ink">Recycled weight by material</h3>
                  <p className="mb-4 text-[12px] text-neutral-400">Demo data · kg</p>
                  <div className="h-72">
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
                  <h3 className="font-display text-lg font-bold text-ink">How we calculate</h3>
                  <div className="mt-4 flex gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <Info size={16} className="mt-0.5 shrink-0 text-sky-600" />
                    <p className="text-[13px] leading-relaxed text-sky-800">{data.methodology}</p>
                  </div>
                  <ul className="mt-4 space-y-3 text-[13.5px] text-ink-soft">
                    <li className="flex gap-2.5"><Droplets size={16} className="mt-0.5 shrink-0 text-sky-500" /> Water saved ≈ weight × per-material water factor (litres/kg)</li>
                    <li className="flex gap-2.5"><Flame size={16} className="mt-0.5 shrink-0 text-amber-500" /> Energy saved ≈ weight × per-material energy factor (kWh/kg)</li>
                    <li className="flex gap-2.5"><Leaf size={16} className="mt-0.5 shrink-0 text-brand-600" /> Factors stored in <code className="rounded bg-neutral-100 px-1 text-[12px]">backend/app/services/catalog.py</code> so they can be tuned later</li>
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {data.by_material.map((m) => (
                      <MaterialChip key={m.category} category={m.category}
                        name={`${m.category} · ${formatKg(m.weight, 0)}`} size="sm" />
                    ))}
                  </div>
                </div>
              </div>

              {data.platform && (
                <div className="card mt-10 grid gap-6 p-7 sm:grid-cols-4">
                  {[
                    ['Completed pickups', formatNumber(data.platform.completed_pickups)],
                    ['Verified collectors', formatNumber(data.platform.verified_collectors)],
                    ['Households connected', formatNumber(data.platform.households)],
                    ['Collector earnings', `₹${formatNumber(Math.round(data.platform.collector_earnings))}`],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="kpi num">{v}</p>
                      <p className="mt-1 text-[12.5px] text-ink-soft">{l}</p>
                    </div>
                  ))}
                  <p className="col-span-full text-[11px] text-neutral-400">Demo data — SIH26229 prototype, not verified figures.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
