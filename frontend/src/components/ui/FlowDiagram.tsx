/** Sankey-style waste flow visualization (pure SVG, animated). */
import { useId } from 'react';

interface Node {
  label: string;
  value: number;
  color: string;
}

export default function FlowDiagram({
  nodes, unit = 'kg', height = 380,
}: {
  nodes: Node[];
  unit?: string;
  height?: number;
}) {
  const uid = useId().replace(/:/g, '');
  if (nodes.length < 2) return null;

  const W = 900;
  const H = height;
  const colW = 118;
  const gap = 26;

  // Vertical layout for each column
  const cols: Node[][] = [nodes.slice(0, 2), nodes.slice(2, 4), nodes.slice(4, 6)];
  const colX = [40, W / 2 - colW / 2, W - 40 - colW];

  const layout: { x: number; y: number; h: number; node: Node }[][] = [];
  cols.forEach((col, ci) => {
    const colTotal = col.reduce((s, n) => s + n.value, 0) || 1;
    const scale = (H - 60) / colTotal;
    let y = 30;
    const laid = col.map((n) => {
      const h = Math.max(18, n.value * scale);
      const item = { x: colX[ci], y, h, node: n };
      y += h + gap;
      return item;
    });
    layout.push(laid);
  });

  function ribbon(x1: number, y1: number, h1: number, x2: number, y2: number, h2: number) {
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2} L ${x2} ${y2 + h2} C ${cx} ${y2 + h2}, ${cx} ${y1 + h1}, ${x1} ${y1 + h1} Z`;
  }

  return (
    <div
      className="overflow-x-auto rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      tabIndex={0}
      role="region"
      aria-label="Waste flow diagram (scrollable)"
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[760px]" role="img"
        aria-label="Waste flow diagram">
        <defs>
          {nodes.map((n, i) => (
            <linearGradient key={i} id={`${uid}-g${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={n.color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={n.color} stopOpacity={0.18} />
            </linearGradient>
          ))}
        </defs>

        {/* Ribbons between columns */}
        {[0, 1].map((ci) => {
          const left = layout[ci];
          const right = layout[ci + 1];
          let rY = 30;
          const paths: { d: string; grad: string }[] = [];
          right.forEach((r) => {
            const l = left[0];
            const hL = l.h;
            paths.push({ d: ribbon(l.x + colW, l.y, hL, r.x, r.y, r.h), grad: `${uid}-g${ci}` });
            rY += r.h + gap;
          });
          void rY;
          return (
            <g key={ci}>
              {paths.map((p, pi) => (
                <path key={pi} d={p.d} fill={`url(#${p.grad})`} className="flow-link" opacity={0.5}>
                  <animate attributeName="opacity" values="0.35;0.65;0.35" dur="3s"
                    begin={`${pi * 0.4}s`} repeatCount="indefinite" />
                </path>
              ))}
            </g>
          );
        })}

        {/* Nodes */}
        {layout.flat().map((n, i) => (
          <g key={i}>
            <rect x={n.x} y={n.y} width={colW} height={n.h} rx={10} fill={n.node.color}
              opacity={0.92} />
            <rect x={n.x} y={n.y} width={colW} height={n.h} rx={10} fill="url(#node-sheen)"
              opacity={0.15} />
            <text x={n.x + colW / 2} y={n.y + n.h / 2 - 4} textAnchor="middle" fill="white"
              fontSize={12.5} fontWeight={700} fontFamily="Inter, sans-serif">
              {n.node.label}
            </text>
            <text x={n.x + colW / 2} y={n.y + n.h / 2 + 13} textAnchor="middle" fill="rgba(255,255,255,.85)"
              fontSize={11} fontFamily="Inter, sans-serif">
              {Math.round(n.node.value).toLocaleString('en-IN')} {unit}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
