import React, { useEffect, useRef, useState } from "react";
import { Plus, Zap, CheckCircle2, History } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/lib/WorkspaceContext";
import useAutomationOptions from "@/hooks/useAutomationOptions";
import { seedDemoRecipes } from "@/lib/automation/demoRecipes";
import RecipeCard from "@/components/automations/RecipeCard";
import RecipeBuilder from "@/components/automations/RecipeBuilder";
import TestRuleDialog from "@/components/automations/TestRuleDialog";
import TemplatePicker from "@/components/automations/TemplatePicker";
import AIRecipeDraft from "@/components/automations/AIRecipeDraft";
import RunList from "@/components/automations/RunList";
import DigestView from "@/components/automations/DigestView";
import EmptyState from "@/components/shared/EmptyState";

export default function Automations() {
  const { workspace } = useWorkspace();
  const { projects, targets } = useAutomationOptions(workspace);
  const [tab, setTab] = useState("recipes");
  const [recipes, setRecipes] = useState(null);
  const [runs, setRuns] = useState([]);
  const [draft, setDraft] = useState(null);
  const [testing, setTesting] = useState(null);
  const seeding = useRef(false);

  const load = async () => {
    const [r, h] = await Promise.all([
      base44.entities.AutomationRecipe.filter({ workspace }, "-created_date", 200),
      base44.entities.AutomationRun.filter({ workspace }, "-created_date", 200),
    ]);
    setRecipes(r); setRuns(h);
  };
  useEffect(() => { setRecipes(null); load(); }, [workspace]);

  useEffect(() => {
    const key = "pkos_demo_recipes_seeded";
    if (workspace !== "demo" || !recipes || recipes.length || !projects.length || localStorage.getItem(key) || seeding.current) return;
    seeding.current = true;
    localStorage.setItem(key, "1");
    seedDemoRecipes(projects, targets).then(load);
  }, [workspace, recipes, projects, targets]);

  const toggle = async (r, enabled) => { await base44.entities.AutomationRecipe.update(r.id, { enabled }); load(); };
  const remove = async (r) => { if (window.confirm(`Delete “${r.name}”? Its history is kept.`)) { await base44.entities.AutomationRecipe.delete(r.id); load(); } };
  const pending = runs.filter((r) => r.status === "pending_review");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight pk-grad-text">Automations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Simple “when this happens, do this” recipes. Safe actions run on their own; bigger ones wait for your approval.</p>
        </div>
        <Button onClick={() => setDraft({ trigger: "capture_created", action: "add_tag" })} className="gap-1.5"><Plus className="h-4 w-4" /> New recipe</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="approvals">Approvals{pending.length ? ` (${pending.length})` : ""}</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="digest">Digest</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "recipes" && (
        <div className="space-y-6">
          <AIRecipeDraft workspace={workspace} onDraft={setDraft} />
          <TemplatePicker onPick={(t) => setDraft({ ...t, conditions: t.conditions.map((c) => ({ ...c })), action_params: { ...t.action_params } })} />
          {recipes === null ? <p className="text-sm text-muted-foreground">Loading...</p> : recipes.length === 0 ? (
            <EmptyState icon={Zap} title="No recipes yet" description="Start from a template or describe a rule above." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recipes.map((r) => <RecipeCard key={r.id} recipe={r} onToggle={(v) => toggle(r, v)} onEdit={() => setDraft(r)} onTest={() => setTesting(r)} onDelete={() => remove(r)} />)}
            </div>
          )}
        </div>
      )}
      {tab === "approvals" && <RunList runs={pending} onChange={load} emptyIcon={CheckCircle2} emptyTitle="Nothing waiting" emptyText="Actions that need your OK will appear here." />}
      {tab === "history" && <RunList runs={runs} onChange={load} emptyIcon={History} emptyTitle="No runs yet" emptyText="Every time a recipe runs, it's logged here." />}

      {tab === "digest" && <DigestView workspace={workspace} />}

      <RecipeBuilder draft={draft} onClose={() => setDraft(null)} onSaved={() => { setDraft(null); load(); }} workspace={workspace} projects={projects} targets={targets} />
      <TestRuleDialog recipe={testing} onClose={() => setTesting(null)} />
    </div>
  );
}