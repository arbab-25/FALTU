/** Public landing page — the SIH pitch in five scrolls. */
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Banknote, BrainCircuit, Camera, ClipboardList,
  HelpCircle, Leaf, LineChart, MapPinned, Package, Recycle, Route as RouteIcon,
  ShieldCheck, Smartphone, Star, Trash2, TrendingUp, Truck, Users, Wallet, XCircle,
} from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import SectionTitle from '@/components/ui/SectionTitle';
import { useAuth } from '@/context/AuthContext';

const PROBLEMS = [
  { icon: HelpCircle, title: 'Fragmented collection', text: 'Households cannot find reliable nearby collectors; collectors operate without organized demand.', impact: 'Recyclables leak into general waste' },
  { icon: XCircle, title: 'Uncertain waste prices', text: 'No transparent reference price exists for household recyclables.', impact: 'Low trust, unfair bargaining' },
  { icon: MapPinned, title: 'Inefficient pickup routes', text: 'Collectors roam blindly; trips overlap and waste fuel and time.', impact: 'Fewer pickups per day, lower income' },
  { icon: LineChart, title: 'Limited digital visibility', text: 'No records of volumes, earnings or material flows to recycling facilities.', impact: 'No credit history, no planning' },
];

const SOLUTION = [
  { icon: Camera, title: 'Identify Waste', text: 'AI demo estimator recognises material types and suggests weights.' },
  { icon: Banknote, title: 'Know the Value', text: 'Transparent reference rates show expected earnings before pickup.' },
  { icon: Truck, title: 'Match a Collector', text: 'Smart matching ranks nearby collectors by distance, availability and rating.' },
  { icon: ClipboardList, title: 'Record Transaction', text: 'Weighed, priced and receipted digitally for both sides.' },
  { icon: Leaf, title: 'Track Impact', text: 'Every kilogram is traced to recycling and CO₂e savings.' },
];

const EMPOWER = [
  { icon: BadgeCheck, title: 'Digital identity', text: 'Verified collector profile with ratings and badges.' },
  { icon: Wallet, title: 'Digital earnings', text: 'Every transaction recorded — a work history that banks can read.' },
  { icon: RouteIcon, title: 'Route optimization', text: 'Smart stop ordering saves kilometres every day.' },
  { icon: Smartphone, title: 'Simple tools', text: 'Works on any phone — no expensive hardware needed.' },
];

const TRUST = [
  { icon: ShieldCheck, title: 'Verified collectors', text: 'Profile checks and platform verification badges.' },
  { icon: ClipboardList, title: 'Digital records', text: 'Pickup IDs and receipts for every transaction.' },
  { icon: Star, title: 'Two-way ratings', text: 'Customers rate collectors; collectors rate customers.' },
  { icon: HelpCircle, title: 'Dispute support', text: 'Report issues inside the app; admin follows up.' },
];

