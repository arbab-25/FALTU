/** Schedule Pickup — 4-step wizard with AI estimator and smart matching. */
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BrainCircuit, Camera, Check, CheckCircle2, ImagePlus,
  Info, Loader2, MapPin, Sparkles, Star, Trash2, Truck, X,
} from 'lucide-react';
import { api } from '@/services/api';
import type { AiAnalysis, CollectorCard, Pickup, ValueEstimate } from '@/types';
import { useAuth } from '@/context/AuthContext';
import DemoMap from '@/components/ui/DemoMap';
import MaterialChip from '@/components/ui/MaterialChip';
import { formatINR } from '@/utils/format';

const MATERIALS = [
  { key: 'paper', name: 'Paper', icon: '📰' },
  { key: 'cardboard', name: 'Cardboard', icon: '📦' },
  { key: 'plastic', name: 'Plastic', icon: '🧴' },
  { key: 'metal', name: 'Metal', icon: '🥫' },
  { key: 'e-waste', name: 'E-waste', icon: '🔌' },
  { key: 'glass', name: 'Glass', icon: '🍾' },
  { key: 'mixed', name: 'Mixed Recyclables', icon: '♻️' },
  { key: 'other', name: 'Other', icon: '🏷️' },
];

const STEPS = ['Waste Type', 'Weight & AI', 'Collector', 'Confirm'];

