import React from "react";

/** Distinct neon-green Smart PKOS mark: interlocking nodes + glow. */
export default function Logo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pkLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(120 100% 55%)" />
          <stop offset="100%" stopColor="hsl(90 100% 45%)" />
        </linearGradient>
        <filter id="pkLogoGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Outer ring */}
      <circle cx="32" cy="32" r="28" fill="none" stroke="url(#pkLogoGrad)" strokeWidth="2.5" filter="url(#pkLogoGlow)" opacity="0.9" />
      {/* Inner nodes */}
      <circle cx="32" cy="18" r="4.5" fill="url(#pkLogoGrad)" filter="url(#pkLogoGlow)" />
      <circle cx="20" cy="38" r="4.5" fill="url(#pkLogoGrad)" filter="url(#pkLogoGlow)" />
      <circle cx="44" cy="38" r="4.5" fill="url(#pkLogoGrad)" filter="url(#pkLogoGlow)" />
      {/* Connecting lines */}
      <path d="M32 22.5 L22 34 M32 22.5 L42 34 M22 38 L42 38" fill="none" stroke="url(#pkLogoGrad)" strokeWidth="2" strokeLinecap="round" filter="url(#pkLogoGlow)" />
    </svg>
  );
}