export default function Landing() {
  const { t } = useLang();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-[0_4px_12px_-4px_rgba(5,150,105,.6)]">
              <Recycle size={19} />
            </span>
            <span className="font-display text-[16px] font-bold tracking-tight text-ink">
              Kabadiwala <span className="text-brand-700">Connect</span>
            </span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
            <a href="#how" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-neutral-100 hover:text-ink">How It Works</a>
            <a href="#collectors" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-neutral-100 hover:text-ink">For Collectors</a>
            <a href="#ai" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-neutral-100 hover:text-ink">AI</a>
            <Link to="/impact" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-neutral-100 hover:text-ink">Impact</Link>
            <Link to="/guidelines" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-neutral-100 hover:text-ink">Guidelines</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden sm:block"><LanguageSwitcher compact /></div>
            {user ? (
              <Link to="/app" className="btn-primary">Open Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden sm:inline-flex">{t('login')}</Link>
                <Link to="/login?role=customer&intent=schedule" className="btn-primary">{t('schedulePickup')}</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="badge border border-brand-200 bg-brand-50 text-brand-700">
              <Leaf size={12} /> Smart India Hackathon 2026 · SIH26229
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[54px]">
              Turn Everyday Waste Into <span className="text-brand-700">Real Value.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-ink-soft">
              {t('heroSub')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login?role=customer&intent=schedule" className="btn-primary px-6 py-3 text-[15px]">
                {t('schedulePickup')} <ArrowRight size={16} />
              </Link>
              <Link to="/login?role=collector" className="btn-outline px-6 py-3 text-[15px]">
                {t('becomeCollector')}
              </Link>
            </div>
            <p className="mt-6 text-[12px] text-neutral-500">
              Prototype demo · <Link to="/login" className="font-semibold text-brand-600 hover:underline">use a demo account</Link> to explore every role.
            </p>
          </div>

          {/* Visual chain */}
          <div className="relative animate-fade-in" aria-hidden>
            <div className="card relative overflow-hidden p-6 shadow-lift">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-100/70" />
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">The connected chain</p>
                <div className="mt-4 space-y-0">
                  {[
                    { icon: Users, label: 'Household', sub: 'schedules a pickup', color: 'bg-sky-500' },
                    { icon: BrainCircuit, label: 'AI Estimate', sub: 'materials · weight · value', color: 'bg-violet-500' },
                    { icon: Truck, label: 'Collector', sub: 'matched · accepted · collected', color: 'bg-amber-500' },
                    { icon: Recycle, label: 'Recycling Partner', sub: 'sorted · processed', color: 'bg-indigo-500' },
                    { icon: Leaf, label: 'Impact', sub: 'CO₂e avoided · livelihoods', color: 'bg-brand-600' },
                  ].map((s, i, arr) => (
                    <div key={s.label}>
                      <div className="flex items-center gap-3.5">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-soft ${s.color}`}>
                          <s.icon size={20} />
                        </span>
                        <div>
                          <p className="text-[14.5px] font-bold text-ink">{s.label}</p>
                          <p className="text-[12.5px] text-ink-soft">{s.sub}</p>
                        </div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="ml-5 h-6 w-0.5 bg-gradient-to-b from-neutral-200 to-brand-300" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating stat chips */}
            <div className="absolute -left-3 top-8 hidden animate-bob rounded-2xl border border-neutral-100 bg-white px-4 py-2.5 shadow-lift sm:block" style={{ animationDelay: '.4s' }}>
              <p className="num font-display text-lg font-bold text-brand-700">12,450 kg</p>
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">recycled · demo</p>
            </div>
            <div className="absolute -right-2 top-24 hidden animate-bob rounded-2xl border border-neutral-100 bg-white px-4 py-2.5 shadow-lift sm:block" style={{ animationDelay: '1.2s' }}>
              <p className="num font-display text-lg font-bold text-ink">₹8.4L</p>
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">collector earnings · demo</p>
            </div>
            <div className="absolute -left-2 bottom-10 hidden animate-bob rounded-2xl border border-neutral-100 bg-white px-4 py-2.5 shadow-lift md:block" style={{ animationDelay: '2s' }}>
              <p className="num font-display text-lg font-bold text-ink">1,240</p>
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">pickups completed · demo</p>
            </div>
            <div className="absolute -bottom-5 right-8 hidden animate-bob rounded-2xl border border-brand-100 bg-white px-4 py-2.5 shadow-lift md:block" style={{ animationDelay: '.8s' }}>
              <p className="num font-display text-lg font-bold text-brand-700">2,850</p>
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">households · demo</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-t border-neutral-100 bg-neutral-50/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle
            kicker="The Problem"
            title="The Recycling Chain Is More Valuable Than It Looks."
            description="India's informal collectors do the heavy lifting of recycling — yet the chain around them runs on guesswork. Demo problem framing for SIH26229." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="card card-hover p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                  <p.icon size={21} />
                </span>
                <h3 className="mt-4 font-display text-[16px] font-bold text-ink">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{p.text}</p>
                <p className="mt-3 border-t border-dashed border-neutral-200 pt-3 text-[12px] font-semibold text-red-700">
                  Impact: {p.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle
            kicker="The Solution"
            title="One Platform. An Entire Recycling Ecosystem."
            description="Five connected stages replace guesswork with a transparent digital chain." />
          <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-5">
            {SOLUTION.map((s, i) => (
              <div key={s.title} className="card card-hover relative p-5">
                <span className="absolute right-4 top-4 num text-2xl font-bold text-neutral-100">{i + 1}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <s.icon size={21} />
                </span>
                <h3 className="mt-4 font-display text-[15px] font-bold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI */}
      <section id="ai" className="bg-ink py-20 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="badge border border-white/15 bg-white/10 text-brand-300">
              <BrainCircuit size={12} /> Intelligence Layer (demo)
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">
              AI that turns a photo of waste into a plan.
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70">
              Snap a picture of today's recyclables. The demo engine suggests detected materials,
              weights and an indicative value — then finds the right collector. Built as a modular
              service so a real vision model can drop in later.
            </p>
            <ul className="mt-6 space-y-3.5">
              {[
                ['Waste classification', 'image → material categories (demo engine)'],
                ['Value estimation', 'weight × transparent reference rates'],
                ['Smart matching', 'distance · availability · rating'],
                ['Route optimization', 'nearest-neighbour stop ordering'],
              ].map(([a, b]) => (
                <li key={a} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
                    <BadgeCheck size={12} />
                  </span>
                  <p className="text-sm"><span className="font-semibold">{a}</span> <span className="text-white/75">— {b}</span></p>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[11.5px] text-white/65">
              Prototype notice: the estimator is a deterministic demo engine, not a trained model.
            </p>
          </div>

          {/* Mock analysis card */}
          <div className="card border-white/10 bg-white/[0.04] p-6 text-white shadow-none">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-[13px] font-bold text-brand-300">
                <Camera size={15} /> AI Analysis
              </p>
              <span className="badge border border-white/10 bg-white/10 text-[10px] text-white/75">demo engine</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {[
                ['Cardboard', '4.2 kg', '₹42.00'],
                ['Plastic', '1.8 kg', '₹45.00'],
                ['Metal', '0.9 kg', '₹54.00'],
              ].map(([m, w, v]) => (
                <div key={m} className="flex items-center justify-between rounded-xl bg-white/[0.05] px-4 py-3 text-sm">
                  <span className="font-medium">{m}</span>
                  <span className="text-white/75">{w}</span>
                  <span className="num font-semibold text-brand-300">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-brand-500/15 px-4 py-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-white/70">Estimated total</p>
                <p className="num font-display text-xl font-bold">6.9 kg</p>
              </div>
              <div className="rounded-xl bg-brand-500/15 px-4 py-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-white/70">Estimated value</p>
                <p className="num font-display text-xl font-bold text-brand-300">₹141–₹173</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[11px] font-semibold text-white/70">
                <span>Confidence (demo)</span><span>87%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-brand-500 to-brand-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTOR EMPOWERMENT */}
      <section id="collectors" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle
            kicker="Collector Empowerment"
            title="Digital Tools for the People Who Keep Our Cities Clean."
            description="From informal collection to digital livelihood — identity, records, fair prices and smarter routes." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {EMPOWER.map((e) => (
              <div key={e.title} className="card card-hover p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <e.icon size={21} />
                </span>
                <h3 className="mt-4 font-display text-[16px] font-bold text-ink">{e.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{e.text}</p>
              </div>
            ))}
          </div>
          <div className="card mt-8 flex flex-col items-center justify-between gap-4 bg-gradient-to-r from-brand-700 to-brand-600 p-7 text-white md:flex-row">
            <div>
              <p className="font-display text-xl font-bold">"From informal collection to digital livelihood."</p>
              <p className="mt-1 text-sm text-white/75">₹8.4L recorded collector earnings · 146 collector profiles · demo data</p>
            </div>
            <Link to="/login?role=collector" className="btn bg-white px-5 py-2.5 text-brand-700 hover:bg-brand-50">
              Open collector demo <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-t border-neutral-100 bg-neutral-50/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle kicker="Trust & Safety" title="Every Pickup Leaves a Record." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((x) => (
              <div key={x.title} className="card card-hover p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <x.icon size={21} />
                </span>
                <h3 className="mt-4 font-display text-[16px] font-bold text-ink">{x.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{x.text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-[13px] font-medium text-amber-700">
            ⚠ Do not exchange sensitive financial credentials through chat.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-600 text-white shadow-pop">
            <Recycle size={30} />
          </span>
          <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Don't just collect waste.<br />Connect the entire recycling ecosystem.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-ink-soft">
            Connecting Waste. Empowering People. Building a Circular Future.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/login?role=customer&intent=schedule" className="btn-primary px-7 py-3 text-[15px]">
              {t('schedulePickup')} <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-outline px-7 py-3 text-[15px]">Try all demo roles</Link>
          </div>
          <p className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-neutral-500">
            <span className="flex items-center gap-1.5"><Package size={13} /> 12,450 kg recycled (demo)</span>
            <span className="flex items-center gap-1.5"><TrendingUp size={13} /> 31.2 t CO₂e avoided est.</span>
            <span className="flex items-center gap-1.5"><Trash2 size={13} /> 48.7 t diverted (demo)</span>
          </p>
        </div>
      </section>

      <footer className="border-t border-neutral-100 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:px-6 md:flex-row md:text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white"><Recycle size={16} /></span>
            <div>
              <p className="text-[13.5px] font-bold text-ink">Kabadiwala Connect</p>
              <p className="text-[11px] text-neutral-500">SIH26229 prototype · demo data only</p>
            </div>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[13px] font-medium text-ink-soft" aria-label="Footer">
            <Link to="/impact" className="hover:text-brand-700">Impact</Link>
            <Link to="/guidelines" className="hover:text-brand-700">Waste Guidelines</Link>
            <Link to="/login" className="hover:text-brand-700">Demo Login</Link>
            <a href="#how" className="hover:text-brand-700">How It Works</a>
          </nav>
          <LanguageSwitcher compact />
        </div>
      </footer>
    </div>
  );
}
