import React from "react";
import { Library } from "lucide-react";
import Widget from "@/components/dashboard/Widget";

export default function KnowledgeGrowthWidget({ rows, links, range }) {
  const added = (rows || []).reduce((a, r) => a + r.count, 0);
  return (
    <Widget title="Knowledge growth" icon={Library}>
      {!rows ? <p className="text-xs text-muted-foreground">Loading...</p> : (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-secondary/60 p-3">
            <p className="text-2xl font-semibold text-foreground">{added}</p>
            <p className="text-[11px] text-muted-foreground">notes added</p>
          </div>
          <div className="rounded-lg bg-secondary/60 p-3">
            <p className="text-2xl font-semibold text-foreground">{links}</p>
            <p className="text-[11px] text-muted-foreground">new connections</p>
          </div>
          <p className="col-span-2 text-[11px] text-muted-foreground">Last {range} days</p>
        </div>
      )}
    </Widget>
  );
}