import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/shared/EmptyState";
import ReviewSection from "@/components/review/ReviewSection";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { buildTimeline, buildDailyReview, buildWeeklyReview } from "@/lib/reviewData";

export default function Review() {
  const [tab, setTab] = useState("timeline");
  const [timeline, setTimeline] = useState([]);
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const { workspace, isSeeding } = useWorkspace();

  const load = useCallback(async () => {
    if (isSeeding) return;
    const [t, d, w] = await Promise.all([buildTimeline(workspace), buildDailyReview(workspace), buildWeeklyReview(workspace)]);
    setTimeline(t.slice(0, 80));
    setDaily(d);
    setWeekly(w);
  }, [workspace, isSeeding]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Review</h1>
        <p className="text-sm text-muted-foreground mt-1">See how your ideas and projects developed over time.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="daily">Daily Review</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Review</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "timeline" &&
        (timeline.length === 0 ? (
          <EmptyState icon={History} title="Nothing recorded yet" />
        ) : (
          <div className="space-y-2">
            {timeline.map((e) => (
              <Link
                key={e.id}
                to={e.link}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-4 py-2.5 transition-colors hover:border-primary/40"
              >
                <span className="text-sm text-foreground/90">
                  <span className="mr-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{e.type}</span>
                  {e.label}
                </span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">{new Date(e.date).toLocaleString()}</span>
              </Link>
            ))}
          </div>
        ))}

      {tab === "daily" && daily && (
        <div className="space-y-3">
          <ReviewSection title="Completed Today" items={daily.completedToday} />
          <ReviewSection title="Unfinished Work" items={daily.unfinished} />
          <ReviewSection title="New Captures" items={daily.newCaptures} />
          <ReviewSection title="Current Priorities" items={daily.priorities} />
          <ReviewSection title="Likely Next Actions" items={daily.nextActions} />
        </div>
      )}

      {tab === "weekly" && weekly && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</p>
            <p className="text-sm text-foreground/85">
              {weekly.progress.completedCount} task{weekly.progress.completedCount === 1 ? "" : "s"} completed · {weekly.progress.activeProjectCount} active project
              {weekly.progress.activeProjectCount === 1 ? "" : "s"} · {weekly.progress.stalledCount} may be stalled
            </p>
          </div>
          <ReviewSection title="Completed Work" items={weekly.completedWork} />
          <ReviewSection title="Stalled Projects" items={weekly.stalledProjects} />
          <ReviewSection title="Unfinished Work" items={weekly.unfinished} />
          <ReviewSection title="Major Decisions" items={weekly.majorDecisions} />
          <ReviewSection title="Lessons" items={weekly.lessons} />
          <ReviewSection title="Important New Knowledge" items={weekly.importantKnowledge} />
        </div>
      )}
    </div>
  );
}