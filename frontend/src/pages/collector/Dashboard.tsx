/** Collector dashboard. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ClipboardList, Coins, Package, Star, Truck, Wallet,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/services/api';
import type { CollectorStats, Pickup } from '@/types';
import { formatDateTime, formatINR, formatKg } from '@/utils/format';
import { KpiCard, StatusBadge, MaterialChip } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function CollectorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CollectorStats | null>(null);
  const [pending, setPending] = useState<Pickup[] | null>(null);
  const [active, setActive] = useState<Pickup[] | null>(null);

  useEffect(() => {
    api.get<CollectorStats>('/collectors/dashboard').then(setStats).catch(() => void 0);
    api.get<{ pickups: Pickup[] }>('/pickups?scope=mine&status=pending')
      .then((d) => setPending(d.pickups)).catch(() => setPending([]));
    api.get<{ pickups: Pickup[] }>('/pickups?scope=mine&status=accepted')
      .then((d) => setActive(d.pickups)).catch(() => setActive([]));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Namaste, {user?.business_name || user?.name} 🛺</h1>
          <p className="text-[13px] text-ink-soft">{stats?.pending_in_zone ?? 0} new requests in your zone today · demo data</p>
        </div>
        <Link to="/app/requests" className="btn-primary"><ClipboardList size={16} /> View Requests</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Truck} label="Today's Pickups" tone="brand" value={stats?.today_pickups ?? '—'} />
        <KpiCard icon={Package} label="Today's Weight" tone="blue" value={stats ? formatKg(stats.today_weight_kg) : '—'} />
        <KpiCard icon={Coins} label="Today's Earnings" tone="amber" value={stats ? formatINR(stats.today_earnings) : '—'} />
        <KpiCard icon={Wallet} label="This Month" tone="violet" value={stats ? formatINR(stats.month_earnings, { compact: true }) : '—'}
          sub="lifetime ₹" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Pending requests */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[16px] font-bold text-ink">New Pickup Requests</h2>
            <Link to="/app/requests" className="text-[13px] font-semibold text-brand-600 hover:underline">View all</Link>
          </div>
          {!pending ? (
            <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="skeleton h-20" />)}</div>
          ) : pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No new requests right now.</p>
          ) : (
            <ul className="space-y-3">
              {pending.slice(0, 3).map((p) => (
                <li key={p.id} className="rounded-xl border border-neutral-200 p-3.5 transition hover:border-brand-300">
                  <div className="flex items-center justify-between gap-2">
                    <p className="num text-[13.5px] font-bold text-ink">{p.code}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 truncate text-[12.5px] text-ink-soft">{p.zone} · {p.address}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {p.items.slice(0, 3).map((it) => <MaterialChip key={it.category} category={it.category} size="sm" />)}
                    <span className="ml-auto text-[12px] font-semibold text-brand-700">
                      ~{formatINR(p.estimated_value_min || 0)}–{formatINR(p.estimated_value_max || 0)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Active + rating */}
        <div className="space-y-5">
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[16px] font-bold text-ink">Active Pickups</h2>
              <Link to="/app/active" className="text-[13px] font-semibold text-brand-600 hover:underline">Manage <ArrowRight size={12} className="inline" /></Link>
            </div>
            {!active ? (
              <div className="skeleton h-16" />
            ) : active.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">Nothing active — accept a request to begin.</p>
            ) : (
              <ul className="space-y-2.5">
                {active.slice(0, 3).map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                    <div>
                      <p className="num text-[13px] font-bold text-ink">{p.code}</p>
                      <p className="text-[11.5px] text-ink-soft">{p.customer_name} · {formatDateTime(p.created_at)}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-[16px] font-bold text-ink">Earnings trend</h2>
              <span className="badge bg-amber-50 text-amber-700"><Star size={11} fill="currentColor" /> {stats?.avg_rating ?? '—'} avg rating</span>
            </div>
            <p className="mb-2 text-[12px] text-neutral-400">Last 14 active days · ₹ · demo data</p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(stats?.daily || []).map((d) => ({ d: d.date.slice(5), v: d.value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} width={36} />
                  <Tooltip formatter={(v) => [formatINR(Number(v)), 'Earned']} />
                  <Area type="monotone" dataKey="v" stroke="#059669" fill="rgba(5,150,105,.12)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
