export default function SectionTitle({
  kicker, title, description, align = 'center',
}: {
  kicker?: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={`mb-10 max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      {kicker && (
        <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-brand-600">{kicker}</p>
      )}
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[32px] md:leading-tight">{title}</h2>
      {description && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{description}</p>}
    </div>
  );
}
