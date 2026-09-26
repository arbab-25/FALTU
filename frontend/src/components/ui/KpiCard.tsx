import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export default function KpiCard({
  icon: Icon, label, value, sub, tone = 'brand', children,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'brand' | 'blue' | 'amber' | 'violet' | 'red' | 'neutral';
  children?: ReactNode;
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    blue: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    red: 'bg-red-50 text-red-500',
    neutral: 'bg-neutral-100 text-neutral-600',
  };
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
          <p className="kpi num mt-2">{value}</p>
          {sub && <p className="mt-1 text-[12px] text-ink-soft">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      {children}
    </div>
  );
}
