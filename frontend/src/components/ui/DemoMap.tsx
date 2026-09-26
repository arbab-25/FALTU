/** Stylized demo city map (Ahmedabad) with interactive markers — no external tiles needed. */
import { useMemo, useState } from 'react';
import { MapPin, Navigation, Recycle, Star, Truck, User } from 'lucide-react';
import type { CollectorCard } from '@/types';

export interface MapPoint {
  id: number;
  kind: 'customer' | 'collector' | 'recycler';
  name: string;
  sub?: string;
  rating?: number;
  available?: boolean;
  distance_km?: number;
  eta_minutes?: number | null;
  x: number;
  y: number;
}

/** Project demo lat/lng (Ahmedabad bounds) into 0–100 viewbox coords. */
function project(lat: number, lng: number): { x: number; y: number } {
  const latMin = 22.94, latMax = 23.12, lngMin = 72.44, lngMax = 72.68;
  return {
    x: ((lng - lngMin) / (lngMax - lngMin)) * 100,
    y: 100 - ((lat - latMin) / (latMax - latMin)) * 100,
  };
}

export default function DemoMap({
  collectors = [], customer, centers = [], height = 420,
}: {
  collectors?: CollectorCard[];
  customer?: { lat: number; lng: number; label?: string } | null;
  centers?: { id: number; name: string; lat: number; lng: number }[];
  height?: number;
}) {
  const [selected, setSelected] = useState<MapPoint | null>(null);

  const points: MapPoint[] = useMemo(() => {
    const pts: MapPoint[] = [];
    if (customer?.lat && customer?.lng) {
      const p = project(customer.lat, customer.lng);
      pts.push({ id: 0, kind: 'customer', name: customer.label || 'You', x: p.x, y: p.y });
    }
    collectors.forEach((c) => {
      const base = { id: c.collector_id, kind: 'collector' as const, name: c.name,
        sub: `${c.distance_km} km · ${c.available ? 'Available' : 'Busy'}`,
        rating: c.rating, available: c.available, distance_km: c.distance_km,
        eta_minutes: c.eta_minutes };
      // Deterministic pseudo-position around the customer for demo purposes
      const seed = c.collector_id;
      const dx = Math.sin(seed * 12.9898) * 9;
      const dy = Math.cos(seed * 78.233) * 7;
      const baseP = customer ? project(customer.lat, customer.lng) : { x: 50, y: 50 };
      pts.push({ ...base, x: Math.max(6, Math.min(94, baseP.x + dx)), y: Math.max(6, Math.min(94, baseP.y + dy)) });
    });
    centers.forEach((r) => {
      const p = project(r.lat, r.lng);
      pts.push({ id: 1000 + r.id, kind: 'recycler', name: r.name, x: p.x, y: p.y });
    });
    return pts;
  }, [collectors, customer, centers]);

  const color = (k: MapPoint['kind']) =>
    k === 'customer' ? '#0f766e' : k === 'collector' ? '#f59e0b' : '#6366f1';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[#eef4ee]" style={{ height }}>
      {/* Stylized roads / river */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
        <rect width="100" height="100" fill="#eef4ee" />
        <path d="M0,62 C25,58 35,72 55,66 S 85,58 100,64" stroke="#bfd7ea" strokeWidth="3.4" fill="none" opacity="0.9" />
        <path d="M0,62 C25,58 35,72 55,66 S 85,58 100,64" stroke="#9fc3dd" strokeWidth="0.7" fill="none" opacity="0.8" />
        <path d="M12,0 L18,100" stroke="white" strokeWidth="1.6" opacity="0.9" />
        <path d="M0,26 L100,20" stroke="white" strokeWidth="1.4" opacity="0.9" />
        <path d="M38,0 L42,100" stroke="white" strokeWidth="1.2" opacity="0.8" />
        <path d="M0,82 L100,78" stroke="white" strokeWidth="1.6" opacity="0.85" />
        <path d="M64,0 L60,100" stroke="white" strokeWidth="1.3" opacity="0.8" />
        <path d="M0,48 L100,44" stroke="white" strokeWidth="1" opacity="0.7" />
        <circle cx="24" cy="40" r="6" fill="#d9ead9" />
        <circle cx="76" cy="30" r="7" fill="#d9ead9" />
        <circle cx="70" cy="86" r="5" fill="#d9ead9" />
      </svg>

      {/* Markers */}
      {points.map((p) => (
        <button
          key={`${p.kind}-${p.id}`}
          type="button"
          onClick={() => setSelected(selected?.id === p.id && selected.kind === p.kind ? null : p)}
          aria-label={`${p.kind}: ${p.name}`}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 focus-visible:scale-110"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lift"
            style={{ background: color(p.kind) }}>
            {p.kind === 'customer' && <User size={15} className="text-white" />}
            {p.kind === 'collector' && <Truck size={14} className="text-white" />}
            {p.kind === 'recycler' && <Recycle size={14} className="text-white" />}
            {p.kind === 'collector' && p.available && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-400" />
            )}
          </span>
        </button>
      ))}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 rounded-xl bg-white/92 px-3 py-2 text-[11px] font-medium shadow-soft backdrop-blur">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#0f766e' }} /> You</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#f59e0b' }} /> Collectors</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#6366f1' }} /> Recycling centers</span>
      </div>

      <div className="absolute right-3 top-3 z-10 rounded-lg bg-white/92 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 shadow-soft backdrop-blur">
        Demo map · Ahmedabad
      </div>

      {/* Info card */}
      {selected && (
        <div className="absolute left-1/2 top-3 z-20 w-64 -translate-x-1/2 animate-fade-up rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-lift">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{selected.name}</p>
              <p className="mt-0.5 text-[12px] text-ink-soft">{selected.sub || (selected.kind === 'recycler' ? 'Recycling facility' : 'Your location')}</p>
              {selected.rating && (
                <p className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-amber-600">
                  <Star size={11} fill="currentColor" /> {selected.rating.toFixed(1)}
                  {selected.eta_minutes ? <span className="ml-1.5 text-neutral-500">· ETA {selected.eta_minutes} min</span> : null}
                </p>
              )}
            </div>
            <button type="button" onClick={() => setSelected(null)}
              className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100" aria-label="Close">✕</button>
          </div>
          {selected.kind === 'collector' && (
            <button type="button" className="btn-primary mt-3 w-full py-2 text-[13px]">
              <Navigation size={13} /> View profile
            </button>
          )}
        </div>
      )}

      {!points.length && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm text-ink-soft shadow-soft">
            <MapPin size={15} className="text-brand-600" /> No locations to display
          </div>
        </div>
      )}
    </div>
  );
}
