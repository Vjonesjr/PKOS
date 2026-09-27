import React, { useEffect, useState, useCallback } from "react";
import { History, Sun, CalendarDays } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import AIActionRunner from "@/components/ai/AIActionRunner";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function Review() {
  const [tab, setTab] = useState("timeline");
  const [events, setEvents] = useState([]);
  const { workspace, isSeeding } = useWorkspace();

  const load = useCallback(async () => {
    if (isSeeding) return;
    const [tasks, captures, decisions, lessons, knowledge, projects] = await Promise.all([
      base44.entities.Task.filter({ workspace }, "-updated_date", 40),
      base44.entities.Capture.filter({ workspace }, "-created_date", 40),
      base44.entities.Decision.filter({ workspace }, "-updated_date", 20),
      base44.entities.Lesson.filter({ workspace }, "-created_date", 20),
      base44.entities.Knowledge.filter({ workspace }, "-updated_date", 30),
      base44.entities.Project.filter({ workspace }, "-updated_date", 30),
    ]);
    const items = [
      ...tasks.map((t) => ({ id: `task-${t.id}`, date: t.updated_date, label: t.status === "done" ? `Completed task: ${t.title}` : `Task updated: ${t.title}` })),
      ...captures.map((c) => ({ id: `cap-${c.id}`, date: c.created_date, label: `Captured: ${c.title}` })),
      ...decisions.map((d) => ({ id: `dec-${d.id}`, date: d.updated_date, label: `Decision: ${d.decision}` })),
      ...lessons.map((l) => ({ id: `les-${l.id}`, date: l.created_date, label: `Lesson: ${l.learned}` })),
      ...knowledge.map((k) => ({ id: `kno-${k.id}`, date: k.updated_date, label: `Knowledge edited: ${k.title}` })),
      ...projects.map((p) => ({ id: `proj-${p.id}`, date: p.updated_date, label: `Project updated: ${p.title}` })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    setEvents(items.slice(0, 60));
  }, [workspace, isSeeding]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Review</h1>
        <p className="text-sm text-muted-foreground mt-1">See how your ideas and projects developed over time.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="daily">Daily Review</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Review</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "timeline" &&
        (events.length === 0 ? (
          <EmptyState icon={History} title="Nothing recorded yet" />
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-4 py-2.5">
                <span className="text-sm text-foreground/90">{e.label}</span>
                <span className="text-xs text-muted-foreground">{e.date ? new Date(e.date).toLocaleString() : ""}</span>
              </div>
            ))}
          </div>
        ))}

      {tab === "daily" && (
        <AIActionRunner
          title="Prepare Daily Review"
          description="Summarize what happened today and what to focus on tomorrow."
          icon={Sun}
          action="daily_review"
          payload={{ workspace }}
          renderResult={(r) => <ReviewResult result={r} />}
        />
      )}

      {tab === "weekly" && (
        <AIActionRunner
          title="Prepare Weekly Review"
          description="Summarize the week's progress, stalled projects, and lessons."
          icon={CalendarDays}
          action="weekly_review"
          payload={{ workspace }}
          renderResult={(r) => <ReviewResult result={r} />}
        />
      )}
    </div>
  );
}

function ReviewResult({ result }) {
  const Section = ({ title, list }) =>
    list?.length > 0 && (
      <div className="mb-3">
        <p className="text-xs font-semibold text-foreground/80 mb-1">{title}</p>
        <ul className="list-disc list-inside space-y-0.5">
          {list.map((item, i) => (
            <li key={i} className="text-sm text-foreground/80">
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  return (
    <div>
      <Section title="Completed" list={result.completed} />
      <Section title="Unfinished" list={result.unfinished} />
      <Section title="New Captures" list={result.new_captures} />
      <Section title="Priorities" list={result.priorities} />
      <Section title="Stalled Projects" list={result.stalled_projects} />
    </div>
  );
}