import React, { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GoalDraftReview from "@/components/goals/GoalDraftReview";
import { useWorkspace } from "@/lib/WorkspaceContext";

/** Step 1: describe intent (+ one optional clarification round). Step 2: review. */
export default function GoalDraftDialog({ open, onOpenChange, onCreated, initialText = "" }) {
  const { workspace } = useWorkspace();
  const [text, setText] = useState(initialText);
  useEffect(() => { if (open && initialText) setText(initialText); }, [open, initialText]);
  const [answer, setAnswer] = useState("");
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState(null);
  const today = () => format(new Date(), "yyyy-MM-dd");
  // Fetched on every open so the count resets on the next local calendar day.
  useEffect(() => {
    if (open) base44.functions.invoke("aiAssist", { action: "goal_draft_usage", today: today() }).then((r) => setUsage(r.data));
  }, [open]);
  const atLimit = usage && usage.used >= usage.limit;

  const reset = () => { setText(""); setAnswer(""); setDraft(null); setError(""); };
  const close = (o) => { if (!o) reset(); onOpenChange(o); };

  const generate = async () => {
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("aiAssist", { action: "draft_goal", workspace, text, answer: draft?.clarifying_question ? answer : "", today: today() });
      setDraft(res.data);
      setUsage({ used: res.data.used, limit: res.data.limit });
    } catch (e) {
      if (e?.response?.status === 429) setUsage((u) => u && { ...u, used: u.limit });
      setError(e?.response?.data?.error || "Couldn't draft a goal. Try again.");
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Draft a goal with AI</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Textarea rows={3} maxLength={1000} placeholder="e.g. Get fit enough to run a half marathon by spring" value={text} onChange={(e) => setText(e.target.value)} />
          {draft?.clarifying_question && (
            <div className="space-y-1.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs text-foreground/90">{draft.clarifying_question}</p>
              <Input maxLength={500} placeholder="Your answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          {atLimit && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">You've reached today's limit of {usage.limit} AI goal drafts. Your goals and this draft are kept; new drafts unlock tomorrow.</p>}
          <Button onClick={generate} disabled={busy || !text.trim() || atLimit} variant={draft ? "outline" : "default"} className="w-full gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {draft ? (draft.clarifying_question && answer ? "Refine draft" : "Regenerate") : "Draft goal"}
          </Button>
          {usage && <p className="text-center text-[11px] text-muted-foreground">AI Goal Drafts Today: {usage.used} / {usage.limit}</p>}
          {draft && <GoalDraftReview key={JSON.stringify(draft.goal)} draft={draft} workspace={workspace} onCancel={() => close(false)} onDone={(goal) => { close(false); onCreated?.(goal); }} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}