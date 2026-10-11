import React from "react";
import { TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Widget from "@/components/dashboard/Widget";

const tip = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

export default function MomentumChart({ data }) {
  const total = data?.points.reduce((a, p) => a + p.completed, 0) || 0;
  return (
    <Widget title="Project momentum" icon={TrendingUp}>
      {!data ? <div className="h-44 animate-pulse rounded-lg bg-secondary/40" /> : (
        <div className="grid gap-4 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <p className="text-2xl font-semibold text-foreground">{total}<span className="ml-1.5 text-xs font-normal text-muted-foreground">tasks completed</span></p>
            <div className="mt-2 h-40">
              <ResponsiveContainer>
                <BarChart data={data.points} margin={{ left: -24, right: 4, top: 6 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tip} cursor={{ fill: "hsl(var(--secondary))" }} formatter={(v) => [v, "Completed"]} />
                  <Bar dataKey="completed" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="sm:col-span-2 space-y-2.5">
            <p className="text-xs text-muted-foreground">Active projects · <span className="text-foreground">{data.avgProgress}% avg progress</span></p>
            {data.projects.length ? data.projects.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between text-xs"><span className="truncate text-foreground/90">{p.title}</span><span className="text-muted-foreground">{p.progress || 0}%</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${p.progress || 0}%` }} /></div>
              </div>
            )) : <p className="text-xs text-muted-foreground">Set a project to Active to track it here.</p>}
          </div>
        </div>
      )}
    </Widget>
  );
}