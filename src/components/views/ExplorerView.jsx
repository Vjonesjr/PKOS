import { useState } from "react";
import { Folder, Tag, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Optional Explorer view (folders / tags / categories).
 * Use when display.viewMode === 'explorer'.
 */
export default function ExplorerView({ folders = [], tags = [], items = [], onSelect }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);

  const filtered = items.filter((item) => {
    if (query && !(item.title || "").toLowerCase().includes(query.toLowerCase())) return false;
    if (active?.type === "folder" && item.folder !== active.id) return false;
    if (active?.type === "tag" && !(item.tags || []).includes(active.id)) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1 text-sm">
        <button
          type="button"
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${!active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
          onClick={() => setActive(null)}
        >
          All
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${active?.id === f.id ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
            onClick={() => setActive({ type: "folder", id: f.id })}
          >
            <Folder className="h-3.5 w-3.5" /> {f.name}
          </button>
        ))}
        {tags.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${active?.id === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
            onClick={() => setActive({ type: "tag", id: t.id })}
          >
            <Tag className="h-3.5 w-3.5" /> {t.name}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground">No items match.</p>}
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left text-sm hover:bg-muted/50"
            onClick={() => onSelect?.(item)}
          >
            <span className="truncate font-medium">{item.title || "Untitled"}</span>
            {item.preview && <span className="ml-auto truncate text-xs text-muted-foreground">{item.preview}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
