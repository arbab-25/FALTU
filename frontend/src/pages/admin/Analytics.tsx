/** Admin analytics — the city-wide command center. */
import { useEffect, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  IndianRupee, Leaf, Presentation, Recycle, Truck, Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Analytics } from '@/types';
import { formatINR, formatKg, formatNumber } from '@/utils/format';
import { KpiCard } from '@/components/ui';

const PIE_COLORS = ['#059669', '#10b981', '#34d399', '#f59e0b', '#0ea5e9', '#6366f1', '#94a3b8'];

export default function AdminAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    api.get<Analytics>('/admin/analytics').then(setData).catch(() => void 0);
  }, []);

  if (!data) return <div className="space-y-4"><div className="skeleton h-24" /><div className="skeleton h-72" /></div>;

  const k = data.kpi;
  const statusRows = Object.entries(data.pickup_status).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">City Analytics — Ahmedabad</h1>
          <p className="text-[13px] text-ink-soft">Live demo environment · all figures are demo data</p>
        </div>
        <Link to="/app/presentation" className="btn-dark"><Presentation size={15} /> Presentation Mode</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard icon={Users} label="Total Users" tone="neutral" value={formatNumber(k.total_users)} sub={`${k.customers} households`} />
        <KpiCard icon={Truck} label="Collectors" tone="amber" value={formatNumber(k.collectors)} sub={`${k.active_collectors} active now`} />
        <KpiCard icon={Recycle} label="Total Pickups" tone="blue" value={formatNumber(k.total_pickups)} sub={`${k.recycling_rate}% recycling rate`} />
        <KpiCard icon={Leaf} label="Waste Diverted" tone="brand" value={formatKg(k.waste_diverted_kg, 0)} />
        <KpiCard icon={Leaf} label="CO₂e Avoided" tone="brand" value={formatKg(k.co2_avoided_kg, 0)} sub="estimated" />
        <KpiCard icon={IndianRupee} label="Collector Earnings" tone="violet" value={formatINR(k.collector_earnings, { compact: true })} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-display text-[16px] font-bold text-ink">Transaction value over time</h2>
          <p className="mb-3 text-[12px] text-neutral-400">Daily ₹ through the platform · demo data</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily_transactions.map((d) => ({ d: d.date.slice(5), value: d.value, count: d.count }))}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} width={44} />
                <Tooltip formatter={(v) => [formatINR(Number(v)), 'Value']} />
                <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-[16px] font-bold text-ink">Pickup status mix</h2>
          <p className="mb-3 text-[12px] text-neutral-400">All {formatNumber(k.total_pickups)} pickups</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusRows} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={3}>
                  {statusRows.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} pickups`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-[16px] font-bold text-ink">Material distribution</h2>
          <p className="mb-3 text-[12px] text-neutral-400">Weighed material by category · kg</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.material_mix.map((m) => ({ name: m.category, kg: Math.round(m.weight) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={44} />
                <Tooltip formatter={(v) => [`${v} kg`, 'Collected']} />
                <Bar dataKey="kg" radius={[5, 5, 0, 0]}>
                  {data.material_mix.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-[16px] font-bold text-ink">Zone demand</h2>
          <p className="mb-3 text-[12px] text-neutral-400">Pickup requests by neighborhood</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.zone_demand} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="zone" tick={{ fontSize: 10 }} width={82} />
                <Tooltip formatter={(v) => [`${v} pickups`, 'Demand']} />
                <Bar dataKey="pickups" fill="#0ea5e9" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
