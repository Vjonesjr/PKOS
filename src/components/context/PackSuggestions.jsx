import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ENTITY_CONFIG } from "@/lib/entityConfig";

export default function PackSuggestions({ pack, onAdd }) {
  const [suggestions, setSuggestions] = useState(null);
  const [picked, setPicked] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("aiAssist", { action: "context_suggest", packId: pack.id, workspace: pack.workspace }).catch(() => null);
    setSuggestions(res?.data?.suggestions || []);
    setPicked(new Set());
    setLoading(false);
  };

  const toggle = (k) => setPicked((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const key = (s) => `${s.type}:${s.id}`;

  const addSelected = async () => {
    await onAdd(suggestions.filter((s) => picked.has(key(s))).map((s) => ({ type: s.type, id: s.id })));
    setSuggestions((prev) => prev.filter((s) => !picked.has(key(s))));
    setPicked(new Set());
  };

  const counts = (suggestions || []).reduce((a, s) => ({ ...a, [s.type]: (a[s.type] || 0) + 1 }), {});

  return (
    <div className="space-y-3">
      <Button variant="outline" onClick={run} disabled={loading} className="gap-1.5">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />} Suggest related records
      </Button>
      {suggestions && suggestions.length === 0 && <p className="text-xs text-muted-foreground">No additional related records found.</p>}
      {suggestions?.length > 0 && (
        <div className="space-y-2 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-3">
          <p className="text-sm text-foreground/85">
            I found {Object.entries(counts).map(([t, n]) => `${n} ${ENTITY_CONFIG[t].label.toLowerCase()} item${n > 1 ? "s" : ""}`).join(", ")}. Nothing is added until you choose.
          </p>
          {suggestions.map((s) => (
            <label key={key(s)} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-secondary/40">
              <Checkbox checked={picked.has(key(s))} onCheckedChange={() => toggle(key(s))} className="mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-foreground/90"><span className={`mr-1.5 text-[11px] ${ENTITY_CONFIG[s.type].color}`}>{ENTITY_CONFIG[s.type].label}</span>{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.reason}</p>
              </div>
            </label>
          ))}
          <div className="flex justify-end">
            <Button size="sm" onClick={addSelected} disabled={picked.size === 0}>Add Selected ({picked.size})</Button>
          </div>
        </div>
      )}
    </div>
  );
}