type AboutImagePlaceholderProps = {
  className?: string;
};

export function AboutImagePlaceholder({
  className,
}: AboutImagePlaceholderProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 560 420"
      fill="none"
      role="img"
      aria-label="Espaço reservado para imagem institucional do INAT"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="560" height="420" rx="8" fill="#F8FAF9" />
      <rect x="48" y="54" width="464" height="312" rx="8" fill="white" />
      <path
        d="M82 320L190 210L266 286L326 226L478 320"
        stroke="#D9E5E2"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="406" cy="132" r="42" fill="#D16B36" opacity=".7" />
      <rect x="96" y="86" width="158" height="24" rx="12" fill="#203436" />
      <rect x="96" y="128" width="214" height="14" rx="7" fill="#D9E5E2" />
      <rect x="96" y="158" width="184" height="14" rx="7" fill="#E8EFED" />
      <path
        d="M404 248C404 222 425 201 451 201C477 201 498 222 498 248V322H404V248Z"
        fill="#088285"
      />
      <circle cx="451" cy="190" r="30" fill="#F4B999" />
      <path
        d="M421 190C426 162 449 149 475 160C474 179 456 190 433 194C428 195 424 193 421 190Z"
        fill="#203436"
      />
      <path
        d="M320 274C320 251 339 232 362 232C385 232 404 251 404 274V322H320V274Z"
        fill="#088285"
      />
      <circle cx="362" cy="223" r="26" fill="#D89B7D" />
      <path
        d="M338 221C341 198 361 185 384 196C384 212 370 223 351 226C346 227 342 225 338 221Z"
        fill="#203436"
      />
      <path
        d="M62 360L498 360"
        stroke="#D9E5E2"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text
        x="280"
        y="392"
        textAnchor="middle"
        fill="#6E7574"
        fontSize="16"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        Espaço para imagem institucional
      </text>
    </svg>
  );
}
