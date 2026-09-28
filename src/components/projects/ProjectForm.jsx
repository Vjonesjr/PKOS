import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUSES = ["Idea", "Planned", "Active", "Waiting", "Completed", "Archived"];
const PRIORITIES = ["low", "medium", "high"];

export default function ProjectForm({ open, onOpenChange, initial, onSave }) {
  const [form, setForm] = useState({ title: "", description: "", status: "Idea", priority: "medium", next_action: "", blockers: "" });

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || "",
        description: initial.description || "",
        status: initial.status || "Idea",
        priority: initial.priority || "medium",
        next_action: initial.next_action || "",
        blockers: initial.blockers || "",
      });
    } else {
      setForm({ title: "", description: "", status: "Idea", priority: "medium", next_action: "", blockers: "" });
    }
  }, [initial, open]);

  const submit = () => {
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Project title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="What is this project?" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
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
          <Input placeholder="Blockers (if any)" value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} />
          <Button onClick={submit} disabled={!form.title.trim()} className="w-full">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}