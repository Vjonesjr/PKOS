import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ENTITY_CONFIG, recordLabel } from "@/lib/entityConfig";

// Loads a lightweight searchable index of workspace records when the palette opens.
export default function usePaletteRecords(open, workspace) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;
    const types = Object.keys(ENTITY_CONFIG);
    Promise.all([
      ...types.map((t) => ENTITY_CONFIG[t].entity.filter({ workspace }, "-updated_date", 150).then((rs) => rs.map((r) => ({ type: t, id: r.id, title: recordLabel(t, r), project_id: r.project_id })))),
      base44.entities.ContextPack.filter({ workspace }, "-updated_date", 100).then((rs) => rs.map((r) => ({ type: "contextPack", id: r.id, title: r.name }))),
    ]).then((lists) => setItems(lists.flat()));
  }, [open, workspace]);

  return items;
}

export function recordRoute(item) {
  if (item.type === "contextPack") return `/context-pack?id=${item.id}`;
  const cfg = ENTITY_CONFIG[item.type];
  if (cfg.detail) return `${cfg.route}?id=${item.id}`;
  if (item.type === "task" && item.project_id) return `/project-detail?id=${item.project_id}`;
  return cfg.route;
}

export const recordTypeLabel = (type) => (type === "contextPack" ? "Context Pack" : ENTITY_CONFIG[type].label);