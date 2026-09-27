import React, { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowRightCircle, StickyNote, ListTodo, FolderPlus, Scale, GraduationCap } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ConvertMenu({ capture, onConverted }) {
  const [loading, setLoading] = useState(false);

  const markProcessed = async (type, id) => {
    await base44.entities.Capture.update(capture.id, { status: "processed", converted_to_type: type, converted_to_id: id });
    onConverted?.();
  };

  const convert = async (target) => {
    setLoading(true);
    try {
      if (target === "knowledge") {
        const rec = await base44.entities.Knowledge.create({ title: capture.title, content: capture.content, tags: capture.tags, project_id: capture.project_id });
        await markProcessed("knowledge", rec.id);
      } else if (target === "task") {
        const rec = await base44.entities.Task.create({ title: capture.title, description: capture.content, project_id: capture.project_id, source_capture_id: capture.id });
        await markProcessed("task", rec.id);
      } else if (target === "project") {
        const rec = await base44.entities.Project.create({ title: capture.title, description: capture.content });
        await markProcessed("project", rec.id);
      } else if (target === "decision") {
        const rec = await base44.entities.Decision.create({ decision: capture.title, context: capture.content, project_id: capture.project_id });
        await markProcessed("decision", rec.id);
      } else if (target === "learning") {
        const rec = await base44.entities.LearningItem.create({ title: capture.title, content: capture.content, project_id: capture.project_id });
        await markProcessed("learning", rec.id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={loading} className="h-8 gap-1.5 text-xs">
          <ArrowRightCircle className="h-3.5 w-3.5" /> Convert
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => convert("knowledge")}>
          <StickyNote className="mr-2 h-3.5 w-3.5" /> To Knowledge
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => convert("task")}>
          <ListTodo className="mr-2 h-3.5 w-3.5" /> To Task
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => convert("project")}>
          <FolderPlus className="mr-2 h-3.5 w-3.5" /> To Project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => convert("decision")}>
          <Scale className="mr-2 h-3.5 w-3.5" /> To Decision
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => convert("learning")}>
          <GraduationCap className="mr-2 h-3.5 w-3.5" /> To Learning
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}