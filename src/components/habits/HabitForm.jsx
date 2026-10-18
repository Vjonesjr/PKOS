import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GoalPicker from "@/components/goals/GoalPicker";
import { ymd } from "@/lib/habits";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const empty = () => ({ title: "", goal_id: "", schedule_type: "daily", weekdays: [1, 2, 3, 4, 5], per_week_target: 3, start_date: ymd(new Date()) });

export default function HabitForm({ open, onOpenChange, initial, onSave }) {
  const [form, setForm] = useState(empty());
  useEffect(() => { setForm(initial ? { ...empty(), ...initial } : empty()); }, [initial, open]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleDay = (d) => set({ weekdays: form.weekdays.includes(d) ? form.weekdays.filter((x) => x !== d) : [...form.weekdays, d].sort() });

  const submit = () => onSave({
    title: form.title.trim(), goal_id: form.goal_id || null, schedule_type: form.schedule_type,
    weekdays: form.weekdays, per_week_target: Number(form.per_week_target) || 1, start_date: form.start_date || null,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{initial ? "Edit habit" : "New habit"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Habit, e.g. Deep work 90 min" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <GoalPicker value={form.goal_id} onChange={(goal_id) => set({ goal_id })} />
          <Select value={form.schedule_type} onValueChange={(v) => set({ schedule_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Every day</SelectItem>
              <SelectItem value="weekdays">Specific days</SelectItem>
              <SelectItem value="per_week">X times per week</SelectItem>
            </SelectContent>
          </Select>
          {form.schedule_type === "weekdays" && (
            <div className="flex gap-1">
              {DAYS.map((l, d) => (
                <button key={d} type="button" onClick={() => toggleDay(d)} aria-label={`Toggle day ${d}`}
                  className={`h-8 flex-1 rounded-md text-xs font-medium ${form.weekdays.includes(d) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{l}</button>
              ))}
            </div>
          )}
          {form.schedule_type === "per_week" && (
            <Input type="number" min={1} max={7} value={form.per_week_target} onChange={(e) => set({ per_week_target: e.target.value })} />
          )}
          <div>
            <label className="text-xs text-muted-foreground">Start date</label>
            <Input type="date" value={form.start_date || ""} onChange={(e) => set({ start_date: e.target.value })} />
          </div>
          <Button onClick={submit} disabled={!form.title.trim() || (form.schedule_type === "weekdays" && !form.weekdays.length)} className="w-full">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}