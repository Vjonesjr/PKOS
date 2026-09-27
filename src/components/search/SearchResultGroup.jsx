import React from "react";
import { Link } from "react-router-dom";
import { SEARCH_TYPE_LABELS, getTitle, getSnippet, getRoute } from "@/lib/searchConfig";
import { highlightMatch } from "@/lib/highlightMatch";
import StatusBadge from "@/components/shared/StatusBadge";

export default function SearchResultGroup({ type, records, query }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {SEARCH_TYPE_LABELS[type]}
        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-foreground/70">{records.length}</span>
      </p>
      <div className="space-y-1.5">
        {records.map((r) => {
          const snippet = getSnippet(type, r);
          return (
            <Link
              key={r.id}
              to={getRoute(type, r)}
              className="block rounded-xl border border-border bg-card/50 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground/90 truncate">{highlightMatch(getTitle(type, r), query)}</p>
                {r.status && <StatusBadge value={r.status} />}
              </div>
              {snippet && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{highlightMatch(snippet, query)}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}