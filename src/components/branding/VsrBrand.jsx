import { useId } from "react";

export function VsrLogoMark() {
  const gradientId = useId();

  return (
    <svg
      className="vsr-logo-glyph block h-[84%] w-[84%] overflow-visible"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${gradientId}-front`} x1="13" y1="9" x2="43" y2="47" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF4FB" />
          <stop offset=".48" stopColor="#F4B1D0" />
          <stop offset="1" stopColor="#AD75EA" />
        </linearGradient>
        <linearGradient id={`${gradientId}-side`} x1="18" y1="13" x2="47" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A54C9E" />
          <stop offset="1" stopColor="#493483" />
        </linearGradient>
      </defs>
      <path d="m15 15 9 23 9-23h5l-12 30h-5L9 15h6Z" fill={`url(#${gradientId}-side)`} transform="translate(2 2)" />
      <path d="M32 15h8a9 9 0 0 1 3.8 17.2L50 45h-6l-5.3-11H37v11h-5V15Zm5 5v9h3a4.5 4.5 0 0 0 0-9h-3Z" fill={`url(#${gradientId}-side)`} transform="translate(2 2)" />
      <path d="m13 13 9 23 9-23h5L24 43h-5L7 13h6Z" fill={`url(#${gradientId}-front)`} />
      <path d="M30 13h8a9 9 0 0 1 3.8 17.2L48 43h-6l-5.3-11H35v11h-5V13Zm5 5v9h3a4.5 4.5 0 0 0 0-9h-3Z" fill={`url(#${gradientId}-front)`} />
    </svg>
  );
}

export function VsrWordmark({ className }) {
  return (
    <span className={className} role="img" aria-label="VSR">
      <span className="vsr-wordmark-v" aria-hidden="true">V</span>
      <span className="vsr-wordmark-s" aria-hidden="true">S</span>
      <span className="vsr-wordmark-r" aria-hidden="true">R</span>
      <i aria-hidden="true" />
    </span>
  );
}
