import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import LessonForm from "@/components/decisions/LessonForm";
import EmptyState from "@/components/shared/EmptyState";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function ProjectLessons({ lessons, projectId, onChange }) {
  const [formOpen, setFormOpen] = useState(false);
  const { workspace } = useWorkspace();

  const create = async (data) => {
    await base44.entities.Lesson.create({ ...data, workspace });
    setFormOpen(false);
    onChange();
  };

  return (
    <div className="space-y-2">
      {lessons.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No lessons yet" />
      ) : (
        lessons.map((l) => (
          <Link key={l.id} to={`/lesson-detail?id=${l.id}`} className="block rounded-lg border border-border bg-secondary/40 px-3 py-2 hover:border-primary/40">
            {l.title && <p className="text-sm text-foreground/90">{l.title}</p>}
            <p className="text-xs text-muted-foreground mt-0.5">Learned: {l.learned}</p>
          </Link>
        ))
      )}
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setFormOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add Lesson
      </Button>
      <LessonForm open={formOpen} onOpenChange={setFormOpen} onSave={create} projectId={projectId} />
    </div>
  );
}