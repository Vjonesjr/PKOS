import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function TaskForm({ open, onOpenChange, workspace, projects = [], initialProjectId = "", onSaved }) {
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", due_date: "", scheduled_time: "", project_id: initialProjectId || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) setForm({ title: "", description: "", priority: "medium", due_date: "", scheduled_time: "", project_id: initialProjectId || "" }); }, [open, initialProjectId]);
  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true); setError("");
    try {
      const task = await base44.entities.Task.create({
        title: form.title.trim(), description: form.description.trim(), status: "todo", priority: form.priority,
        due_date: form.due_date || null, scheduled_time: form.scheduled_time || null,
        today_date: form.due_date && form.scheduled_time ? form.due_date : null,
        project_id: form.project_id || null, workspace,
      });
      window.dispatchEvent(new CustomEvent("pkos:task-saved", { detail: { task } }));
      onSaved?.(task); onOpenChange(false);
    } catch (e) { setError(e.message || "Could not create task."); }
    finally { setSaving(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader><div className="space-y-4">
    <p className="text-sm text-muted-foreground">A task can stand on its own. Project is optional.</p>
    <label className="block space-y-1 text-sm"><span>Title</span><Input autoFocus value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
    <label className="block space-y-1 text-sm"><span>Notes</span><Textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block space-y-1 text-sm"><span>Priority</span><select className="h-11 w-full rounded-lg border border-input bg-background px-3" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
      <label className="block space-y-1 text-sm"><span>Project (optional)</span><select className="h-11 w-full rounded-lg border border-input bg-background px-3" value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})}><option value="">Standalone task</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
      <label className="block space-y-1 text-sm"><span>Due date</span><Input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/></label>
      <label className="block space-y-1 text-sm"><span>Planned time</span><Input type="time" value={form.scheduled_time} onChange={e=>setForm({...form,scheduled_time:e.target.value})}/></label>
    </div>
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button className="w-full" disabled={saving||!form.title.trim()} onClick={save}>{saving?"Saving…":"Create task"}</Button>
  </div></DialogContent></Dialog>;
}
