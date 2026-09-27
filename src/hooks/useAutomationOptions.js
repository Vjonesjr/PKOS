import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Projects and link targets (learning + knowledge) for the recipe builder.
export default function useAutomationOptions(workspace) {
  const [projects, setProjects] = useState([]);
  const [targets, setTargets] = useState([]);
  useEffect(() => {
    Promise.all([
      base44.entities.Project.filter({ workspace }, "title", 200),
      base44.entities.LearningItem.filter({ workspace }, "title", 200),
      base44.entities.Knowledge.filter({ workspace }, "title", 200),
    ]).then(([p, l, k]) => {
      setProjects(p);
      setTargets([...l.map((x) => ({ id: x.id, title: x.title, type: "learning" })), ...k.map((x) => ({ id: x.id, title: x.title, type: "knowledge" }))]);
    });
  }, [workspace]);
  return { projects, targets };
}