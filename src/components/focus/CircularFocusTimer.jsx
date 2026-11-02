import { useMemo } from "react";

/**
 * Circular segmented Focus timer.
 * Visual progress ring + optional break markers.
 * Styled for Smart PKOS dark + mint theme.
 */
export default function CircularFocusTimer({
  totalSeconds = 25 * 60,
  remainingSeconds = 25 * 60,
  breaks = [],
  status = "idle",
  size = 280,
}) {
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds)) : 0;
  const elapsed = 1 - progress;

  const radius = size / 2 - 18;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - elapsed);

  const breakMarkers = useMemo(() => {
    return breaks
      .filter((b) => b.at > 0 && b.at < totalSeconds)
      .map((b) => {
        const angle = (b.at / totalSeconds) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const x = size / 2 + radius * Math.cos(rad);
        const y = size / 2 + radius * Math.sin(rad);
        return { ...b, x, y };
      });
  }, [breaks, totalSeconds, size, radius]);

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-muted/40"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          className="text-primary transition-all duration-300"
        />
        {/* Break markers */}
        {breakMarkers.map((b, i) => (
          <circle
            key={i}
            cx={b.x}
            cy={b.y}
            r="6"
            className="fill-amber-400 stroke-background stroke-2"
          />
        ))}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground">
          {mm}:{ss}
        </span>
        <span className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          {status === "running" ? "Focus" : status === "paused" ? "Paused" : "Ready"}
        </span>
      </div>
    </div>
  );
}
