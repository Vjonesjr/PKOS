import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TYPES = ["note", "concept", "reference", "information", "personal", "structured"];

export default function KnowledgeForm({ open, onOpenChange, initial, onSave }) {
  const [form, setForm] = useState({ title: "", content: "", type: "note", category: "", source: "", tags: "" });

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || "",
        content: initial.content || "",
        type: initial.type || "note",
        category: initial.category || "",
        source: initial.source || "",
        tags: (initial.tags || []).join(", "),
      });
    } else {
      setForm({ title: "", content: "", type: "note", category: "", source: "", tags: "" });
    }
  }, [initial, open]);

  const submit = () => {
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      content: form.content,
      type: form.type,
      category: form.category,
      source: form.source,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit knowledge" : "New knowledge record"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Content" rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <Input placeholder="Tags, comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <Input placeholder="Source / reference (optional)" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <Button onClick={submit} disabled={!form.title.trim()} className="w-full">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}