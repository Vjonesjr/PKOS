import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Flame, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { updateTaskStatus } from "@/lib/taskStatus";
import ProgressRing from "@/components/home/ProgressRing";
import { celebrateProgress } from "@/components/shared/Celebration";

const day = (d) => (d ? String(d).slice(0, 10) : "");

function streakOf(tasks) {
  const days = new Set(tasks.filter((t) => t.status === "done").map((t) => day(t.completed_date || t.completed_at || t.updated_date)));
  let n = 0;
  const cur = new Date();
  if (!days.has(cur.toISOString().slice(0, 10))) cur.setDate(cur.getDate() - 1);
  while (days.has(cur.toISOString().slice(0, 10))) { n += 1; cur.setDate(cur.getDate() - 1); }
  return n;
}

/** Premium hero: greeting, Today's Focus ring + streak, stat pills, airy task list, gradient Capture. */
export default function HomeHero({ data, workspace, onChanged }) {
  const [user, setUser] = useState(null);
  const [goalCount, setGoalCount] = useState(null);
  const [pending, setPending] = useState("");
  const [recent, setRecent] = useState(null);
  const [tasks, setTasks] = useState(data.tasks);
  useEffect(() => setTasks(data.tasks), [data.tasks]);
  useEffect(() => {const saved=e=>{const t=e.detail?.task;if(t?.workspace===workspace&&t.status!=="done")setRecent(previous=>previous?.task.id===t.id?null:previous);};window.addEventListener("pkos:task-saved",saved);return()=>window.removeEventListener("pkos:task-saved",saved);},[workspace]);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  useEffect(() => {
    base44.entities.Goal.filter({ workspace, status: "Active" }, "-updated_date", 50).then((g) => setGoalCount((g?.items || g || []).length)).catch(() => setGoalCount(0));
  }, [workspace]);

  const active = data.projects.filter((p) => p.status === "Active");
  const focus = useMemo(() => {
    const scored = active.map((p) => {
      const pt = tasks.filter((t) => t.project_id === p.id);
      return { p, total: pt.length, done: pt.filter((t) => t.status === "done").length };
    }).filter((x) => x.total > 0).sort((a, b) => (b.done / b.total) - (a.done / a.total));
    return scored.find((x) => x.done < x.total) || scored[0] || null;
  }, [active, tasks]);
  const open = tasks.filter((t) => t.status !== "done");
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = open.filter((t) => t.due_date && t.due_date <= today).length;
  const rank = { high: 0, medium: 1, low: 2 };
  const list = [...open].sort((a, b) => (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1)).slice(0, 5);
  const streak = streakOf(tasks);
  const pct = focus ? Math.round((focus.done / focus.total) * 100) : 0;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = (user?.full_name || "").split(" ")[0];

  const complete = async (t) => {
    if (pending) return;
    const before = focus;
    setPending(t.id);
    try {
      const saved = await updateTaskStatus(t,"done");
      if (!saved) return;
      setTasks(ts=>ts.map(x=>x.id===t.id?saved:x));
      setRecent({task:saved, previousStatus:t.status||"todo"});
      if (before && t.project_id === before.p.id) {
        const from = Math.round((before.done / before.total) * 100), to = Math.round(((before.done + 1) / before.total) * 100);
        const nextTask = open.find(x=>x.id!==t.id);
        if (to >= 100 || Math.floor(to / 25) > Math.floor(from / 25)) celebrateProgress({title:to>=100?"Project complete!":"Milestone reached!",subtitle:before.p.title,progress:to,from,next:nextTask?.title||"Pick your next focus"});
      }
      onChanged?.();
    } finally { setPending(""); }
  };

  return (
    <section className="space-y-5">
      <h1 className="pk-in text-[2rem] font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
        {greet}{first ? "," : ""}<br className="sm:hidden" /> {first && <span className="pk-grad-text">{first}</span>}
      </h1>

      <div className="pk-glass pk-hero pk-in pk-in-2 rounded-3xl p-5">
        <div className="flex items-center gap-5">
          <ProgressRing value={pct} label="Today's focus" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Today's Focus</p>
            {focus ? (
              <Link to={`/project-detail?id=${focus.p.id}`} className="mt-1 block text-lg font-semibold leading-snug text-foreground line-clamp-3 hover:opacity-90">{focus.p.title}</Link>
            ) : (
              <p className="mt-1 text-lg font-semibold text-foreground">Set an active project</p>
            )}
            {focus && <p className="mt-1 text-xs text-muted-foreground">{focus.done} of {focus.total} tasks done</p>}
            <span className="pk-pill mt-3 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-foreground">
              <Flame className="h-3.5 w-3.5 text-orange-400" /> {streak}-day streak
            </span>
          </div>
        </div>
      </div>

      <div className="pk-in pk-in-3 grid grid-cols-3 gap-2">
        {[["Goals", goalCount ?? "–", "/goals"], ["Projects", active.length, "/projects"], ["Tasks", dueToday ? `${dueToday} today` : open.length, "/today"]].map(([l, v, to]) => (
          <Link key={l} to={to} className="pk-pill rounded-2xl px-3 py-2.5 text-center transition-colors hover:bg-primary/10">
            <p className="text-[11px] text-muted-foreground">{l}</p>
            <p className="text-lg font-bold text-foreground">{v}</p>
          </Link>
        ))}
      </div>

      {list.length > 0 && (
        <ul className="pk-in pk-in-4 divide-y divide-foreground/5">
          {list.map((t) => (
            <li key={t.id} className="flex items-center gap-4 py-3.5">
              <button type="button" aria-label={`Complete ${t.title}`} aria-busy={pending === t.id} disabled={!!pending} onClick={() => complete(t)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-primary/60 text-primary transition active:scale-90 active:bg-primary active:text-primary-foreground pk-feedback-high">
                {pending === t.id && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
              </button>
              <Link to={`/task-detail?id=${t.id}`} className="min-w-0 flex-1 whitespace-normal break-words text-base font-medium leading-6 text-foreground hover:text-foreground">{t.title}</Link>
            </li>
          ))}
        </ul>
      )}

      {recent && <div className="rounded-xl border border-primary/40 bg-primary/10 p-4"><p role="status" className="flex items-center gap-2 text-sm font-semibold text-primary"><Check className="h-4 w-4"/>Completed</p><p className="mt-1 break-words text-sm text-muted-foreground line-through">{recent.task.title}</p><div className="mt-3 flex flex-wrap gap-4 text-sm"><button className="font-semibold text-primary underline" onClick={async()=>{const saved=await updateTaskStatus(recent.task,recent.previousStatus);if(saved){setRecent(null);onChanged?.();}}}>Undo</button><Link to="/completed" className="text-primary underline">View completed tasks</Link></div></div>}
      <Link to="/capture" className="pk-grad pk-btn flex h-14 items-center justify-center gap-2 rounded-2xl text-base font-semibold">
        <Plus className="h-5 w-5" /> Capture
      </Link>
    </section>
  );
}
