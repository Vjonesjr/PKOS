import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function DecisionForm({ open, onOpenChange, onSave, projectId }) {
  const [form, setForm] = useState({ decision: "", context: "", alternatives: "", reasoning: "", expected_result: "" });

  useEffect(() => {
    if (open) setForm({ decision: "", context: "", alternatives: "", reasoning: "", expected_result: "" });
  }, [open]);

  const submit = () => {
    if (!form.decision.trim()) return;
    onSave({ ...form, date: new Date().toISOString().slice(0, 10), project_id: projectId || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Decision</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="What did you decide?" value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })} />
          <Textarea placeholder="Context" rows={2} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} />
          <Textarea placeholder="Alternatives considered" rows={2} value={form.alternatives} onChange={(e) => setForm({ ...form, alternatives: e.target.value })} />
          <Textarea placeholder="Reasoning" rows={2} value={form.reasoning} onChange={(e) => setForm({ ...form, reasoning: e.target.value })} />
          <Input placeholder="Expected result" value={form.expected_result} onChange={(e) => setForm({ ...form, expected_result: e.target.value })} />
          <Button onClick={submit} disabled={!form.decision.trim()} className="w-full">
            Save Decision
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}