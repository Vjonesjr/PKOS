import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Plus, Repeat2, Pause, Play, CalendarClock, ListFilter } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { ensureRecurringOccurrences, recurringLabel, skipRecurringOccurrence, snoozeRecurringOccurrence } from "@/lib/recurringTasks";
import { updateTaskStatus, actionSaved } from "@/lib/taskStatus";
import TaskForm from "@/components/tasks/TaskForm";
import RecurringTaskForm from "@/components/tasks/RecurringTaskForm";
import { Button } from "@/components/ui/button";

import PagedTaskGroup from '@/components/queue/PagedTaskGroup';

const rows = (result) => Array.isArray(result) ? result : result?.items || [];
const localDateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const addDays = (date, count) => { const next = new Date(date); next.setDate(next.getDate() + count); return next; };
const VIEW_OPTIONS = [["cards", "Cards"], ["list", "List"], ["compact", "Compact"]];
const FILTER_OPTIONS = [["all", "All task groups"], ["today", "Today"], ["tomorrow", "Tomorrow"], ["upcoming", "Upcoming"], ["next", "Next / active"], ["waiting", "Waiting"], ["someday", "Someday"], ["repeating", "Repeating schedules"], ["completed", "Completed"]];

export default function Tasks() {
  const { workspace } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const scope = params.get("tab") || "all";
  const [view, setView] = useState(() => localStorage.getItem("pkos-task-view") === "grid" ? "cards" : localStorage.getItem("pkos-task-view") || "cards");
  const [tasks, setTasks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskOpen, setTaskOpen] = useState(params.get("new") === "task");
  const [repeatOpen, setRepeatOpen] = useState(params.get("new") === "repeat");
  const [editing, setEditing] = useState(null);

  const changeView = (value) => { setView(value); localStorage.setItem("pkos-task-view", value); };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await ensureRecurringOccurrences(workspace);
      const [taskRows, templateRows, projectRows] = await Promise.all([
        base44.entities.Task.filter({ workspace, archived: { $ne: true } }, { sort: "-updated_date", limit: 1000 }),
        base44.entities.RecurringTask.filter({ workspace }, { sort: "next_occurrence_at", limit: 500 }),
        base44.entities.Project.filter({ workspace }, { sort: "-updated_date", limit: 300 }),
      ]);
      const nextTemplates = rows(templateRows);
      setTasks(rows(taskRows));
      setTemplates(nextTemplates);
      setProjects(rows(projectRows));
      const edit = params.get("edit");
      if (edit) {
        const found = nextTemplates.find((template) => template.id === edit);
        if (found) { setEditing(found); setRepeatOpen(true); }
      }
    } catch (e) {
      setError(e.message || "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener("pkos:task-saved", refresh);
    window.addEventListener("pkos:recurring-changed", refresh);
    return () => {
      window.removeEventListener("pkos:task-saved", refresh);
      window.removeEventListener("pkos:recurring-changed", refresh);
    };
  }, [load]);

  const projectNames = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project.title])), [projects]);
  const today = localDateKey(new Date());
  const tomorrow = localDateKey(addDays(new Date(), 1));

  const topLevel = useMemo(() => tasks.filter((task) => !task.parent_task_id), [tasks]);
  const buckets = useMemo(() => {
    const active = topLevel.filter((task) => task.status !== "done");
    return {
      today: active.filter((task) => task.today_date === today || task.due_date === today),
      tomorrow: active.filter((task) => task.due_date === tomorrow),
      upcoming: active.filter((task) => task.due_date && task.due_date > tomorrow),
      next: active.filter((task) => task.status === "todo" || task.status === "in_progress"),
      waiting: active.filter((task) => task.status === "waiting"),
      someday: active.filter((task) => !task.due_date && !task.today_date && task.status !== "waiting"),
      completed: topLevel.filter((task) => task.status === "done"),
    };
  }, [topLevel, today, tomorrow]);

  const setScope = (value) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("tab"); else next.set("tab", value);
    next.delete("new");
    next.delete("edit");
    setParams(next, { replace: true });
  };

  const closeRepeat = (open) => {
    setRepeatOpen(open);
    if (!open) {
      setEditing(null);
      const next = new URLSearchParams(params);
      next.delete("edit"); next.delete("new");
      setParams(next, { replace: true });
    }
  };

  const rowClass = view === "compact"
    ? "px-3 py-2"
    : view === "list"
      ? "px-4 py-3"
      : "rounded-xl border border-border bg-card/50 p-4";

  const taskRow = (task) => (
    <div key={task.id} className={rowClass}>
      <div className={`flex ${view === "compact" ? "items-center" : "items-start"} gap-3`}>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {task.recurrence_template_id && <Repeat2 className="h-4 w-4 shrink-0 text-primary" />}
            <Link to={`/task-detail?id=${task.id}`} className={`min-w-0 break-words font-semibold hover:text-primary ${view === "compact" ? "text-sm leading-5" : ""} ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</Link>
          </div>
          <p className={`${view === "compact" ? "mt-0 text-[11px] leading-4" : "mt-1 text-xs"} text-muted-foreground`}>
            {task.project_id ? projectNames[task.project_id] || "Project-linked" : "Standalone"}
            {task.due_date ? ` · ${task.due_date}` : ""}
            {task.recurrence_template_id ? " · Repeating" : ""}
          </p>
        </div>
        <div className={`flex shrink-0 ${view === "compact" ? "gap-1" : "flex-wrap gap-2"} `}>
          {task.status !== "done" && <Button aria-label={`Complete ${task.title}`} size="sm" variant={view === "compact" ? "ghost" : "default"} className={view === "compact" ? "h-9 px-2" : ""} onClick={async () => { await updateTaskStatus(task, "done"); load(); }}><CheckCircle2 className="h-4 w-4" />{view !== "compact" && <span className="ml-1">Complete</span>}</Button>}
          {task.recurrence_template_id && task.status !== "done" && view !== "compact" && <>
            <Button size="sm" variant="outline" onClick={async () => { await snoozeRecurringOccurrence(task, 1); actionSaved("Snoozed one day."); load(); }}><CalendarClock className="mr-1 h-4 w-4" />+1 day</Button>
            <Button size="sm" variant="ghost" onClick={async () => { await skipRecurringOccurrence(task); actionSaved("Skipped this occurrence. The series continues."); load(); }}>Skip</Button>
          </>}
        </div>
      </div>
    </div>
  );

  const taskGroup = (title, subtitle, items) => (
    <PagedTaskGroup key={`${workspace}:${title}`} title={title} subtitle={subtitle} count={items.length} storageKey={`pkos-task-group:${workspace}:${title}`} defaultOpen={!['Upcoming','Someday','Repeating schedules'].includes(title)}>
      {limit => <div className={view === 'cards' ? 'space-y-2 p-3' : 'divide-y divide-border'}>{items.slice(0, limit).map(taskRow)}</div>}
    </PagedTaskGroup>
  );
  const repeatingGroup = () => (
    <PagedTaskGroup key={`${workspace}:repeating`} title="Repeating schedules" subtitle="Templates that create normal task occurrences." count={templates.length} storageKey={`pkos-task-group:${workspace}:Repeating schedules`} defaultOpen={scope === 'repeating'}>
      {limit => <div className={view === 'cards' ? 'space-y-2 p-3' : 'divide-y divide-border'}>{templates.slice(0, limit).map(template => (
        <div key={template.id} className={rowClass}>
          <div className="flex items-start gap-3">
            <Repeat2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <button className="break-words text-left font-semibold hover:text-primary" onClick={() => { setEditing(template); setRepeatOpen(true); }}>{template.title}</button>
              <p className={`${view === "compact" ? "text-[11px]" : "mt-1 text-xs"} text-muted-foreground`}>{recurringLabel(template)} · {template.time_of_day || "No time"}{template.project_id ? ` · ${projectNames[template.project_id] || "Project"}` : " · Standalone"}</p>
              {view !== "compact" && <p className="mt-1 text-xs text-muted-foreground">Next: {template.next_occurrence_at ? new Date(template.next_occurrence_at).toLocaleString() : "Not scheduled"}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" className={view === "compact" ? "h-9 px-2" : ""} onClick={async () => { await base44.entities.RecurringTask.update(template.id, { active: !template.active }); actionSaved(template.active ? "Repeating task paused." : "Repeating task resumed."); load(); }}>{template.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{view !== "compact" && <span className="ml-1">{template.active ? "Pause" : "Resume"}</span>}</Button>
              {view !== "compact" && <Button size="sm" onClick={() => { setEditing(template); setRepeatOpen(true); }}>Edit</Button>}
            </div>
          </div>
        </div>
      ))}</div>}
    </PagedTaskGroup>
  );

  const selectedGroup = scope === "today" ? ["Today", "Due or planned for today", buckets.today]
    : scope === "tomorrow" ? ["Tomorrow", "Due tomorrow", buckets.tomorrow]
    : scope === "upcoming" ? ["Upcoming", "After tomorrow", buckets.upcoming]
    : scope === "next" ? ["Next / active", "All active work", buckets.next]
    : scope === "waiting" ? ["Waiting", "Blocked or waiting on something", buckets.waiting]
    : scope === "someday" ? ["Someday", "No date assigned yet", buckets.someday]
    : scope === "completed" ? ["Completed", "Finished work", buckets.completed]
    : null;

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1><p className="mt-2 text-sm text-muted-foreground">One-time and repeating work, grouped so you can scan it quickly.</p></div>
      <div className="grid w-full grid-cols-2 gap-2 sm:w-auto"><Button variant="outline" onClick={() => { setEditing(null); setRepeatOpen(true); }} className="gap-2"><Repeat2 className="h-4 w-4" />Repeating</Button><Button onClick={() => setTaskOpen(true)} className="gap-2"><Plus className="h-4 w-4" />One-time</Button></div>
    </div>

    <section className="rounded-2xl border border-border bg-card/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><ListFilter className="h-4 w-4 text-primary" />Task display</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm"><span className="text-xs text-muted-foreground">Show</span><select value={scope} onChange={(e) => setScope(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3">{FILTER_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="space-y-1 text-sm"><span className="text-xs text-muted-foreground">View</span><select value={view} onChange={(e) => changeView(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3">{VIEW_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Compact uses thinner rows. Cards keeps more breathing room. Each group starts with five tasks.</p>
    </section>

    {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {loading ? <p className="text-sm text-muted-foreground">Loading tasks…</p> : scope === "repeating" ? repeatingGroup() : selectedGroup ? taskGroup(...selectedGroup) : <div className="space-y-4">
      {taskGroup("Today", "Due or planned for today", buckets.today)}
      {taskGroup("Tomorrow", "Due tomorrow", buckets.tomorrow)}
      {taskGroup("Upcoming", "After tomorrow", buckets.upcoming)}
      {taskGroup("Waiting", "Blocked or waiting on something", buckets.waiting)}
      {taskGroup("Someday", "No date assigned yet", buckets.someday)}
      {repeatingGroup()}
      {buckets.completed.length > 0 && <Link to="/tasks?tab=completed" className="flex min-h-12 items-center justify-between rounded-xl border border-border px-4 text-sm hover:text-primary"><span>Completed tasks</span><span>{buckets.completed.length}</span></Link>}
    </div>}

    <TaskForm open={taskOpen} onOpenChange={setTaskOpen} workspace={workspace} projects={projects} onSaved={load} />
    <RecurringTaskForm open={repeatOpen} onOpenChange={closeRepeat} workspace={workspace} projects={projects} template={editing} onSaved={load} />
  </div>;
}
