/** Collector earnings analytics. */
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Coins, Package, Scale, TrendingUp, Wallet } from 'lucide-react';
import { api } from '@/services/api';
import type { CollectorStats } from '@/types';
import { formatINR, formatKg } from '@/utils/format';
import { KpiCard, MaterialChip } from '@/components/ui';

export default function Earnings() {
  const [stats, setStats] = useState<CollectorStats | null>(null);

  useEffect(() => {
    api.get<CollectorStats>('/collectors/dashboard').then(setStats).catch(() => void 0);
  }, []);

  if (!stats) {
    return <div className="space-y-4"><div className="skeleton h-24" /><div className="skeleton h-64" /></div>;
  }

  const daily = stats.daily.map((d) => ({ date: d.date.slice(5), value: d.value }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Earnings</h1>
        <p className="text-[13px] text-ink-soft">Every rupee recorded digitally · demo data</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Coins} label="Today" tone="brand" value={formatINR(stats.today_earnings)} sub={`${stats.today_pickups} pickups`} />
        <KpiCard icon={TrendingUp} label="This Month" tone="blue" value={formatINR(stats.month_earnings, { compact: true })} sub={formatKg(stats.month_weight_kg)} />
        <KpiCard icon={Wallet} label="Lifetime" tone="amber" value={formatINR(stats.lifetime_earnings, { compact: true })} sub={`${stats.completed_pickups} completed pickups`} />
        <KpiCard icon={Scale} label="Avg Daily Collection" tone="violet" value={formatKg(stats.avg_daily_kg)} sub="over active period" />
      </div>

      <div className="card p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-[16px] font-bold text-ink">Daily earnings</h2>
          <span className="badge bg-brand-50 text-brand-700">₹ · last 14 active days</span>
        </div>
        <p className="mb-3 text-[12px] text-neutral-400">Demo data — earnings from completed transactions</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 10 }} width={42} />
              <Tooltip formatter={(v) => [formatINR(Number(v)), 'Earned']} />
              <Bar dataKey="value" fill="#059669" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-display text-[16px] font-bold text-ink"><Package size={17} /> Material collected</h2>
        <div className="mt-4 space-y-3">
          {stats.materials_breakdown.map((m) => {
            const max = Math.max(...stats.materials_breakdown.map((x) => x.weight), 1);
            return (
              <div key={m.category}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <MaterialChip category={m.category} size="sm" />
                  <span className="num font-semibold text-ink">{formatKg(m.weight, 0)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(m.weight / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
