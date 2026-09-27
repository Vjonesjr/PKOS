import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const TYPES = ["idea", "note", "task", "question", "project_thought", "learning_note", "decision", "lesson", "reference", "prompt"];

export default function QuickCapture({ onCaptured }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("idea");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setType("idea");
    setTitle("");
    setContent("");
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await base44.entities.Capture.create({ type, title: title.trim(), content, status: "inbox" });
    setSaving(false);
    toast({ description: "Captured to your inbox." });
    reset();
    setOpen(false);
    onCaptured?.();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5 rounded-full shadow-[0_0_20px_-4px_hsl(var(--primary))]">
        <Plus className="h-4 w-4" /> Capture
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Capture</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={type} onValueChange={setType}>
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
            <Input
              autoFocus
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSave()}
            />
            <Textarea placeholder="Add detail (optional)" value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
            <Button onClick={handleSave} disabled={!title.trim() || saving} className="w-full">
              {saving ? "Saving..." : "Save to Inbox"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}