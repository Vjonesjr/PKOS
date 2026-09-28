import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, ListTodo, FolderKanban, Clock, Library, Scale, GraduationCap, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionCard from "@/components/home/SectionCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function Home() {
  const [data, setData] = useState(null);
  const { workspace, isSeeding } = useWorkspace();

  const load = useCallback(async () => {
    if (isSeeding) return;
    const [tasks, projects, captures, knowledge, decisions, flashcards] = await Promise.all([
      base44.entities.Task.filter({ workspace }, "-updated_date", 60),
      base44.entities.Project.filter({ workspace }, "-updated_date", 30),
      base44.entities.Capture.filter({ workspace, status: "inbox" }, "-created_date", 10),
      base44.entities.Knowledge.filter({ workspace }, "-updated_date", 10),
      base44.entities.Decision.filter({ workspace }, "-updated_date", 5),
      base44.entities.Flashcard.filter({ workspace }, "-last_reviewed", 5),
    ]);
    setData({ tasks, projects, captures, knowledge, decisions, flashcards });
  }, [workspace, isSeeding]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <div key={workspace} className="py-20 text-center text-sm text-muted-foreground">Loading your workspace...</div>;

  const activeProjects = data.projects.filter((p) => p.status === "Active");
  const openTasks = data.tasks.filter((t) => t.status !== "done");
  const priorityRank = { high: 0, medium: 1, low: 2 };
  const priorityTasks = [...openTasks]
    .sort((a, b) => (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1) || (a.due_date || "9999-12-31").localeCompare(b.due_date || "9999-12-31"))
    .slice(0, 6);
  const upcomingTasks = openTasks.filter((t) => t.due_date).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 6);
  const needsReview = data.projects.filter((p) => p.status === "Active" && (!p.next_action || new Date(p.updated_date) < new Date(Date.now() - 14 * 86400000)));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">What matters right now.</p>
      </div>

      {activeProjects.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Current Context</p>
          <div className="flex flex-wrap gap-3">
            {activeProjects.slice(0, 3).map((p) => (
              <Link key={p.id} to={`/project-detail?id=${p.id}`} className="flex-1 min-w-[220px] rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/40">
                <p className="text-sm font-medium text-foreground/90">{p.title}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.next_action || "No next action set"}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SectionCard
          title="Priorities"
          icon={ListTodo}
          viewAllTo="/projects"
          items={priorityTasks}
          emptyIcon={ListTodo}
          emptyText="No open tasks"
          renderItem={(t) => (
            <Link key={t.id} to={`/task-detail?id=${t.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/50">
              <span className="text-sm text-foreground/90 truncate">{t.title}</span>
              <StatusBadge value={t.priority} />
            </Link>
          )}
        />
        <SectionCard
          title="Active Projects"
          icon={FolderKanban}
          viewAllTo="/projects"
          items={activeProjects}
          emptyIcon={FolderKanban}
          emptyText="No active projects"
          renderItem={(p) => (
            <Link key={p.id} to={`/project-detail?id=${p.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/50">
              <span className="text-sm text-foreground/90 truncate">{p.title}</span>
              <StatusBadge value={p.status} />
            </Link>
          )}
        />
        <SectionCard
          title="Recent Captures"
          icon={Inbox}
          viewAllTo="/capture"
          items={data.captures}
          emptyIcon={Inbox}
          emptyText="Inbox is clear"
          renderItem={(c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/50">
              <span className="text-sm text-foreground/90 truncate">{c.title}</span>
              <StatusBadge value={c.type} className="capitalize" />
            </div>
          )}
        />
        <SectionCard
          title="Upcoming Tasks"
          icon={Clock}
          viewAllTo="/projects"
          items={upcomingTasks}
          emptyIcon={Clock}
          emptyText="Nothing due soon"
          renderItem={(t) => (
            <Link key={t.id} to={`/task-detail?id=${t.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/50">
              <span className="text-sm text-foreground/90 truncate">{t.title}</span>
              <span className="text-xs text-muted-foreground">{t.due_date}</span>
            </Link>
          )}
        />
        <SectionCard
          title="Needs Review"
          icon={Lightbulb}
          viewAllTo="/review"
          items={needsReview}
          emptyIcon={Lightbulb}
          emptyText="Nothing stalled"
          renderItem={(p) => (
            <Link key={p.id} to={`/project-detail?id=${p.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/50">
              <span className="text-sm text-foreground/90 truncate">{p.title}</span>
              <span className="text-xs text-amber-400">stalled</span>
            </Link>
          )}
        />
        <SectionCard
          title="Recently Edited Knowledge"
          icon={Library}
          viewAllTo="/knowledge"
          items={data.knowledge}
          emptyIcon={Library}
          emptyText="No knowledge records yet"
          renderItem={(k) => (
            <Link key={k.id} to={`/knowledge-detail?id=${k.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/50">
              <span className="text-sm text-foreground/90 truncate">{k.title}</span>
            </Link>
          )}
        />
        <SectionCard
          title="Recent Decisions"
          icon={Scale}
          viewAllTo="/decisions"
          items={data.decisions}
          emptyIcon={Scale}
          emptyText="No decisions logged"
          renderItem={(d) => (
            <Link key={d.id} to={`/decision-detail?id=${d.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/50">
              <span className="text-sm text-foreground/90 truncate">{d.decision}</span>
            </Link>
          )}
        />
        <SectionCard
          title="Learning Activity"
          icon={GraduationCap}
          viewAllTo="/learning"
          items={data.flashcards.filter((f) => f.last_reviewed)}
          emptyIcon={GraduationCap}
          emptyText="No study activity yet"
          renderItem={(f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/50">
              <span className="text-sm text-foreground/90 truncate">{f.front}</span>
              <StatusBadge value={f.confidence} />
            </div>
          )}
        />
      </div>
    </div>
  );
}