export default function SchedulePickup() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [cats, setCats] = useState<string[]>([]);
  const [manualWeight, setManualWeight] = useState('');
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [estimate, setEstimate] = useState<ValueEstimate | null>(null);
  const [collectors, setCollectors] = useState<CollectorCard[] | null>(null);
  const [selectedCollector, setSelectedCollector] = useState<CollectorCard | null>(null);
  const [address, setAddress] = useState(user?.address || '');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [created, setCreated] = useState<Pickup | null>(null);

  const totalWeight = useMemo(() => {
    if (analysis) return analysis.total_weight;
    const w = parseFloat(manualWeight);
    return Number.isFinite(w) && w > 0 ? w : 0;
  }, [analysis, manualWeight]);

  const toggleCat = (key: string) => {
    setCats((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
    setAnalysis(null); // changing materials invalidates the previous AI pass
  };

  const runAnalysis = async (file?: File) => {
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const form = new FormData();
      if (file) form.append('image', file);
      form.append('categories', cats.join(','));
      if (manualWeight && parseFloat(manualWeight) > 0) {
        form.append('hint_weight', manualWeight);
      }
      const res = await api.postForm<AiAnalysis>('/waste/analyze', form);
      setAnalysis(res);
      const est = await api.post<ValueEstimate>('/waste/estimate', {
        items: res.items.map((i) => ({ category: i.category, weight: i.weight })),
      });
      setEstimate(est);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed — try manual entry.');
    } finally {
      setAnalyzing(false);
    }
  };

  const findCollectors = async () => {
    setStep(2);
    setCollectors(null);
    try {
      const res = await api.post<{ all: CollectorCard[] }>('/pickups/recommend', {
        categories: cats,
      });
      setCollectors(res.all);
    } catch {
      setCollectors([]);
    }
  };

  const submit = async () => {
    setCreating(true);
    setCreateError('');
    try {
      const per = analysis
        ? analysis.items.map((i) => i.weight)
        : cats.map(() => (totalWeight / Math.max(cats.length, 1)));
      const pickup = await api.post<Pickup>('/pickups', {
        categories: cats,
        weights: per,
        total_weight: totalWeight,
        address: address || user?.address || 'Demo address, Ahmedabad',
        zone: user?.zone || 'Satellite',
        estimated_value_min: analysis?.value_min ?? estimate?.total_value ?? null,
        estimated_value_max: analysis?.value_max ?? null,
        ai_confidence: analysis?.confidence ?? null,
      });
      setCreated(pickup);
      setStep(3);
      void refreshUser();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create pickup');
    } finally {
      setCreating(false);
    }
  };

  const assignCollector = async (pickupId: number, collectorId: number) => {
    // Demo: immediately attach the chosen collector so the tracking screen is complete.
    await api.patch(`/pickups/${pickupId}/status`, { status: 'accepted' }).catch(() => void 0);
  };

  if (created && step === 3) {
    return (
      <div className="mx-auto max-w-lg animate-fade-up">
        <div className="card p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <CheckCircle2 size={32} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Pickup Scheduled!</h1>
          <p className="mt-1.5 text-[14px] text-ink-soft">
            <span className="num font-bold text-ink">{created.code}</span> · {created.address}
          </p>
          <div className="mt-5 rounded-2xl bg-neutral-50 p-4 text-left text-sm">
            <div className="flex justify-between py-1"><span className="text-ink-soft">Materials</span><span className="font-medium">{cats.map((c) => c).join(', ')}</span></div>
            <div className="flex justify-between py-1"><span className="text-ink-soft">Estimated weight</span><span className="num font-medium">{totalWeight.toFixed(1)} kg</span></div>
            {analysis && (
              <div className="flex justify-between py-1"><span className="text-ink-soft">AI estimate</span>
                <span className="num font-medium">{formatINR(analysis.value_min)}–{formatINR(analysis.value_max)} <span className="text-[11px] text-neutral-400">({Math.round(analysis.confidence * 100)}% conf.)</span></span></div>
            )}
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] text-neutral-400">
            <Info size={13} /> Switch to the collector demo account to accept this request.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link to={`/app/pickups/${created.id}`} className="btn-outline">Track Pickup</Link>
            <button type="button" className="btn-primary" onClick={() => {
              setStep(0); setCats([]); setManualWeight(''); setAnalysis(null);
              setEstimate(null); setCollectors(null); setSelectedCollector(null); setCreated(null);
            }}>
              New Pickup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition
              ${i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-ink text-white' : 'bg-neutral-200 text-neutral-500'}`}>
              {i < step ? <Check size={13} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`hidden text-[12.5px] font-semibold sm:block ${i === step ? 'text-ink' : 'text-neutral-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded ${i < step ? 'bg-brand-500' : 'bg-neutral-200'}`} />}
          </li>
        ))}
      </ol>

      {/* STEP 1 — waste types */}
      {step === 0 && (
        <section className="animate-fade-up" aria-label="Waste type">
          <h1 className="font-display text-2xl font-bold text-ink">What type of waste do you have?</h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">Select all that apply — rates are demo reference values.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MATERIALS.map((m) => {
              const on = cats.includes(m.key);
              return (
                <button key={m.key} type="button" onClick={() => toggleCat(m.key)} aria-pressed={on}
                  className={`relative rounded-2xl border-2 p-4 text-center transition
                    ${on ? 'border-brand-500 bg-brand-50/70 shadow-soft' : 'border-neutral-200 bg-white hover:border-brand-300'}`}>
                  {on && <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white"><Check size={11} strokeWidth={3.5} /></span>}
                  <span className="text-2xl" aria-hidden>{m.icon}</span>
                  <p className="mt-1.5 text-[13px] font-bold text-ink">{m.name}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex justify-between">
            <span />
            <button type="button" disabled={!cats.length} onClick={() => setStep(1)} className="btn-primary">
              Next <ArrowRight size={15} />
            </button>
          </div>
        </section>
      )}

      {/* STEP 2 — weight + AI */}
      {step === 1 && (
        <section className="animate-fade-up space-y-5" aria-label="Weight and AI estimation">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Approximately how much?</h1>
            <p className="mt-1 text-[13.5px] text-ink-soft">Estimate manually or let the demo AI estimator help.</p>
          </div>

          <div className="card p-5">
            <label htmlFor="weight" className="label">Manual estimate (kg)</label>
            <div className="flex flex-wrap gap-3">
              <input id="weight" type="number" min={0.1} step={0.1} value={manualWeight}
                onChange={(e) => { setManualWeight(e.target.value); setAnalysis(null); }}
                disabled={Boolean(analysis)}
                className="input num max-w-[180px]" placeholder="e.g. 6.5" />
              <button type="button" disabled={analyzing || !cats.length}
                onClick={() => fileRef.current?.click()}
                className="btn-dark flex-1 sm:flex-none">
                {analyzing ? <Loader2 size={15} className="animate-spin" /> : <BrainCircuit size={15} />}
                Use AI Waste Estimator
              </button>
              <button type="button" disabled={analyzing || !cats.length}
                onClick={() => void runAnalysis()} className="btn-ghost border border-neutral-200 text-[13px]">
                <Sparkles size={14} /> No photo? Estimate anyway
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void runAnalysis(f);
                  e.target.value = '';
                }} />
            </div>
            <p className="mt-2 text-[11.5px] text-neutral-400">
              {analysis ? 'Demo AI estimate active — clear it below to edit manually.' :
                'Uploads are analysed and discarded; nothing is stored.'}
            </p>
            {analyzeError && (
              <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-600">{analyzeError}</p>
            )}
          </div>

          {analyzing && (
            <div className="card p-5">
              <div className="flex items-center gap-3 text-sm text-ink-soft">
                <Loader2 size={17} className="animate-spin text-brand-600" />
                Analysing image… (demo inference engine)
              </div>
              <div className="mt-4 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-9" />)}</div>
            </div>
          )}

          {analysis && (
            <div className="card animate-fade-up border-brand-200 p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                  <BrainCircuit size={17} className="text-brand-600" /> AI Analysis
                  <span className="badge bg-neutral-100 text-[10px] text-neutral-500">demo engine</span>
                </p>
                <button type="button" onClick={() => { setAnalysis(null); setEstimate(null); }}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100" aria-label="Clear AI estimate">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {analysis.items.map((i) => (
                  <div key={i.category} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5 text-sm">
                    <span className="font-medium text-ink">{i.name}</span>
                    <span className="num text-ink-soft">{i.weight.toFixed(1)} kg · ₹{i.rate}/kg</span>
                    <span className="num font-semibold text-brand-700">{formatINR(i.value)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-brand-50 px-3 py-2.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-brand-700/60">Total</p>
                  <p className="num font-display text-lg font-bold text-ink">{analysis.total_weight.toFixed(1)} kg</p>
                </div>
                <div className="rounded-xl bg-brand-50 px-3 py-2.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-brand-700/60">Value</p>
                  <p className="num font-display text-lg font-bold text-brand-700">{formatINR(analysis.value_min)}–{formatINR(analysis.value_max)}</p>
                </div>
                <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-neutral-500">Confidence</p>
                  <p className="num font-display text-lg font-bold text-ink">{Math.round(analysis.confidence * 100)}%</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">{analysis.notice}</p>
            </div>
          )}

          {/* Value table */}
          {((analysis?.items.length || 0) > 0 || (manualWeight && cats.length ? true : false)) && (
            <div className="card p-5">
              <h2 className="font-display text-[15px] font-bold text-ink">Estimated Value</h2>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-400">
                    <th className="pb-2 font-semibold">Material</th><th className="pb-2 text-right font-semibold">Weight</th>
                    <th className="pb-2 text-right font-semibold">Rate</th><th className="pb-2 text-right font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(analysis ? analysis.items : cats.map((c) => ({ category: c, weight: totalWeight / cats.length, rate: null as number | null }))).map((i) => {
                    const w = i.weight;
                    const r = 'rate' in i && typeof i.rate === 'number' ? i.rate : null;
                    return (
                      <tr key={i.category} className="border-b border-neutral-100">
                        <td className="py-2 font-medium text-ink">{i.category}</td>
                        <td className="num py-2 text-right text-ink-soft">{w.toFixed(1)} kg</td>
                        <td className="num py-2 text-right text-ink-soft">{r ? `₹${r}/kg` : '—'}</td>
                        <td className="num py-2 text-right font-semibold text-ink">{formatINR(w * (r ?? 0))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
                Estimated values are indicative demo rates and may vary by location, material quality,
                market conditions and collector.
              </p>
            </div>
          )}

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(0)} className="btn-ghost"><ArrowLeft size={15} /> Back</button>
            <button type="button" disabled={totalWeight <= 0} onClick={() => void findCollectors()} className="btn-primary">
              Find Collector <ArrowRight size={15} />
            </button>
          </div>
        </section>
      )}

      {/* STEP 3 — collector matching */}
      {step === 2 && (
        <section className="animate-fade-up" aria-label="Collector matching">
          <h1 className="font-display text-2xl font-bold text-ink">Choose a collector</h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">Ranked by distance, availability, material match and rating.</p>

          <div className="mt-5"><DemoMap height={280} customer={user?.lat && user?.lng ? { lat: user.lat, lng: user.lng } : null} collectors={collectors || []} /></div>

          {!collectors ? (
            <div className="mt-5 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}</div>
          ) : collectors.length === 0 ? (
            <div className="card mt-5 p-10 text-center">
              <p className="font-display text-lg font-bold text-ink">No collectors nearby</p>
              <p className="mt-1 text-[13px] text-ink-soft">Try again in a moment or reduce selected materials.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {collectors.map((c, idx) => (
                <button key={c.collector_id} type="button" onClick={() => setSelectedCollector(c)}
                  className={`card card-hover p-4 text-left ${selectedCollector?.collector_id === c.collector_id ? 'border-brand-500 ring-2 ring-brand-500/25' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-[14.5px] font-bold text-ink">
                        {c.name}
                        {idx === 0 && <span className="badge bg-brand-600 text-[10px] text-white">Recommended</span>}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">{c.zone} · {c.vehicle}</p>
                    </div>
                    <span className={`badge ${c.available ? 'bg-brand-50 text-brand-700' : 'bg-neutral-100 text-neutral-500'}`}>
                      {c.available ? 'Available now' : 'Busy'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-soft">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {c.distance_km} km</span>
                    <span className="flex items-center gap-1 text-amber-600"><Star size={12} fill="currentColor" /> {c.rating.toFixed(1)}</span>
                    <span>{c.completed_pickups.toLocaleString('en-IN')} pickups</span>
                    {c.eta_minutes && <span>ETA ~{c.eta_minutes} min</span>}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {c.materials.slice(0, 4).map((m) => (
                      <MaterialChip key={m} category={m.toLowerCase().replace(' ', '-')} name={m} size="sm" />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Address */}
          <div className="card mt-5 p-5">
            <label htmlFor="addr" className="label">Pickup address</label>
            <textarea id="addr" rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
              className="input" placeholder="House / street / landmark" />
          </div>

          <div className="mt-5 flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="btn-ghost"><ArrowLeft size={15} /> Back</button>
            <button type="button" disabled={!selectedCollector || creating} onClick={() => void submit()} className="btn-primary">
              {creating ? 'Creating…' : 'Confirm Request'} <Check size={15} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
