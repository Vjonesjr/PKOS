import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { TRIGGERS, recordRoute } from "@/lib/automation/catalog";
import { ACTIONS } from "@/lib/automation/actions";

const STATUS = {
  success: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-rose-500/15 text-rose-300",
  skipped: "bg-slate-500/15 text-slate-300",
  pending_review: "bg-amber-500/15 text-amber-300",
  dismissed: "bg-slate-600/15 text-slate-400",
};
const LABEL = { success: "Success", failed: "Failed", skipped: "Skipped", pending_review: "Awaiting approval", dismissed: "Dismissed" };

export default function RunRow({ run, onApprove, onDismiss, busy }) {
  const canAct = run.status === "pending_review" || (run.status === "failed" && ACTIONS[run.action]);
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{run.recipe_name}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS[run.status]}`}>{LABEL[run.status]}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {format(new Date(run.created_date), "MMM d, h:mm a")} · {TRIGGERS[run.trigger]?.label} → {ACTIONS[run.action]?.label}
      </p>
      <p className="mt-1 text-sm text-foreground/80">
        <Link to={recordRoute(run.record_type, run.record_id)} className="text-primary hover:underline">{run.record_title}</Link>
        {run.message && <span className="text-muted-foreground"> — {run.message}</span>}
      </p>
      {canAct && onApprove && (
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={() => onApprove(run)} disabled={busy}>{run.status === "failed" ? "Retry" : "Approve"}</Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(run)} disabled={busy}>Dismiss</Button>
        </div>
      )}
    </div>
  );
}