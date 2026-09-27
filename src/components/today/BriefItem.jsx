import React from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, X, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENTITY_CONFIG } from "@/lib/entityConfig";

const sourceLink = (item) => {
  if (item.type === "review") return "/learning";
  const cfg = ENTITY_CONFIG[item.type];
  return cfg.detail ? `${cfg.route}?id=${item.id}` : item.type === "task" && item.project_id ? `/project-detail?id=${item.project_id}` : cfg.route;
};

export default function BriefItem({ item, added, onAdd, onDismiss, onPriority }) {
  const cfg = ENTITY_CONFIG[item.type];
  const canPrioritize = item.type === "task" || item.type === "project";
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground/90">
            <span className={`mr-2 text-[11px] ${cfg?.color || "text-pink-400"}`}>{cfg?.label || "Review"}</span>
            {item.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">Based on: {item.facts.join(" · ")}</p>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={added} onClick={onAdd}>
          {added ? <Check className="h-3.5 w-3.5" /> : <CalendarPlus className="h-3.5 w-3.5" />} {added ? "On Today" : "Add to Today"}
        </Button>
        {canPrioritize && (
          <Select value={item.priority} onValueChange={onPriority}>
            <SelectTrigger className="h-7 w-28 text-xs" aria-label="Change priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["low", "medium", "high"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs">
          <Link to={sourceLink(item)}><ExternalLink className="h-3.5 w-3.5" /> Open Source</Link>
        </Button>
      </div>
    </div>
  );
}