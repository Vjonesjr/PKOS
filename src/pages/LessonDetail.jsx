import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Link2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import LessonForm from "@/components/decisions/LessonForm";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function LessonDetail() {
  const navigate = useNavigate();
  const id = new URLSearchParams(window.location.search).get("id");
  const [lesson, setLesson] = useState(null);
  const [project, setProject] = useState(null);
  const [decision, setDecision] = useState(null);
  const [knowledge, setKnowledge] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [knowledgeOptions, setKnowledgeOptions] = useState([]);
  const { workspace } = useWorkspace();

  const load = useCallback(async () => {
    try {
      const l = await base44.entities.Lesson.get(id);
      if (!l || l.workspace !== workspace) throw new Error("Lesson not found");
      setNotFound(false);
      setLesson(l);
      const [p, d, k] = await Promise.all([
        l.project_id ? base44.entities.Project.get(l.project_id).catch(() => null) : Promise.resolve(null),
        l.decision_id ? base44.entities.Decision.get(l.decision_id).catch(() => null) : Promise.resolve(null),
        l.knowledge_id ? base44.entities.Knowledge.get(l.knowledge_id).catch(() => null) : Promise.resolve(null),
      ]);
      setProject(p?.workspace === workspace ? p : null);
      setDecision(d?.workspace === workspace ? d : null);
      setKnowledge(k?.workspace === workspace ? k : null);
    } catch {
      setNotFound(true);
    }
  }, [id, workspace]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!editOpen) return;
    base44.entities.Project.filter({ workspace }, "-updated_date", 200).then(setProjects);
    base44.entities.Decision.filter({ workspace }, "-date", 200).then(setDecisions);
    base44.entities.Knowledge.filter({ workspace }, "-updated_date", 200).then(setKnowledgeOptions);
  }, [editOpen, workspace]);

  if (notFound) return <div className="py-20 text-center text-sm text-muted-foreground">Lesson not found.</div>;
  if (!lesson) return <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>;

  const update = async (data) => {
    await base44.entities.Lesson.update(id, data);
    setEditOpen(false);
    load();
  };

  const remove = async () => {
    if (!window.confirm("Delete this lesson? This cannot be undone.")) return;
    const sourceCaptures = await base44.entities.Capture.filter({ workspace, converted_to_type: "lesson", converted_to_id: id }, "-created_date", 100);
    await Promise.all(sourceCaptures.map((capture) => base44.entities.Capture.update(capture.id, { status: "inbox", converted_to_type: "", converted_to_id: "" })));
    await base44.entities.Lesson.delete(id);
    navigate("/lessons");
  };

  const Field = ({ label, value }) => (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{value || "Not set"}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate("/lessons")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Lessons
      </button>

      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-3 flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)} aria-label="Edit lesson">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={remove} aria-label="Delete lesson">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
        <h1 className="text-xl font-semibold text-foreground">{lesson.title || "Lesson"}</h1>

        <div className="mt-3 flex flex-wrap gap-2">
          {project && (
            <Link to={`/project-detail?id=${project.id}`} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/90 hover:text-primary">
              <Link2 className="h-3 w-3" /> {project.title}
            </Link>
          )}
          {decision && (
            <Link to={`/decision-detail?id=${decision.id}`} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/90 hover:text-primary">
              <Link2 className="h-3 w-3" /> {decision.title || decision.decision}
            </Link>
          )}
          {knowledge && (
            <Link to={`/knowledge-detail?id=${knowledge.id}`} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/90 hover:text-primary">
              <Link2 className="h-3 w-3" /> {knowledge.title}
            </Link>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="What happened" value={lesson.what_happened} />
          <Field label="What worked" value={lesson.what_worked} />
          <Field label="What didn't work" value={lesson.what_didnt} />
          <Field label="What to do differently" value={lesson.next_time} />
          <div className="sm:col-span-2">
            <Field label="Lesson learned" value={lesson.learned} />
          </div>
        </div>
      </div>

      <LessonForm open={editOpen} onOpenChange={setEditOpen} initial={lesson} onSave={update} projects={projects} decisions={decisions} knowledgeOptions={knowledgeOptions} />
    </div>
  );
}