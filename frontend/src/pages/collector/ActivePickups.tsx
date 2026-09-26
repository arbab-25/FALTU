/** Collector active pickups + completion flow with receipt. */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, CircleCheck, MapPin, Plus, Scale, Trash2, Truck, X,
} from 'lucide-react';
import { api } from '@/services/api';
import type { Pickup, Receipt as ReceiptData } from '@/types';
import { formatDateTime, formatINR } from '@/utils/format';
import { Empty, MaterialChip, Receipt, StatusBadge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

interface Line {
  category: string;
  weight: string;
  rate: string;
}

export default function ActivePickups() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [pickups, setPickups] = useState<Pickup[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [completing, setCompleting] = useState<Pickup | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [payment, setPayment] = useState('Cash');
  const [finishing, setFinishing] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.get<{ pickups: Pickup[] }>('/pickups?scope=mine&status=accepted'),
      api.get<{ pickups: Pickup[] }>('/pickups?scope=mine&status=on_the_way'),
      api.get<{ pickups: Pickup[] }>('/pickups?scope=mine&status=collected'),
    ]).then(([a, o, c]) => setPickups([...a.pickups, ...o.pickups, ...c.pickups]))
      .catch(() => setPickups([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const advance = async (p: Pickup, status: string) => {
    setBusyId(p.id);
    setNote('');
    try {
      await api.patch(`/pickups/${p.id}/status`, { status });
      load();
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const openComplete = (p: Pickup) => {
    setCompleting(p);
    setLines(p.items.length
      ? p.items.map((it) => ({ category: it.category, weight: String(it.estimated_weight || 1), rate: String(it.rate_per_kg) }))
      : [{ category: 'mixed', weight: '1', rate: '12' }]);
  };

  const total = lines.reduce((s, l) => s + (parseFloat(l.weight) || 0) * (parseFloat(l.rate) || 0), 0);

  const complete = async () => {
    if (!completing) return;
    setFinishing(true);
    setNote('');
    try {
      await api.post(`/pickups/${completing.id}/complete`, {
        items: lines.map((l) => ({
          category: l.category,
          actual_weight: parseFloat(l.weight) || 0.1,
          rate_per_kg: parseFloat(l.rate) || 0,
        })),
        payment_method: payment,
      });
      setCompleting(null);
      load();
      void refreshUser();
      // fetch the fresh receipt for the celebration view
      const r = await api.get<ReceiptData>(`/pickups/${completing.id}/receipt`);
      setReceipt(r);
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Completion failed');
    } finally {
      setFinishing(false);
    }
  };

  if (receipt) {
    return (
      <div className="mx-auto max-w-lg space-y-5 animate-fade-up">
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[16px] font-bold text-brand-700">
            <CircleCheck size={18} /> Pickup completed — receipt generated
          </p>
        </div>
        <Receipt data={receipt} />
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => { setReceipt(null); navigate('/app/earnings'); }} className="btn-outline">View Earnings</button>
          <button type="button" onClick={() => setReceipt(null)} className="btn-primary">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Active Pickups</h1>
        <p className="text-[13px] text-ink-soft">Advance each pickup, then weigh and complete on site.</p>
      </div>

      {note && <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-[13px] font-medium text-sky-700">{note}</p>}

      {!pickups ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="skeleton h-28" />)}</div>
      ) : pickups.length === 0 ? (
        <Empty icon={Truck} title="No active pickups"
          description="Accept a request from the Pickup Requests page to get started."
          action={<button type="button" onClick={() => navigate('/app/requests')} className="btn-primary">View Requests</button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pickups.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="num text-[14.5px] font-bold text-ink">{p.code}</p>
                  <p className="mt-0.5 text-[12px] text-ink-soft">{p.customer_name} · {formatDateTime(p.created_at)}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-soft"><MapPin size={11} /> {p.address}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {p.items.map((it) => <MaterialChip key={it.category + it.id} category={it.category} size="sm" />)}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {p.status === 'accepted' && (
                  <button type="button" disabled={busyId === p.id} onClick={() => void advance(p, 'on_the_way')} className="btn-dark py-2 text-[13px]">
                    <Truck size={14} /> Start — On the way
                  </button>
                )}
                {p.status === 'on_the_way' && (
                  <button type="button" disabled={busyId === p.id} onClick={() => void advance(p, 'collected')} className="btn-dark py-2 text-[13px]">
                    <Scale size={14} /> Mark Collected
                  </button>
                )}
                {(p.status === 'collected' || p.status === 'on_the_way' || p.status === 'accepted') && (
                  <button type="button" onClick={() => openComplete(p)} className="btn-primary py-2 text-[13px]">
                    <CircleCheck size={14} /> Complete Pickup
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completion modal */}
      {completing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Complete pickup">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={() => setCompleting(null)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-lift animate-fade-up">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Complete {completing.code}</h2>
                <p className="text-[12.5px] text-ink-soft">Enter actual weighed quantities — the customer sees this too.</p>
              </div>
              <button type="button" onClick={() => setCompleting(null)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100" aria-label="Close"><X size={17} /></button>
            </div>

            <div className="mt-5 space-y-3">
              {lines.map((l, i) => (
                <div key={i} className="rounded-xl border border-neutral-200 p-3.5">
                  <div className="flex items-center justify-between">
                    <MaterialChip category={l.category} />
                    {lines.length > 1 && (
                      <button type="button" onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))}
                        className="text-neutral-300 hover:text-red-500" aria-label="Remove line"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="label text-[11px]">Actual weight (kg)</label>
                      <input type="number" min={0.1} step={0.1} value={l.weight}
                        onChange={(e) => setLines((prev) => prev.map((x, j) => j === i ? { ...x, weight: e.target.value } : x))}
                        className="input num" />
                    </div>
                    <div>
                      <label className="label text-[11px]">Rate (₹/kg)</label>
                      <input type="number" min={0} step={0.5} value={l.rate}
                        onChange={(e) => setLines((prev) => prev.map((x, j) => j === i ? { ...x, rate: e.target.value } : x))}
                        className="input num" />
                    </div>
                  </div>
                  <p className="mt-2 text-right text-[13px] font-bold text-brand-700">
                    {formatINR((parseFloat(l.weight) || 0) * (parseFloat(l.rate) || 0))}
                  </p>
                </div>
              ))}
              <button type="button"
                onClick={() => setLines((prev) => [...prev, { category: 'paper', weight: '1', rate: '14' }])}
                className="btn-ghost w-full border border-dashed border-neutral-300 text-[13px]">
                <Plus size={14} /> Add material line
              </button>
            </div>

            <div className="mt-4">
              <label className="label">Payment method</label>
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'UPI', 'Digital'].map((m) => (
                  <button key={m} type="button" onClick={() => setPayment(m)}
                    className={`rounded-xl border-2 py-2 text-[13px] font-bold transition
                      ${payment === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-neutral-200 text-ink-soft hover:border-brand-300'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
              <span className="text-[13px] font-semibold text-ink-soft">Total payable</span>
              <span className="num font-display text-xl font-bold text-brand-700">{formatINR(total)}</span>
            </div>

            <button type="button" disabled={finishing || total <= 0} onClick={() => void complete()} className="btn-primary mt-4 w-full py-3">
              <Check size={16} /> {finishing ? 'Completing…' : 'Complete Pickup'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
