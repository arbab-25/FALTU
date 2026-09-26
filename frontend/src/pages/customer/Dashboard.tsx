/** Customer dashboard. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarClock, Coins, Leaf, PackageCheck, Phone, Recycle, Truck,
} from 'lucide-react';
import { api } from '@/services/api';
import type { ImpactResponse, Pickup } from '@/types';
import { formatINR, formatKg } from '@/utils/format';
import { KpiCard, StatusBadge, TrackingTimeline, DemoMap, MaterialChip } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import type { CollectorCard } from '@/types';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [pickups, setPickups] = useState<Pickup[] | null>(null);
  const [impact, setImpact] = useState<ImpactResponse['totals'] | null>(null);
  const [collectors, setCollectors] = useState<CollectorCard[]>([]);

  useEffect(() => {
    api.get<{ pickups: Pickup[] }>('/pickups?scope=mine').then((d) => setPickups(d.pickups)).catch(() => setPickups([]));
    api.get<ImpactResponse>('/impact/mine').then((d) => setImpact(d.totals)).catch(() => setImpact(null));
    if (user?.lat && user?.lng) {
      api.get<{ collectors: CollectorCard[] }>(`/collectors/nearby?lat=${user.lat}&lng=${user.lng}`)
        .then((d) => setCollectors(d.collectors.slice(0, 6)))
        .catch(() => void 0);
    }
  }, [user]);

  const active = (pickups || []).filter((p) =>
    ['accepted', 'on_the_way', 'collected'].includes(p.status));
  const upcoming = active[0] || (pickups || []).find((p) => p.status === 'pending');
  const completed = (pickups || []).filter((p) => p.status === 'completed');
  const earned = completed.reduce((s, p) => s + (p.final_value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Welcome back, {user?.name.split(' ')[0]} 👋</h1>
          <p className="text-[13px] text-ink-soft">Your recycling activity at a glance · demo data</p>
        </div>
        <Link to="/app/schedule" className="btn-primary">
          <CalendarClock size={16} /> Schedule Pickup
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={PackageCheck} label="Total Recycled" tone="brand"
          value={impact ? formatKg(impact.weight_kg) : '—'}
          sub={`${completed.length} pickups completed`} />
        <KpiCard icon={Coins} label="Money Earned" tone="amber"
          value={formatINR(earned)} sub="from completed pickups" />
        <KpiCard icon={Leaf} label="CO₂ Impact (est.)" tone="blue"
          value={impact ? formatKg(impact.co2_kg) : '—'} sub="CO₂e avoided" />
        <KpiCard icon={Recycle} label="Pickups Completed" tone="violet"
          value={completed.length} sub="lifetime" />
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* Upcoming pickup */}
        <div className="card p-6 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[16px] font-bold text-ink">Upcoming Pickup</h2>
            {upcoming && <StatusBadge status={upcoming.status} />}
          </div>

          {!pickups ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-10" />)}</div>
          ) : upcoming ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="num text-lg font-bold text-ink">{upcoming.code}</p>
                <p className="mt-0.5 text-[13px] text-ink-soft">{upcoming.address}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {upcoming.items.map((it) => (
                    <MaterialChip key={it.category} category={it.category} size="sm" />
                  ))}
                </div>
                {upcoming.collector_name && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-neutral-50 px-3.5 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Truck size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-ink">
                        {upcoming.business_name || upcoming.collector_name}
                      </p>
                      <p className="text-[11.5px] text-ink-soft">Your collector · verified ✓</p>
                    </div>
                    {upcoming.customer_phone && (
                      <button type="button" className="btn-outline ml-auto px-3 py-1.5 text-[12px]" aria-label="Call collector">
                        <Phone size={13} /> Call
                      </button>
                    )}
                  </div>
                )}
                <Link to={`/app/pickups/${upcoming.id}`} className="btn-outline mt-4 w-full">
                  Track pickup <ArrowRight size={14} />
                </Link>
              </div>
              <TrackingTimeline status={upcoming.status} />
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><CalendarClock size={22} /></span>
              <p className="mt-3 text-[14.5px] font-semibold text-ink">No upcoming pickup</p>
              <p className="mt-1 text-[13px] text-ink-soft">Schedule one in under a minute.</p>
              <Link to="/app/schedule" className="btn-primary mt-4">Schedule Pickup</Link>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="xl:col-span-2">
          <div className="card h-full p-5">
            <h2 className="mb-3 font-display text-[16px] font-bold text-ink">Collectors Near You</h2>
            <DemoMap
              height={300}
              customer={user?.lat && user?.lng ? { lat: user.lat, lng: user.lng, label: 'You' } : null}
              collectors={collectors} />
            <p className="mt-3 text-[11.5px] text-neutral-400">Demo map · approximate positions for visualization</p>
          </div>
        </div>
      </div>

      {/* Recent */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[16px] font-bold text-ink">Recent Pickups</h2>
          <Link to="/app/pickups" className="text-[13px] font-semibold text-brand-600 hover:underline">View all</Link>
        </div>
        {!pickups ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-12" />)}</div>
        ) : pickups.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">No pickups yet — schedule your first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead><tr><th className="th">Pickup</th><th className="th">Materials</th><th className="th">Date</th><th className="th">Value</th><th className="th">Status</th></tr></thead>
              <tbody>
                {pickups.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70">
                    <td className="td"><Link to={`/app/pickups/${p.id}`} className="num font-semibold text-brand-700 hover:underline">{p.code}</Link></td>
                    <td className="td"><div className="flex flex-wrap gap-1">{p.items.slice(0, 3).map((it) => <MaterialChip key={it.category + it.id} category={it.category} size="sm" />)}</div></td>
                    <td className="td text-[13px] text-ink-soft">{new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td className="td num font-medium">{p.final_value ? formatINR(p.final_value) : p.estimated_value_min ? `~${formatINR(p.estimated_value_min)}` : '—'}</td>
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
