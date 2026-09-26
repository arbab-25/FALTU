/** Collector incoming pickup requests. */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ClipboardList, MapPin, Package, X } from 'lucide-react';
import { api } from '@/services/api';
import type { Pickup } from '@/types';
import { formatINR } from '@/utils/format';
import { Empty, MaterialChip, StatusBadge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function Requests() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [pickups, setPickups] = useState<Pickup[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    api.get<{ pickups: Pickup[] }>('/pickups?scope=mine&status=pending')
      .then((d) => setPickups(d.pickups))
      .catch(() => setPickups([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const accept = async (p: Pickup) => {
    setBusyId(p.id);
    setMessage('');
    try {
      await api.post(`/pickups/${p.id}/accept`);
      setMessage(`Accepted ${p.code} — it is now in your Active Pickups.`);
      load();
      void refreshUser();
      window.setTimeout(() => navigate('/app/active'), 900);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not accept');
    } finally {
      setBusyId(null);
    }
  };

  const reject = (p: Pickup) => {
    // Demo: a rejected request simply disappears from the collector's feed.
    setPickups((prev) => (prev || []).filter((x) => x.id !== p.id));
    setMessage(`Dismissed ${p.code}.`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Pickup Requests</h1>
        <p className="text-[13px] text-ink-soft">New requests from households in {user?.zone || 'your zone'} · demo feed</p>
      </div>

      {message && (
        <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-[13px] font-medium text-brand-700">{message}</p>
      )}

      {!pickups ? (
        <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-36" />)}</div>
      ) : pickups.length === 0 ? (
        <Empty icon={ClipboardList} title="No pending requests"
          description="New pickup requests in your zone will appear here in real time."
          action={<button type="button" onClick={load} className="btn-outline">Refresh</button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pickups.map((p) => (
            <div key={p.id} className="card card-hover flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="num text-[14.5px] font-bold text-ink">#{p.code}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-soft">
                    <MapPin size={11} /> {p.zone} · demo distance {(((p.id * 37) % 30) / 10 + 0.6).toFixed(1)} km
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.items.map((it) => <MaterialChip key={it.category + it.id} category={it.category} size="sm" />)}
              </div>

              <div className="mt-3 space-y-1 text-[13px]">
                <p className="flex items-center gap-1.5 text-ink-soft">
                  <Package size={12} /> Est. {(p.estimated_weight || 0).toFixed(1)} kg
                  <span className="mx-1 text-neutral-300">·</span>
                  <span className="font-semibold text-brand-700">{formatINR(p.estimated_value_min || 0)}–{formatINR(p.estimated_value_max || 0)}</span>
                </p>
                <p className="text-ink-soft">Customer: <span className="font-medium text-ink">{p.customer_name}</span></p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 pt-1">
                <button type="button" disabled={busyId === p.id} onClick={() => void accept(p)} className="btn-primary py-2 text-[13px]">
                  <Check size={14} /> {busyId === p.id ? 'Accepting…' : 'Accept'}
                </button>
                <button type="button" onClick={() => reject(p)} className="btn-danger py-2 text-[13px]">
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
