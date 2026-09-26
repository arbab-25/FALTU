/** Collector's regular customers. */
import { useEffect, useState } from 'react';
import { Package, Star, Users, Wallet } from 'lucide-react';
import { api } from '@/services/api';
import { Empty } from '@/components/ui';
import { formatDate, formatINR } from '@/utils/format';

interface Row {
  id: number; name: string; zone: string; pickups: number;
  value: number | null; last_pickup: string | null;
}

export default function Customers() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    api.get<{ customers: Row[] }>('/collectors/customers')
      .then((d) => setRows(d.customers))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Customers</h1>
        <p className="text-[13px] text-ink-soft">Households you've served · sorted by lifetime value</p>
      </div>

      {!rows ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14" />)}</div>
      ) : rows.length === 0 ? (
        <Empty icon={Users} title="No customers yet"
          description="Complete pickups to build your customer base." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead><tr><th className="th">Customer</th><th className="th">Zone</th><th className="th">Pickups</th><th className="th">Lifetime value</th><th className="th">Last pickup</th><th className="th">Rating</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50/70">
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[12px] font-bold text-brand-700">{r.name.charAt(0)}</span>
                      <span className="font-medium text-ink">{r.name}</span>
                    </div>
                  </td>
                  <td className="td text-[13px] text-ink-soft">{r.zone}</td>
                  <td className="td num text-[13px]"><span className="flex items-center gap-1"><Package size={12} className="text-neutral-400" /> {r.pickups}</span></td>
                  <td className="td num text-[13px] font-semibold"><span className="flex items-center gap-1"><Wallet size={12} className="text-neutral-400" /> {formatINR(r.value || 0)}</span></td>
                  <td className="td text-[12.5px] text-ink-soft">{formatDate(r.last_pickup)}</td>
                  <td className="td"><span className="badge bg-amber-50 text-amber-700"><Star size={11} fill="currentColor" /> 4.8</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
