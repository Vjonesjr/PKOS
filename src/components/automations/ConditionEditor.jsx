import React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONDITIONS } from "@/lib/automation/catalog";

export default function ConditionEditor({ conditions, onChange, projects }) {
  const set = (i, patch) => onChange(conditions.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <div className="space-y-2">
      {conditions.map((c, i) => {
        const def = CONDITIONS[c.field];
        return (
          <div key={i} className="flex flex-wrap items-center gap-2">
            {i > 0 && <span className="text-xs text-muted-foreground">and</span>}
            <Select value={c.field} onValueChange={(v) => set(i, { field: v, value: "" })}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(CONDITIONS).map(([k, d]) => <SelectItem key={k} value={k}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
            {def?.project ? (
              <Select value={c.value} onValueChange={(v) => set(i, { value: v })}>
                <SelectTrigger className="min-w-40 flex-1"><SelectValue placeholder="Choose project" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
              </Select>
            ) : def?.options ? (
              <Select value={c.value} onValueChange={(v) => set(i, { value: v })}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{def.options.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
              </Select>
            ) : def?.needsValue ? (
              <Input value={c.value} onChange={(e) => set(i, { value: e.target.value })} placeholder="Value" className="min-w-32 flex-1" />
            ) : null}
            <button onClick={() => onChange(conditions.filter((_, j) => j !== i))} aria-label="Remove condition" className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
          </div>
        );
      })}
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...conditions, { field: "tag", value: "" }])} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add condition</Button>
    </div>
  );
}