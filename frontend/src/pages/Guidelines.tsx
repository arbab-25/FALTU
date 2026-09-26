/** Educational waste-handling guidelines. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Recycle, ShieldAlert } from 'lucide-react';
import { api } from '@/services/api';
import MaterialChip from '@/components/ui/MaterialChip';

interface Guideline {
  recyclable: string; prepare: string; avoid: string; safety: string;
}

const FALLBACK: Record<string, Guideline> = {
  plastic: { recyclable: 'Bottles, containers, rigid packaging (PET, HDPE).', prepare: 'Rinse and dry; crush bottles.', avoid: 'Do not mix with food waste.', safety: 'Never burn plastic.' },
  paper: { recyclable: 'Newspapers, notebooks, office paper.', prepare: 'Keep dry; remove covers.', avoid: 'No wet kitchen waste.', safety: 'Tie bundles.' },
  metal: { recyclable: 'Cans, utensils, wires.', prepare: 'Flatten cans; separate metals.', avoid: 'No batteries mixed in.', safety: 'Beware sharp edges.' },
  glass: { recyclable: 'Bottles, jars.', prepare: 'Rinse; pack separately.', avoid: 'Keep broken glass out of paper batches.', safety: 'Wrap shards, mark GLASS.' },
  'e-waste': { recyclable: 'Phones, chargers, cables.', prepare: 'Tape battery terminals.', avoid: 'Never mix with dry waste.', safety: 'Do not dismantle lithium batteries.' },
  hazardous: { recyclable: 'Needs special handling.', prepare: 'Store in original containers.', avoid: 'Never mix paints or medical waste.', safety: 'Use municipal helpline.' },
};

const TITLES: Record<string, string> = {
  plastic: 'Plastic', paper: 'Paper', metal: 'Metal', glass: 'Glass',
  'e-waste': 'E-waste', hazardous: 'Hazardous waste',
};

export default function Guidelines() {
  const [cats, setCats] = useState<Record<string, Guideline>>(FALLBACK);

  useEffect(() => {
    api.get<{ categories: Record<string, Guideline> }>('/waste/guidelines')
      .then((d) => setCats(d.categories))
      .catch(() => void 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
            <ArrowLeft size={16} /> Back
          </Link>
          <span className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white"><Recycle size={16} /></span>
            Kabadiwala Connect
          </span>
          <Link to="/login" className="btn-primary">Open Dashboard</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand-600">Responsible waste handling</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Prepare Your Waste Right. Earn More. Recycle Better.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Simple preparation raises the value of your recyclables and keeps collectors safe.
          Educational guidance only — not official government legal guidance.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {Object.entries(cats).map(([key, g]) => (
            <div key={key} className="card card-hover p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-ink">{TITLES[key] || key}</h2>
                <MaterialChip category={key === 'hazardous' ? 'other' : key} name={key} size="sm" />
              </div>
              <ul className="mt-4 space-y-2.5 text-[13.5px] leading-relaxed">
                <li className="flex gap-2.5"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-600" /><span><b>What can be recycled:</b> {g.recyclable}</span></li>
                <li className="flex gap-2.5"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-sky-600" /><span><b>How to prepare:</b> {g.prepare}</span></li>
                <li className="flex gap-2.5"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" /><span><b>Do not mix:</b> {g.avoid}</span></li>
                <li className="flex gap-2.5"><ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-500" /><span><b>Safety:</b> {g.safety}</span></li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
