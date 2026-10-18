import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ParseTextButton from "@/components/parse/ParseTextButton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";

const TYPES = ["idea", "note", "task", "question", "project_thought", "learning_note", "decision", "lesson", "reference", "prompt"];

export default function CaptureEditDialog({ capture, onOpenChange, onSave }) {
  const [form, setForm] = useState(null);
  const [projects, setProjects] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const { workspace } = useWorkspace();

  useEffect(() => {
    if (!capture) return;
    setForm({
      type: capture.type || "idea",
      title: capture.title || "",
      content: capture.content || "",
      tags: (capture.tags || []).join(", "),
      project_id: capture.project_id || "",
      knowledge_id: capture.knowledge_id || "",
      due_date: capture.due_date || "",
      important: !!capture.important,
    });
    base44.entities.Project.filter({ workspace }, "-updated_date", 100).then(setProjects);
    base44.entities.Knowledge.filter({ workspace }, "-updated_date", 100).then(setKnowledge);
  }, [capture, workspace]);

  if (!capture || !form) return null;

  const submit = () => {
    if (!form.content.trim()) return;
    onSave(capture.id, {
      type: form.type,
      title: form.title.trim(),
      content: form.content.trim(),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      project_id: form.project_id || undefined,
      knowledge_id: form.knowledge_id || undefined,
      due_date: form.type === "task" ? form.due_date || undefined : undefined,
      important: form.important,
    });
  };

  return (
    <Dialog open={!!capture} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit capture</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          {form.content.length > 120 && <ParseTextButton text={form.content} />}
          <Input placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="flex items-center gap-2">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant={form.important ? "default" : "outline"} size="icon" aria-label={form.important ? "Unmark important" : "Mark important"} onClick={() => setForm({ ...form, important: !form.important })}>
              <Star className={`h-4 w-4 ${form.important ? "fill-current" : ""}`} />
            </Button>
          </div>
          <Input placeholder="Tags, comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Select value={form.project_id || "__none"} onValueChange={(v) => setForm({ ...form, project_id: v === "__none" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Link project" />
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
            <Select value={form.knowledge_id || "__none"} onValueChange={(v) => setForm({ ...form, knowledge_id: v === "__none" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Link knowledge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No knowledge</SelectItem>
                {knowledge.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.type === "task" && <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />}
          <Button onClick={submit} disabled={!form.content.trim()} className="w-full">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}