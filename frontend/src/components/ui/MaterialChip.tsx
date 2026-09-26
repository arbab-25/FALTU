import { Cpu, CupSoda, Layers, Newspaper, Package, Tag, Wine, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  paper: Newspaper, cardboard: Package, plastic: CupSoda, metal: Wrench,
  glass: Wine, 'e-waste': Cpu, mixed: Layers, other: Tag,
};

const STYLES: Record<string, string> = {
  paper: 'bg-sky-50 text-sky-700 border-sky-200',
  cardboard: 'bg-amber-50 text-amber-700 border-amber-200',
  plastic: 'bg-violet-50 text-violet-700 border-violet-200',
  metal: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  glass: 'bg-teal-50 text-teal-700 border-teal-200',
  'e-waste': 'bg-red-50 text-red-600 border-red-200',
  mixed: 'bg-brand-50 text-brand-700 border-brand-200',
  other: 'bg-neutral-50 text-neutral-600 border-neutral-200',
};

export function materialIcon(category: string): LucideIcon {
  return ICONS[category] || Tag;
}

export default function MaterialChip({ category, name, size = 'md' }: {
  category: string;
  name?: string;
  size?: 'sm' | 'md';
}) {
  const Icon = materialIcon(category);
  return (
    <span className={`badge border ${STYLES[category] || STYLES.other} ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : ''}`}>
      <Icon size={size === 'sm' ? 11 : 13} />
      {name || category}
    </span>
  );
}
