import React, { useEffect, useState, useCallback } from "react";
import { Plus, Scale, Lightbulb } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import DecisionForm from "@/components/decisions/DecisionForm";
import LessonForm from "@/components/decisions/LessonForm";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function Decisions() {
  const [decisions, setDecisions] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [tab, setTab] = useState("decisions");
  const [query, setQuery] = useState("");
  const [decisionFormOpen, setDecisionFormOpen] = useState(false);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const { workspace } = useWorkspace();

  const load = useCallback(async () => {
    const [d, l] = await Promise.all([
      base44.entities.Decision.filter({ workspace }, "-date", 200),
      base44.entities.Lesson.filter({ workspace }, "-created_date", 200),
    ]);
    setDecisions(d);
    setLessons(l);
  }, [workspace]);

  useEffect(() => {
    load();
  }, [load]);

  const createDecision = async (data) => {
    await base44.entities.Decision.create({ ...data, workspace });
    setDecisionFormOpen(false);
    load();
  };
  const createLesson = async (data) => {
    await base44.entities.Lesson.create({ ...data, workspace });
    setLessonFormOpen(false);
    load();
  };

  const q = query.toLowerCase();
  const filteredDecisions = decisions.filter((d) => `${d.decision} ${d.context} ${d.reasoning}`.toLowerCase().includes(q));
  const filteredLessons = lessons.filter((l) => `${l.title} ${l.learned} ${l.what_happened}`.toLowerCase().includes(q));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Decisions & Lessons</h1>
        <p className="text-sm text-muted-foreground mt-1">Stop useful experience from disappearing.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => (tab === "decisions" ? setDecisionFormOpen(true) : setLessonFormOpen(true))} className="gap-1.5">
          <Plus className="h-4 w-4" /> New {tab === "decisions" ? "Decision" : "Lesson"}
        </Button>
      </div>

      <Input placeholder={`Search ${tab}...`} value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />

      {tab === "decisions" ? (
        filteredDecisions.length === 0 ? (
          <EmptyState icon={Scale} title="No decisions logged" description="Record decisions to track reasoning and outcomes over time." />
        ) : (
          <div className="space-y-3">
            {filteredDecisions.map((d) => (
              <div key={d.id} className="rounded-xl border border-border bg-card/60 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground/90">{d.decision}</p>
                  <StatusBadge value={d.status} />
                </div>
                {d.context && <p className="text-xs text-muted-foreground">Context: {d.context}</p>}
                {d.reasoning && <p className="text-xs text-muted-foreground">Reasoning: {d.reasoning}</p>}
                {d.date && <p className="mt-1 text-xs text-muted-foreground">{d.date}</p>}
              </div>
            ))}
          </div>
        )
      ) : filteredLessons.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No lessons yet" description="Capture what you learned so it isn't lost." />
      ) : (
        <div className="space-y-3">
          {filteredLessons.map((l) => (
            <div key={l.id} className="rounded-xl border border-border bg-card/60 p-4">
              {l.title && <p className="text-sm font-medium text-foreground/90">{l.title}</p>}
              <p className="text-xs text-muted-foreground mt-1">Learned: {l.learned}</p>
              {l.next_time && <p className="text-xs text-muted-foreground">Next time: {l.next_time}</p>}
            </div>
          ))}
        </div>
      )}

      <DecisionForm open={decisionFormOpen} onOpenChange={setDecisionFormOpen} onSave={createDecision} />
      <LessonForm open={lessonFormOpen} onOpenChange={setLessonFormOpen} onSave={createLesson} />
    </div>
  );
}