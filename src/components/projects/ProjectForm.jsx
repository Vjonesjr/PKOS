import { actionSaved } from '@/lib/taskStatus';
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GoalPicker from "@/components/goals/GoalPicker";

const STATUSES = ["Idea", "Planned", "Active", "Waiting", "Archived"];
const PRIORITIES = ["low", "medium", "high"];

export default function ProjectForm({ open, onOpenChange, initial, onSave }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "Planned", priority: "medium", next_action: "", blockers: "" });

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || "",
        description: initial.description || "",
        status: initial.status || "Idea",
        priority: initial.priority || "medium",
        next_action: initial.next_action || "",
        blockers: initial.blockers || "",
        goal_id: initial.goal_id || "",
      });
    } else {
      setForm({ title: "", description: "", status: "Planned", priority: "medium", next_action: "", blockers: "", goal_id: "" });
    }
  }, [initial, open]);

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      await onSave({ ...form, goal_id: form.goal_id || null });
      setSaved(true); actionSaved("Project saved");
      setTimeout(() => setSaved(false), 1000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Project title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="What is this project?" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select disabled={initial?.status === "Completed"} value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...STATUSES,...(initial?.status === "Completed" ? ["Completed"] : [])].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Next action" value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} />
          <div><label htmlFor="project-blockers" className="text-sm">What gets in your way? (optional)</label><Textarea id="project-blockers" rows={3} placeholder="For example: I feel overwhelmed by paperwork, or I keep switching between projects." value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">Add practical ways around it and reminders in the project’s Blockers & what helps me section.</p></div>
          <GoalPicker value={form.goal_id} onChange={(goal_id) => setForm({ ...form, goal_id })} />
          <Button
            onClick={submit}
            disabled={saving || !form.title.trim()}
            className={`w-full ${saved ? "pk-save-flash pk-pulse-success" : ""}`}
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}