import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Scale } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DecisionForm from "@/components/decisions/DecisionForm";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { useWorkspace } from "@/lib/WorkspaceContext";

const STATUSES = ["pending", "made", "reviewed"];

export default function Decisions() {
  const [decisions, setDecisions] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const { workspace, isSeeding } = useWorkspace();

  const load = useCallback(async () => {
    if (isSeeding) return;
    const [d, l, p] = await Promise.all([
      base44.entities.Decision.filter({ workspace }, "-date", 200),
      base44.entities.Lesson.filter({ workspace }, "-created_date", 200),
      base44.entities.Project.filter({ workspace }, "-updated_date", 200),
    ]);
    setDecisions(d);
    setLessons(l);
    setProjects(p);
  }, [workspace, isSeeding]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data) => {
    await base44.entities.Decision.create({ ...data, workspace });
    setFormOpen(false);
    load();
  };

  const projectTitle = (id) => projects.find((p) => p.id === id)?.title;
  const q = query.toLowerCase();
  const filtered = decisions
    .filter((d) => statusFilter === "all" || d.status === statusFilter)
    .filter((d) => projectFilter === "all" || d.project_id === projectFilter)
    .filter((d) => `${d.title} ${d.decision} ${d.context} ${d.reasoning}`.toLowerCase().includes(q));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight pk-grad-text">Decisions</h1>
          <p className="text-sm text-muted-foreground mt-1">Track reasoning and outcomes over time.</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Decision
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Input placeholder="Search decisions..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Scale} title="No decisions found" description="Record decisions to track reasoning and outcomes over time." />
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const linkedLessonCount = lessons.filter((l) => l.decision_id === d.id).length;
            return (
              <Link key={d.id} to={`/decision-detail?id=${d.id}`} className="block rounded-xl border border-primary/25 bg-card/40 pk-glass p-4 transition-colors hover:border-primary/40">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground/90">{d.title || d.decision}</p>
                  <StatusBadge value={d.status} />
                </div>
                {d.title && <p className="text-xs text-muted-foreground line-clamp-2">{d.decision}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {d.project_id && projectTitle(d.project_id) && <span>Project: {projectTitle(d.project_id)}</span>}
                  {d.date && <span>{d.date}</span>}
                  {linkedLessonCount > 0 && <span>{linkedLessonCount} linked lesson{linkedLessonCount > 1 ? "s" : ""}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <DecisionForm open={formOpen} onOpenChange={setFormOpen} onSave={create} projects={projects} />
    </div>
  );
}