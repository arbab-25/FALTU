/** Recycler material flow — Sankey-style visualization. */
import { useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { api } from '@/services/api';
import type { RecyclerOverview } from '@/types';
import FlowDiagram from '@/components/ui/FlowDiagram';
import { formatKg } from '@/utils/format';

export default function RecyclerFlow() {
  const [data, setData] = useState<RecyclerOverview | null>(null);

  useEffect(() => {
    api.get<RecyclerOverview>('/recycler/overview').then(setData).catch(() => void 0);
  }, []);

  if (!data) return <div className="skeleton h-96" />;

  const f = data.flow;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Material Flow</h1>
        <p className="text-[13px] text-ink-soft">From collection to recycled output · demo data</p>
      </div>

      <div className="card p-6">
        <FlowDiagram
          nodes={[
            { label: 'Collected', value: f.collected, color: '#f59e0b' },
            { label: 'Sorted', value: f.sorted, color: '#10b981' },
            { label: 'Processed', value: f.processed, color: '#0ea5e9' },
            { label: 'Recycled', value: f.recycled, color: '#059669' },
            { label: 'New Materials', value: Math.round(f.recycled * 0.92), color: '#065f46' },
            { label: 'Residue', value: Math.max(1, f.collected - f.recycled), color: '#94a3b8' },
          ]}
          height={360} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ['Collected', f.collected, 'bg-amber-50 text-amber-700'],
          ['Sorted', f.sorted, 'bg-brand-50 text-brand-700'],
          ['Processed', f.processed, 'bg-sky-50 text-sky-700'],
          ['Recycled', f.recycled, 'bg-emerald-50 text-emerald-700'],
        ].map(([label, value, tone], i) => (
          <div key={label as string} className="relative card p-5 text-center">
            {i < 3 && <ArrowDown size={16} className="absolute -bottom-6 left-1/2 z-10 -translate-x-1/2 text-neutral-300" />}
            <p className={`badge ${tone}`}>{label as string}</p>
            <p className="kpi num mt-2">{formatKg(value as number, 0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
