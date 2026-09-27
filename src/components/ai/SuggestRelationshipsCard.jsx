import React, { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AIActionRunner from "@/components/ai/AIActionRunner";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function SuggestRelationshipsCard() {
  const [projects, setProjects] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [selected, setSelected] = useState("");
  const { toast } = useToast();
  const { workspace } = useWorkspace();

  useEffect(() => {
    (async () => {
      setProjects(await base44.entities.Project.filter({ workspace }, "-updated_date", 60));
      setKnowledge(await base44.entities.Knowledge.filter({ workspace }, "-updated_date", 60));
    })();
  }, [workspace]);

  const [entityType, id] = selected ? selected.split(":") : [null, null];

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <p className="mb-3 text-sm font-semibold text-foreground/90">Suggest Relationships</p>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="mb-3">
          <SelectValue placeholder="Select a project or knowledge note..." />
        </SelectTrigger>
        <SelectContent>
          {projects.map((p) => (
            <SelectItem key={`project:${p.id}`} value={`project:${p.id}`}>
              {p.title}
            </SelectItem>
          ))}
          {knowledge.map((k) => (
            <SelectItem key={`knowledge:${k.id}`} value={`knowledge:${k.id}`}>
              {k.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <AIActionRunner
          title="Find Related Records"
          description="Suggest genuinely related projects and notes."
          icon={Link2}
          action="suggest_relationships"
          payload={{ entityType, id }}
          renderResult={(r, clear) => <RelatedSuggestions related={r.related} sourceType={entityType} sourceId={id} clear={clear} toast={toast} />}
        />
      )}
    </div>
  );
}

function RelatedSuggestions({ related, sourceType, sourceId, toast }) {
  if (!related?.length) return <p className="text-sm text-foreground/80">No related records found.</p>;
  const link = async (item) => {
    await base44.entities.Link.create({ source_type: sourceType, source_id: sourceId, target_type: item.type, target_id: item.id });
    toast({ description: `Linked to ${item.title}.` });
  };
  return (
    <div className="space-y-2">
      {related.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 p-2.5">
          <div>
            <p className="text-sm font-medium text-foreground/90">{item.title}</p>
            {item.reason && <p className="text-xs text-muted-foreground">{item.reason}</p>}
          </div>
          <Button size="sm" onClick={() => link(item)}>
            Link
          </Button>
        </div>
      ))}
    </div>
  );
}