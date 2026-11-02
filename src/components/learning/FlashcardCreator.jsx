import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function FlashcardCreator({ learningItemId, knowledgeId, flashcards = [], onChange }) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const { workspace } = useWorkspace();

  const remove = async (card) => {
    if (!window.confirm("Delete this flashcard? This cannot be undone.")) return;
    await base44.entities.Flashcard.delete(card.id);
    onChange?.();
  };

  const add = async () => {
    if (!front.trim() || !back.trim()) return;
    await base44.entities.Flashcard.create({
      front: front.trim(),
      back: back.trim(),
      learning_item_id: learningItemId || undefined,
      knowledge_id: knowledgeId || undefined,
      workspace,
    });
    setFront("");
    setBack("");
    onChange?.();
  };

  return (
    <div className="space-y-3">
      {flashcards.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {flashcards.map((f) => (
            <div key={f.id} className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground/80">{f.front}</p>
                <p className="text-xs text-muted-foreground">{f.back}</p>
              </div>
              <button onClick={() => remove(f)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Delete flashcard" title="Delete flashcard">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input placeholder="Question" value={front} onChange={(e) => setFront(e.target.value)} className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none" />
      <input placeholder="Answer" value={back} onChange={(e) => setBack(e.target.value)} className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none" />
      <Button size="sm" onClick={add} className="w-full">
        Add Flashcard
      </Button>
    </div>
  );
}