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
    if (res.data.error) setError(res.data.error); else setResult({ ...res.data, stages: Array.isArray(res.data?.stages) ? res.data.stages : [], machine_fit: Array.isArray(res.data?.machine_fit) ? res.data.machine_fit : [], bottlenecks: Array.isArray(res.data?.bottlenecks) ? res.data.bottlenecks : [] });
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex gap-2">
        <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Describe a task, e.g. Build an Android feature" />
        <Button type="submit" disabled={loading || !task.trim()} className="gap-1.5">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />} Route</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((example) => <button key={example} type="button" onClick={() => run(example)} className="min-h-11 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground">{example}</button>)}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {result && <div className="space-y-4">
        <p className="text-sm leading-6 text-foreground/85">{result.summary}</p>
        {result.bottlenecks.length > 0 && <div className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4"><p className="text-sm font-semibold">Likely bottlenecks to clear first</p><ul className="list-disc space-y-1 pl-5 text-sm leading-6">{result.bottlenecks.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
        <div className="space-y-3">{result.stages.map((stage, index) => <div key={index} className="space-y-3 rounded-xl border border-border bg-card/60 p-4">
          <div className="flex flex-wrap items-baseline gap-x-3"><span className="text-xs font-bold uppercase tracking-wider text-primary">{stage.stage}</span><span className="text-sm font-medium text-foreground/90">{[name(tools, stage.tool_id), name(devices, stage.device_id)].filter(Boolean).join(" on ") || "No saved match"}</span></div>
          {stage.action && <p className="text-sm leading-6 text-foreground/80">{stage.action}</p>}
          {stage.bottleneck && <p className="text-sm leading-6"><span className="font-medium">Bottleneck:</span> {stage.bottleneck}</p>}
          {Array.isArray(stage.specific_options) && stage.specific_options.length > 0 && <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3"><p className="text-sm font-semibold">Specific options to compare</p>{stage.specific_options.map((option, optionIndex) => <div key={`${option.name || "option"}-${optionIndex}`} className="rounded-lg border border-border/70 bg-background/40 p-3 text-sm leading-6"><p className="font-medium">{[option.provider, option.name, option.size].filter(Boolean).join(" · ")}</p>{option.fit && <p className="text-xs font-medium text-primary">{option.fit}</p>}<p className="text-muted-foreground">{option.reason}</p></div>)}</div>}
          <p className="text-xs leading-5 text-muted-foreground">Why: {stage.explanation}</p>
        </div>)}</div>
        {result.machine_fit.length > 0 && <div className="rounded-xl border border-border bg-card/60 p-4"><p className="mb-2 text-sm font-semibold text-foreground/90">Machine Fit for this task</p>{result.machine_fit.map((fit) => <div key={fit.device_id} className="mb-3 space-y-1 text-xs"><p className="font-medium text-foreground/90">{name(devices, fit.device_id) || "Saved device"}</p>{fit.good_for?.length > 0 && <p className="flex gap-1 text-emerald-300"><ThumbsUp className="mt-0.5 h-3 w-3 shrink-0" /> Good for: {fit.good_for.join(", ")}</p>}{fit.poor_for?.length > 0 && <p className="flex gap-1 text-rose-300"><ThumbsDown className="mt-0.5 h-3 w-3 shrink-0" /> Poor for: {fit.poor_for.join(", ")}</p>}</div>)}</div>}
        {result.missing_info && <p className="text-xs leading-5 text-amber-300">Missing info: {result.missing_info}</p>}
        <p className="text-[11px] leading-5 text-muted-foreground">Recommendations are recalculated from your saved tools and devices. Generic categories should now include concrete comparison options so you are not left choosing from a vague label.</p>
      </div>}
    </div>
  );
}
