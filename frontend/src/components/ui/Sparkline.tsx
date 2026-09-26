/** Dependency-free SVG sparkline. */
export default function Sparkline({
  data, height = 48, stroke = '#059669', fill = 'rgba(5,150,105,.12)',
}: {
  data: number[];
  height?: number;
  stroke?: string;
  fill?: string;
}) {
  if (!data.length) return <div style={{ height }} className="rounded-lg bg-neutral-100" />;
  const w = 240;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} role="img" aria-label="trend chart">
      <polygon points={`0,${height} ${pts.join(' ')} ${w},${height}`} fill={fill} />
      <polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]}
        r={3.5} fill={stroke} />
    </svg>
  );
}
