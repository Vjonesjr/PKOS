import React, { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Simple countdown for /focus and /sprint. Plays a short beep when finished. */
export default function FocusTimer({ minutes, label }) {
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (left <= 0) {
      setRunning(false);
      const ctx = new AudioContext(); const o = ctx.createOscillator(); o.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.3);
      return;
    }
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [running, left]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Focus · {minutes}m</p>
        <p className="truncate text-sm text-foreground">{label || "Pick one next action"}</p>
      </div>
      <span className="font-mono text-lg tabular-nums text-primary">{mm}:{ss}</span>
      <Button size="icon" variant="ghost" onClick={() => setRunning(!running)} aria-label={running ? "Pause" : "Start"}>{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
      <Button size="icon" variant="ghost" onClick={() => { setRunning(false); setLeft(minutes * 60); }} aria-label="Reset timer"><RotateCcw className="h-4 w-4" /></Button>
    </div>
  );
}