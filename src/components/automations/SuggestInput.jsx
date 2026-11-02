import React, { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { TRIGGERS, TYPES } from "@/lib/automation/catalog";

// Type-ahead for tag / keyword conditions. Suggestions come from the trigger's record types in
// the current workspace; any custom value can still be typed. Native datalist = keyboard accessible.
export default function SuggestInput({ field, value, onChange, trigger, workspace }) {
  const listId = useId();
  const [options, setOptions] = useState([]);
  const types = (TRIGGERS[trigger]?.types || []).filter((t) => TYPES[t]);

  useEffect(() => {
    const q = value.trim();
    const t = setTimeout(async () => {
      const distinct = field === "tag" ? "tags" : "title";
      const query = { workspace, ...(q && { [distinct]: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }) };
      const pages = await Promise.all(types.map((ty) => TYPES[ty].entity.filter(query, { distinct, limit: 20 }).catch(() => ({ items: [] }))));
      const all = [...new Set(pages.flatMap((p) => p.items).flat().filter(Boolean).map(String))];
      setOptions(all.filter((o) => !q || o.toLowerCase().includes(q.toLowerCase())).slice(0, 12));
    }, 200);
    return () => clearTimeout(t);
  }, [value, field, trigger, workspace]);

  return (
    <>
      <Input list={listId} value={value} onChange={(e) => onChange(e.target.value)} className="min-w-32 flex-1"
        placeholder={field === "tag" ? "Start typing a tag…" : "Type a keyword…"} aria-label={field === "tag" ? "Tag" : "Keyword"} />
      <datalist id={listId}>{options.map((o) => <option key={o} value={o} />)}</datalist>
    </>
  );
}
