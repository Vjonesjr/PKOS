import React from "react";
import { format, parseISO, startOfWeek } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import Widget from "@/components/dashboard/Widget";

/** Merge done/created buckets into chart rows keyed by bucket date. */
// Daily rows come in; for week view, fold each day into its Monday.
const bucketKey = (d, unit) => {
  const day = String(d).slice(0, 10);
  return unit === "day" ? day : format(startOfWeek(parseISO(day), { weekStartsOn: 1 }), "yyyy-MM-dd");
};

function merge(done = [], created = [], unit) {
  const map = {};
  const add = (d, field, n) => { if (!d) return; const k = bucketKey(d, unit); (map[k] ??= { key: k, done: 0, created: 0 })[field] += n; };
  done.forEach((r) => add(r.completed_date, "done", r.count));
  created.forEach((r) => add(r.created_date, "created", r.count));
  return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
}

export default function TaskCompletionWidget({ done, created, unit }) {
  const rows = merge(done, created, unit).map((r) => ({ ...r, label: format(parseISO(r.key), unit === "day" ? "EEE" : "MMM d") }));
  const totalDone = rows.reduce((a, r) => a + r.done, 0);
  const totalCreated = rows.reduce((a, r) => a + r.created, 0);

  return (
    <Widget title="Tasks" icon={CheckCircle2}>
      {!done ? <p className="text-xs text-muted-foreground">Loading...</p> : (
        <>
          <p className="text-2xl font-semibold text-foreground">{totalDone}<span className="ml-1 text-xs font-normal text-muted-foreground">done · {totalCreated} added</span></p>
          {rows.length > 0 && (
            <div className="mt-2 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Bar dataKey="created" fill="hsl(var(--muted-foreground) / 0.35)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="done" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </Widget>
  );
}