import React, { useEffect, useState, useCallback } from "react";
import { Inbox, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConvertMenu from "@/components/capture/ConvertMenu";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

export default function Capture() {
  const [captures, setCaptures] = useState([]);
  const [tab, setTab] = useState("inbox");

  const load = useCallback(async () => {
    const items = await base44.entities.Capture.list("-created_date", 200);
    setCaptures(items);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = captures.filter((c) => c.status === tab);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Capture</h1>
        <p className="text-sm text-muted-foreground mt-1">Everything you save lands here first. Classify and connect it whenever you're ready.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState icon={tab === "inbox" ? Inbox : CheckCircle2} title={tab === "inbox" ? "Inbox is clear" : "Nothing processed yet"} description="Use the Capture button to add ideas, notes, tasks, and more." />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge value={c.type} />
                    {c.status === "processed" && <span className="text-xs text-muted-foreground">→ {c.converted_to_type}</span>}
                  </div>
                  <p className="text-sm font-medium text-foreground/90">{c.title}</p>
                  {c.content && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.content}</p>}
                </div>
                {c.status === "inbox" && <ConvertMenu capture={c} onConverted={load} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}