export function VsrLogoMark() {
  return (
    <svg
      className="vsr-logo-glyph"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M42 8.5a22 22 0 1 0 0 39"
        className="vsr-logo-crescent"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M38.5 14.5a16.5 16.5 0 1 0 0 27"
        className="vsr-logo-inner-arc"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="m14 19 8.5 20L31 19"
        className="vsr-logo-v"
        strokeWidth="4.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m22.5 39 10.2-10.2h5.1"
        className="vsr-logo-rise"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
