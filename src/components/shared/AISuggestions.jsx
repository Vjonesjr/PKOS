import React from "react";
import StepGenerator from "@/components/shared/StepGenerator";

/** Compatibility wrapper. All AI generation is routed through the authenticated aiAssist backend. */
export default function AISuggestions({ mode, workspace, parentId, existing = [], onSave }) {
  return <StepGenerator
    action={mode === "task" ? "generate_subtasks" : "suggest_milestones"}
    workspace={workspace}
    parentId={parentId}
    existingTitles={existing}
    label={mode === "task" ? "Generate subtasks with AI" : "Suggest milestones with AI"}
    onAccept={onSave}
  />;
}
