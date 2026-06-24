type SocialIconProps = {
  label: string;
  className?: string;
};

export function SocialIcon({ label, className }: SocialIconProps) {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes("instagram")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="4.5"
          stroke="currentColor"
          strokeWidth="1.9"
        />
        <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="16.9" cy="7.1" r="1.1" fill="currentColor" />
      </svg>
    );
  }

  if (normalizedLabel.includes("facebook")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14.2 8.2H16V5.3C15.7 5.3 14.8 5.2 13.8 5.2C11.6 5.2 10.1 6.5 10.1 9V11H7.7V14.2H10.1V21H13.3V14.2H15.8L16.2 11H13.3V9.3C13.3 8.5 13.5 8.2 14.2 8.2Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.7 9.3H3.8V20H6.7V9.3Z"
        fill="currentColor"
      />
      <path
        d="M5.3 4C4.3 4 3.6 4.7 3.6 5.6C3.6 6.5 4.3 7.2 5.3 7.2C6.3 7.2 7 6.5 7 5.6C7 4.7 6.3 4 5.3 4Z"
        fill="currentColor"
      />
      <path
        d="M15.8 9.1C14.2 9.1 13.3 10 12.9 10.7V9.3H10V20H12.9V14C12.9 12.4 13.8 11.7 14.9 11.7C16 11.7 16.7 12.5 16.7 14V20H19.6V13.6C19.6 10.6 18 9.1 15.8 9.1Z"
        fill="currentColor"
      />
    </svg>
  );
}
