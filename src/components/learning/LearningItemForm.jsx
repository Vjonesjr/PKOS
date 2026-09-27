import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";

const TYPES = ["course", "topic", "resource", "study_note", "practice_session", "flashcard_set", "interview_prep", "certificate", "skill"];

export default function LearningItemForm({ open, onOpenChange, onSave }) {
  const [form, setForm] = useState({ title: "", content: "", type: "topic", knowledge_id: "" });
  const [knowledgeOptions, setKnowledgeOptions] = useState([]);
  const { workspace } = useWorkspace();

  useEffect(() => {
    if (open) {
      setForm({ title: "", content: "", type: "topic", knowledge_id: "" });
      base44.entities.Knowledge.filter({ workspace }, "-updated_date", 100).then(setKnowledgeOptions);
    }
  }, [open, workspace]);

  const submit = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, knowledge_id: form.knowledge_id || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Learning Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger>
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
          <Textarea placeholder="Notes / content" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <Select value={form.knowledge_id || "__none"} onValueChange={(v) => setForm({ ...form, knowledge_id: v === "__none" ? "" : v })}>
            <SelectTrigger>
              <SelectValue placeholder="Link to knowledge (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">No linked knowledge</SelectItem>
              {knowledgeOptions.map((k) => (
                <SelectItem key={k.id} value={k.id}>{k.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={submit} disabled={!form.title.trim()} className="w-full">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}