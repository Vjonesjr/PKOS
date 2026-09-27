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
  const load = () => base44.entities.AutomationRun.filter({ workspace, flag_open: true }, "-created_date", 50).then((rs) => setRuns(rs.filter((r) => flags.includes(r.flag))));
  useEffect(() => { load(); }, [workspace]);

  if (!runs.length) return null;
  const dismiss = async (r) => { await base44.entities.AutomationRun.update(r.id, { flag_open: false }); load(); };
  return (
    <div className="rounded-2xl border border-primary/25 bg-card/60 p-5">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary"><Zap className="h-3.5 w-3.5" /> {title}</p>
      <div className="space-y-2">
        {runs.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl bg-secondary/40 p-3">
            <div className="min-w-0">
              <Link to={recordRoute(r.record_type, r.record_id)} className="text-sm font-medium text-foreground hover:text-primary">{r.record_title}</Link>
              <p className="text-xs text-muted-foreground">{FLAG_LABEL[r.flag]} · {r.flag === "prompt" ? r.message : r.recipe_name}</p>
            </div>
            <button onClick={() => dismiss(r)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}