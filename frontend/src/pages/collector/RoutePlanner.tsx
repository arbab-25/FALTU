/** Collector route optimization (nearest-neighbour demo). */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Flag, MapPin, Navigation, Package, RefreshCw, Route as RouteIcon, Save,
} from 'lucide-react';
import { api } from '@/services/api';
import type { CollectorCard, Pickup, RoutePlan } from '@/types';
import { DemoMap, Empty, MaterialChip } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function RoutePlanner() {
  const { user } = useAuth();
  const [pickups, setPickups] = useState<Pickup[] | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [collectors, setCollectors] = useState<CollectorCard[]>([]);

  const load = useCallback(() => {
    Promise.all([
      api.get<{ pickups: Pickup[] }>('/pickups?scope=mine&status=accepted'),
      api.get<{ pickups: Pickup[] }>('/pickups?scope=mine&status=on_the_way'),
    ]).then(([a, o]) => setPickups([...a.pickups, ...o.pickups]))
      .catch(() => setPickups([]));
  }, []);

  useEffect(() => {
    load();
    if (user?.lat && user?.lng) {
      api.get<{ collectors: CollectorCard[] }>(`/collectors/nearby?lat=${user.lat}&lng=${user.lng}`)
        .then((d) => setCollectors(d.collectors.slice(0, 6)))
        .catch(() => void 0);
    }
  }, [load, user]);

  const optimize = async () => {
    if (selected.length < 2) return;
    setBusy(true);
    try {
      const res = await api.post<RoutePlan>('/collectors/route', { pickup_ids: selected });
      setPlan(res);
    } catch { /* demo */ } finally {
      setBusy(false);
    }
  };

  const sortedStops = useMemo(() => plan?.stops || [], [plan]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Smart Route</h1>
          <p className="text-[13px] text-ink-soft">Nearest-neighbour ordering to save kilometres · replaceable by real routing APIs</p>
        </div>
        <button type="button" onClick={load} className="btn-outline"><RefreshCw size={14} /> Refresh</button>
      </div>

      {!pickups ? (
        <div className="skeleton h-48" />
      ) : pickups.length < 2 ? (
        <Empty icon={RouteIcon} title="Need at least 2 active pickups"
          description="Accept more requests to unlock route optimization for the day."
          action={<button type="button" onClick={load} className="btn-outline">Refresh</button>} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="mb-1 font-display text-[15.5px] font-bold text-ink">Select stops</h2>
              <p className="mb-3 text-[12px] text-ink-soft">{selected.length} of {pickups.length} selected</p>
              <ul className="space-y-2">
                {pickups.map((p) => {
                  const on = selected.includes(p.id);
                  return (
                    <li key={p.id}>
                      <button type="button" onClick={() => setSelected((prev) => on ? prev.filter((x) => x !== p.id) : [...prev, p.id])}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition
                          ${on ? 'border-brand-500 bg-brand-50/60' : 'border-neutral-200 hover:border-brand-300'}`}>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold
                          ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-neutral-300 text-neutral-400'}`}>
                          {on ? '✓' : ''}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="num text-[13px] font-bold text-ink">{p.code}</p>
                          <p className="truncate text-[11.5px] text-ink-soft">{p.address}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.items.slice(0, 2).map((it) => <MaterialChip key={it.category} category={it.category} size="sm" />)}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button type="button" disabled={selected.length < 2 || busy} onClick={() => void optimize()} className="btn-primary mt-4 w-full">
                <Navigation size={15} /> {busy ? 'Optimizing…' : 'Optimize Route'}
              </button>
            </div>

            {plan && (
              <div className="card animate-fade-up p-5">
                <h2 className="font-display text-[15.5px] font-bold text-ink">Suggested order</h2>
                <ol className="mt-3 space-y-0">
                  <li className="flex items-center gap-3 pb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white"><Navigation size={14} /></span>
                    <p className="text-[13.5px] font-semibold text-ink">Start · {user?.business_name || user?.name}</p>
                  </li>
                  {sortedStops.map((s, i) => (
                    <li key={s.id} className="relative flex items-center gap-3 pb-4">
                      {i < sortedStops.length - 1 && <span className="absolute left-4 top-8 h-full w-0.5 bg-brand-200" />}
                      <span className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-[12px] font-bold text-white">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="num text-[13px] font-bold text-ink">{s.code}</p>
                        <p className="truncate text-[11.5px] text-ink-soft">{s.address}</p>
                      </div>
                      <span className="ml-auto flex shrink-0 items-center gap-1 text-[11.5px] text-ink-soft"><Package size={11} /> {s.estimated_weight?.toFixed(0)} kg</span>
                    </li>
                  ))}
                  {plan.center && (
                    <li className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white"><Flag size={14} /></span>
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{plan.center.name}</p>
                        <p className="text-[11.5px] text-ink-soft">Drop-off · recycling center</p>
                      </div>
                    </li>
                  )}
                </ol>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-brand-50 px-4 py-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-700/70"><Save size={12} /> Distance saved</p>
                    <p className="num font-display text-xl font-bold text-brand-700">{plan.saved_km} km</p>
                  </div>
                  <div className="rounded-xl bg-sky-50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700/70">Time saved</p>
                    <p className="num font-display text-xl font-bold text-sky-700">~{Math.round(plan.saved_minutes)} min</p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-neutral-400">
                  Route: {plan.distance_km} km total · heuristic: {plan.engine} · demo distances
                </p>
              </div>
            )}
          </div>

          <div className="card h-fit p-5 lg:sticky lg:top-20">
            <h2 className="mb-3 flex items-center gap-2 font-display text-[15.5px] font-bold text-ink"><MapPin size={16} /> Zone map</h2>
            <DemoMap height={360}
              customer={user?.lat && user?.lng ? { lat: user.lat, lng: user.lng, label: 'Start' } : null}
              collectors={collectors} />
          </div>
        </div>
      )}
    </div>
  );
}
