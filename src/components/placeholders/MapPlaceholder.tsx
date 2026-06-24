type MapPlaceholderProps = {
  className?: string;
};

export function MapPlaceholder({ className }: MapPlaceholderProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 680 360"
      fill="none"
      role="img"
      aria-label="Placeholder de mapa da localização do INAT Paranaguá"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="680" height="360" rx="8" fill="#F8FAF9" />
      <path
        d="M0 88L152 42L314 88L500 46L680 92V360H0V88Z"
        fill="#E5F1EF"
      />
      <path
        d="M152 42V360"
        stroke="#D9E5E2"
        strokeWidth="4"
        strokeDasharray="10 12"
      />
      <path
        d="M314 88V360"
        stroke="#D9E5E2"
        strokeWidth="4"
        strokeDasharray="10 12"
      />
      <path
        d="M500 46V360"
        stroke="#D9E5E2"
        strokeWidth="4"
        strokeDasharray="10 12"
      />
      <path
        d="M72 282C161 221 231 219 313 268C403 322 501 294 604 226"
        stroke="#088285"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M92 156C184 190 264 165 340 132C429 94 516 121 592 170"
        stroke="#D16B36"
        strokeWidth="10"
        strokeLinecap="round"
        opacity=".9"
      />
      <path
        d="M342 72C304 72 274 102 274 140C274 194 342 250 342 250C342 250 410 194 410 140C410 102 380 72 342 72Z"
        fill="#203436"
      />
      <circle cx="342" cy="140" r="25" fill="#F8FAF9" />
      <rect x="236" y="272" width="212" height="42" rx="21" fill="white" />
      <rect x="264" y="287" width="156" height="12" rx="6" fill="#6E7574" />
    </svg>
  );
}
