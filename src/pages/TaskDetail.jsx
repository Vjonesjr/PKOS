import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { taskStatusPatch } from "@/lib/taskStatus";
import { useWorkspace } from "@/lib/WorkspaceContext";
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
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const id = new URLSearchParams(window.location.search).get("id");
  const [task, setTask] = useState(null);
  const [form, setForm] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sourceCapture, setSourceCapture] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (t.source_capture_id) {
      const candidate = await base44.entities.Capture.get(t.source_capture_id).catch(() => null);
      if (candidate?.workspace === workspace) capture = candidate;
    }

    setNotFound(false);
    setTask(t);
    setProjects(projectRows);
    setSourceCapture(capture);
    setForm({
      title: t.title || "",
      description: t.description || "",
      status: t.status || "todo",
      priority: t.priority || "medium",
      due_date: t.due_date || "",
      project_id: t.project_id || "",
    });
  }, [id, workspace]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form?.title.trim()) return;
    setSaving(true);
    await base44.entities.Task.update(id, {
      title: form.title.trim(),
      description: form.description.trim(),
      ...taskStatusPatch(task, form.status),
      priority: form.priority,
      due_date: form.due_date || null,
      project_id: form.project_id || null,
    });
    setSaving(false);
    await load();
  };

  const remove = async () => {
    if (!window.confirm(`Delete task “${task.title}”? This cannot be undone.`)) return;
    if (sourceCapture?.converted_to_type === "task" && sourceCapture.converted_to_id === id) {
      await base44.entities.Capture.update(sourceCapture.id, {
        status: "inbox",
        converted_to_type: "",
        converted_to_id: "",
      });
    }
    await base44.entities.Task.delete(id);
    navigate(-1);
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-sm text-muted-foreground">Task not found in this workspace.</p>
        <Button variant="ghost" className="mt-3" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  if (!task || !form) return <div className="py-20 text-center text-sm text-muted-foreground">Loading task...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Task Details</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update the task without losing its project or source connections.</p>
        </div>
        <Button size="sm" variant="ghost" onClick={remove} aria-label="Delete task" title="Delete task">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
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
        </div>

        {task.completed_date && <p className="text-xs text-emerald-400">Completed on {task.completed_date}</p>}
        {task.today_date && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground/80">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            On your Today list for {task.today_date}
          </div>
        )}

        {sourceCapture && (
          <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Created from capture</p>
            <Link to="/capture" className="mt-1 block text-sm text-primary hover:underline">
              {sourceCapture.title || sourceCapture.content?.slice(0, 80) || "Open source capture"}
            </Link>
          </div>
        )}

        <Button onClick={save} disabled={saving || !form.title.trim()} className="w-full sm:w-auto">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}