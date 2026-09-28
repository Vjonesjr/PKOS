import React, { useEffect, useState } from "react";
import { ListTodo } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AIActionRunner from "@/components/ai/AIActionRunner";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function NotesToTasksCard() {
  const [captures, setCaptures] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [selected, setSelected] = useState("");
  const { toast } = useToast();
  const { workspace } = useWorkspace();

  useEffect(() => {
    setSelected("");
    (async () => {
      setCaptures(await base44.entities.Capture.filter({ workspace }, "-created_date", 60));
      setKnowledge(await base44.entities.Knowledge.filter({ workspace }, "-updated_date", 60));
    })();
  }, [workspace]);

  const [entityType, id] = selected ? selected.split(":") : [null, null];

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground/90">Turn Notes into Tasks</p>
        {selected && (
          <Button size="sm" variant="ghost" onClick={() => setSelected("")}>
            Change
          </Button>
        )}
      </div>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="mb-3">
          <SelectValue placeholder="Select a capture or knowledge note..." />
        </SelectTrigger>
        <SelectContent>
          {captures.map((c) => (
            <SelectItem key={`capture:${c.id}`} value={`capture:${c.id}`}>
              {c.title || (c.content ? c.content.slice(0, 40) : "Untitled capture")}
            </SelectItem>
          ))}
          {knowledge.map((k) => (
            <SelectItem key={`knowledge:${k.id}`} value={`knowledge:${k.id}`}>
              {k.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <AIActionRunner
          title="Extract Tasks"
          description="Pull concrete action items out of this note."
          icon={ListTodo}
          action="notes_to_tasks"
          payload={{ entityType, id, workspace }}
          renderResult={(r, clear) => (
            <ExtractedTasks tasks={r.tasks} entityType={entityType} id={id} workspace={workspace} clear={clear} toast={toast} />
          )}
        />
      )}
    </div>
  );
}

function ExtractedTasks({ tasks, entityType, id, workspace, clear, toast }) {
  if (!tasks?.length) return <p className="text-sm text-foreground/80">No action items found in this note.</p>;
  const createAll = async () => {
    await base44.entities.Task.bulkCreate(
      tasks.map((title) => ({ title, source_capture_id: entityType === "capture" ? id : undefined, workspace }))
    );
    toast({ description: `${tasks.length} tasks created.` });
    clear();
  };
  return (
    <div className="space-y-2">
      <ul className="list-disc list-inside space-y-0.5">
        {tasks.map((t, i) => (
          <li key={i} className="text-sm text-foreground/80">
            {t}
          </li>
        ))}
      </ul>
      <Button size="sm" onClick={createAll} className="w-full">
        Create {tasks.length} Tasks
      </Button>
    </div>
  );
}