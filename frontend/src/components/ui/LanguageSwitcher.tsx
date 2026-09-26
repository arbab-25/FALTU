import { Languages } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import type { Lang } from '@/context/LanguageContext';

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'hi', label: 'हिं' },
  { value: 'gu', label: 'ગુ' },
];

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Select language">
      {!compact && <Languages size={15} className="text-neutral-400" />}
      <div className="flex overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {OPTIONS.map((o) => (
          <button key={o.value} type="button" onClick={() => setLang(o.value)}
            aria-pressed={lang === o.value}
            className={`px-2 py-1 text-[11.5px] font-bold transition
              ${lang === o.value ? 'bg-brand-600 text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
