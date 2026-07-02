/**
 * Certified lot seal — signature motif for hero and trust sections.
 */
export function LotSeal({ className = '', label }) {
  return (
    <svg
      className={['pub-seal', className].filter(Boolean).join(' ')}
      viewBox="0 0 120 120"
      role="img"
      aria-label={label}
    >
      <circle cx="60" cy="60" r="54" className="pub-seal__ring" />
      <circle cx="60" cy="60" r="44" className="pub-seal__inner" />
      <path
        className="pub-seal__star"
        d="M60 28 L66 48 L88 48 L70 60 L76 80 L60 68 L44 80 L50 60 L32 48 L54 48 Z"
      />
      <text x="60" y="98" className="pub-seal__text" textAnchor="middle">
        CPO
      </text>
    </svg>
  );
}

export default LotSeal;
