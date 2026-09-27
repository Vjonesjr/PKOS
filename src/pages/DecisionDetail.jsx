import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Link2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import DecisionForm from "@/components/decisions/DecisionForm";
import StatusBadge from "@/components/shared/StatusBadge";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function DecisionDetail() {
  const navigate = useNavigate();
  const id = new URLSearchParams(window.location.search).get("id");
  const [decision, setDecision] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { workspace } = useWorkspace();

  const load = useCallback(async () => {
    try {
      const d = await base44.entities.Decision.get(id);
      setDecision(d);
      const ls = await base44.entities.Lesson.filter({ decision_id: id, workspace }, "-created_date", 100);
      setLessons(ls);
      setProject(d.project_id ? await base44.entities.Project.get(d.project_id).catch(() => null) : null);
    } catch {
      setNotFound(true);
    }
  }, [id, workspace]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (editOpen) base44.entities.Project.filter({ workspace }, "-updated_date", 200).then(setProjects);
  }, [editOpen, workspace]);

  if (notFound) return <div className="py-20 text-center text-sm text-muted-foreground">Decision not found.</div>;
  if (!decision) return <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>;

  const update = async (data) => {
    await base44.entities.Decision.update(id, data);
    setEditOpen(false);
    load();
  };

  const remove = async () => {
    await base44.entities.Decision.delete(id);
    navigate("/decisions");
  };

  const unlinkLesson = async (lessonId) => {
    await base44.entities.Lesson.update(lessonId, { decision_id: "" });
    load();
  };

  const Field = ({ label, value }) => (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{value || "Not set"}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate("/decisions")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Decisions
      </button>

      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-3 flex items-center justify-between">
          <StatusBadge value={decision.status} />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)} aria-label="Edit decision">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={remove} aria-label="Delete decision">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-foreground">{decision.title || decision.decision}</h1>
        {decision.date && <p className="mt-1 text-xs text-muted-foreground">{decision.date}</p>}
        {project && (
          <Link to={`/project-detail?id=${project.id}`} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <Link2 className="h-3 w-3" /> {project.title}
          </Link>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {decision.title && <Field label="Decision" value={decision.decision} />}
          <Field label="Context" value={decision.context} />
          <Field label="Alternatives" value={decision.alternatives} />
          <Field label="Reasoning" value={decision.reasoning} />
          <Field label="Expected Outcome" value={decision.expected_result} />
          <Field label="Actual Outcome" value={decision.actual_result} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground/90">
          <Link2 className="h-3.5 w-3.5" /> Linked Lessons
        </p>
        {lessons.length === 0 ? (
          <p className="text-xs text-muted-foreground">No lessons linked yet.</p>
        ) : (
          <div className="space-y-1.5">
            {lessons.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2">
                <Link to={`/lesson-detail?id=${l.id}`} className="text-sm text-foreground/90 hover:text-primary">
                  {l.title || l.learned}
                </Link>
                <button onClick={() => unlinkLesson(l.id)} className="text-muted-foreground hover:text-destructive" aria-label="Unlink lesson">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DecisionForm open={editOpen} onOpenChange={setEditOpen} initial={decision} onSave={update} projects={projects} />
    </div>
  );
}