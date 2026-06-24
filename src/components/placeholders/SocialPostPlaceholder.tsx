type SocialPostPlaceholderProps = {
  title: string;
  className?: string;
  revealDirection?: "left" | "right" | "up";
};

export function SocialPostPlaceholder({
  title,
  className,
  revealDirection,
}: SocialPostPlaceholderProps) {
  return (
    <article
      className={`card-simple overflow-hidden ${className ?? ""}`}
      data-reveal={revealDirection}
    >
      <svg
        viewBox="0 0 360 260"
        fill="none"
        role="img"
        aria-label={`Placeholder de publicação para ${title}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="360" height="260" fill="#F8FAF9" />
        <rect x="28" y="28" width="304" height="204" rx="22" fill="white" />
        <rect x="52" y="54" width="70" height="12" rx="6" fill="#203436" />
        <rect x="52" y="84" width="142" height="10" rx="5" fill="#D9E5E2" />
        <rect x="52" y="106" width="112" height="10" rx="5" fill="#E8EFED" />
        <circle cx="256" cy="94" r="38" fill="#E5F1EF" />
        <path
          d="M230 171L274 128L312 171"
          stroke="#088285"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M52 190H184"
          stroke="#D16B36"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M52 218H282"
          stroke="#D9E5E2"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-[var(--inat-primary)]">
          {title}
        </p>
        <p className="section-copy mt-1 text-sm">
          Espaço reservado para conteúdo oficial.
        </p>
      </div>
    </article>
  );
}
