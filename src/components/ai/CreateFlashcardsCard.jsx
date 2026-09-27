import React, { useEffect, useState } from "react";
import { Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AIActionRunner from "@/components/ai/AIActionRunner";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function CreateFlashcardsCard() {
  const [knowledge, setKnowledge] = useState([]);
  const [learningItems, setLearningItems] = useState([]);
  const [selected, setSelected] = useState("");
  const { toast } = useToast();
  const { workspace } = useWorkspace();

  useEffect(() => {
    (async () => {
      setKnowledge(await base44.entities.Knowledge.filter({ workspace }, "-updated_date", 60));
      setLearningItems(await base44.entities.LearningItem.filter({ workspace }, "-updated_date", 60));
    })();
  }, [workspace]);

  const [entityType, id] = selected ? selected.split(":") : [null, null];

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <p className="mb-3 text-sm font-semibold text-foreground/90">Create Flashcards</p>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="mb-3">
          <SelectValue placeholder="Select a knowledge note or learning item..." />
        </SelectTrigger>
        <SelectContent>
          {knowledge.map((k) => (
            <SelectItem key={`knowledge:${k.id}`} value={`knowledge:${k.id}`}>
              {k.title}
            </SelectItem>
          ))}
          {learningItems.map((l) => (
            <SelectItem key={`learning:${l.id}`} value={`learning:${l.id}`}>
              {l.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <AIActionRunner
          title="Generate Flashcards"
          description="Turn this material into study flashcards."
          icon={Wand2}
          action="create_flashcards"
          payload={{ entityType, id }}
          renderResult={(r, clear) => (
            <FlashcardSuggestions flashcards={r.flashcards} entityType={entityType} id={id} workspace={workspace} clear={clear} toast={toast} />
          )}
        />
      )}
    </div>
  );
}

function FlashcardSuggestions({ flashcards, entityType, id, workspace, clear, toast }) {
  if (!flashcards?.length) return <p className="text-sm text-foreground/80">No flashcards generated.</p>;
  const applyAll = async () => {
    await base44.entities.Flashcard.bulkCreate(
      flashcards.map((f) => ({
        ...f,
        knowledge_id: entityType === "knowledge" ? id : undefined,
        learning_item_id: entityType === "learning" ? id : undefined,
        workspace,
      }))
    );
    toast({ description: `${flashcards.length} flashcards created.` });
    clear();
  };
  return (
    <div className="space-y-2">
      {flashcards.map((f, i) => (
        <div key={i} className="rounded-lg bg-secondary/40 p-2.5">
          <p className="text-xs font-medium text-foreground/90">{f.front}</p>
          <p className="text-xs text-muted-foreground">{f.back}</p>
        </div>
      ))}
      <Button size="sm" onClick={applyAll} className="w-full">
        Save all as Flashcards
      </Button>
    </div>
  );
}