import React, { useEffect, useState } from "react";

/** Glowing gradient progress ring. Animates from 0 (or `from`) to `value` on mount. */
export default function ProgressRing({ value = 0, from = 0, size = 132, stroke = 11, label, id = "pkring" }) {
  const [shown, setShown] = useState(from);
  useEffect(() => { const t = setTimeout(() => setShown(Math.max(0, Math.min(100, value))), 60); return () => clearTimeout(t); }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="pk-ring-glow -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--glow-1))" />
            <stop offset="100%" stopColor="hsl(var(--glow-2))" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--foreground) / 0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tight text-foreground">{Math.round(shown)}<span className="text-lg font-semibold">%</span></span>
        {label && <span className="text-[11px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
