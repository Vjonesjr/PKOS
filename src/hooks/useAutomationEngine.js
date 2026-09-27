import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TRIGGERS, TYPES, matchesTrigger, matchesConditions } from "@/lib/automation/catalog";
import { processRecord, touched } from "@/lib/automation/engine";

// Runs enabled recipes for the active workspace while the app is open.
export default function useAutomationEngine(workspace) {
  useEffect(() => {
    let recipes = [];
    const runKeys = new Set();
    let ready = false;

    const loadRecipes = async () => { recipes = await base44.entities.AutomationRecipe.filter({ workspace, enabled: true }); };

    const handle = (type, event, record) => {
      if (!ready || !record || record.workspace !== workspace || touched.has(record.id)) return;
      recipes.forEach((recipe) => {
        const trigger = TRIGGERS[recipe.trigger];
        if (trigger?.event === event && matchesTrigger(trigger, type, record) && matchesConditions(recipe, type, record)) processRecord(recipe, type, record, runKeys);
      });
    };

    const scan = async () => {
      for (const recipe of recipes.filter((r) => TRIGGERS[r.trigger]?.event === "scan")) {
        for (const type of TRIGGERS[recipe.trigger].types) {
          const rows = await TYPES[type].entity.filter({ workspace }, "-updated_date", 200);
          for (const r of rows) if (matchesTrigger(TRIGGERS[recipe.trigger], type, r) && matchesConditions(recipe, type, r)) await processRecord(recipe, type, r, runKeys);
        }
      }
    };

    const unsubs = Object.entries(TYPES).map(([type, { entity }]) =>
      entity.subscribe((e) => { if (e.type === "create" || e.type === "update") handle(type, e.type, e.data); })
    );
    unsubs.push(base44.entities.AutomationRecipe.subscribe(() => loadRecipes()));

    (async () => {
      const runs = await base44.entities.AutomationRun.filter({ workspace }, "-created_date", 2000);
      runs.forEach((r) => runKeys.add(`${r.recipe_id}:${r.record_id}`));
      await loadRecipes();
      ready = true;
      scan();
    })();
    const timer = setInterval(scan, 10 * 60 * 1000);

    return () => { clearInterval(timer); unsubs.forEach((u) => u()); };
  }, [workspace]);
}