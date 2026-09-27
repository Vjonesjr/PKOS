import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LessonForm({ open, onOpenChange, onSave, projectId, decisions = [] }) {
  const [form, setForm] = useState({ title: "", what_happened: "", what_worked: "", what_didnt: "", learned: "", next_time: "", decision_id: "" });

  useEffect(() => {
    if (open) setForm({ title: "", what_happened: "", what_worked: "", what_didnt: "", learned: "", next_time: "", decision_id: "" });
  }, [open]);

  const submit = () => {
    if (!form.learned.trim()) return;
    onSave({ ...form, project_id: projectId || undefined, decision_id: form.decision_id || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Lesson</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="What happened?" rows={2} value={form.what_happened} onChange={(e) => setForm({ ...form, what_happened: e.target.value })} />
          <Textarea placeholder="What worked?" rows={2} value={form.what_worked} onChange={(e) => setForm({ ...form, what_worked: e.target.value })} />
          <Textarea placeholder="What didn't work?" rows={2} value={form.what_didnt} onChange={(e) => setForm({ ...form, what_didnt: e.target.value })} />
          <Textarea placeholder="What was learned?" rows={2} value={form.learned} onChange={(e) => setForm({ ...form, learned: e.target.value })} />
          <Textarea placeholder="What to do differently next time?" rows={2} value={form.next_time} onChange={(e) => setForm({ ...form, next_time: e.target.value })} />
          {decisions.length > 0 && (
            <Select value={form.decision_id || "__none"} onValueChange={(v) => setForm({ ...form, decision_id: v === "__none" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Link to a decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No linked decision</SelectItem>
                {decisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.decision}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={submit} disabled={!form.learned.trim()} className="w-full">
            Save Lesson
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}