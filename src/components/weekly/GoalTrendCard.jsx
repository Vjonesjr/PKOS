import React from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Progress } from "@/components/ui/progress";
import { goalProgress } from "@/lib/goals";
import useGoalActivity from "@/hooks/useGoalActivity";

/** Completion % plus an 8-week trend: tasks finished (bars) and habit consistency % (line). */
export default function GoalTrendCard({ goal, projects, trend }) {
  const activity = useGoalActivity(goal, projects);
  const pct = goalProgress(goal, projects, activity);
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card/60 p-4">
      <div className="flex justify-between gap-2 text-sm">
        <span className="min-w-0 truncate font-medium text-foreground">{goal.title}</span>
        <span className="shrink-0 text-primary">{pct}%</span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trend} margin={{ top: 6, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
            <YAxis yAxisId="t" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
            <YAxis yAxisId="h" orientation="right" domain={[0, 100]} hide />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
            <Bar yAxisId="t" dataKey="tasks" name="Tasks done" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            <Line yAxisId="h" dataKey="habits" name="Habit consistency %" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-muted-foreground">Bars: tasks done per week · Line: habit consistency %</p>
    </div>
  );
}