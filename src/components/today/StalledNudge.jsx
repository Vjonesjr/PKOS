import React, { useEffect, useState } from "react";
import { format, addDays } from "date-fns";
import { AlarmClock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const day = (n) => format(addDays(new Date(), n), "yyyy-MM-dd");

/** Gentle nudge for overdue open tasks, with one-tap snooze / reschedule. */
export default function StalledNudge({ workspace, onChanged }) {
  const [tasks, setTasks] = useState([]);
  const load = () => base44.entities.Task.filter(
    { workspace, status: { $ne: "done" }, archived: { $ne: true }, due_date: { $lt: day(0) } },
    { sort: "due_date", limit: 3, fields: ["title", "due_date"] }
  ).then((p) => setTasks(p.items));
  useEffect(() => { load(); }, [workspace]);

  const move = async (t, n) => { await base44.entities.Task.update(t.id, { due_date: day(n) }); load(); onChanged?.(); };
  if (!tasks.length) return null;
  return (
    <section className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-amber-300"><AlarmClock className="h-3.5 w-3.5" />These slipped a little. No stress, pick a new day.</p>
      {tasks.map((t) => (
        <div key={t.id} className="flex flex-wrap items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{t.title}</span>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => move(t, 0)}>Today</Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => move(t, 1)}>Snooze 1d</Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => move(t, 7)}>Next week</Button>
        </div>
      ))}
    </section>
  );
}