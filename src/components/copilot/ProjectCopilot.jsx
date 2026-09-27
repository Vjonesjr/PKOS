import React, { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import ProjectBrief from "@/components/copilot/ProjectBrief";
import ProjectChat from "@/components/copilot/ProjectChat";
import CopilotSuggestionRow from "@/components/copilot/CopilotSuggestionRow";
import { applyCopilotSuggestion } from "@/lib/copilotApply";

export default function ProjectCopilot({ project, onChange }) {
  const { toast } = useToast();
  const [tab, setTab] = useState("brief");
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState({});

  const generate = async () => {
    setLoading(true);
    setError("");
    const res = await base44.functions.invoke("aiAssist", { action: "project_brief", projectId: project.id, workspace: project.workspace }).catch(() => null);
    setLoading(false);
    if (!res?.data || res.data.error) return setError("Couldn't generate a briefing. Please try again.");
    setBrief(res.data);
    setStatus({});
  };

  // Opened via "Generate Project Brief" command (?brief=1)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("brief") === "1") generate();
  }, [project.id]);

  const apply = async (s) => {
    await applyCopilotSuggestion(project, s);
    setStatus((p) => ({ ...p, [s.key]: "applied" }));
    toast({ description: "Suggestion applied." });
    onChange();
  };

  const edit = (s) => setBrief((b) => ({ ...b, suggestions: b.suggestions.map((x) => (x.key === s.key ? s : x)) }));

  return (
    <div className="rounded-2xl border border-accent/30 bg-card/60 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground/90"><Sparkles className="h-4 w-4 text-accent" /> Project Copilot</p>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="brief">Briefing</TabsTrigger>
            <TabsTrigger value="chat">Ask</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab === "chat" ? (
        <ProjectChat projectId={project.id} workspace={project.workspace} />
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground">AI reads only this project's records. Nothing is saved until you apply a suggestion.</p>
          <Button onClick={generate} disabled={loading} variant={brief ? "outline" : "default"} className="gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Analyzing project..." : brief ? "Refresh briefing" : "What should I do next?"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {brief && <ProjectBrief brief={brief} />}
          {brief?.suggestions?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">Suggestions — review before applying</p>
              <div className="space-y-2">
                {brief.suggestions.map((s) => (
                  <CopilotSuggestionRow key={s.key} suggestion={s} status={status[s.key]} onApply={apply} onSkip={() => setStatus((p) => ({ ...p, [s.key]: "skipped" }))} onEdit={edit} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}