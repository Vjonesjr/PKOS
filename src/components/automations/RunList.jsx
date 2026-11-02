import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { approveRun } from "@/lib/automation/engine";
import RunRow from "@/components/automations/RunRow";
import EmptyState from "@/components/shared/EmptyState";

export default function RunList({ runs, onChange, emptyIcon, emptyTitle, emptyText }) {
  const [busy, setBusy] = useState(null);
  const approve = async (run) => { setBusy(run.id); await approveRun(run); setBusy(null); onChange(); };
  const dismiss = async (run) => { setBusy(run.id); await base44.entities.AutomationRun.update(run.id, { status: "dismissed" }); setBusy(null); onChange(); };
  if (!runs.length) return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyText} />;
  return (
    <div className="space-y-2">
      {runs.map((r) => <RunRow key={r.id} run={r} onApprove={approve} onDismiss={dismiss} busy={busy === r.id} />)}
    </div>
  );
}