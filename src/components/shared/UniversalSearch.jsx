import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { SEARCH_TYPE_LABELS, getSearchText, getTitle, getRoute } from "@/lib/searchConfig";

export default function UniversalSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { workspace } = useWorkspace();

  useEffect(() => {
    (async () => {
      const [captures, knowledge, projects, tasks, learning, decisions, lessons] = await Promise.all([
        base44.entities.Capture.filter({ workspace }, "-created_date", 100),
        base44.entities.Knowledge.filter({ workspace }, "-updated_date", 100),
        base44.entities.Project.filter({ workspace }, "-updated_date", 60),
        base44.entities.Task.filter({ workspace }, "-updated_date", 100),
        base44.entities.LearningItem.filter({ workspace }, "-updated_date", 100),
        base44.entities.Decision.filter({ workspace }, "-updated_date", 60),
        base44.entities.Lesson.filter({ workspace }, "-created_date", 60),
      ]);
      setData({ capture: captures, knowledge, project: projects, task: tasks, learning, decision: decisions, lesson: lessons });
    })();
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [workspace]);

  const q = query.trim().toLowerCase();
  const results =
    q.length > 0 && data
      ? Object.entries(data).reduce((acc, [type, records]) => {
          const matches = records.filter((r) => getSearchText(type, r).toLowerCase().includes(q));
          if (matches.length) acc[type] = matches.slice(0, 5);
          return acc;
        }, {})
      : {};
  const hasResults = Object.keys(results).length > 0;

  const highlight = (text) => {
    if (!text) return "";
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-primary font-semibold">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const goTo = (type, record) => {
    navigate(getRoute(type, record));
    setFocused(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search everything..."
          className="w-full rounded-full border border-border bg-secondary/60 py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/50"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {focused && q.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-popover p-2 shadow-2xl max-h-[70vh] overflow-y-auto">
          {!hasResults && <p className="px-3 py-4 text-center text-sm text-muted-foreground">No matches for "{query}"</p>}
          {Object.entries(results).map(([type, records]) => (
            <div key={type} className="mb-1">
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{SEARCH_TYPE_LABELS[type]}</p>
              {records.map((r) => (
                <button
                  key={r.id}
                  onClick={() => goTo(type, r)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-foreground/90 transition-colors hover:bg-secondary"
                >
                  {highlight(getTitle(type, r))}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}