import React, { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function CalendarSyncButton({ workspace, today, onDone }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sync = async () => {
    setLoading(true);
    const fail = (e) => ({ data: { error: e.message } });
    // Pull appointments in, then push task deadlines + weekly goal check-ins out.
    const res = await base44.functions.invoke("syncCalendar", { workspace, today }).catch(fail);
    const push = res.data?.error ? null : await base44.functions.invoke("pushToCalendar", { workspace, today }).catch(fail);
    setLoading(false);
    const error = res.data?.error || push?.data?.error;
    if (error) return toast({ title: "Calendar sync failed", description: error, variant: "destructive" });
    toast({ title: "Calendar synced", description: `${res.data.created} new, ${res.data.updated} updated · ${push.data.tasks} deadlines${push.data.checkin ? " + weekly check-in" : ""} sent to Google` });
    onDone?.();
  };

  return (
    <Button variant="outline" onClick={sync} disabled={loading} className="gap-1.5">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />} Sync Calendar
    </Button>
  );
}