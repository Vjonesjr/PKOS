import React, { useState } from "react";
import { Plus, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import DecisionForm from "@/components/decisions/DecisionForm";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

export default function ProjectDecisions({ decisions, projectId, onChange }) {
  const [formOpen, setFormOpen] = useState(false);

  const create = async (data) => {
    await base44.entities.Decision.create(data);
    setFormOpen(false);
    onChange();
  };

  return (
    <div className="space-y-2">
      {decisions.length === 0 ? (
        <EmptyState icon={Scale} title="No decisions logged" />
      ) : (
        decisions.map((d) => (
          <div key={d.id} className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground/90">{d.decision}</span>
              <StatusBadge value={d.status} />
            </div>
            {d.reasoning && <p className="mt-0.5 text-xs text-muted-foreground">{d.reasoning}</p>}
          </div>
        ))
      )}
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setFormOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add Decision
      </Button>
      <DecisionForm open={formOpen} onOpenChange={setFormOpen} onSave={create} projectId={projectId} />
    </div>
  );
}