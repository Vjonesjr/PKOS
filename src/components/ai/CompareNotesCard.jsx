import React, { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import AIActionRunner from "@/components/ai/AIActionRunner";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function CompareNotesCard() {
  const [knowledge, setKnowledge] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const { workspace } = useWorkspace();

  useEffect(() => {
    (async () => {
      setKnowledge(await base44.entities.Knowledge.filter({ workspace }, "-updated_date", 60));
    })();
  }, [workspace]);

  const toggle = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <p className="mb-1 text-sm font-semibold text-foreground/90">Summarize & Compare Notes</p>
      <p className="mb-3 text-xs text-muted-foreground">Pick a few related notes to summarize together and spot common themes.</p>
      {knowledge.length === 0 ? (
        <p className="text-xs text-muted-foreground">No knowledge notes yet.</p>
      ) : (
        <div className="mb-3 max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
          {knowledge.map((k) => (
            <label key={k.id} className="flex items-center gap-2 px-1 py-1 text-sm text-foreground/80">
              <Checkbox checked={selectedIds.includes(k.id)} onCheckedChange={() => toggle(k.id)} />
              {k.title}
            </label>
          ))}
        </div>
      )}
      {selectedIds.length >= 2 && (
        <AIActionRunner
          title="Summarize & Compare"
          description={`Summarize ${selectedIds.length} selected notes and highlight shared themes.`}
          icon={Layers}
          action="summarize_records"
          payload={{ entityType: "knowledge", ids: selectedIds }}
          renderResult={(r) => (
            <div>
              <p className="text-sm text-foreground/80">{r.summary}</p>
              {r.themes?.length > 0 && (
                <ul className="list-disc list-inside mt-2 space-y-0.5">
                  {r.themes.map((t, i) => (
                    <li key={i} className="text-sm text-foreground/80">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        />
      )}
      {selectedIds.length === 1 && <p className="text-xs text-muted-foreground">Select at least 2 notes to compare.</p>}
    </div>
  );
}