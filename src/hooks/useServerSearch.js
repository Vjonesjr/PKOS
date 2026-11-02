import { useEffect, useRef, useState } from "react";
import { buildQuery, fetchPage } from "@/lib/searchQuery";

const SEARCH_TIMEOUT_MS = 8000;
const timeout = (promise, ms = SEARCH_TIMEOUT_MS) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error("Search source timed out")), ms)),
]);

// Runs paginated searches per record type. One slow/broken source never blocks the rest.
export default function useServerSearch({ enabled, types, filters }) {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const version = useRef(0);
  const key = JSON.stringify({ enabled, types, filters });

  useEffect(() => {
    const v = ++version.current;
    if (!enabled) {
      setResults({});
      setWarnings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setWarnings([]);
    const timer = setTimeout(async () => {
      const next = {};
      const failed = [];
      try {
        const jobs = types.map((type) => [type, buildQuery(type, filters)]).filter(([, query]) => query);
        for (let i = 0; i < jobs.length; i += 4) {
          const wave = jobs.slice(i, i + 4);
          const settled = await Promise.allSettled(
            wave.map(([type, query]) => timeout(fetchPage(type, query)))
          );

          settled.forEach((result, index) => {
            const [type, query] = wave[index];
            if (result.status === "fulfilled") {
              const page = result.value || {};
              next[type] = {
                items: page.items || [],
                cursor: page.next_cursor || null,
                hasMore: Boolean(page.has_more),
                query,
              };
            } else {
              failed.push(type);
              next[type] = { items: [], cursor: null, hasMore: false, query };
            }
          });
          if (v !== version.current) return;
        }
        setResults(next);
        setWarnings(failed);
      } catch (error) {
        if (v === version.current) setWarnings(["search"]);
      } finally {
        if (v === version.current) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [key]);

  const loadMore = async (type) => {
    const cur = results[type];
    if (!cur?.hasMore) return;
    try {
      const page = await timeout(fetchPage(type, cur.query, cur.cursor));
      setResults((prev) => ({
        ...prev,
        [type]: {
          ...cur,
          items: [...cur.items, ...(page.items || [])],
          cursor: page.next_cursor || null,
          hasMore: Boolean(page.has_more),
        },
      }));
    } catch {
      setWarnings((prev) => [...new Set([...prev, type])]);
    }
  };

  return { results, loading, warnings, loadMore };
}
