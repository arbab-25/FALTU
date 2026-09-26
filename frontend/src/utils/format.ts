/** Formatting helpers for the demo (Indian number style). */
export function formatINR(value: number | null | undefined, opts: { compact?: boolean } = {}) {
  const v = value ?? 0;
  if (opts.compact && v >= 100000) {
    return `₹${(v / 100000).toFixed(1)}L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: v % 1 === 0 ? 0 : 2,
  }).format(v);
}

export function formatKg(value: number | null | undefined, decimals = 1) {
  const v = value ?? 0;
  if (v >= 1000) return `${(v / 1000).toFixed(1)} t`;
  return `${v.toFixed(decimals)} kg`;
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('en-IN').format(value ?? 0);
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') || iso.includes(' ') ? iso : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  on_the_way: 'On the way',
  collected: 'Collected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
