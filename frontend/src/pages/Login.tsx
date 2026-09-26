/** Login with one-click demo accounts for every role. */
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BarChart3, Factory, Info, Lock, Mail, Recycle, Truck, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import type { Role } from '@/types';

const DEMOS: { role: Role; icon: typeof Users; name: string; email: string; desc: string }[] = [
  { role: 'customer', icon: Users, name: 'Customer', email: 'customer@demo.com', desc: 'Ananya Sharma · Satellite' },
  { role: 'collector', icon: Truck, name: 'Kabadiwala', email: 'collector@demo.com', desc: 'Ramesh Recycling Services' },
  { role: 'recycler', icon: Factory, name: 'Recycling Partner', email: 'recycler@demo.com', desc: 'Prakriti Materials LLP' },
  { role: 'admin', icon: BarChart3, name: 'Admin', email: 'admin@demo.com', desc: 'City-wide analytics' },
];

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preferred = params.get('role') as Role | null;
  const intent = params.get('intent');

  const [email, setEmail] = useState(preferred ? DEMOS.find((d) => d.role === preferred)?.email ?? '' : '');
  const [password, setPassword] = useState(preferred ? 'demo123' : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const doLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const quick = async (d: typeof DEMOS[number]) => {
    setEmail(d.email);
    setPassword('demo123');
    setError('');
    setBusy(true);
    try {
      await login(d.email, 'demo123');
      navigate(intent === 'schedule' && d.role === 'customer' ? '/app/schedule' : '/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Left panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-ink p-10 text-white lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600"><Recycle size={19} /></span>
          <span className="font-display text-[16px] font-bold">Kabadiwala Connect</span>
        </Link>
        <div>
          <h1 className="max-w-md font-display text-4xl font-bold leading-tight">
            Connecting Waste. <span className="text-brand-400">Empowering People.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
            One transparent platform linking households, kabadiwalas and recycling partners —
            built for Smart India Hackathon 2026 (SIH26229).
          </p>
          <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
            {[['48.7 t', 'waste diverted (demo)'], ['₹8.4L', 'collector earnings (demo)'], ['31.2 t', 'CO₂e avoided est.'], ['1,240', 'pickups (demo)']].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                <p className="num font-display text-xl font-bold text-brand-300">{v}</p>
                <p className="mt-0.5 text-[11px] text-white/70">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11.5px] text-white/60">Prototype demo · all data is simulated</p>
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl" />
      </div>

      {/* Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 flex items-center justify-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><Recycle size={18} /></span>
            <span className="font-display text-lg font-bold text-ink">Kabadiwala Connect</span>
          </Link>

          <div className="card p-7">
            <h2 className="font-display text-[22px] font-bold text-ink">{t('signIn')}</h2>
            <p className="mt-1 text-[13.5px] text-ink-soft">{t('demoLogin')} · demo123</p>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {DEMOS.map((d) => (
                <button key={d.role} type="button" disabled={busy} onClick={() => void quick(d)}
                  className="group rounded-xl border border-neutral-200 bg-white p-3 text-left transition hover:border-brand-400 hover:bg-brand-50/40 disabled:opacity-60">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-ink">
                    <d.icon size={15} className="text-brand-600" /> {d.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-neutral-500">{d.desc}</span>
                </button>
              ))}
            </div>

            <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <span className="h-px flex-1 bg-neutral-200" /> or with email <span className="h-px flex-1 bg-neutral-200" />
            </div>

            <form onSubmit={doLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input id="email" type="email" autoComplete="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} className="input pl-10"
                    placeholder="you@demo.com" />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input id="password" type="password" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10" placeholder="demo123" />
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full py-3">
                {busy ? '…' : t('signIn')} <ArrowRight size={15} />
              </button>
            </form>

            <div className="mt-5 flex gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3">
              <Info size={15} className="mt-0.5 shrink-0 text-sky-600" />
              <p className="text-[12px] leading-relaxed text-sky-800">
                All demo accounts use password <code className="rounded bg-white px-1 font-mono text-[11px]">demo123</code>.
                Sessions are simulated for this prototype.
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-[12.5px] text-neutral-500">
            <Link to="/" className="font-semibold text-brand-600 hover:underline">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
