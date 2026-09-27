import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const NEXT_DAYS = { low: 1, medium: 3, high: 7 };

export default function FlashcardStudy({ cards, onClose, onDone }) {
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const card = cards[index];

  const rate = async (confidence) => {
    const days = NEXT_DAYS[confidence];
    const next = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await base44.entities.Flashcard.update(card.id, {
      confidence,
      last_reviewed: new Date().toISOString().slice(0, 10),
      next_review_date: next,
      review_count: (card.review_count || 0) + 1,
    });
    if (index + 1 < cards.length) {
      setIndex(index + 1);
      setShowBack(false);
    } else {
      onDone?.();
    }
  };

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {index + 1} / {cards.length}
          </span>
          <button onClick={onClose} className="hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id + showBack}
            initial={{ opacity: 0, rotateX: -8 }}
            animate={{ opacity: 1, rotateX: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowBack((v) => !v)}
            className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{showBack ? "Answer" : "Question"}</p>
            <p className="text-lg font-medium text-foreground">{showBack ? card.back : card.front}</p>
            {!showBack && <p className="mt-4 text-xs text-muted-foreground">Tap to reveal</p>}
          </motion.div>
        </AnimatePresence>
        {showBack && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button variant="outline" className="border-rose-500/30 text-rose-300" onClick={() => rate("low")}>
              Hard
            </Button>
            <Button variant="outline" className="border-amber-500/30 text-amber-300" onClick={() => rate("medium")}>
              Okay
            </Button>
            <Button variant="outline" className="border-emerald-500/30 text-emerald-300" onClick={() => rate("high")}>
              Easy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}