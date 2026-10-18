import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Add one task at a time, no AI. Recently added tasks are listed below. */
export default function SingleTaskEntry({ workspace }) {
  const [form, setForm] = useState({ title: "", due_date: "", priority: "medium" });
  const [added, setAdded] = useState([]);
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    const t = await base44.entities.Task.create({ title: form.title.trim(), priority: form.priority, workspace, ...(form.due_date ? { due_date: form.due_date } : {}) });
    setAdded([t, ...added].slice(0, 5));
    setForm({ ...form, title: "" });
    setBusy(false);
  };

  return (
    <form onSubmit={add} className="space-y-2">
      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="One task, e.g. Call Mom" aria-label="Task title" autoFocus />
      <div className="flex gap-2">
        <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="flex-1" aria-label="Due date" />
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} aria-label="Priority"
          className="rounded-md border border-input bg-background px-2 text-sm text-foreground">
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
        <Button type="submit" disabled={busy || !form.title.trim()} aria-label="Add task">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}</Button>
      </div>
      {added.length > 0 && (
        <ul className="space-y-1 pt-1 text-sm text-foreground">
          {added.map((t) => <li key={t.id} className="truncate rounded-md bg-secondary/40 px-2 py-1">✓ {t.title}</li>)}
        </ul>
      )}
    </form>
  );
}