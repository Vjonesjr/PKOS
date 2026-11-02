import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { testRecipe } from "@/lib/automation/engine";
import { recordRoute, TYPES, TRIGGERS } from "@/lib/automation/catalog";
import LevelBadge from "@/components/automations/LevelBadge";

export default function TestRuleDialog({ recipe, onClose }) {
  const [results, setResults] = useState(null);
  useEffect(() => { if (recipe) { setResults(null); testRecipe(recipe).then(setResults); } }, [recipe]);
  if (!recipe) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Test: {recipe.name}</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">{TRIGGERS[recipe.trigger]?.event === "nightly" ? "What last night's check would do for this rule. Nothing is changed." : "A preview against your recent records. Nothing is changed."}</p>
        {!results ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> : results.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No recent records match this rule.</p>
        ) : (
          <div className="space-y-2">
            {results.map((x) => (
              <div key={x.record.id} className="rounded-xl border border-border p-3">
                <Link to={recordRoute(x.type, x.record.id, x.record)} onClick={onClose} className="text-sm font-medium text-foreground hover:text-primary">{x.title}</Link>
                <p className="text-xs text-muted-foreground">{TYPES[x.type].label} → would {x.outcome.charAt(0).toLowerCase() + x.outcome.slice(1)}</p>
                {x.level !== "skip" && <div className="mt-1.5"><LevelBadge level={x.level} /></div>}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}