import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { recordRoute } from "@/lib/automation/catalog";

const FLAG_LABEL = { today: "Surfaced", review: "Review", attention: "Needs attention", prompt: "Reflect" };

// Shows open items raised by automation recipes (e.g. on Today or Review).
export default function AutomationFlags({ flags, title }) {
  const { workspace } = useWorkspace();
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState("");
  const load = async () => {
    const rows = await base44.entities.AutomationRun.filter({ workspace, flag_open: true }, "-created_date", 300);
    const grouped = new Map();
    for (const run of rows.filter((r) => flags.includes(r.flag))) {
      // Collapse multiple automation runs that surface the same underlying record.
      // Different flags (Today vs attention) remain independently actionable.
      const key = [workspace, run.flag, run.record_type || "", run.record_id || run.id].join("|");
      const existing = grouped.get(key);
      if (existing) {
        existing.runIds.push(run.id);
        if (run.recipe_name && !existing.recipeNames.includes(run.recipe_name)) existing.recipeNames.push(run.recipe_name);
      } else {
        grouped.set(key, {
          ...run,
          runIds: [run.id],
          recipeNames: run.recipe_name ? [run.recipe_name] : [],
        });
      }
    }
    setRuns([...grouped.values()]);
  };
  useEffect(() => { setRuns([]); setError(""); load().catch(() => setError("Couldn't load automation suggestions.")); }, [workspace]);

  if (!runs.length && !error) return null;
  const dismiss = async (r) => {
    // Dismiss all open runs for this record/flag, not only the newest duplicate.
    try {
      await Promise.all(r.runIds.map((id) => base44.entities.AutomationRun.update(id, { flag_open: false })));
      setError("");
      await load();
    } catch {
      setError("Couldn't dismiss that suggestion. Please try again.");
    }
  };
  return (
    <div className="rounded-2xl border border-primary/25 bg-card/60 p-5">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary"><Zap className="h-3.5 w-3.5" /> {title}</p>
      {error && <p role="alert" className="mb-3 text-xs text-destructive">{error}</p>}
      <div className="space-y-2">
        {runs.map((r) => (
          <div key={r.id} className="flex min-w-0 items-start justify-between gap-3 rounded-xl bg-secondary/40 p-3">
            <div className="min-w-0 flex-1">
              <Link to={recordRoute(r.record_type, r.record_id)} className="block break-words text-sm font-medium leading-6 text-foreground hover:text-primary">{r.record_title}</Link>
              <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{FLAG_LABEL[r.flag]} · {r.flag === "prompt" ? r.message : r.recipeNames.join(", ") || "Automation"}</p>
              {r.runIds.length > 1 && <p className="mt-1 text-xs text-muted-foreground">{r.runIds.length} duplicate notifications combined</p>}
            </div>
            <button type="button" onClick={() => dismiss(r)} aria-label={`Dismiss all notifications for ${r.record_title}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}