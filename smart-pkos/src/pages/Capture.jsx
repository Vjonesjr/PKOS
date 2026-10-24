import React, { useEffect, useState, useCallback } from "react";
import { Inbox, CheckCircle2, Archive as ArchiveIcon, Pencil, Star, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import DataToggle from "@/components/workspace/DataToggle";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ConvertMenu from "@/components/capture/ConvertMenu";
import ConversationDistiller from "@/components/capture/ConversationDistiller";
import CaptureEditDialog from "@/components/capture/CaptureEditDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { getRoute } from "@/lib/searchConfig";

export default function Capture() {
  const [captures, setCaptures] = useState([]);
  const [tab, setTab] = useState("inbox");
  const [editing, setEditing] = useState(null);
  const { workspace, isSeeding } = useWorkspace();

  const load = useCallback(async () => {
    if (isSeeding) return;
    const items = await base44.entities.Capture.filter({ workspace }, "-created_date", 300);
    setCaptures(items);
  }, [workspace, isSeeding]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Capture</h1>
          <p className="text-sm text-muted-foreground mt-1">Everything you save lands here first. Classify and connect it whenever you're ready.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataToggle />
          <Link to="/triage">
            <Button variant="outline" className="gap-1.5"><Sparkles className="h-4 w-4 text-accent" /> AI Triage</Button>
          </Link>
        </div>
      </div>

      {!isSeeding && <ConversationDistiller key={workspace} workspace={workspace} onSaved={load} />}

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
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge value={c.type} />
                    {c.important && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    {c.status === "processed" && c.converted_to_type && c.converted_to_id && (
                      <Link
                        to={getRoute(c.converted_to_type, { id: c.converted_to_id })}
                        className="text-xs text-primary hover:underline"
                        title="Open converted record"
                      >
                        → {c.converted_to_type.replace(/_/g, " ")}
                      </Link>
                    )}
                  </div>
                  {c.title && <p className="break-words text-base font-semibold leading-6 text-foreground">{c.title}</p>}
                  {c.content && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground line-clamp-4">{c.content}</p>}
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
                  <div className="flex w-full flex-wrap items-center justify-end gap-1.5 border-t border-border/60 pt-2 sm:w-auto sm:shrink-0 sm:border-0 sm:pt-0">
                    <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => toggleImportant(c)} aria-label={c.important ? "Remove from important" : "Mark as important"}>
                      <Star className={`h-3.5 w-3.5 ${c.important ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => setEditing(c)} aria-label="Edit capture">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <ConvertMenu capture={c} />
                    <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => archive(c)} aria-label="Archive capture">
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