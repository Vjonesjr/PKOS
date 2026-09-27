import React, { useEffect, useState, useCallback } from "react";
import { Plus, Scale, Lightbulb, X, Link2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { workspace, isSeeding } = useWorkspace();

  const load = useCallback(async () => {
    if (isSeeding) return;
    const [d, l] = await Promise.all([
      base44.entities.Decision.filter({ workspace }, "-date", 200),
      base44.entities.Lesson.filter({ workspace }, "-created_date", 200),
    ]);
    setDecisions(d);
    setLessons(l);
  }, [workspace, isSeeding]);

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

  const linkLessonToDecision = async (lessonId, decisionId) => {
    await base44.entities.Lesson.update(lessonId, { decision_id: decisionId || undefined });
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
            {filteredDecisions.map((d) => {
              const linkedLessons = lessons.filter((l) => l.decision_id === d.id);
              const unlinkedLessons = lessons.filter((l) => l.decision_id !== d.id);
              return (
                <div key={d.id} className="rounded-xl border border-border bg-card/60 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground/90">{d.decision}</p>
                    <StatusBadge value={d.status} />
                  </div>
                  {d.context && <p className="text-xs text-muted-foreground">Context: {d.context}</p>}
                  {d.reasoning && <p className="text-xs text-muted-foreground">Reasoning: {d.reasoning}</p>}
                  {d.date && <p className="mt-1 text-xs text-muted-foreground">{d.date}</p>}

                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Link2 className="h-3 w-3" /> Linked Lessons
                    </p>
                    {linkedLessons.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No lessons linked yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {linkedLessons.map((l) => (
                          <span key={l.id} className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/90">
                            <button onClick={() => setTab("lessons")} className="hover:text-primary">{l.title || l.learned}</button>
                            <button onClick={() => linkLessonToDecision(l.id, null)} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {unlinkedLessons.length > 0 && (
                      <Select value="__pick" onValueChange={(v) => linkLessonToDecision(v, d.id)}>
                        <SelectTrigger className="mt-2 h-7 w-44 text-xs">
                          <SelectValue placeholder="+ Link a lesson" />
                        </SelectTrigger>
                        <SelectContent>
                          {unlinkedLessons.map((l) => (
                            <SelectItem key={l.id} value={l.id}>{l.title || l.learned}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredLessons.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No lessons yet" description="Capture what you learned so it isn't lost." />
      ) : (
        <div className="space-y-3">
          {filteredLessons.map((l) => {
            const linkedDecision = decisions.find((d) => d.id === l.decision_id);
            return (
              <div key={l.id} className="rounded-xl border border-border bg-card/60 p-4">
                {l.title && <p className="text-sm font-medium text-foreground/90">{l.title}</p>}
                <p className="text-xs text-muted-foreground mt-1">Learned: {l.learned}</p>
                {l.next_time && <p className="text-xs text-muted-foreground">Next time: {l.next_time}</p>}
                {linkedDecision && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/90">
                      <button onClick={() => setTab("decisions")} className="flex items-center gap-1 hover:text-primary">
                        <Link2 className="h-3 w-3" /> {linkedDecision.decision}
                      </button>
                      <button onClick={() => linkLessonToDecision(l.id, null)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DecisionForm open={decisionFormOpen} onOpenChange={setDecisionFormOpen} onSave={createDecision} />
      <LessonForm open={lessonFormOpen} onOpenChange={setLessonFormOpen} onSave={createLesson} decisions={decisions} />
    </div>
  );
}