import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { getRoute, getTitle } from "@/lib/searchConfig";

export default function MeaningSearch({ workspace, query, candidates }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const alive = useRef(true);
  const lock = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const run = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setResult(null);
    try {
      const res = await base44.functions.invoke("pkosIntelligence", {
        action: "search", workspace, query, candidates: candidates.slice(0,120).map(x => ({ type: x.type, id: x.record.id }))
      });
      if (res.data?.error) throw new Error(res.data.error);
      if (!Array.isArray(res.data?.matches)) throw new Error("No valid search response.");
      if (alive.current) setResult(res.data);
    } catch (e) { if (alive.current) setError(e.message || "Meaning search failed."); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  return <section className="rounded-2xl border border-primary/20 bg-card/60 p-4 space-y-3" aria-label="Search by meaning">
    <div className="flex flex-wrap justify-between items-center gap-3">
      <div><h2 className="text-sm font-semibold">Search by meaning</h2>
        <p className="text-xs text-muted-foreground">Ask naturally. Searches up to 120 recently updated records matching your filters. Uses AI credits only when clicked.</p></div>
      <Button size="sm" disabled={busy || query.trim().length < 3 || !candidates.length} onClick={run}>{busy ? "Searching…" : "Find related records"}</Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {result && <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Reviewed {result.searched} records. AI relevance explanations are suggestions; open the source to verify.</p>
      {result.matches.length === 0 && <p className="text-sm">No related records found in this set. Broaden your filters or try different wording.</p>}
      {result.matches.map(match => {
        const source = candidates.find(x => x.type === match.type && x.record.id === match.id);
        if (!source) return null;
        return <article className="rounded-lg border border-border p-3" key={match.type + ":" + match.id}>
          <Link className="text-sm font-medium text-primary underline" to={getRoute(match.type,source.record)}>{getTitle(match.type,source.record)}</Link>
          <p className="text-xs text-muted-foreground capitalize">{match.type}</p>
          <p className="mt-1 text-sm">{match.reason}</p>
          <blockquote className="mt-2 border-l-2 border-border pl-2 text-xs text-muted-foreground whitespace-pre-wrap">{match.excerpt}</blockquote>
        </article>;
      })}
    </div>}
  </section>;
}
