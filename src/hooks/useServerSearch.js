import { useEffect, useRef, useState } from "react";
import { buildQuery, fetchPage } from "@/lib/searchQuery";

// Runs a paginated server-side search per record type. Results: { [type]: { items, cursor, hasMore, query } }.
export default function useServerSearch({ enabled, types, filters }) {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const version = useRef(0);
  const key = JSON.stringify({ enabled, types, filters });

  useEffect(() => {
    const v = ++version.current;
    if (!enabled) { setResults({}); setLoading(false); return; }
    setLoading(true);
    // Debounce typing, then fetch in small waves to stay under rate limits.
    const timer = setTimeout(async () => {
      const next = {};
      const jobs = types.map((t) => [t, buildQuery(t, filters)]).filter(([, q]) => q);
      for (let i = 0; i < jobs.length; i += 4) {
        const pages = await Promise.all(jobs.slice(i, i + 4).map(([t, q]) => fetchPage(t, q)));
        pages.forEach((p, j) => {
          const [t, q] = jobs[i + j];
          next[t] = { items: p.items, cursor: p.next_cursor, hasMore: p.has_more, query: q };
        });
        if (v !== version.current) return;
      }
      setResults(next);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [key]);

  const loadMore = async (type) => {
    const cur = results[type];
    if (!cur?.hasMore) return;
    const p = await fetchPage(type, cur.query, cur.cursor);
    setResults((prev) => ({ ...prev, [type]: { ...cur, items: [...cur.items, ...p.items], cursor: p.next_cursor, hasMore: p.has_more } }));
  };

  return { results, loading, loadMore };
}