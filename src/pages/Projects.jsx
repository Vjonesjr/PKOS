import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderKanban } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import ProjectForm from "@/components/projects/ProjectForm";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

const STATUSES = ["Active", "Planned", "Idea", "Waiting", "Completed", "Archived"];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setProjects(await base44.entities.Project.list("-updated_date", 200));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data) => {
    const p = await base44.entities.Project.create(data);
    setFormOpen(false);
    load();
    window.location.href = `/project-detail?id=${p.id}`;
  };

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
        <div className="space-y-8">
          {STATUSES.map((status) => {
            const group = projects.filter((p) => p.status === status);
            if (group.length === 0) return null;
            return (
              <div key={status}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{status}</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((p) => (
                    <Link key={p.id} to={`/project-detail?id=${p.id}`} className="rounded-xl border border-border bg-card/60 p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5">
                      <div className="mb-2 flex items-center justify-between">
                        <StatusBadge value={p.status} />
                        <StatusBadge value={p.priority} />
                      </div>
                      <p className="text-sm font-medium text-foreground/90">{p.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.next_action || "No next action set"}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectForm open={formOpen} onOpenChange={setFormOpen} onSave={create} />
    </div>
  );
}