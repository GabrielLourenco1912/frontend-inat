type DashboardIllustrationProps = {
  className?: string;
};

export function DashboardIllustration({ className }: DashboardIllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 560 420"
      fill="none"
      role="img"
      aria-label="Ilustração de painel administrativo do sistema interno"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="560" height="420" rx="8" fill="#203436" />
      <rect x="44" y="54" width="472" height="312" rx="8" fill="#F8FAF9" />
      <rect x="72" y="82" width="94" height="256" rx="8" fill="#E5F1EF" />
      <rect x="94" y="112" width="48" height="10" rx="5" fill="#203436" />
      <rect x="94" y="152" width="50" height="10" rx="5" fill="#9DB3AF" />
      <rect x="94" y="186" width="42" height="10" rx="5" fill="#9DB3AF" />
      <rect x="94" y="220" width="54" height="10" rx="5" fill="#9DB3AF" />
      <rect x="94" y="254" width="38" height="10" rx="5" fill="#9DB3AF" />
      <rect x="190" y="84" width="290" height="54" rx="8" fill="white" />
      <rect x="214" y="106" width="116" height="12" rx="6" fill="#203436" />
      <rect x="190" y="158" width="132" height="82" rx="8" fill="#E5F1EF" />
      <rect x="344" y="158" width="136" height="82" rx="8" fill="#F7E7DE" />
      <rect x="214" y="186" width="58" height="12" rx="6" fill="#088285" />
      <rect x="214" y="210" width="82" height="10" rx="5" fill="#A7D0CC" />
      <rect x="368" y="186" width="58" height="12" rx="6" fill="#D16B36" />
      <rect x="368" y="210" width="82" height="10" rx="5" fill="#E6B49A" />
      <rect x="190" y="262" width="290" height="76" rx="8" fill="white" />
      <path
        d="M222 316V292"
        stroke="#088285"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M262 316V282"
        stroke="#203436"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M302 316V300"
        stroke="#D16B36"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M342 316V276"
        stroke="#088285"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <rect x="390" y="286" width="54" height="10" rx="5" fill="#D9E5E2" />
      <rect x="390" y="310" width="42" height="10" rx="5" fill="#E8EFED" />
      <circle cx="464" cy="88" r="42" fill="#088285" />
      <path
        d="M448 88L459 99L481 72"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
