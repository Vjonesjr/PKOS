import React, { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

/** AI week summary, saved as this week's weekly ReviewEntry (one per week). */
export default function WeekSummary({ workspace, week, disabled }) {
  const [entry, setEntry] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    base44.entities.ReviewEntry.filter({ workspace, type: "weekly", date: week }, { limit: 1 }).then((r) => setEntry(r.items[0] || null));
  }, [workspace, week]);

  const run = async () => {
    setBusy(true);
    const { data } = await base44.functions.invoke("aiAssist", { action: "weekly_goal_summary", workspace, week_start: week });
    const payload = { summary: data.focus, content: data.insights.map((i) => `- ${i}`).join("\n") };
    setEntry(entry
      ? await base44.entities.ReviewEntry.update(entry.id, payload)
      : await base44.entities.ReviewEntry.create({ ...payload, type: "weekly", date: week, workspace }));
    setBusy(false);
  };

  return (
    <div className="space-y-2 border-t border-border pt-3">
      {entry && (
        <div className="space-y-1.5">
          <p className="whitespace-pre-line text-xs text-foreground/85">{entry.content}</p>
          {entry.summary && <p className="text-xs text-primary">Next week: {entry.summary}</p>}
        </div>
      )}
      <Button size="sm" variant="outline" className="w-full gap-1.5" disabled={disabled || busy} onClick={run}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {entry ? "Refresh week summary" : "Summarize my week"}
      </Button>
    </div>
  );
}