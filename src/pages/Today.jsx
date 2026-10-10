import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/WorkspaceContext";
import BriefItem from "@/components/today/BriefItem";
import TodayList from "@/components/today/TodayList";
import CalendarSyncButton from "@/components/today/CalendarSyncButton";
import AutomationFlags from "@/components/automations/AutomationFlags";
import TodayHabits from "@/components/habits/TodayHabits";

const SECTIONS = [
  ["top_focus", "Top Focus"],
  ["secondary_tasks", "Secondary Tasks"],
  ["quick_win", "Quick Win"],
  ["blocker_to_resolve", "Blocker to Resolve"],
  ["learning_review", "Learning / Review"],
  ["optional_items", "Optional Items"],
];

export default function Today() {
  const { workspace, isSeeding } = useWorkspace();
  const today = format(new Date(), "yyyy-MM-dd");
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());
  const [todayTasks, setTodayTasks] = useState([]);

  const loadToday = useCallback(async () => {
    if (!isSeeding) setTodayTasks(await base44.entities.Task.filter({ workspace, today_date: today }, "-created_date", 100));
  }, [workspace, today, isSeeding]);

  useEffect(() => { loadToday(); setBrief(null); }, [loadToday]);

  const generate = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("aiAssist", { action: "daily_brief", workspace, today }).catch(() => null);
    setBrief(res?.data?.sections || {});
    setDismissed(new Set());
    setLoading(false);
  };

  const addedIds = new Set(todayTasks.flatMap((t) => [t.id, t.source_capture_id].filter(Boolean)));
  const isAdded = (item) => addedIds.has(item.id) || todayTasks.some((t) => t.title === item.title);

  const addToToday = async (item) => {
    if (item.type === "task") await base44.entities.Task.update(item.id, { today_date: today });
    else await base44.entities.Task.create({
      title: item.type === "project" ? `${item.title}: ${item.facts.find((f) => f.startsWith("next action"))?.slice(14, -1) || "work on project"}` : item.title,
      project_id: item.type === "project" ? item.id : undefined,
      source_capture_id: item.type === "capture" ? item.id : undefined,
      today_date: today,
      workspace,
    });
    loadToday();
  };

  // Only runs on explicit user choice; AI never changes priorities itself.
  const changePriority = async (item, priority) => {
    await (item.type === "task" ? base44.entities.Task : base44.entities.Project).update(item.id, { priority });
    setBrief((b) => Object.fromEntries(Object.entries(b).map(([k, list]) => [k, list.map((i) => (i.id === item.id ? { ...i, priority } : i))])));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Today Brief</h1>
          <p className="mt-1 text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")} · built only from your actual records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CalendarSyncButton workspace={workspace} today={today} onDone={loadToday} />
          <Button onClick={generate} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {brief ? "Regenerate" : "Generate Today Brief"}
          </Button>
        </div>
      </div>

      {!isSeeding && <TodayHabits key={workspace} workspace={workspace} />}

      <AutomationFlags flags={["today", "attention"]} title="From your automations" />

      <TodayList
        tasks={todayTasks}
        onToggle={async (t) => { await base44.entities.Task.update(t.id, { status: t.status === "done" ? "todo" : "done" }); loadToday(); }}
        onRemove={async (t) => { await base44.entities.Task.update(t.id, { today_date: null }); loadToday(); }}
      />

      {brief && Object.values(brief).every((l) => !l?.length) && <p className="text-center text-sm text-muted-foreground">Nothing needs attention today based on your records.</p>}
      {brief && SECTIONS.map(([key, label]) => {
        const items = (brief[key] || []).filter((i) => !dismissed.has(`${i.type}:${i.id}`));
        if (!items.length) return null;
        return (
          <div key={key} className="rounded-2xl border border-border bg-card/60 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="space-y-2">
              {items.map((item) => (
                <BriefItem key={`${item.type}:${item.id}`} item={item} added={isAdded(item)}
                  onAdd={() => addToToday(item)}
                  onDismiss={() => setDismissed((d) => new Set(d).add(`${item.type}:${item.id}`))}
                  onPriority={(p) => changePriority(item, p)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}