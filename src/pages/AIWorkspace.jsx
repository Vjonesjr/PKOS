import React, { useEffect, useState } from "react";
import { Sparkles, ListChecks, AlertTriangle, Inbox, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AIActionRunner from "@/components/ai/AIActionRunner";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function AIWorkspace() {
  const [projects, setProjects] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedKnowledge, setSelectedKnowledge] = useState("");
  const { toast } = useToast();
  const { workspace } = useWorkspace();

  useEffect(() => {
    (async () => {
      setProjects(await base44.entities.Project.filter({ workspace }, "-updated_date", 100));
      setKnowledge(await base44.entities.Knowledge.filter({ workspace }, "-updated_date", 100));
    })();
  }, [workspace]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> AI Workspace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI assists your knowledge system. Suggestions are reviewed by you before anything is saved.</p>
      </div>

      <AIActionRunner
        title="Organize Inbox"
        description="Suggest a type and tags for your unprocessed captures."
        icon={Inbox}
        action="organize_inbox"
        payload={{ workspace }}
        renderResult={(r, clear) => <OrganizeInboxResult result={r} clear={clear} toast={toast} />}
      />

      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <p className="mb-3 text-sm font-semibold text-foreground/90">Project Status Check</p>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="mb-3">
            <SelectValue placeholder="Select a project..." />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProject && (
          <AIActionRunner
            title="Summarize Project Status"
            description="Get a status summary and next actions."
            icon={ListChecks}
            action="project_status"
            payload={{ projectId: selectedProject, workspace }}
            renderResult={(r) => (
              <div>
                <p className="text-sm text-foreground/80">{r.summary}</p>
                {r.next_actions?.length > 0 && (
                  <ul className="list-disc list-inside mt-2 space-y-0.5">
                    {r.next_actions.map((a, i) => (
                      <li key={i} className="text-sm text-foreground/80">
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
                {r.stalled && <p className="mt-2 text-xs text-amber-400">⚠ May be stalled: {r.stalled_reason}</p>}
              </div>
            )}
          />
        )}
      </div>

      <AIActionRunner
        title="Identify Stalled Projects"
        description="Flag active projects with no recent progress."
        icon={AlertTriangle}
        action="stalled_projects"
        payload={{ workspace }}
        renderResult={(r) =>
          r.stalled.length === 0 ? (
            <p className="text-sm text-foreground/80">No stalled projects found.</p>
          ) : (
            <div className="space-y-2">
              {r.stalled.map((s) => (
                <div key={s.id} className="rounded-lg bg-secondary/40 p-2.5">
                  <p className="text-sm font-medium text-foreground/90">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                  <p className="text-xs text-primary mt-0.5">Suggested: {s.suggested_next_action}</p>
                </div>
              ))}
            </div>
          )
        }
      />

      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <p className="mb-3 text-sm font-semibold text-foreground/90">Create Flashcards from Knowledge</p>
        <Select value={selectedKnowledge} onValueChange={setSelectedKnowledge}>
          <SelectTrigger className="mb-3">
            <SelectValue placeholder="Select a knowledge record..." />
          </SelectTrigger>
          <SelectContent>
            {knowledge.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedKnowledge && (
          <AIActionRunner
            title="Generate Flashcards"
            description="Turn this note into study flashcards."
            icon={Wand2}
            action="create_flashcards"
            payload={{ entityType: "knowledge", id: selectedKnowledge }}
            renderResult={(r, clear) => <FlashcardSuggestions result={r} knowledgeId={selectedKnowledge} clear={clear} toast={toast} workspace={workspace} />}
          />
        )}
      </div>
    </div>
  );
}

function OrganizeInboxResult({ result, clear, toast }) {
  const apply = async (s) => {
    await base44.entities.Capture.update(s.id, { type: s.suggested_type, tags: s.tags || [] });
    toast({ description: "Applied to capture." });
    clear();
  };
  if (!result.suggestions?.length) return <p className="text-sm text-foreground/80">Inbox is clear — nothing to organize.</p>;
  return (
    <div className="space-y-2">
      {result.suggestions.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary/40 p-2.5">
          <div>
            <p className="text-xs text-foreground/90">Suggested type: <span className="font-medium capitalize">{s.suggested_type}</span></p>
            {s.tags?.length > 0 && <p className="text-xs text-muted-foreground">Tags: {s.tags.join(", ")}</p>}
          </div>
          <Button size="sm" onClick={() => apply(s)}>
            Apply
          </Button>
        </div>
      ))}
    </div>
  );
}

function FlashcardSuggestions({ result, knowledgeId, clear, toast, workspace }) {
  const applyAll = async () => {
    await base44.entities.Flashcard.bulkCreate(result.flashcards.map((f) => ({ ...f, learning_item_id: null, workspace })));
    toast({ description: `${result.flashcards.length} flashcards created.` });
    clear();
  };
  if (!result.flashcards?.length) return <p className="text-sm text-foreground/80">No flashcards generated.</p>;
  return (
    <div className="space-y-2">
      {result.flashcards.map((f, i) => (
        <div key={i} className="rounded-lg bg-secondary/40 p-2.5">
          <p className="text-xs font-medium text-foreground/90">{f.front}</p>
          <p className="text-xs text-muted-foreground">{f.back}</p>
        </div>
      ))}
      <Button size="sm" onClick={applyAll} className="w-full">
        Save all as Flashcards
      </Button>
    </div>
  );
}