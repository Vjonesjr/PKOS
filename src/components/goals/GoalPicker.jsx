import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/lib/WorkspaceContext";

/** Select a single goal (or none). value: goal id or "". */
export default function GoalPicker({ value, onChange }) {
  const { workspace } = useWorkspace();
  const [goals, setGoals] = useState([]);
  useEffect(() => {
    base44.entities.Goal.filter({ workspace, status: { $in: ["Active", "Draft", "Paused"] } }, { limit: 100, fields: ["title"] }).then((r) => setGoals(r.items));
  }, [workspace]);

  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
      <SelectTrigger aria-label="Supports goal"><SelectValue placeholder="Supports goal" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No goal</SelectItem>
        {goals.map((g) => <SelectItem key={g.id} value={g.id}>🎯 {g.title}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}