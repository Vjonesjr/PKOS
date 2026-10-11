import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TRIGGERS, TYPES, matchesTrigger, matchesConditions } from "@/lib/automation/catalog";
import { processRecord, touched } from "@/lib/automation/engine";

// Runs enabled recipes for the active workspace while the app is open.
export default function useAutomationEngine(workspace) {
  useEffect(() => {
    let recipes = [];
    const runKeys = new Set();
    const snapshots = new Map();
    let ready = false;

    const snapshotKey = (type, id) => `${type}:${id}`;
    const loadRecipes = async () => {
      recipes = await base44.entities.AutomationRecipe.filter({ workspace, enabled: true });
    };

    // Base44 realtime update events contain the record after the change, not the previous record.
    // Keep a lightweight local snapshot so "status changed", "completed", and "tag added"
    // triggers fire for the actual transition instead of every unrelated update.
    const primeSnapshots = async () => {
      const updateTypes = new Set(
        Object.values(TRIGGERS)
          .filter((trigger) => trigger.event === "update")
          .flatMap((trigger) => trigger.types)
      );
      const lists = await Promise.all(
        [...updateTypes].map((type) =>
          TYPES[type].entity
            .filter({ workspace }, "-updated_date", 500)
            .then((rows) => rows.map((record) => ({ type, record })))
        )
      );
      for (const { type, record } of lists.flat()) {
        snapshots.set(snapshotKey(type, record.id), record);
      }
    };

    const isRealTransition = (recipe, previous, record) => {
      switch (recipe.trigger) {
        case "project_status_changed":
        case "goal_status_changed":
          return !!previous && previous.status !== record.status;
        case "task_completed":
          return !!previous && previous.status !== "done" && record.status === "done";
        case "tag_added": {
          if (!previous) return false;
          const before = new Set(previous.tags || []);
          return (record.tags || []).some((tag) => !before.has(tag));
        }
        default:
          return true;
      }
    };

    const handle = (type, event, record, timestamp) => {
      if (!record || record.workspace !== workspace) return;

      const sKey = snapshotKey(type, record.id);
      const previous = snapshots.get(sKey);
      snapshots.set(sKey, record);

      if (!ready || touched.has(record.id)) return;

      recipes.forEach((recipe) => {
        const trigger = TRIGGERS[recipe.trigger];
        if (trigger?.event !== event) return;
        if (event === "update" && !isRealTransition(recipe, previous, record)) return;
        if (!matchesTrigger(trigger, type, record) || !matchesConditions(recipe, type, record)) return;

        // Live events should be allowed to run again on a later legitimate user change.
        const eventKey = `${recipe.id}:${record.id}:${event}:${timestamp || record.updated_date || "event"}`;
        processRecord(recipe, type, record, runKeys, eventKey);
      });
    };

    const scan = async () => {
      for (const recipe of recipes.filter((r) => TRIGGERS[r.trigger]?.event === "scan")) {
        for (const type of TRIGGERS[recipe.trigger].types) {
          const rows = await TYPES[type].entity.filter({ workspace }, "-updated_date", 200);
          for (const record of rows) {
            if (matchesTrigger(TRIGGERS[recipe.trigger], type, record) && matchesConditions(recipe, type, record)) {
              // Scan rules intentionally use a stable recipe+record key so reopening the app
              // does not create duplicate overdue/scan actions for the same record.
              await processRecord(recipe, type, record, runKeys);
            }
          }
        }
      }
    };

    const unsubs = Object.entries(TYPES).map(([type, { entity }]) =>
      entity.subscribe((event) => {
        if (event.type === "create" || event.type === "update") {
          handle(type, event.type, event.data, event.timestamp);
        }
      })
    );
    unsubs.push(base44.entities.AutomationRecipe.subscribe(() => loadRecipes()));

    (async () => {
      await loadRecipes();
      await primeSnapshots();

      // Only scan rules need persisted "already handled" keys across app sessions.
      // Live create/update events are not replayed by the subscription API.
      const scanRecipeIds = new Set(
        recipes.filter((recipe) => TRIGGERS[recipe.trigger]?.event === "scan").map((recipe) => recipe.id)
      );
      const runs = await base44.entities.AutomationRun.filter({ workspace }, "-created_date", 2000);
      runs
        .filter((run) => scanRecipeIds.has(run.recipe_id) && run.status !== "failed")
        .forEach((run) => runKeys.add(`${run.recipe_id}:${run.record_id}`));

      ready = true;
      await scan();
    })();

    const timer = setInterval(scan, 10 * 60 * 1000);

    return () => {
      clearInterval(timer);
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [workspace]);
}