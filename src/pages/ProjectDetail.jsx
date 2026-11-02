import ProjectFinishPanel from "@/components/mvp/ProjectFinishPanel";
import SupportPlan from "@/components/support/SupportPlan";
import usePageBack from "@/hooks/usePageBack";
import ProjectReferences from "@/components/projects/ProjectReferences";
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Archive } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ProjectForm from "@/components/projects/ProjectForm";
import MilestoneEditor from "@/components/projects/MilestoneEditor";
import ProjectTasks from "@/components/projects/ProjectTasks";
import ProjectDecisions from "@/components/projects/ProjectDecisions";
import ProjectLessons from "@/components/projects/ProjectLessons";
import RelatedFromOthers from "@/components/projects/RelatedFromOthers";
import LinkedItems from "@/components/shared/LinkedItems";
import ProjectCopilot from "@/components/copilot/ProjectCopilot";
import StatusBadge from "@/components/shared/StatusBadge";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const goBack = usePageBack("/projects");
  const id = new URLSearchParams(window.location.search).get("id");
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { workspace, isSeeding } = useWorkspace();

  const load = useCallback(async () => {
    if (isSeeding) return;
    try {
      const p = await base44.entities.Project.get(id);
      if (!p || p.workspace !== workspace) throw new Error("Project not found");
      const [t, d, l] = await Promise.all([
        base44.entities.Task.filter({ project_id: id, workspace, archived: { $ne: true } }, "-created_date", 100),
        base44.entities.Decision.filter({ project_id: id, workspace }, "-date", 100),
        base44.entities.Lesson.filter({ project_id: id, workspace }, "-created_date", 100),
      ]);
      setNotFound(false);
      setProject(p);
      setTasks(t);
      setDecisions(d);
      setLessons(l);
    } catch {
      setNotFound(true);
    }
  }, [id, workspace, isSeeding]);

  useEffect(() => {
    load();
  }, [load]);

  if (notFound) return <div className="py-20 text-center text-sm text-muted-foreground">Project not found.</div>;
  if (!project) return <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>;

  const update = async (data) => {
    await base44.entities.Project.update(id, data);
    setEditOpen(false);
    load();
  };

  const archiveProject = async () => {
    await base44.entities.Project.update(id, { status: "Archived" });
    navigate("/projects");
  };

  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="rounded-2xl border border-primary/25 bg-card/40 pk-glass p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-2">
            <StatusBadge value={project.status} />
            <StatusBadge value={project.priority} />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)} aria-label="Edit project">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={archiveProject} aria-label="Archive project" title="Archive project">
              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        <h1 className="text-xl font-bold pk-grad-text">{project.title}</h1>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">What is this?</p>
            <p className="text-sm text-foreground/80">{project.description || "No description yet."}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current state</p>
            <p className="text-sm text-foreground/80">
              {doneCount}/{tasks.length} tasks done · {project.progress || 0}% progress
            </p>
            <Progress value={project.progress || 0} className="mt-2 h-2 bg-secondary/50 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next action</p>
            <p className="text-sm text-foreground/80">{project.next_action || "Not set"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">What's blocking progress?</p>
            <p className="text-sm text-foreground/80">{project.blockers || "Nothing blocking"}</p>
          </div>
        </div>

      </div>

      <ProjectFinishPanel key={project.id} project={project} tasks={tasks} onChanged={load} />
      <ProjectCopilot project={project} onChange={load} />
      <SupportPlan key={"project-"+project.id} type="project" record={project} workspace={workspace} />

      <RelatedFromOthers projectId={id} projectTags={project.tags || []} />

      <div className="rounded-2xl border border-primary/25 bg-card/40 pk-glass p-6">
        <p className="mb-3 text-sm font-semibold text-foreground/90">Milestones</p>
        <MilestoneEditor project={project} workspace={workspace} milestones={project.milestones} onChange={(m) => update({ milestones: m })} />
      </div>

      <div className="rounded-2xl border border-primary/25 bg-card/40 pk-glass p-6">
        <p className="mb-3 text-sm font-semibold text-foreground/90">Tasks</p>
        <ProjectTasks tasks={tasks} projectId={id} onChange={load} />
      </div>

      <div className="rounded-2xl border border-primary/25 bg-card/40 pk-glass p-6">
        <p className="mb-3 text-sm font-semibold text-foreground/90">Knowledge</p>
        <LinkedItems recordType="project" recordId={id} allowedTypes={["knowledge"]} filterTypes={["knowledge"]} />
      </div>

      <div className="rounded-2xl border border-primary/25 bg-card/40 pk-glass p-6">
        <p className="mb-3 text-sm font-semibold text-foreground/90">Decisions</p>
        <ProjectDecisions decisions={decisions} projectId={id} onChange={load} />
      </div>

      <div className="rounded-2xl border border-primary/25 bg-card/40 pk-glass p-6">
        <p className="mb-3 text-sm font-semibold text-foreground/90">Lessons</p>
        <ProjectLessons lessons={lessons} projectId={id} onChange={load} />
      </div>

      <div className="rounded-2xl border border-primary/25 bg-card/40 pk-glass p-6">
        <p className="mb-3 text-sm font-semibold text-foreground/90">Files / References</p>
        <ProjectReferences references={project.references || []} onChange={(refs) => update({ references: refs })} />
      </div>

      <ProjectForm open={editOpen} onOpenChange={setEditOpen} initial={project} onSave={update} />
    </div>
  );
}