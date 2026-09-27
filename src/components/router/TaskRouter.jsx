import React, { useState } from "react";
import { Route, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EXAMPLES = ["Build an Android feature", "Analyze a large dataset", "Run a local model", "Create an image"];

export default function TaskRouter({ workspace, tools, devices }) {
  const [task, setTask] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const name = (list, id) => list.find((x) => x.id === id)?.name;

  const run = async (t = task) => {
    if (!t.trim()) return;
    setTask(t); setLoading(true); setError(""); setResult(null);
    const res = await base44.functions.invoke("aiAssist", { action: "route_task", workspace, task: t }).catch((e) => ({ data: { error: e.response?.data?.error || "Routing failed. Please try again." } }));
    if (res.data.error) setError(res.data.error); else setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex gap-2">
        <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Describe a task, e.g. Build an Android feature" />
        <Button type="submit" disabled={loading || !task.trim()} className="gap-1.5">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />} Route</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((e) => <button key={e} onClick={() => run(e)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground">{e}</button>)}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && (
        <div className="space-y-4">
          <p className="text-sm text-foreground/85">{result.summary}</p>
          <div className="space-y-2">
            {result.stages.map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/60 p-4">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">{s.stage}</span>
                  <span className="text-sm font-medium text-foreground/90">{[name(tools, s.tool_id), name(devices, s.device_id)].filter(Boolean).join(" on ") || "No saved match"}</span>
                </div>
                {s.action && <p className="mt-1 text-sm text-foreground/80">{s.action}</p>}
                <p className="mt-1 text-xs text-muted-foreground">Why: {s.explanation}</p>
              </div>
            ))}
          </div>
          {result.machine_fit.length > 0 && (
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground/90">Machine Fit for this task</p>
              {result.machine_fit.map((m) => (
                <div key={m.device_id} className="mb-2 text-xs">
                  <p className="font-medium text-foreground/90">{name(devices, m.device_id)}</p>
                  {m.good_for?.length > 0 && <p className="flex items-center gap-1 text-emerald-300"><ThumbsUp className="h-3 w-3" /> Good for: {m.good_for.join(", ")}</p>}
                  {m.poor_for?.length > 0 && <p className="flex items-center gap-1 text-rose-300"><ThumbsDown className="h-3 w-3" /> Poor for: {m.poor_for.join(", ")}</p>}
                </div>
              ))}
            </div>
          )}
          {result.missing_info && <p className="text-xs text-amber-300">Missing info: {result.missing_info}</p>}
          <p className="text-[11px] text-muted-foreground">Recommendations are recalculated each time from your saved tools and devices — update them as tools evolve.</p>
        </div>
      )}
    </div>
  );
}