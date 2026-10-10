import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import KeyResultsEditor from "@/components/goals/KeyResultsEditor";
import { GOAL_AREAS, GOAL_STATUSES, PROGRESS_MODES } from "@/lib/goals";

const EMPTY = { title: "", why: "", area: "Personal", target_date: "", status: "Active", progress_mode: "rollup", manual_progress: 0, key_results: [] };

const Pick = ({ value, onChange, options }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
  </Select>
);

export default function GoalForm({ open, onOpenChange, initial, onSave }) {
  const [form, setForm] = useState(EMPTY);
  useEffect(() => { setForm(initial ? { ...EMPTY, ...initial, target_date: initial.target_date || "" } : EMPTY); }, [initial, open]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = () => {
    const { id, created_date, updated_date, created_by_id, created_by, workspace, ...rest } = form;
    onSave({ ...rest, target_date: rest.target_date || null, manual_progress: Number(rest.manual_progress) || 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{initial ? "Edit Goal" : "New Goal"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Goal, e.g. Ship 3 indie apps" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <Textarea placeholder="Why does this matter?" rows={2} value={form.why} onChange={(e) => set({ why: e.target.value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Pick value={form.area} onChange={(v) => set({ area: v })} options={GOAL_AREAS.map((a) => [a, a])} />
            <Pick value={form.status} onChange={(v) => set({ status: v })} options={GOAL_STATUSES.map((s) => [s, s])} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Target date</label>
            <Input type="date" value={form.target_date} onChange={(e) => set({ target_date: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Measure progress</label>
            <Pick value={form.progress_mode} onChange={(v) => set({ progress_mode: v })} options={PROGRESS_MODES} />
          </div>
          {form.progress_mode === "manual" && (
            <Input type="number" min={0} max={100} placeholder="Progress %" value={form.manual_progress} onChange={(e) => set({ manual_progress: e.target.value })} />
          )}
          {form.progress_mode === "key_results" && <KeyResultsEditor value={form.key_results || []} onChange={(key_results) => set({ key_results })} />}
          {form.progress_mode === "rollup" && <p className="text-xs text-muted-foreground">Link projects to this goal from each project's edit form.</p>}
          <Button onClick={submit} disabled={!form.title.trim()} className="w-full">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}