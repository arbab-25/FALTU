/** Pickup tracking detail for customers. */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Star, Truck, XCircle } from 'lucide-react';
import { api } from '@/services/api';
import type { Pickup } from '@/types';
import { formatINR } from '@/utils/format';
import { DemoMap, StatusBadge, TrackingTimeline, MaterialChip } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import type { CollectorCard } from '@/types';

export default function PickupTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [error, setError] = useState('');
  const [collectors, setCollectors] = useState<CollectorCard[]>([]);

  const load = useCallback(() => {
    if (!id) return;
    api.get<Pickup>(`/pickups/${id}`)
      .then(setPickup)
      .catch((e) => setError(e instanceof Error ? e.message : 'Pickup not found'));
  }, [id]);

  useEffect(() => {
    load();
    const t = window.setInterval(load, 8000); // gentle live refresh for the demo
    return () => window.clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (user?.lat && user?.lng) {
      api.get<{ collectors: CollectorCard[] }>(`/collectors/nearby?lat=${user.lat}&lng=${user.lng}`)
        .then((d) => setCollectors(d.collectors.slice(0, 5)))
        .catch(() => void 0);
    }
  }, [user]);

  if (error) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <p className="font-display text-lg font-bold text-ink">{error}</p>
        <button type="button" onClick={() => navigate('/app/pickups')} className="btn-outline mt-4">Back to My Pickups</button>
      </div>
    );
  }
  if (!pickup) {
    return <div className="card mx-auto max-w-3xl p-6"><div className="skeleton h-64" /></div>;
  }

  const cancellable = ['pending', 'accepted'].includes(pickup.status);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button type="button" onClick={() => navigate('/app/pickups')} className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={15} /> My Pickups
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="num font-display text-xl font-bold text-ink">{pickup.code}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-soft">
            <MapPin size={13} /> {pickup.address}
          </p>
        </div>
        <StatusBadge status={pickup.status} />
      </div>

      <div className="grid gap-5 md:grid-cols-5">
        <div className="card p-6 md:col-span-3">
          <h2 className="mb-4 font-display text-[15.5px] font-bold text-ink">Tracking</h2>
          <TrackingTimeline status={pickup.status} />
        </div>

        <div className="space-y-5 md:col-span-2">
          {pickup.collector_id ? (
            <div className="card p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Your collector</p>
              <div className="mt-2.5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Truck size={19} /></span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-ink">{pickup.business_name || pickup.collector_name}</p>
                  <p className="flex items-center gap-1 text-[12px] text-amber-600"><Star size={11} fill="currentColor" /> 4.8 · verified ✓</p>
                </div>
              </div>
              {pickup.customer_phone && (
                <button type="button" className="btn-outline mt-3 w-full py-2 text-[13px]"><Phone size={13} /> Contact</button>
              )}
            </div>
          ) : (
            <div className="card p-5 text-center">
              <p className="text-[13.5px] font-semibold text-ink">Waiting for a collector…</p>
              <p className="mt-1 text-[12.5px] text-ink-soft">Nearby collectors can see this request.</p>
            </div>
          )}

          <div className="card p-5">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Materials</p>
            <div className="flex flex-wrap gap-1.5">
              {pickup.items.map((it) => <MaterialChip key={it.category + it.id} category={it.category} size="sm" />)}
            </div>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-soft">Est. weight</dt><dd className="num font-medium">{(pickup.estimated_weight || 0).toFixed(1)} kg</dd></div>
              {pickup.final_value && (
                <div className="flex justify-between"><dt className="text-ink-soft">Final value</dt><dd className="num font-bold text-brand-700">{formatINR(pickup.final_value)}</dd></div>
              )}
            </dl>
          </div>

          <DemoMap height={220} customer={user?.lat && user?.lng ? { lat: user.lat, lng: user.lng } : null} collectors={collectors} />

          {pickup.status === 'completed' && (
            <p className="text-center text-[12.5px] text-ink-soft">
              Receipt is available on the <Link to="/app/transactions" className="font-semibold text-brand-600 hover:underline">Transactions</Link> page.
            </p>
          )}

          {cancellable && (
            <button type="button"
              onClick={async () => {
                await api.post(`/pickups/${pickup.id}/cancel`).catch(() => void 0);
                load();
              }}
              className="btn-danger w-full"><XCircle size={14} /> Cancel Pickup</button>
          )}
        </div>
      </div>
    </div>
  );
}
