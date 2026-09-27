import React, { useMemo } from "react";
import { BookOpen, Layers, RotateCcw, Clock, TrendingUp } from "lucide-react";

export default function LearningOverview({ items, flashcards, dueCount, onStudy }) {
  const activeCourses = useMemo(() => items.filter((i) => i.type === "course" && i.status === "in_progress"), [items]);
  const topics = useMemo(() => items.filter((i) => i.type === "topic"), [items]);
  const recentStudy = useMemo(
    () => flashcards.filter((f) => f.last_reviewed).sort((a, b) => (a.last_reviewed < b.last_reviewed ? 1 : -1)).slice(0, 5),
    [flashcards]
  );
  const completedCount = items.filter((i) => i.status === "completed").length;
  const progressPct = items.length ? Math.round((completedCount / items.length) * 100) : 0;

  const Tile = ({ icon: Icon, label, value, sub }) => (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <Tile icon={BookOpen} label="Active Courses" value={activeCourses.length} sub={activeCourses.length ? activeCourses[0].title : "None in progress"} />
      <Tile icon={Layers} label="Topics" value={topics.length} sub="Being explored" />
      <button onClick={onStudy} disabled={dueCount === 0} className="text-left disabled:cursor-not-allowed disabled:opacity-60">
        <Tile icon={RotateCcw} label="Review Items" value={dueCount} sub={dueCount > 0 ? "Tap to study" : "All caught up"} />
      </button>
      <Tile icon={Clock} label="Recent Study" value={recentStudy.length} sub={recentStudy[0] ? `Last: ${recentStudy[0].last_reviewed}` : "No study yet"} />
      <Tile icon={TrendingUp} label="Progress" value={`${progressPct}%`} sub={`${completedCount}/${items.length} completed`} />
    </div>
  );
}