import React, { useEffect, useState, useCallback } from "react";
import { Inbox, CheckCircle2, Archive as ArchiveIcon, Pencil, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ConvertMenu from "@/components/capture/ConvertMenu";
import CaptureEditDialog from "@/components/capture/CaptureEditDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function Capture() {
  const [captures, setCaptures] = useState([]);
  const [tab, setTab] = useState("inbox");
  const [editing, setEditing] = useState(null);
  const { workspace } = useWorkspace();

  const load = useCallback(async () => {
    const items = await base44.entities.Capture.filter({ workspace }, "-created_date", 300);
    setCaptures(items);
  }, [workspace]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = base44.entities.Capture.subscribe((event) => {
      if (event.data?.workspace !== workspace) return;
      setCaptures((prev) => {
        if (event.type === "create") return [event.data, ...prev];
        if (event.type === "update") return prev.map((c) => (c.id === event.data.id ? event.data : c));
        if (event.type === "delete") return prev.filter((c) => c.id !== event.data.id);
        return prev;
      });
    });
    return unsubscribe;
  }, [workspace]);

  const filtered = captures.filter((c) => c.status === tab);

  const archive = async (c) => {
    await base44.entities.Capture.update(c.id, { status: "archived" });
  };

  const toggleImportant = async (c) => {
    await base44.entities.Capture.update(c.id, { important: !c.important });
  };

  const saveEdit = async (id, data) => {
    await base44.entities.Capture.update(id, data);
    setEditing(null);
  };

  const emptyCopy = {
    inbox: "Nothing waiting to be organized.",
    processed: "Nothing processed yet.",
    archived: "Nothing archived yet.",
  };

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
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState icon={tab === "inbox" ? Inbox : tab === "processed" ? CheckCircle2 : ArchiveIcon} title={emptyCopy[tab]} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge value={c.type} />
                    {c.important && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    {c.status === "processed" && <span className="text-xs text-muted-foreground">→ {c.converted_to_type}</span>}
                  </div>
                  {c.title && <p className="text-sm font-medium text-foreground/90">{c.title}</p>}
                  {c.content && <p className="mt-1 text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{c.content}</p>}
                  {c.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.tags.map((t) => (
                        <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {c.status === "inbox" && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleImportant(c)}>
                      <Star className={`h-3.5 w-3.5 ${c.important ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <ConvertMenu capture={c} />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive(c)}>
                      <ArchiveIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CaptureEditDialog capture={editing} onOpenChange={(v) => !v && setEditing(null)} onSave={saveEdit} />
    </div>
  );
}