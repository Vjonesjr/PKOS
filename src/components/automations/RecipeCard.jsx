import React from "react";
import { formatDistanceToNow } from "date-fns";
import { FlaskConical, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { TRIGGERS, CONDITIONS } from "@/lib/automation/catalog";
import { ACTIONS } from "@/lib/automation/actions";
import LevelBadge from "@/components/automations/LevelBadge";
import ModeBadge from "@/components/automations/ModeBadge";

const Row = ({ label, children }) => (
  <div className="flex gap-3 text-sm"><span className="w-12 shrink-0 text-xs font-bold tracking-widest text-primary pt-0.5">{label}</span><span className="text-foreground/90">{children}</span></div>
);

export default function RecipeCard({ recipe, onToggle, onEdit, onTest, onDelete }) {
  const action = ACTIONS[recipe.action];
  const conds = (recipe.conditions || []).map((c) => `${CONDITIONS[c.field]?.label || c.field}${c.value ? ` “${c.field === "project" ? "selected project" : c.value}”` : ""}`);
  return (
    <div className={`rounded-2xl border bg-card/60 p-5 transition-opacity ${recipe.enabled ? "border-primary/30" : "border-border opacity-70"}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{recipe.name}</p>
          {recipe.description && <p className="mt-0.5 text-xs text-muted-foreground">{recipe.description}</p>}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {recipe.enabled ? "On" : "Off"}
          <Switch checked={!!recipe.enabled} onCheckedChange={onToggle} aria-label="Turn recipe on or off" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Row label="WHEN">{TRIGGERS[recipe.trigger]?.label || "Unknown trigger"}</Row>
        {conds.length > 0 && <Row label="IF">{conds.join(" and ")}</Row>}
        <Row label="THEN">{action ? action.describe(recipe.action_params || {}, "capture", { title: "{title}" }) : "Unknown action"}</Row>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <ModeBadge trigger={recipe.trigger} />
          {action && <LevelBadge level={action.level} />}
          {recipe.workspace === "demo" && <span className="rounded-full bg-secondary px-2 py-0.5">Sample</span>}
          <span>Ran {recipe.run_count || 0}×</span>
          {recipe.last_run && <span>· last {formatDistanceToNow(new Date(recipe.last_run), { addSuffix: true })} ({recipe.last_result})</span>}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onTest} className="gap-1"><FlaskConical className="h-3.5 w-3.5" /> Test rule</Button>
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Edit recipe"><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete recipe"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}