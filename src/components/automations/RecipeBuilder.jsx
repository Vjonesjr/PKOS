import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { TRIGGERS } from "@/lib/automation/catalog";
import { ACTIONS } from "@/lib/automation/actions";
import ConditionEditor from "@/components/automations/ConditionEditor";
import ActionParams from "@/components/automations/ActionParams";
import LevelBadge from "@/components/automations/LevelBadge";

const Step = ({ label, children }) => (
  <div className="rounded-xl border border-border bg-secondary/30 p-4">
    <p className="mb-2 text-xs font-bold tracking-widest text-primary">{label}</p>
    {children}
  </div>
);

const missingParam = (a, p) => (a?.params || []).some((k) => (k === "tag" && !p.tag) || (k === "text" && !p.text) || (k === "project" && !p.project_id) || (k === "target" && !p.target_id));

export default function RecipeBuilder({ draft, onClose, onSaved, workspace, projects, targets }) {
  const [r, setR] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setR(draft ? { conditions: [], action_params: {}, enabled: false, ...draft } : null); }, [draft]);
  if (!r) return null;
  const set = (patch) => setR((x) => ({ ...x, ...patch }));
  const action = ACTIONS[r.action];
  const invalid = !r.name?.trim() || !TRIGGERS[r.trigger] || !action || missingParam(action, r.action_params);

  const save = async () => {
    setSaving(true);
    const data = { name: r.name, description: r.description || "", enabled: r.enabled, trigger: r.trigger, conditions: r.conditions, action: r.action, action_params: r.action_params, workspace };
    if (r.id) await base44.entities.AutomationRecipe.update(r.id, data);
    else await base44.entities.AutomationRecipe.create({ ...data, run_count: 0 });
    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{r.id ? "Edit recipe" : "New recipe"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {r.hint && <p className="rounded-lg bg-accent/10 p-2 text-xs text-accent">Tip: pick your “{r.hint}” item below.</p>}
          <Input value={r.name || ""} onChange={(e) => set({ name: e.target.value })} placeholder="Recipe name" />
          <Input value={r.description || ""} onChange={(e) => set({ description: e.target.value })} placeholder="What does it do? (optional)" />
          <Step label="WHEN">
            <Select value={r.trigger || ""} onValueChange={(v) => set({ trigger: v })}>
              <SelectTrigger><SelectValue placeholder="Choose what happens" /></SelectTrigger>
              <SelectContent>{Object.entries(TRIGGERS).map(([k, t]) => <SelectItem key={k} value={k}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </Step>
          <Step label="IF (optional)"><ConditionEditor conditions={r.conditions} onChange={(c) => set({ conditions: c })} projects={projects} /></Step>
          <Step label="THEN">
            <div className="space-y-2">
              <Select value={r.action || ""} onValueChange={(v) => set({ action: v })}>
                <SelectTrigger><SelectValue placeholder="Choose what to do" /></SelectTrigger>
                <SelectContent>{Object.entries(ACTIONS).map(([k, a]) => <SelectItem key={k} value={k}>{a.label}{a.level === "review" ? " · approval" : ""}</SelectItem>)}</SelectContent>
              </Select>
              {action && <LevelBadge level={action.level} />}
              <ActionParams action={action} params={r.action_params} onChange={(p) => set({ action_params: p })} projects={projects} targets={targets} />
            </div>
          </Step>
          <label className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
            Turn on after saving <Switch checked={r.enabled} onCheckedChange={(v) => set({ enabled: v })} />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={invalid || saving}>{saving ? "Saving..." : "Save recipe"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}