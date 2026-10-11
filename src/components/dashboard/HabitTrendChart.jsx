import React from "react";
import { Link } from "react-router-dom";
import { Repeat } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Widget from "@/components/dashboard/Widget";

const tip = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

export default function HabitTrendChart({ data }) {
  const rated = data?.points.filter((p) => p.rate !== null) || [];
  const avg = rated.length ? Math.round(rated.reduce((a, p) => a + p.rate, 0) / rated.length) : 0;
  return (
    <Widget title="Habit completion" icon={Repeat}>
      {!data ? <div className="h-44 animate-pulse rounded-lg bg-secondary/40" /> : !data.habitCount ? (
        <Link to="/goals?tab=habits" className="block rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Add a habit to start your trend →</Link>
      ) : (
        <>
          <p className="text-2xl font-semibold text-foreground">{avg}%<span className="ml-1.5 text-xs font-normal text-muted-foreground">average in this window</span></p>
          <div className="mt-2 h-40">
            <ResponsiveContainer>
              <AreaChart data={data.points} margin={{ left: -24, right: 4, top: 6 }}>
                <defs><linearGradient id="hab" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} formatter={(v) => [`${v}%`, "Completed"]} />
                <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#hab)" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Widget>
  );
}