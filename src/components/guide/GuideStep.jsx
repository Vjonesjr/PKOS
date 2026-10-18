import React from "react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** One tutorial step: what it is, how to use it, and a button to try it on demo data. */
export default function GuideStep({ step, index, done, onTry, onToggle }) {
  return (
    <div className={`rounded-xl border p-4 ${done ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle} aria-label={done ? "Mark step not done" : "Mark step done"} className="mt-0.5 shrink-0">
          {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{index + 1}. {step.title}</p>
          <p className="text-xs text-muted-foreground">{step.why}</p>
          <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-xs text-foreground/90">
            {step.how.map((h) => <li key={h}>{h}</li>)}
          </ol>
          <Button size="sm" variant="outline" onClick={onTry} className="mt-3 h-8 gap-1 text-xs">
            Try it on demo data <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}