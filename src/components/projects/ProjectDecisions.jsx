import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import DecisionForm from "@/components/decisions/DecisionForm";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function ProjectDecisions({ decisions, projectId, onChange }) {
  const [formOpen, setFormOpen] = useState(false);
  const { workspace } = useWorkspace();

  const create = async (data) => {
    await base44.entities.Decision.create({ ...data, workspace });
    setFormOpen(false);
    onChange();
  };

  return (
    <div className="space-y-2">
      {decisions.length === 0 ? (
        <EmptyState icon={Scale} title="No decisions logged" />
      ) : (
        decisions.map((d) => (
          <Link key={d.id} to={`/decision-detail?id=${d.id}`} className="block rounded-lg border border-border bg-secondary/40 px-3 py-2 hover:border-primary/40">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground/90">{d.title || d.decision}</span>
              <StatusBadge value={d.status} />
            </div>
            {d.reasoning && <p className="mt-0.5 text-xs text-muted-foreground">{d.reasoning}</p>}
          </Link>
        ))
      )}
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setFormOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add Decision
      </Button>
      <DecisionForm open={formOpen} onOpenChange={setFormOpen} onSave={create} projectId={projectId} />
    </div>
  );
}