import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderKanban, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProjectForm from "@/components/projects/ProjectForm";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { useWorkspace } from "@/lib/WorkspaceContext";

const STATUSES = ["Active", "Planned", "Idea", "Waiting", "Completed", "Archived"];
const PRIORITIES = ["low", "medium", "high"];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const { workspace } = useWorkspace();

  const load = useCallback(async () => {
    setProjects(await base44.entities.Project.filter({ workspace }, "-updated_date", 200));
  }, [workspace]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data) => {
    const p = await base44.entities.Project.create({ ...data, workspace });
    setFormOpen(false);
    load();
    window.location.href = `/project-detail?id=${p.id}`;
  };

  const filtered = projects
    .filter((p) => (statusFilter === "all" ? true : p.status === statusFilter))
    .filter((p) => (priorityFilter === "all" ? true : p.priority === priorityFilter));

  const visibleStatuses = statusFilter === "all" ? STATUSES : [statusFilter];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Turn knowledge into action.</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Start a project to turn ideas into progress." />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No matching projects" description="Try a different status or priority filter." />
          ) : (
            <div className="space-y-8">
              {visibleStatuses.map((status) => {
                const group = filtered.filter((p) => p.status === status);
                if (group.length === 0) return null;
                return (
                  <div key={status}>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{status}</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {group.map((p) => (
                        <Link key={p.id} to={`/project-detail?id=${p.id}`} className="rounded-xl border border-border bg-card/60 p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StatusBadge value={p.status} />
                              <StatusBadge value={p.priority} />
                            </div>
                            {p.blockers && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                          </div>
                          <p className="text-sm font-medium text-foreground/90">{p.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.next_action || "No next action set"}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <Progress value={p.progress || 0} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground">{p.progress || 0}%</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <ProjectForm open={formOpen} onOpenChange={setFormOpen} onSave={create} />
    </div>
  );
}