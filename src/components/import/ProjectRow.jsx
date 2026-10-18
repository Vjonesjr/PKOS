import React from "react";
import { FolderKanban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MilestoneList from "@/components/import/MilestoneList";
import TaskTreeEditor from "@/components/import/TaskTreeEditor";

const STATUSES = ["Idea", "Planned", "Active", "Waiting", "Completed"];

/** goalOptions: [{value, label}] — imported goals use "new:<key>", existing ones "id:<id>". */
export default function ProjectRow({ project, onChange, goalOptions, duplicate }) {
  const set = (patch) => onChange({ ...project, ...patch });
  return (
    <div className={`space-y-2 rounded-xl border bg-card/60 p-3 ${project.include ? "border-border" : "border-border/40 opacity-50"}`}>
      <div className="flex items-center gap-2">
        <Checkbox checked={project.include} onCheckedChange={(v) => set({ include: !!v })} aria-label="Include project" />
        <FolderKanban className="h-4 w-4 shrink-0 text-accent" />
        <Input value={project.title} onChange={(e) => set({ title: e.target.value })} className="h-8 min-w-0 flex-1 text-sm" aria-label="Project title" />
      </div>
      {duplicate && <p className="text-xs text-amber-500">A project with this title already exists; it will be skipped.</p>}
      <div className="grid grid-cols-2 gap-2">
        <Select value={project.status} onValueChange={(v) => set({ status: v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={project.goal_key || "none"} onValueChange={(v) => set({ goal_key: v === "none" ? "" : v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Goal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No goal</SelectItem>
            {goalOptions.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <MilestoneList items={project.milestones} onChange={(milestones) => set({ milestones })} />
      <p className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</p>
      <TaskTreeEditor tasks={project.tasks} onChange={(tasks) => set({ tasks })} />
    </div>
  );
}