import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import CapturePicker from "@/components/triage/CapturePicker";
import TriageCard from "@/components/triage/TriageCard";
import { applySuggestion } from "@/lib/triageApply";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function Triage() {
  const { workspace, isSeeding } = useWorkspace();
  const { toast } = useToast();
  const [captures, setCaptures] = useState(null);
  const [picked, setPicked] = useState(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [applying, setApplying] = useState(new Set());
  const [current, setCurrent] = useState(0);

  const load = useCallback(async () => {
    if (isSeeding) return;
    setCaptures(await base44.entities.Capture.filter({ workspace, status: "inbox" }, "-created_date", 100));
    setSuggestions(null);
    setPicked(new Set());
  }, [workspace, isSeeding]);

  useEffect(() => { load(); }, [load]);

  const toggleIn = (setter) => (id) => setter((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const analyze = async () => {
    setAnalyzing(true);
    setError("");
    const res = await base44.functions.invoke("aiAssist", { action: "triage_inbox", ids: [...picked].slice(0, 15), workspace }).catch((e) => ({ data: { error: e.message } }));
    setAnalyzing(false);
    if (res.data.error) return setError("AI analysis failed. Please try again.");
    setSuggestions(res.data.suggestions);
    setProjects(res.data.projects || []);
    setStatus(Object.fromEntries(res.data.suggestions.map((s) => [s.id, "pending"])));
    setSelected(new Set());
    setCurrent(0);
  };

  const captureById = (id) => captures.find((c) => c.id === id);

  const apply = async (s) => {
    setApplying((p) => new Set(p).add(s.id));
    await applySuggestion(captureById(s.id), s);
    setApplying((p) => { const n = new Set(p); n.delete(s.id); return n; });
    setStatus((p) => ({ ...p, [s.id]: "applied" }));
    setSelected((p) => { const n = new Set(p); n.delete(s.id); return n; });
  };

  const applySelected = async () => {
    const list = suggestions.filter((s) => selected.has(s.id) && status[s.id] === "pending");
    for (const s of list) await apply(s);
    toast({ description: `Applied ${list.length} suggestion${list.length === 1 ? "" : "s"}.` });
  };

  const skip = (id) => setStatus((p) => ({ ...p, [id]: "skipped" }));
  const edit = (s) => setSuggestions((prev) => prev.map((x) => (x.id === s.id ? s : x)));

  if (!captures) return <div className="py-20 text-center text-sm text-muted-foreground">Loading inbox...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/capture" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Capture</Link>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground"><Sparkles className="h-5 w-5 text-accent" /> AI Inbox Triage</h1>
        <p className="mt-1 text-sm text-muted-foreground">Select captures for AI to review. Nothing changes until you approve each suggestion.</p>
      </div>

      {!suggestions ? (
        <>
          <CapturePicker captures={captures} selected={picked} onToggle={toggleIn(setPicked)} onToggleAll={() => setPicked(picked.size === captures.length ? new Set() : new Set(captures.map((c) => c.id)))} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {captures.length > 0 && (
            <div className="flex items-center justify-end gap-3">
              {picked.size > 15 && <span className="text-xs text-muted-foreground">Only the first 15 will be analyzed.</span>}
              <Button onClick={analyze} disabled={picked.size === 0 || analyzing} className="gap-1.5">
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {analyzing ? "Analyzing..." : `Analyze ${picked.size || ""} selected`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
            <span className="text-sm text-muted-foreground">{suggestions.length} suggestion{suggestions.length === 1 ? "" : "s"} · {selected.size} selected</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={load}>Start over</Button>
              <Button size="sm" onClick={applySelected} disabled={selected.size === 0}>Apply Selected</Button>
            </div>
          </div>

          {suggestions.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No suggestions returned. Try again or pick different captures.</p>}

          {suggestions.length > 1 && (
            <div className="flex items-center justify-between lg:hidden">
              <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setCurrent(current - 1)} aria-label="Previous capture"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-xs text-muted-foreground">{current + 1} of {suggestions.length}</span>
              <Button variant="outline" size="sm" disabled={current === suggestions.length - 1} onClick={() => setCurrent(current + 1)} aria-label="Next capture"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}

          <div className="space-y-4">
            {suggestions.map((s, i) => (
              <div key={s.id} className={i === current ? "" : "hidden lg:block"}>
                <TriageCard
                  capture={captureById(s.id)}
                  suggestion={s}
                  projects={projects}
                  status={status[s.id]}
                  selected={selected.has(s.id)}
                  applying={applying.has(s.id)}
                  onToggleSelect={() => toggleIn(setSelected)(s.id)}
                  onApply={() => apply(s)}
                  onSkip={() => skip(s.id)}
                  onEdit={edit}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}