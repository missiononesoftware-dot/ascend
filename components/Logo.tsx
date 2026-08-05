// Ascend mark: two figures climbing, the upper reaching down to clasp the
// lower's forearm; the peak forms a capital "A". Minimal geometric line art.
export default function Logo({ size = 40, withWord = false }: { size?: number; withWord?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Ascend logo">
        {/* peak forming the A */}
        <path d="M8 54 L32 10 L56 54" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* crossbar of the A / ledge */}
        <path d="M20 40 L44 40" stroke="var(--accent)" strokeWidth="3.2" strokeLinecap="round" opacity="0.55" />
        {/* upper figure (head + reaching arm down) */}
        <circle cx="35.5" cy="24" r="3.4" stroke="currentColor" strokeWidth="2.6" />
        <path d="M34 29 L30 37" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        {/* lower figure (head + arm reaching up) */}
        <circle cx="24.5" cy="44.5" r="3.4" stroke="currentColor" strokeWidth="2.6" />
        <path d="M26.5 41 L30 37" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        {/* clasp point */}
        <circle cx="30" cy="37" r="2" fill="var(--accent)" />
      </svg>
      {withWord && <span className="text-xl font-semibold tracking-wide">Ascend</span>}
    </span>
  );
}
