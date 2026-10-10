import React, { useState } from "react";
import { Check, Loader2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { setHabitStatus, ymd } from "@/lib/habits";

/** One-tap "done" for today, plus a skip option. Tapping again clears it. */
export default function HabitToggle({ habit, status, streak = 0, onChanged, compact }) {
  const [busy, setBusy] = useState(false);
  const today = ymd(new Date());

  const set = async (next) => {
    setBusy(true);
    await setHabitStatus(habit, today, status === next ? null : next);
    // Today's check-in extends the current streak by one; cache the best.
    if (next === "done" && status !== "done" && streak + 1 > (habit.best_streak || 0)) {
      await base44.entities.Habit.update(habit.id, { best_streak: streak + 1 });
    }
    setBusy(false);
    onChanged?.();
  };

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant={status === "done" ? "default" : "outline"} disabled={busy} onClick={() => set("done")} className="h-7 gap-1 px-2.5">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} {compact ? habit.title : status === "done" ? "Done" : "Mark done"}
      </Button>
      {!compact && (
        <Button size="icon" variant={status === "skipped" ? "secondary" : "ghost"} disabled={busy} onClick={() => set("skipped")} className="h-7 w-7" aria-label="Skip today">
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}