import React, { useEffect, useState } from "react";
import { TREND_RANGES, loadHabitTrend, loadMomentum } from "@/lib/trends";
import HabitTrendChart from "@/components/dashboard/HabitTrendChart";
import MomentumChart from "@/components/dashboard/MomentumChart";

export default function TrendsSection({ workspace }) {
  const [range, setRange] = useState(TREND_RANGES[1]);
  const [habits, setHabits] = useState(null);
  const [momentum, setMomentum] = useState(null);

  useEffect(() => {
    let live = true;
    setHabits(null); setMomentum(null);
    loadHabitTrend(workspace, range).then((d) => live && setHabits(d));
    loadMomentum(workspace, range).then((d) => live && setMomentum(d));
    return () => { live = false; };
  }, [workspace, range]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Trends</p>
        <div className="flex rounded-lg border border-border p-0.5">
          {TREND_RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r)} className={`rounded-md px-2.5 py-1 text-xs transition-colors ${range.key === r.key ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>{r.label}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div className="lg:col-span-2"><HabitTrendChart data={habits} /></div>
        <div className="lg:col-span-3"><MomentumChart data={momentum} /></div>
      </div>
    </section>
  );
}