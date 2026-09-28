import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, GraduationCap, Sparkles, Pencil } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import LearningItemForm from "@/components/learning/LearningItemForm";
import FlashcardStudy from "@/components/learning/FlashcardStudy";
import FlashcardCreator from "@/components/learning/FlashcardCreator";
import LearningOverview from "@/components/learning/LearningOverview";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import LinkedItems from "@/components/shared/LinkedItems";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function Learning() {
  const [items, setItems] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [studying, setStudying] = useState(false);
  const { workspace, isSeeding } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (isSeeding) return;
    const [li, fc] = await Promise.all([
      base44.entities.LearningItem.filter({ workspace }, "-updated_date", 100),
      base44.entities.Flashcard.filter({ workspace }, "-created_date", 300),
    ]);
    setItems(li);
    setFlashcards(fc);
    const requestedId = new URLSearchParams(location.search).get("id");
    setSelected((current) => {
      const id = requestedId || current?.id;
      return id ? li.find((item) => item.id === id) || null : null;
    });
  }, [workspace, isSeeding, location.search]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data) => {
    const item = await base44.entities.LearningItem.create({ ...data, workspace });
    setFormOpen(false);
    navigate(`/learning?id=${item.id}`);
    load();
  };

  const update = async (data) => {
    if (!selected) return;
    await base44.entities.LearningItem.update(selected.id, data);
    setEditOpen(false);
    await load();
  };

  const selectItem = (item) => {
    setSelected(item);
    navigate(`/learning?id=${item.id}`, { replace: true });
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

      <LearningOverview items={items} flashcards={flashcards} dueCount={dueCards.length} onStudy={() => setStudying(true)} />

      {items.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No learning material yet" description="Add courses, topics, or resources to start building flashcards." />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <button key={item.id} onClick={() => selectItem(item)} className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${selected?.id === item.id ? "border-primary/50 bg-primary/5" : "border-border bg-card/60"}`}>
                <div className="flex items-center gap-1.5">
                  <StatusBadge value={item.type} />
                  <StatusBadge value={item.status} />
                </div>
                <p className="mt-2 text-sm font-medium text-foreground/90">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">{flashcards.filter((f) => f.learning_item_id === item.id).length} flashcards</p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-5">
            {selected ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground/90">{selected.title}</p>
                  <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)} className="h-8 gap-1" aria-label="Edit learning item">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">{selected.content || "No notes yet."}</p>
                <FlashcardCreator learningItemId={selected.id} flashcards={flashcards.filter((f) => f.learning_item_id === selected.id)} onChange={load} />
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
      <LearningItemForm open={editOpen} onOpenChange={setEditOpen} onSave={update} initial={selected} />
      {studying && <FlashcardStudy cards={dueCards} onClose={() => setStudying(false)} onDone={() => { setStudying(false); load(); }} />}
    </div>
  );
}