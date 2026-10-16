import React, { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

// Renders one agent proposal; nothing is written until the user clicks Apply.
export default function ProposalCard({ proposal }) {
  const [state, setState] = useState("idle");
  const { type, title, description, due_date, priority, content } = proposal;
  const isTask = type === "task";

  const apply = async () => {
    setState("saving");
    if (isTask) {
      await base44.entities.Task.create({ title, description, due_date: due_date || undefined, priority: priority || "medium", workspace: "personal" });
    } else {
      await base44.entities.Capture.create({ title, content: content || description || title, status: "inbox", workspace: "personal" });
    }
    setState("done");
  };

  return (
    <div className="my-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{isTask ? "New task" : "New capture"}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
      {(description || content) && <p className="mt-0.5 text-xs text-muted-foreground">{description || content}</p>}
      {isTask && (due_date || priority) && <p className="mt-1 text-xs text-muted-foreground">{[due_date && `Due ${due_date}`, priority && `${priority} priority`].filter(Boolean).join(" · ")}</p>}
      <Button size="sm" className="mt-2" disabled={state !== "idle"} onClick={apply}>
        {state === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : state === "done" ? <><Check className="h-3.5 w-3.5" /> Created</> : "Apply"}
      </Button>
    </div>
  );
}