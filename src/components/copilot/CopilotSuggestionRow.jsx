import React, { useState } from "react";
import { Check, Pencil, SkipForward, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUGGESTION_LABELS } from "@/lib/copilotApply";

export default function CopilotSuggestionRow({ suggestion, status, onApply, onSkip, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(suggestion);
  const [busy, setBusy] = useState(false);
  const done = status && status !== "pending";

  const apply = async () => {
    setBusy(true);
    await onApply(suggestion);
    setBusy(false);
  };

  return (
    <div className={`rounded-xl border border-dashed border-accent/40 bg-accent/5 p-3 ${done ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">{SUGGESTION_LABELS[suggestion.type]}</span>
        {done && <span className="text-xs text-muted-foreground">{status === "applied" ? "Applied" : "Skipped"}</span>}
      </div>
      {editing ? (
        <div className="mt-2 space-y-2">
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} disabled={suggestion.type === "knowledge_link"} />
          {suggestion.type !== "knowledge_link" && suggestion.type !== "milestone" && (
            <Textarea value={draft.detail || ""} onChange={(e) => setDraft({ ...draft, detail: e.target.value })} rows={2} />
          )}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { onEdit(draft); setEditing(false); }}>Save</Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm font-medium text-foreground/90">{suggestion.title}</p>
          {suggestion.detail && <p className="mt-0.5 text-xs text-muted-foreground">{suggestion.detail}</p>}
          {suggestion.reason && <p className="mt-1 text-xs italic text-muted-foreground">Why: {suggestion.reason}</p>}
        </>
      )}
      {!done && !editing && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onSkip} className="gap-1.5"><SkipForward className="h-3.5 w-3.5" /> Skip</Button>
          <Button size="sm" variant="outline" onClick={() => { setDraft(suggestion); setEditing(true); }} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
          <Button size="sm" onClick={apply} disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Apply
          </Button>
        </div>
      )}
    </div>
  );
}