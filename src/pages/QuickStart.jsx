import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { GUIDE_STEPS, GUIDE_DONE_KEY } from "@/lib/guideSteps";
import GuideStep from "@/components/guide/GuideStep";

/** Quick Start Guide: a reference tutorial that walks through the demo profile. */
export default function QuickStart() {
  const navigate = useNavigate();
  const { workspace, setWorkspace } = useWorkspace();
  const [done, setDone] = useState(new Set());
  // Progress lives on the user's account so it follows them across devices.
  useEffect(() => { base44.auth.me().then((u) => setDone(new Set(Array.isArray(u.guide_done) ? u.guide_done : []))); }, []);

  const save = (next) => { setDone(next); base44.auth.updateMe({ [GUIDE_DONE_KEY]: [...next] }); };
  const toggle = (id) => { const n = new Set(done); n.has(id) ? n.delete(id) : n.add(id); save(n); };
  const tryStep = (s) => { save(new Set(done).add(s.id)); setWorkspace("demo"); navigate(s.to); };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="pk-grad-text flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground"><BookOpen className="h-6 w-6 text-primary" />Quick Start Guide</h1>
        <p className="mt-1 text-sm text-muted-foreground">Come back here anytime you forget how something works. Every step opens the Demo Workspace, so you can explore without touching your own data.</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{done.size} of {GUIDE_STEPS.length} steps done</p>
        <Progress value={(done.size / GUIDE_STEPS.length) * 100} />
      </div>
      {GUIDE_STEPS.map((s, i) => (
        <GuideStep key={s.id} step={s} index={i} done={done.has(s.id)} onTry={() => tryStep(s)} onToggle={() => toggle(s.id)} />
      ))}
      <div className="flex flex-wrap gap-2 pt-2">
        {workspace === "demo" && <Button onClick={() => { setWorkspace("personal"); navigate("/"); }}>Switch to my own data</Button>}
        <Button variant="ghost" onClick={() => save(new Set())}>Reset progress</Button>
      </div>
    </div>
  );
}