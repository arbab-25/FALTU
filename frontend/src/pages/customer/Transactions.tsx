/** Customer transactions with receipts. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ReceiptText, Wallet } from 'lucide-react';
import { api } from '@/services/api';
import type { Pickup, Receipt as ReceiptData } from '@/types';
import { formatDate, formatINR } from '@/utils/format';
import { Empty, Receipt } from '@/components/ui';

export default function Transactions() {
  const [pickups, setPickups] = useState<Pickup[] | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ pickups: Pickup[] }>('/pickups?scope=mine&status=completed')
      .then((d) => setPickups(d.pickups))
      .catch(() => setPickups([]));
  }, []);

  const openReceipt = async (pid: number) => {
    setBusyId(pid);
    try {
      const r = await api.get<ReceiptData>(`/pickups/${pid}/receipt`);
      setReceipt(r);
    } catch { /* toast-less demo */ } finally {
      setBusyId(null);
    }
  };

  const total = (pickups || []).reduce((s, p) => s + (p.final_value || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Transactions</h1>
          <p className="text-[13px] text-ink-soft">Digital records for every completed pickup.</p>
        </div>
        <div className="card px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Total earned</p>
          <p className="num font-display text-xl font-bold text-brand-700">{formatINR(total)}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {!pickups ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14" />)}</div>
          ) : pickups.length === 0 ? (
            <Empty icon={Wallet} title="No transactions yet"
              description="Complete a pickup to generate your first digital receipt."
              action={<Link to="/app/schedule" className="btn-primary">Schedule Pickup</Link>} />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead><tr><th className="th">Pickup</th><th className="th">Date</th><th className="th">Weight</th><th className="th">Amount</th><th className="th"></th></tr></thead>
                <tbody>
                  {pickups.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/70">
                      <td className="td num font-semibold text-brand-700">{p.code}</td>
                      <td className="td whitespace-nowrap text-[12.5px] text-ink-soft">{formatDate(p.completed_at)}</td>
                      <td className="td num text-[13px]">{(p.actual_weight || 0).toFixed(1)} kg</td>
                      <td className="td num text-[13px] font-bold text-ink">{formatINR(p.final_value)}</td>
                      <td className="td">
                        <button type="button" onClick={() => void openReceipt(p.id)} disabled={busyId === p.id}
                          className="btn-outline px-3 py-1.5 text-[12px]">
                          <Eye size={13} /> {busyId === p.id ? 'Loading…' : 'Receipt'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {receipt ? (
            <Receipt data={receipt} />
          ) : (
            <div className="card flex h-full flex-col items-center justify-center p-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"><ReceiptText size={22} /></span>
              <p className="mt-3 text-[14px] font-semibold text-ink">Select a transaction</p>
              <p className="mt-1 text-[12.5px] text-ink-soft">Tap "Receipt" to view, download or share.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
