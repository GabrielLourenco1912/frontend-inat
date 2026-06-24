type HeroIllustrationProps = {
  className?: string;
};

export function HeroIllustration({ className }: HeroIllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 620 480"
      fill="none"
      role="img"
      aria-label="Ilustração de jovens conectados à aprendizagem profissional"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="620" height="480" rx="8" fill="#F8FAF9" />
      <path
        d="M88 345C125 279 181 244 256 239C331 234 365 181 418 149C471 117 542 139 564 198C586 257 544 333 481 366C418 399 333 389 271 396C209 403 124 411 88 345Z"
        fill="#E5F1EF"
      />
      <path
        d="M120 110H392C410 110 424 124 424 142V310C424 328 410 342 392 342H120C102 342 88 328 88 310V142C88 124 102 110 120 110Z"
        fill="white"
        stroke="#D9E5E2"
        strokeWidth="4"
      />
      <path
        d="M118 154H394"
        stroke="#D9E5E2"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="138" cy="134" r="8" fill="#088285" />
      <circle cx="164" cy="134" r="8" fill="#D16B36" />
      <circle cx="190" cy="134" r="8" fill="#203436" />
      <rect x="128" y="188" width="96" height="22" rx="11" fill="#203436" />
      <rect x="128" y="226" width="188" height="14" rx="7" fill="#D9E5E2" />
      <rect x="128" y="256" width="140" height="14" rx="7" fill="#E8EFED" />
      <rect x="128" y="286" width="174" height="14" rx="7" fill="#E8EFED" />
      <rect x="340" y="188" width="54" height="96" rx="8" fill="#E5F1EF" />
      <path
        d="M362 238L375 251L402 216"
        stroke="#088285"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M448 232C448 202 472 178 502 178C532 178 556 202 556 232V342H448V232Z"
        fill="#203436"
      />
      <circle cx="502" cy="166" r="37" fill="#F6C9A7" />
      <path
        d="M460 166C462 130 488 109 523 121C543 128 556 149 555 171C527 159 498 154 460 166Z"
        fill="#203436"
      />
      <path
        d="M470 347H534L548 424H456L470 347Z"
        fill="#088285"
      />
      <path
        d="M259 367C259 336 284 311 315 311C346 311 371 336 371 367V424H259V367Z"
        fill="#088285"
      />
      <circle cx="315" cy="299" r="34" fill="#F4B999" />
      <path
        d="M281 302C285 267 315 248 347 264C345 284 331 297 306 302C296 304 288 304 281 302Z"
        fill="#203436"
      />
      <path
        d="M206 382C206 355 228 333 255 333C282 333 304 355 304 382V424H206V382Z"
        fill="#D16B36"
      />
      <circle cx="255" cy="323" r="29" fill="#D89B7D" />
      <path
        d="M229 320C232 293 254 278 280 290C281 307 265 320 244 324C238 325 233 324 229 320Z"
        fill="#203436"
      />
      <path
        d="M406 92L448 70L490 92V140C490 168 471 193 448 200C425 193 406 168 406 140V92Z"
        fill="#E5F1EF"
        stroke="#088285"
        strokeWidth="4"
      />
      <path
        d="M431 133L445 147L468 116"
        stroke="#088285"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="105" cy="386" r="16" fill="#088285" opacity=".22" />
      <circle cx="545" cy="90" r="12" fill="#D16B36" opacity=".45" />
      <path
        d="M92 424H560"
        stroke="#D9E5E2"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
