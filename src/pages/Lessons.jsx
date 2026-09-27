import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Lightbulb } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LessonForm from "@/components/decisions/LessonForm";
import EmptyState from "@/components/shared/EmptyState";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [knowledgeOptions, setKnowledgeOptions] = useState([]);
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const { workspace, isSeeding } = useWorkspace();

  const load = useCallback(async () => {
    if (isSeeding) return;
    const [l, d, p, k] = await Promise.all([
      base44.entities.Lesson.filter({ workspace }, "-created_date", 200),
      base44.entities.Decision.filter({ workspace }, "-date", 200),
      base44.entities.Project.filter({ workspace }, "-updated_date", 200),
      base44.entities.Knowledge.filter({ workspace }, "-updated_date", 200),
    ]);
    setLessons(l);
    setDecisions(d);
    setProjects(p);
    setKnowledgeOptions(k);
  }, [workspace, isSeeding]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data) => {
    await base44.entities.Lesson.create({ ...data, workspace });
    setFormOpen(false);
    load();
  };

  const projectTitle = (id) => projects.find((p) => p.id === id)?.title;
  const q = query.toLowerCase();
  const filtered = lessons
    .filter((l) => projectFilter === "all" || l.project_id === projectFilter)
    .filter((l) => `${l.title} ${l.learned} ${l.what_happened}`.toLowerCase().includes(q));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Lessons</h1>
          <p className="text-sm text-muted-foreground mt-1">Stop useful experience from disappearing.</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Lesson
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Input placeholder="Search lessons..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
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
        <EmptyState icon={Lightbulb} title="No lessons found" description="Capture what you learned so it isn't lost." />
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const linkedDecision = decisions.find((d) => d.id === l.decision_id);
            return (
              <Link key={l.id} to={`/lesson-detail?id=${l.id}`} className="block rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/40">
                {l.title && <p className="text-sm font-medium text-foreground/90">{l.title}</p>}
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Learned: {l.learned}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {l.project_id && projectTitle(l.project_id) && <span>Project: {projectTitle(l.project_id)}</span>}
                  {linkedDecision && <span>Decision: {linkedDecision.title || linkedDecision.decision}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <LessonForm open={formOpen} onOpenChange={setFormOpen} onSave={create} projects={projects} decisions={decisions} knowledgeOptions={knowledgeOptions} />
    </div>
  );
}