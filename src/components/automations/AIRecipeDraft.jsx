import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { TRIGGERS, CONDITIONS } from "@/lib/automation/catalog";
import { ACTIONS } from "@/lib/automation/actions";

const catalog = () => ({
  triggers: Object.entries(TRIGGERS).map(([key, t]) => ({ key, label: t.label })),
  conditions: Object.entries(CONDITIONS).map(([key, c]) => ({ key, label: c.label })),
  actions: Object.entries(ACTIONS).map(([key, a]) => ({ key, label: a.label, params: a.params || [] })),
});

// AI drafts a rule; it opens in the builder switched OFF so you review before saving.
export default function AIRecipeDraft({ workspace, onDraft }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true); setError("");
    const res = await base44.functions.invoke("aiAssist", { action: "automation_draft", workspace, request: text, catalog: catalog() }).catch(() => null);
    setLoading(false);
    const d = res?.data;
    if (!d || d.error || !TRIGGERS[d.trigger] || !ACTIONS[d.action]) return setError("Couldn't turn that into a rule. Try rephrasing.");
    onDraft({ ...d, conditions: (d.conditions || []).filter((c) => CONDITIONS[c.field]), action_params: d.action_params || {}, enabled: false });
    setText("");
  };

  return (
    <div className="rounded-2xl border border-accent/30 bg-card/60 p-5">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"><Sparkles className="h-4 w-4 text-accent" /> Describe a rule in your own words</p>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Whenever I save something about SQL, connect it to my SQL learning material." />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">You'll review the draft before it's saved. It starts switched off.</p>
        <Button size="sm" onClick={run} disabled={!text.trim() || loading} className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Draft rule
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}