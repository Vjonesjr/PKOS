import React, { useEffect, useState, useCallback } from "react";
import { Plus, GraduationCap, PlayCircle, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import LearningItemForm from "@/components/learning/LearningItemForm";
import FlashcardStudy from "@/components/learning/FlashcardStudy";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import LinkedItems from "@/components/shared/LinkedItems";

export default function Learning() {
  const [items, setItems] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [studying, setStudying] = useState(false);

  const load = useCallback(async () => {
    const [li, fc] = await Promise.all([base44.entities.LearningItem.list("-updated_date", 100), base44.entities.Flashcard.list("-created_date", 300)]);
    setItems(li);
    setFlashcards(fc);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data) => {
    await base44.entities.LearningItem.create(data);
    setFormOpen(false);
    load();
  };

  const dueCards = flashcards.filter((f) => !selected || f.learning_item_id === selected?.id).filter((f) => !f.next_review_date || f.next_review_date <= new Date().toISOString().slice(0, 10));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Learning</h1>
          <p className="text-sm text-muted-foreground mt-1">Study, review, and retain what matters.</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Learning Item
        </Button>
      </div>

      {flashcards.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div>
            <p className="text-sm font-medium text-foreground/90">{dueCards.length} flashcards due for review</p>
            <p className="text-xs text-muted-foreground">Across all your learning material</p>
          </div>
          <Button onClick={() => setStudying(true)} disabled={dueCards.length === 0} className="gap-1.5">
            <PlayCircle className="h-4 w-4" /> Study Now
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No learning material yet" description="Add courses, topics, or resources to start building flashcards." />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <button key={item.id} onClick={() => setSelected(item)} className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${selected?.id === item.id ? "border-primary/50 bg-primary/5" : "border-border bg-card/60"}`}>
                <StatusBadge value={item.type} />
                <p className="mt-2 text-sm font-medium text-foreground/90">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">{flashcards.filter((f) => f.learning_item_id === item.id).length} flashcards</p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-5">
            {selected ? (
              <>
                <p className="mb-3 text-sm font-semibold text-foreground/90">{selected.title}</p>
                <FlashcardManager learningItem={selected} flashcards={flashcards.filter((f) => f.learning_item_id === selected.id)} onChange={load} />
                <div className="mt-5">
                  <LinkedItems recordType="learning" recordId={selected.id} />
                </div>
              </>
            ) : (
              <EmptyState icon={Sparkles} title="Select an item" description="Pick a learning item to manage its flashcards." />
            )}
          </div>
        </div>
      )}

      <LearningItemForm open={formOpen} onOpenChange={setFormOpen} onSave={create} />
      {studying && <FlashcardStudy cards={dueCards} onClose={() => setStudying(false)} onDone={() => { setStudying(false); load(); }} />}
    </div>
  );
}

function FlashcardManager({ learningItem, flashcards, onChange }) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const add = async () => {
    if (!front.trim() || !back.trim()) return;
    await base44.entities.Flashcard.create({ front, back, learning_item_id: learningItem.id });
    setFront("");
    setBack("");
    onChange();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {flashcards.map((f) => (
          <div key={f.id} className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <p className="text-xs font-medium text-foreground/80">{f.front}</p>
            <p className="text-xs text-muted-foreground">{f.back}</p>
          </div>
        ))}
      </div>
      <input placeholder="Front" value={front} onChange={(e) => setFront(e.target.value)} className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none" />
      <input placeholder="Back" value={back} onChange={(e) => setBack(e.target.value)} className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none" />
      <Button size="sm" onClick={add} className="w-full">
        Add Flashcard
      </Button>
    </div>
  );
}