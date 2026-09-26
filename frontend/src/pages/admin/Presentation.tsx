/** Presentation Mode — projection-ready SIH summary screen. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Minimize2, Recycle, TrendingUp, Truck, Users, Wallet } from 'lucide-react';
import { api } from '@/services/api';
import type { PresentationData } from '@/types';
import FlowDiagram from '@/components/ui/FlowDiagram';
import { formatINR, formatKg, formatNumber } from '@/utils/format';

export default function Presentation() {
  const [data, setData] = useState<PresentationData | null>(null);

  useEffect(() => {
    api.get<PresentationData>('/presentation').then(setData).catch(() => void 0);
  }, []);

  const k = data?.kpi;
  const totalForFlow = k?.waste_diverted_kg || 12450;

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600"><Recycle size={20} /></span>
          <div>
            <p className="font-display text-[16px] font-bold">KABADIWALA CONNECT</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-300">Presentation Mode</p>
          </div>
        </div>
        <Link to="/app" className="btn bg-white/10 text-white hover:bg-white/20"><Minimize2 size={14} /> Exit</Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-center text-[12px] font-bold uppercase tracking-[0.3em] text-brand-300">
          Smart India Hackathon 2026 · SIH26229
        </p>
        <h1 className="mt-3 text-center font-display text-4xl font-bold leading-tight md:text-5xl">
          Digitizing India's <span className="text-brand-400">Informal Recycling</span> Ecosystem
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[14px] text-white/75">
          Connecting Waste. Empowering People. Building a Circular Future.
        </p>

        {/* KPI grid */}
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { icon: Recycle, value: k ? formatKg(k.waste_diverted_kg, 0) : '—', label: 'Waste Diverted', tone: 'text-brand-300' },
            { icon: Truck, value: k ? formatNumber(k.pickups) : '—', label: 'Pickups', tone: 'text-sky-300' },
            { icon: Users, value: k ? formatNumber(k.collectors) : '—', label: 'Collectors', tone: 'text-amber-300' },
            { icon: Wallet, value: k ? formatINR(k.earnings, { compact: true }) : '—', label: 'Collector Earnings', tone: 'text-violet-300' },
            { icon: Leaf, value: k ? formatKg(k.co2_avoided_kg, 0) : '—', label: 'CO₂e Avoided (est.)', tone: 'text-emerald-300' },
          ].map((s, i) => (
            <div key={s.label}
              className="animate-fade-up rounded-3xl border border-white/10 bg-white/[0.05] p-5 text-center"
              style={{ animationDelay: `${i * 0.08}s` }}>
              <s.icon size={22} className={`mx-auto ${s.tone}`} />
              <p className={`num mt-3 font-display text-3xl font-bold ${s.tone}`}>{s.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/65">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Flow */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-1 text-center font-display text-lg font-bold">The Connected Chain</h2>
          <p className="mb-4 text-center text-[12px] text-white/65">
            Household → AI Estimate → Collector → Recycling → Impact (demo data, kg)
          </p>
          <FlowDiagram
            nodes={[
              { label: 'Households', value: Math.round(totalForFlow * 0.32), color: '#0ea5e9' },
              { label: 'AI Estimate', value: Math.round(totalForFlow * 0.30), color: '#8b5cf6' },
              { label: 'Collectors', value: Math.round(totalForFlow * 0.24), color: '#f59e0b' },
              { label: 'Recycling', value: Math.round(totalForFlow * 0.20), color: '#10b981' },
              { label: 'Impact', value: Math.round(totalForFlow * 0.16), color: '#059669' },
              { label: 'New Materials', value: Math.round(totalForFlow * 0.14), color: '#065f46' },
            ]}
            height={320} />
        </div>

        {/* Story strip */}
        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {[
            ['Problem', 'Fragmented informal recycling'],
            ['Solution', 'One connected platform'],
            ['Intelligence', 'Estimate · match · route'],
            ['Empowerment', 'Digital livelihoods'],
            ['Impact', 'Cleaner cities, better incomes'],
          ].map(([t, d], i) => (
            <div key={t} className="animate-fade-up rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              style={{ animationDelay: `${0.4 + i * 0.08}s` }}>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-brand-300">0{i + 1} · {t}</p>
              <p className="mt-1 text-[13px] font-medium leading-snug text-white/80">{d}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/35">
          <TrendingUp size={12} /> All metrics are demo data from the SIH26229 prototype environment.
        </p>
      </main>
    </div>
  );
}
