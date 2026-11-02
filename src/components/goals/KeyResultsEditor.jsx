import React from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function KeyResultsEditor({ value, onChange }) {
  const update = (i, patch) => onChange(value.map((k, j) => (j === i ? { ...k, ...patch } : k)));
  return (
    <div className="space-y-2">
      {value.map((k, i) => (
        <div key={i} className="space-y-1.5 rounded-lg border border-border p-2">
          <div className="flex gap-1.5">
            <Input placeholder="Key result" value={k.title || ""} onChange={(e) => update(i, { title: e.target.value })} />
            <Button variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove key result"><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <Input type="number" placeholder="Now" value={k.current ?? ""} onChange={(e) => update(i, { current: Number(e.target.value) })} />
            <Input type="number" placeholder="Target" value={k.target ?? ""} onChange={(e) => update(i, { target: Number(e.target.value) })} />
            <Input placeholder="Unit" value={k.unit || ""} onChange={(e) => update(i, { unit: e.target.value })} />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => onChange([...value, { title: "", current: 0, target: 1, unit: "" }])}>
        <Plus className="h-4 w-4" /> Add key result
      </Button>
    </div>
  );
}