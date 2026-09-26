import { useLang } from '@/context/LanguageContext';

const MAP: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  accepted: 'bg-blue-50 text-blue-700 border border-blue-200',
  on_the_way: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  collected: 'bg-violet-50 text-violet-700 border border-violet-200',
  completed: 'bg-brand-50 text-brand-700 border border-brand-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-200',
};

/** status value -> dictionary key (dictionary uses camelCase keys). */
const KEY: Record<string, string> = {
  pending: 'pending',
  accepted: 'accepted',
  on_the_way: 'onTheWay',
  collected: 'collected',
  completed: 'completed',
  cancelled: 'cancelled',
};

export default function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  const key = KEY[status];
  return (
    <span className={`badge ${MAP[status] || 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}>
      {key ? t(key) : status}
    </span>
  );
}
