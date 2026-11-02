import React, { useEffect, useState } from "react";
import { subDays } from "date-fns";
import { FolderKanban } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Widget from "@/components/dashboard/Widget";

const ORDER = ["Active", "Planned", "Waiting", "Idea", "Completed"];

export default function ProjectHealthWidget({ rows, workspace }) {
  const [stalled, setStalled] = useState(null);
  useEffect(() => {
    base44.entities.Project.count({ workspace, status: "Active", updated_date: { $lt: subDays(new Date(), 14).toISOString() } }).then(setStalled);
  }, [workspace]);

  const counts = Object.fromEntries((rows || []).map((r) => [r.status, r.count]));
  return (
    <Widget title="Projects" icon={FolderKanban}>
      {!rows ? <p className="text-xs text-muted-foreground">Loading...</p> : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {ORDER.filter((s) => counts[s]).map((s) => (
              <div key={s} className="rounded-lg bg-secondary/60 p-2 text-center">
                <p className="text-lg font-semibold text-foreground">{counts[s]}</p>
                <p className="text-[10px] text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
          {stalled > 0 && <p className="text-xs text-amber-400">{stalled} active project{stalled > 1 ? "s" : ""} with no activity in 14 days</p>}
        </div>
      )}
    </Widget>
  );
}