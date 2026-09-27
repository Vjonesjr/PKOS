import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const TYPE_META = {
  capture: { label: "Captures", route: "/capture" },
  knowledge: { label: "Knowledge", route: "/knowledge-detail" },
  project: { label: "Projects", route: "/project-detail" },
  task: { label: "Tasks", route: "/projects" },
  decision: { label: "Decisions", route: "/decisions" },
};

export default function UniversalSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [captures, knowledge, projects, tasks, decisions] = await Promise.all([
        base44.entities.Capture.list("-created_date", 100),
        base44.entities.Knowledge.list("-updated_date", 100),
        base44.entities.Project.list("-updated_date", 60),
        base44.entities.Task.list("-updated_date", 100),
        base44.entities.Decision.list("-updated_date", 60),
      ]);
      setData({ capture: captures, knowledge, project: projects, task: tasks, decision: decisions });
    })();
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = query.trim().toLowerCase();
  const results =
    q.length > 0 && data
      ? Object.entries(data).reduce((acc, [type, records]) => {
          const matches = records.filter((r) => {
            const text = `${r.title || ""} ${r.decision || ""} ${r.content || ""} ${(r.tags || []).join(" ")}`.toLowerCase();
            return text.includes(q);
          });
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
    const meta = TYPE_META[type];
    if (type === "knowledge" || type === "project") {
      navigate(`${meta.route}?id=${record.id}`);
    } else {
      navigate(meta.route);
    }
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
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{TYPE_META[type].label}</p>
              {records.map((r) => (
                <button
                  key={r.id}
                  onClick={() => goTo(type, r)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-foreground/90 transition-colors hover:bg-secondary"
                >
                  {highlight(r.title || r.decision || "Untitled")}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}