/** Pickup tracking timeline. */
import { Check, CircleDashed, Truck } from 'lucide-react';

const STEPS = [
  { key: 'pending', label: 'Pickup Requested' },
  { key: 'accepted', label: 'Collector Assigned' },
  { key: 'on_the_way', label: 'Collector On The Way' },
  { key: 'collected', label: 'Waste Collected' },
  { key: 'completed', label: 'Sent for Recycling' },
];

const ORDER = ['pending', 'accepted', 'on_the_way', 'collected', 'completed'];

export default function TrackingTimeline({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        This pickup was cancelled.
      </div>
    );
  }
  const currentIdx = ORDER.indexOf(status);
  return (
    <ol className="space-y-0" aria-label="Pickup progress">
      {STEPS.map((step, i) => {
        const idx = ORDER.indexOf(step.key);
        const done = currentIdx > idx || (currentIdx === idx && status === 'completed');
        const active = currentIdx === idx && status !== 'completed';
        return (
          <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
            {i < STEPS.length - 1 && (
              <span className={`absolute left-[11px] top-6 h-full w-0.5 ${done ? 'bg-brand-500' : 'bg-neutral-200'}`} />
            )}
            <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold
              ${done ? 'border-brand-500 bg-brand-500 text-white' :
                active ? 'border-brand-500 bg-white text-brand-600' : 'border-neutral-300 bg-white text-neutral-400'}`}>
              {done ? <Check size={13} strokeWidth={3} /> :
                active ? <Truck size={12} className="animate-pulse-soft" /> : <CircleDashed size={12} />}
            </span>
            <div>
              <p className={`text-sm font-semibold ${done || active ? 'text-ink' : 'text-neutral-500'}`}>
                {step.label}
              </p>
              {active && (
                <p className="text-[12px] font-medium text-brand-700">In progress…</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
