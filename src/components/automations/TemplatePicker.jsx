import React from "react";
import { LayoutTemplate } from "lucide-react";
import { TEMPLATES } from "@/lib/automation/templates";

export default function TemplatePicker({ onPick }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><LayoutTemplate className="h-3.5 w-3.5" /> Start from a template</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <button key={t.name} onClick={() => onPick(t)} className="rounded-xl border border-border bg-card/60 p-3 text-left transition-colors hover:border-primary/40">
            <p className="text-sm font-medium text-foreground">{t.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}