import React, { useEffect, useState } from "react";
import ProgressRing from "@/components/home/ProgressRing";

/** Fire with: window.dispatchEvent(new CustomEvent("pkos:celebrate", { detail: { title, subtitle, progress, from, next } })) */
export function celebrate(detail) {
  window.dispatchEvent(new CustomEvent("pkos:celebrate", { detail }));
}

export default function Celebration() {
  const [d, setD] = useState(null);
  useEffect(() => {
    const on = (e) => setD(e.detail || {});
    const changed = e => { if(e.detail?.task?.status !== "done")setD(null); };
    window.addEventListener("pkos:celebrate", on);
    window.addEventListener("pkos:task-saved",changed);
    return () => {window.removeEventListener("pkos:celebrate", on);window.removeEventListener("pkos:task-saved",changed);};
  }, []);
  useEffect(() => { if (!d) return; const t = setTimeout(() => setD(null), 6500); return () => clearTimeout(t); }, [d]);
  if (!d) return null;
  const sparks = Array.from({ length: 14 }, (_, i) => i * (360 / 14));
  return (
    <div role="dialog" aria-label="Milestone complete" onClick={() => setD(null)}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-6 backdrop-blur-md pk-in" style={{ backgroundColor: "hsl(var(--background) / 0.85)" }}>
      <div className="w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <div className="relative mx-auto mb-4 h-36 w-36">
          {sparks.map((a, i) => (
            <span key={i} className="absolute left-1/2 top-1/2 h-2 w-2 -ml-1 -mt-1 rounded-full pk-grad"
              style={{ "--a": `${a}deg`, animation: `pk-burst 1.1s ${0.15 + (i % 3) * 0.06}s ease-out both` }} />
          ))}
          <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" style={{ animation: "pk-pop .6s cubic-bezier(.2,.8,.2,1) both", filter: "drop-shadow(0 0 18px hsl(var(--glow-1) / .8))" }}>
            <defs><linearGradient id="pkcheck" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(var(--glow-1))" /><stop offset="100%" stopColor="hsl(var(--glow-2))" /></linearGradient></defs>
            <path d="M16 34 L28 46 L50 20" fill="none" stroke="url(#pkcheck)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" style={{ animation: "pk-draw .6s .25s ease-out both" }} />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{d.title || "Milestone complete!"}</h2>
        {d.subtitle && <p className="mt-1 text-sm text-muted-foreground">{d.subtitle}</p>}
        {typeof d.progress === "number" && <div className="my-6 flex justify-center"><ProgressRing id="pkcelebring" value={d.progress} from={d.from ?? 0} size={150} /></div>}
        {d.next && (
          <div className="pk-glass mt-2 rounded-2xl p-4 text-left pk-in pk-in-4">
            <p className="text-xs text-muted-foreground">Next up</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{d.next}</p>
          </div>
        )}
        <button type="button" onClick={() => setD(null)} className="pk-grad pk-btn mt-6 h-12 w-full rounded-2xl font-semibold">Keep going</button>
      </div>
    </div>
  );
}

export function celebrateProgress(detail) {
  window.dispatchEvent(new CustomEvent('pkos:progress-celebration', {detail}));
}
