/** Digital transaction receipt. */
import { Download, Share2 } from 'lucide-react';
import type { Receipt as ReceiptData } from '@/types';
import { formatDate, formatINR } from '@/utils/format';

export default function Receipt({ data }: { data: ReceiptData }) {
  const download = () => {
    const lines = data.lines
      .map((l) => `  ${l.name.padEnd(12)} ${String(l.weight).padStart(6)} kg  × ₹${l.rate}/kg  = ₹${l.amount.toFixed(2)}`)
      .join('\n');
    const text = [
      '='.repeat(46),
      '        KABADIWALA CONNECT',
      '     Connecting Waste. Empowering People.',
      '='.repeat(46),
      `Receipt:  ${data.receipt_code}`,
      `Pickup:   ${data.pickup.code}`,
      `Date:     ${formatDate(data.pickup.date)}`,
      `Customer: ${data.customer.name}`,
      `Collector:${data.collector.name}`,
      '-'.repeat(46),
      lines,
      '-'.repeat(46),
      `Total Weight:     ${data.totals.weight.toFixed(1)} kg`,
      `Transaction Value:${formatINR(data.totals.amount)}  (${data.totals.payment_method})`,
      '-'.repeat(46),
      data.tagline,
      'Demo receipt — SIH26229 prototype.',
      '='.repeat(46),
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.receipt_code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const text = `Kabadiwala Connect receipt ${data.receipt_code} — ${data.totals.weight.toFixed(1)} kg recycled, ${formatINR(data.totals.amount)}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Kabadiwala Connect Receipt', text });
      else await navigator.clipboard.writeText(text);
    } catch { /* user dismissed */ }
  };

  return (
    <div className="card overflow-hidden max-w-md mx-auto" role="document" aria-label="Transaction receipt">
      <div className="bg-ink px-6 py-5 text-center text-white">
        <p className="text-[11px] font-bold tracking-[0.28em] text-brand-300">RECEIPT</p>
        <p className="font-display text-lg font-bold">{data.brand}</p>
        <p className="mt-0.5 text-[11px] text-white/75">Connecting Waste. Empowering People.</p>
      </div>

      <div className="px-6 py-5">
        <div className="mb-4 flex items-center justify-between border-b border-dashed border-neutral-300 pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Pickup ID</p>
            <p className="num text-sm font-bold text-ink">{data.pickup.code}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">{data.receipt_code}</p>
            <p className="text-sm font-medium text-ink">{formatDate(data.pickup.date)}</p>
          </div>
        </div>

        <div className="mb-4 space-y-1.5 text-sm">
          <p><span className="text-neutral-500">Collector:</span> <span className="font-medium text-ink">{data.collector.name}</span></p>
          <p><span className="text-neutral-500">Customer:</span> <span className="font-medium text-ink">{data.customer.name}</span></p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-500">
              <th className="pb-2 font-semibold">Material</th>
              <th className="pb-2 text-right font-semibold">Weight</th>
              <th className="pb-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((l, i) => (
              <tr key={i} className="border-b border-neutral-100">
                <td className="py-2">
                  <span className="font-medium text-ink">{l.name}</span>
                  <span className="ml-1.5 text-[11px] text-neutral-400">₹{l.rate}/kg</span>
                </td>
                <td className="num py-2 text-right text-ink">{l.weight.toFixed(1)} kg</td>
                <td className="num py-2 text-right font-semibold text-ink">{formatINR(l.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-3 font-semibold text-ink">Total</td>
              <td className="num pt-3 text-right font-semibold text-ink">{data.totals.weight.toFixed(1)} kg</td>
              <td className="num pt-3 text-right font-display text-lg font-bold text-brand-700">{formatINR(data.totals.amount)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-3 flex items-center justify-between text-[13px]">
          <span className="text-neutral-500">Payment</span>
          <span className="badge bg-brand-50 text-brand-700">{data.totals.payment_method}</span>
        </div>

        <p className="mt-5 border-t border-dashed border-neutral-300 pt-4 text-center text-[12px] italic text-ink-soft">
          “{data.tagline}”
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={download} className="btn-outline" type="button">
            <Download size={15} /> Download
          </button>
          <button onClick={share} className="btn-primary" type="button">
            <Share2 size={15} /> Share
          </button>
        </div>
        <p className="mt-3 text-center text-[10.5px] text-neutral-400">{data.note}</p>
      </div>
    </div>
  );
}
