import React from "react";
import { Link } from "react-router-dom";
import { X, Layers } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { ENTITY_CONFIG, recordLabel } from "@/lib/entityConfig";

export default function PackItems({ records, onRemove }) {
  if (records.length === 0) return <EmptyState icon={Layers} title="This pack is empty" description="Add records below or accept AI suggestions." />;
  return (
    <div className="space-y-1.5">
      {records.map(({ type, id, record }) => {
        const cfg = ENTITY_CONFIG[type];
        const to = cfg.detail ? `${cfg.route}?id=${id}` : cfg.route;
        return (
          <div key={`${type}:${id}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2">
            <Link to={to} className="flex min-w-0 items-center gap-2 text-sm text-foreground/90 hover:text-primary">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
              <span className="truncate">{recordLabel(type, record)}</span>
            </Link>
            <button onClick={() => onRemove(type, id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove from pack">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}