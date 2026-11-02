import { actionSaved } from '@/lib/taskStatus';
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function emptyForm(projectId) {
  return { title: "", what_happened: "", what_worked: "", what_didnt: "", learned: "", next_time: "", decision_id: "", project_id: projectId || "", knowledge_id: "" };
}

export default function LessonForm({ open, onOpenChange, onSave, projectId, decisions = [], projects = [], knowledgeOptions = [], initial }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(emptyForm(projectId));

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            title: initial.title || "",
            what_happened: initial.what_happened || "",
            what_worked: initial.what_worked || "",
            what_didnt: initial.what_didnt || "",
            learned: initial.learned || "",
            next_time: initial.next_time || "",
            decision_id: initial.decision_id || "",
            project_id: initial.project_id || projectId || "",
            knowledge_id: initial.knowledge_id || "",
          }
        : emptyForm(projectId)
    );
  }, [open, initial, projectId]);

  const submit = async () => {
    if (!form.learned.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      await onSave({
        ...form,
        project_id: form.project_id || undefined,
        decision_id: form.decision_id || undefined,
        knowledge_id: form.knowledge_id || undefined,
      });
      setSaved(true); actionSaved("Lesson saved");
      setTimeout(() => setSaved(false), 1000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit lesson" : "New lesson"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="What happened?" rows={2} value={form.what_happened} onChange={(e) => setForm({ ...form, what_happened: e.target.value })} />
          <Textarea placeholder="What worked?" rows={2} value={form.what_worked} onChange={(e) => setForm({ ...form, what_worked: e.target.value })} />
          <Textarea placeholder="What didn't work?" rows={2} value={form.what_didnt} onChange={(e) => setForm({ ...form, what_didnt: e.target.value })} />
          <Textarea placeholder="What was learned?" rows={2} value={form.learned} onChange={(e) => setForm({ ...form, learned: e.target.value })} />
          <Textarea placeholder="What to do differently next time?" rows={2} value={form.next_time} onChange={(e) => setForm({ ...form, next_time: e.target.value })} />
          {!projectId && projects.length > 0 && (
            <Select value={form.project_id || "__none"} onValueChange={(v) => setForm({ ...form, project_id: v === "__none" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Related project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {decisions.length > 0 && (
            <Select value={form.decision_id || "__none"} onValueChange={(v) => setForm({ ...form, decision_id: v === "__none" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Related decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No linked decision</SelectItem>
                {decisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.title || d.decision}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {knowledgeOptions.length > 0 && (
            <Select value={form.knowledge_id || "__none"} onValueChange={(v) => setForm({ ...form, knowledge_id: v === "__none" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Related knowledge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No linked knowledge</SelectItem>
                {knowledgeOptions.map((k) => (
                  <SelectItem key={k.id} value={k.id}>{k.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={submit}
            disabled={saving || !form.learned.trim()}
            className={`w-full ${saved ? "pk-save-flash pk-pulse-success" : ""}`}
          >
            {saving ? "Saving…" : saved ? "Saved" : (initial ? "Save Changes" : "Save Lesson")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}