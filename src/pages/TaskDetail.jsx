import SupportPlan from "@/components/support/SupportPlan";
import usePageBack from "@/hooks/usePageBack";
import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Archive, ArchiveRestore, CalendarDays, Trash2, Repeat2 } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { taskStatusPatch, spawnNextIfRecurring, RECURRENCES, taskSaved, actionSaved } from "@/lib/taskStatus";
import { advanceRecurringOccurrence, skipRecurringOccurrence, snoozeRecurringOccurrence, recurringLabel } from "@/lib/recurringTasks";
import { useWorkspace } from "@/lib/WorkspaceContext";
import TaskSubtasks from "@/components/tasks/TaskSubtasks";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = [
  ["todo", "To Do"],
  ["in_progress", "In Progress"],
  ["done", "Done"],
];

const PRIORITIES = [
  ["low", "Low"],
  ["medium", "Medium"],
  ["high", "High"],
];

export default function TaskDetail() {
  const goBack = usePageBack();
  const { workspace } = useWorkspace();
  const id = new URLSearchParams(window.location.search).get("id");
  const [task, setTask] = useState(null);
  const [form, setForm] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sourceCapture, setSourceCapture] = useState(null);
  const [recurringTemplate, setRecurringTemplate] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      return;
    }
    const t = await base44.entities.Task.get(id).catch(() => null);
    if (!t || t.workspace !== workspace) {
      setTask(null);
      setForm(null);
      setSourceCapture(null);
      setNotFound(true);
      return;
    }

    const projectRows = await base44.entities.Project.filter({ workspace }, "-updated_date", 200);
    let capture = null;
    let repeatTemplate = null;
    if (t.recurrence_template_id) {
      const candidate = await base44.entities.RecurringTask.get(t.recurrence_template_id).catch(() => null);
      if (candidate?.workspace === workspace) repeatTemplate = candidate;
    }
    if (t.source_capture_id) {
      const candidate = await base44.entities.Capture.get(t.source_capture_id).catch(() => null);
      if (candidate?.workspace === workspace) capture = candidate;
    }

    setNotFound(false);
    setTask(t);
    setProjects(projectRows);
    setSourceCapture(capture);
    setRecurringTemplate(repeatTemplate);
    setForm({
      title: t.title || "",
      description: t.description || "",
      status: t.status || "todo",
      priority: t.priority || "medium",
      due_date: t.due_date || "",
      scheduled_time: t.scheduled_time || "",
      project_id: t.project_id || "",
      recurrence: t.recurrence || "none",
    });
  }, [id, workspace]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form?.title.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await base44.entities.Task.update(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        ...taskStatusPatch(task, form.status),
        priority: form.priority,
        due_date: form.due_date || null,
        scheduled_time: form.scheduled_time || null,
        ...((task.scheduled_time || form.scheduled_time) ? { today_date: form.due_date || null } : {}),
        project_id: form.project_id || null,
        recurrence: task.recurrence_template_id ? (task.recurrence || "none") : form.recurrence,
      });
      if (task.status !== form.status) taskSaved({...task,...form,...updated,workspace},task.status);
      else actionSaved("Task changes saved");
      if (task.status !== form.status && form.status === "done") {
        if (task.recurrence_template_id) await advanceRecurringOccurrence({ ...task, ...form, ...updated }, "completed");
        else await spawnNextIfRecurring({ ...task, ...form, status: task.status }, form.status);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Move “${task.title}” to Trash? You can restore it from Settings.`)) return;
    await base44.entities.Task.update(id, { archived: true });
    actionSaved(`Moved to Trash: ${task.title}`, {undo: async()=>{await base44.entities.Task.update(id,{archived:false});}});
    goBack();
  };

  // Archived tasks leave active lists but remain in search.
  const toggleArchive = async () => {
    const archived = !task.archived;
    await base44.entities.Task.update(id, { archived });
    if (archived) goBack();
    else setTask({ ...task, archived });
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-sm text-muted-foreground">Task not found in this workspace.</p>
        <Button variant="ghost" className="mt-3" onClick={goBack}>Go Back</Button>
      </div>
    );
  }

  if (!task || !form) return <div className="py-20 text-center text-sm text-muted-foreground">Loading task...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight pk-grad-text">Task Details</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update the task without losing its project or source connections.</p>
        </div>
        <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={toggleArchive} aria-label={task.archived ? "Restore task" : "Archive task"} title={task.archived ? "Restore task" : "Archive task"}>
          {task.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />} {task.archived ? "Restore task" : "Archive task"}
        </Button>
        <Button size="sm" variant="ghost" onClick={remove} aria-label="Delete task" title="Delete task">
          <Trash2 className="h-4 w-4 text-destructive" /> Delete task
        </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-primary/25 bg-card/40 pk-glass p-5 sm:p-6">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
          <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Notes or details about this task" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
            <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Priority</label>
            <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Due Date</label>
            <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div><label htmlFor="task-time" className="mb-1.5 block text-xs font-medium text-muted-foreground">Planned time (optional)</label><Input id="task-time" type="time" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">Shown in-app. Phone push alerts are not enabled.</p></div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Project</label>
            <Select value={form.project_id || "__none"} onValueChange={(value) => setForm({ ...form, project_id: value === "__none" ? "" : value })}>
              <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No project</SelectItem>
                {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {!task.recurrence_template_id && <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Legacy repeat</label>
            <Select value={form.recurrence} onValueChange={(value) => setForm({ ...form, recurrence: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECURRENCES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">For full repeating options, create or edit a series from Tasks.</p>
          </div>}
        </div>

        {task.completed_date && <p className="text-xs text-emerald-400">Completed on {task.completed_date}</p>}
        {task.today_date && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground/80">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            On your Today list for {task.today_date}
          </div>
        )}

        {recurringTemplate && (
          <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-2"><Repeat2 className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><div><p className="text-sm font-semibold">Repeating series: {recurringTemplate.title}</p><p className="text-xs text-muted-foreground">{recurringLabel(recurringTemplate)} · This occurrence is a normal task, so subtasks, AI generation, focus, project links, and completion all work normally.</p></div></div>
            {task.status !== "done" && !task.archived && <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={async()=>{await snoozeRecurringOccurrence(task,1);actionSaved("Snoozed one day.");await load();}}>Snooze 1 day</Button><Button type="button" size="sm" variant="ghost" onClick={async()=>{await skipRecurringOccurrence(task);actionSaved("Skipped this occurrence. The series continues.");goBack();}}>Skip occurrence</Button><Button type="button" size="sm" asChild><Link to={`/tasks?tab=repeating&edit=${recurringTemplate.id}`}>Edit series</Link></Button></div>}
          </div>
        )}

        {sourceCapture && (
          <div className="rounded-lg border border-primary/25 bg-secondary/30 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Created from capture</p>
            <Link to="/capture" className="mt-1 block text-sm text-primary hover:underline">
              {sourceCapture.title || sourceCapture.content?.slice(0, 80) || "Open source capture"}
            </Link>
          </div>
        )}

        <Button
          onClick={save}
          disabled={saving || !form.title.trim()}
          className={`w-full sm:w-auto ${saved ? "pk-save-flash pk-feedback-high pk-pulse-success" : ""}`}
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
        </Button>
      </div>
      {task.status !== "done" && !task.archived && <Button asChild className="w-full h-12"><Link to={`/focus?task=${encodeURIComponent(task.id)}`}>Start focus session</Link></Button>}
      <TaskSubtasks key={task.id} task={task} workspace={workspace} />
      <SupportPlan key={"task-"+task.id} type="task" record={task} workspace={workspace} />
    </div>
  );
}