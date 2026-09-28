import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";

const TYPES = ["course", "topic", "resource", "study_note", "practice_session", "flashcard_set", "interview_prep", "certificate", "skill"];
const STATUSES = [
  ["not_started", "Not Started"],
  ["in_progress", "In Progress"],
  ["completed", "Completed"],
];

const emptyForm = () => ({
  title: "",
  content: "",
  type: "topic",
  status: "not_started",
  knowledge_id: "",
  project_id: "",
});

export default function LearningItemForm({ open, onOpenChange, onSave, initial }) {
  const [form, setForm] = useState(emptyForm());
  const [knowledgeOptions, setKnowledgeOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const { workspace } = useWorkspace();

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            title: initial.title || "",
            content: initial.content || "",
            type: initial.type || "topic",
            status: initial.status || "not_started",
            knowledge_id: initial.knowledge_id || "",
            project_id: initial.project_id || "",
          }
        : emptyForm()
    );
    Promise.all([
      base44.entities.Knowledge.filter({ workspace }, "-updated_date", 100),
      base44.entities.Project.filter({ workspace }, "-updated_date", 100),
    ]).then(([knowledge, projects]) => {
      setKnowledgeOptions(knowledge);
      setProjectOptions(projects);
    });
  }, [open, initial, workspace]);

  const submit = () => {
    if (!form.title.trim()) return;
    onSave({
      ...form,
      title: form.title.trim(),
      knowledge_id: form.knowledge_id || null,
      project_id: form.project_id || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Learning Item" : "New Learning Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Notes / content" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={form.knowledge_id || "__none"} onValueChange={(v) => setForm({ ...form, knowledge_id: v === "__none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Link to knowledge" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No linked knowledge</SelectItem>
                {knowledgeOptions.map((k) => <SelectItem key={k.id} value={k.id}>{k.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.project_id || "__none"} onValueChange={(v) => setForm({ ...form, project_id: v === "__none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Link to project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No linked project</SelectItem>
                {projectOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} disabled={!form.title.trim()} className="w-full">
            {initial ? "Save Changes" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
