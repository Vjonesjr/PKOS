import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import AIActionRunner from "@/components/ai/AIActionRunner";

export default function SmartBoyBrain({ data, workspace }) {
  const [dismissed, setDismissed] = useState(false);
  const rank = { high: 0, medium: 1, low: 2 };
  const today = new Date().toLocaleDateString("en-CA");
  const projects = [...data.projects].filter(p => p.status === "Active")
    .sort((a, b) => (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1));
  const open = data.tasks.filter(t => t.status !== "done");
  const overdue = open.filter(t => t.due_date && t.due_date < today);
  const missing = projects.filter(p => !p.next_action?.trim());
  const project = projects[0];
  const tasks = [...open].filter(t => !project || t.project_id === project.id)
    .sort((a, b) => (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1) ||
      (a.due_date || "9999-12-31").localeCompare(b.due_date || "9999-12-31"));
  const task = tasks[0];
  const next = project?.next_action?.trim() || task?.title ||
    (project ? "Set one concrete next action for this project." :
      data.captures.length ? "Triage your capture inbox." : "Choose one project to focus on.");
  const target = project?.next_action || !task
    ? project ? `/project-detail?id=${encodeURIComponent(project.id)}` : data.captures.length ? "/capture" : "/projects"
    : `/task-detail?id=${encodeURIComponent(task.id)}`;

  return <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4" aria-label="Smart Boy Brain">
    <div className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /><h2 className="font-semibold">Smart Boy Brain</h2></div>
    <p className="text-xs text-muted-foreground">Based on the recent records loaded for this workspace. Project priority determines focus; equal priorities use the most recently updated project.</p>
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/today" className="hover:underline">{overdue.length} overdue tasks</Link>
      <Link to="/capture" className="hover:underline">{data.captures.length} recent inbox captures</Link>
      <Link to="/projects" className="hover:underline">{missing.length} active projects missing a next action</Link>
    </div>
    {!dismissed ? <div className="rounded-xl bg-card/70 border border-primary/25 p-4 space-y-2">
      <p className="text-xs text-primary font-semibold">RECOMMENDED NEXT MOVE{project ? ` · ${project.title}` : ""}</p>
      <p className="text-sm break-words">{next}</p>
      <div className="flex gap-2">
        <Button asChild size="sm"><Link to={target}>Review</Link></Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>Not now</Button>
      </div>
    </div> : <Button variant="ghost" size="sm" onClick={() => setDismissed(false)}>Show next move</Button>}
    <AIActionRunner title="AI attention review" description="Optional: review recent projects, tasks, captures, decisions and lessons. Uses AI credits only when you press Run."
      icon={Brain} action="weekly_review" payload={{ workspace }}
      renderResult={(result, clear) => <div className="space-y-3">
        {["priorities", "unfinished", "stalled_projects"].map(key => {
          const items = Array.isArray(result[key]) ? result[key].filter(x => typeof x === "string").slice(0, 3) : [];
          return items.length > 0 && <div key={key}><p className="text-xs font-semibold capitalize">{key.replaceAll("_", " ")}</p>
            <ul className="list-disc pl-4 text-sm space-y-1">{items.map((item, i) => <li className="break-words" key={i}>{item}</li>)}</ul></div>;
        })}
        <p className="text-xs text-muted-foreground">Suggestions only. Review the source records before making changes.</p>
        <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link to="/review">Review records</Link></Button>
          <Button size="sm" variant="ghost" onClick={clear}>Not now</Button></div>
      </div>} />
  </section>;
}
