import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUSES = ["pending", "made", "reviewed"];

function emptyForm(projectId) {
  return {
    title: "",
    decision: "",
    context: "",
    alternatives: "",
    reasoning: "",
    expected_result: "",
    actual_result: "",
    status: "made",
    date: new Date().toISOString().slice(0, 10),
    project_id: projectId || "",
  };
}

export default function DecisionForm({ open, onOpenChange, onSave, projectId, projects = [], initial }) {
  const [form, setForm] = useState(emptyForm(projectId));

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            title: initial.title || "",
            decision: initial.decision || "",
            context: initial.context || "",
            alternatives: initial.alternatives || "",
            reasoning: initial.reasoning || "",
            expected_result: initial.expected_result || "",
            actual_result: initial.actual_result || "",
            status: initial.status || "made",
            date: initial.date || new Date().toISOString().slice(0, 10),
            project_id: initial.project_id || projectId || "",
          }
        : emptyForm(projectId)
    );
  }, [open, initial, projectId]);

  const submit = () => {
    if (!form.decision.trim()) return;
    onSave({ ...form, project_id: form.project_id || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Decision" : "New Decision"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <Input placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="What did you decide?" rows={2} value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })} />
          <Textarea placeholder="Context" rows={2} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} />
          <Textarea placeholder="Alternatives considered" rows={2} value={form.alternatives} onChange={(e) => setForm({ ...form, alternatives: e.target.value })} />
          <Textarea placeholder="Reasoning" rows={2} value={form.reasoning} onChange={(e) => setForm({ ...form, reasoning: e.target.value })} />
          <Textarea placeholder="Expected outcome" rows={2} value={form.expected_result} onChange={(e) => setForm({ ...form, expected_result: e.target.value })} />
          <Textarea placeholder="Actual outcome" rows={2} value={form.actual_result} onChange={(e) => setForm({ ...form, actual_result: e.target.value })} />
          <div className="grid grid-cols-2 gap-2.5">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          {!projectId && projects.length > 0 && (
            <Select value={form.project_id || "__none"} onValueChange={(v) => setForm({ ...form, project_id: v === "__none" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Related project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={submit} disabled={!form.decision.trim()} className="w-full">
            {initial ? "Save Changes" : "Save Decision"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}