import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { recordRoute } from "@/lib/automation/catalog";
import EmptyState from "@/components/shared/EmptyState";

const todayNY = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

const ItemRow = ({ i }) => (
  <p className="text-sm text-foreground/80">
    <Link to={recordRoute(i.record_type, i.record_id)} className="text-primary hover:underline">{i.record_title}</Link>
    <span className="text-muted-foreground"> · {i.recipe_name} — {i.message}{i.status === "pending_review" ? " (awaiting approval)" : ""}</span>
  </p>
);

// In-app digest: today's events so far (live) plus the nightly digests that were also emailed.
export default function DigestView({ workspace }) {
  const [today, setToday] = useState(null);
  const [digests, setDigests] = useState(null);
  useEffect(() => {
    base44.entities.AutomationRun.filter({ workspace, digest_date: todayNY(), status: { $in: ["success", "pending_review", "failed"] } }, "-created_date", 50).then(setToday);
    base44.entities.DailyDigest.filter({ workspace }, "-date", 14).then(setDigests);
  }, [workspace]);
  if (!today || !digests) return <p className="text-sm text-muted-foreground">Loading...</p>;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/30 bg-card/60 p-4">
        <p className="mb-2 text-sm font-semibold text-foreground">Today so far · {today.length} event{today.length === 1 ? "" : "s"}</p>
        {today.length ? <div className="space-y-1">{today.map((r) => <ItemRow key={r.id} i={r} />)}</div> : <p className="text-xs text-muted-foreground">Nothing yet. Tonight's check adds anything time-based.</p>}
      </div>
      {digests.length === 0 ? <EmptyState icon={Inbox} title="No digests yet" description="After the nightly check finds events, a digest appears here and is emailed to you." /> : digests.map((d) => (
        <div key={d.id} className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{d.date} · {d.total} events · {d.pending} need approval</p>
            {d.emailed && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> Emailed</span>}
          </div>
          <div className="space-y-1">{(d.items || []).map((i, n) => <ItemRow key={n} i={i} />)}</div>
        </div>
      ))}
    </div>
  );
}