import React, { useState } from "react";
import { Check, Pencil, SkipForward, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "@/components/shared/StatusBadge";
import TriageEditor from "@/components/triage/TriageEditor";
import { TRIAGE_ACTIONS, describeChanges } from "@/lib/triageApply";

export default function TriageCard({ capture, suggestion, projects, status, selected, applying, onToggleSelect, onApply, onSkip, onEdit }) {
  const [editing, setEditing] = useState(false);
  const done = status !== "pending";

  return (
    <div className={`rounded-2xl border bg-card/60 p-5 transition-opacity ${done ? "border-border opacity-60" : "border-border"}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox checked={selected} onCheckedChange={onToggleSelect} disabled={done} aria-label="Select for Apply Selected" />
          Select
        </label>
        {done && <span className="text-xs font-medium text-muted-foreground">{status === "applied" ? "Applied" : "Skipped — nothing changed"}</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original Capture</p>
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <StatusBadge value={capture.type} />
            {capture.title && <p className="mt-2 text-sm font-medium text-foreground/90">{capture.title}</p>}
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{capture.content}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
            <Sparkles className="h-3.5 w-3.5" /> AI Suggestion
          </p>
          {editing ? (
            <TriageEditor capture={capture} suggestion={suggestion} projects={projects} onCancel={() => setEditing(false)} onSave={(s) => { onEdit(s); setEditing(false); }} />
          ) : (
            <div className="space-y-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-3">
              <p className="text-sm font-medium text-foreground/90">{TRIAGE_ACTIONS[suggestion.action]}</p>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Why</p>
                <p className="text-sm text-foreground/80">{suggestion.reason}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Proposed Changes</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-foreground/80">
                  {describeChanges(capture, suggestion, projects).map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {!done && !editing && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onSkip} className="gap-1.5"><SkipForward className="h-3.5 w-3.5" /> Skip</Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
          <Button size="sm" onClick={onApply} disabled={applying} className="gap-1.5">
            {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Apply
          </Button>
        </div>
      )}
    </div>
  );
}