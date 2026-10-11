import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Weekly check-in progress history for one goal.
export default function CheckinChart({ checkins }) {
  if (!checkins.length) return <p className="text-[11px] text-muted-foreground">No weekly check-ins yet.</p>;
  const data = [...checkins].sort((a, b) => a.week_start.localeCompare(b.week_start))
    .map((c) => ({ week: c.week_start.slice(5), progress: c.progress_snapshot || 0 }));
  return (
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v) => [`${v}%`, "Progress"]} />
          <Line type="monotone" dataKey="progress" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}