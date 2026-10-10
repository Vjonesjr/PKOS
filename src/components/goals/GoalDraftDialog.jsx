import React, { useState } from "react";
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
export default function GoalDraftDialog({ open, onOpenChange, onCreated }) {
  const { workspace } = useWorkspace();
  const [text, setText] = useState("");
  const [answer, setAnswer] = useState("");
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setText(""); setAnswer(""); setDraft(null); setError(""); };
  const close = (o) => { if (!o) reset(); onOpenChange(o); };

  const generate = async () => {
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("aiAssist", { action: "draft_goal", workspace, text, answer: draft?.clarifying_question ? answer : "", today: format(new Date(), "yyyy-MM-dd") });
      setDraft(res.data);
    } catch (e) {
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
          <Button onClick={generate} disabled={busy || !text.trim()} variant={draft ? "outline" : "default"} className="w-full gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {draft ? (draft.clarifying_question && answer ? "Refine draft" : "Regenerate") : "Draft goal"}
          </Button>
          {draft && <GoalDraftReview key={JSON.stringify(draft.goal)} draft={draft} workspace={workspace} onDone={(goal) => { close(false); onCreated(goal); }} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}