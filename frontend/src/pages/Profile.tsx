/** Profile page shared by all roles, with collector-specific details. */
import { useEffect, useState } from 'react';
import { Award, BadgeCheck, Leaf, Package, Recycle, Star, Truck, Wallet } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatINR, formatKg, formatNumber } from '@/utils/format';
import type { CollectorStats } from '@/types';

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CollectorStats | null>(null);

  useEffect(() => {
    if (user?.role === 'collector') {
      api.get<CollectorStats>('/collectors/dashboard').then(setStats).catch(() => void 0);
    }
  }, [user]);

  if (!user) return null;
  const isCollector = user.role === 'collector';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Header card */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500" />
        <div className="-mt-10 px-6 pb-6">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-ink font-display text-2xl font-bold text-white">
            {user.name.charAt(0)}
          </span>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-bold text-ink">{user.name}</h1>
            {isCollector && <span className="badge bg-sky-50 text-sky-700"><BadgeCheck size={12} /> Verified Collector ✓</span>}
            {isCollector && <span className="badge bg-amber-50 text-amber-700"><Star size={12} fill="currentColor" /> {stats ? stats.avg_rating || 4.8 : 4.8}</span>}
            <span className="badge bg-neutral-100 capitalize text-neutral-600">{user.role}</span>
          </div>
          <p className="mt-1 text-[13px] text-ink-soft">{user.email}{user.zone ? ` · ${user.zone}, Ahmedabad` : ''}</p>
          {isCollector && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge bg-brand-50 text-brand-700"><Award size={12} /> Verified</span>
              <span className="badge bg-brand-50 text-brand-700"><Award size={12} /> Reliable</span>
              <span className="badge bg-amber-50 text-amber-700"><Award size={12} /> Eco Champion</span>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="card p-6">
        <h2 className="mb-4 font-display text-[16px] font-bold text-ink">Account details</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {[
            ['Email', user.email],
            ['Phone', user.phone || '—'],
            ['Address', user.address || '—'],
            ['Zone', user.zone || '—'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-neutral-50 px-4 py-3">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{k}</dt>
              <dd className="mt-0.5 text-[13.5px] font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Collector stats */}
      {isCollector && stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="flex items-center gap-2 text-[12px] font-semibold text-ink-soft"><Package size={14} /> Completed pickups</p>
            <p className="kpi num mt-2">{formatNumber(user.completed_pickups || stats.completed_pickups)}</p>
          </div>
          <div className="card p-5">
            <p className="flex items-center gap-2 text-[12px] font-semibold text-ink-soft"><Recycle size={14} /> Material collected</p>
            <p className="kpi num mt-2">{formatKg(stats.weight_collected_kg, 0)}</p>
          </div>
          <div className="card p-5">
            <p className="flex items-center gap-2 text-[12px] font-semibold text-ink-soft"><Wallet size={14} /> Lifetime earnings</p>
            <p className="kpi num mt-2">{formatINR(stats.lifetime_earnings, { compact: true })}</p>
          </div>
        </div>
      )}

      {isCollector && (
        <div className="card flex items-center gap-4 bg-gradient-to-r from-brand-700 to-brand-600 p-6 text-white">
          <Truck size={26} />
          <div>
            <p className="font-display text-[15.5px] font-bold">From informal collection to digital livelihood.</p>
            <p className="text-[12.5px] text-white/70">Active on Kabadiwala Connect since 2024 · demo profile</p>
          </div>
          <Leaf size={22} className="ml-auto opacity-60" />
        </div>
      )}

      <p className="text-center text-[11px] text-neutral-400">
        Member since {formatDate((user as unknown as { created_at?: string }).created_at) || '2024'} · demo data
      </p>
    </div>
  );
}
