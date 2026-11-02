import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function PagedTaskGroup({ title, subtitle, count, storageKey, children, defaultOpen = true }) {
  const id = useId();
  const [open, setOpen] = useState(() => {
    try { const saved = localStorage.getItem(storageKey); return saved === null ? defaultOpen : saved === 'true'; } catch { return defaultOpen; }
  });
  const [limit, setLimit] = useState(5);
  const expanded = count > 0 && open;
  const toggle = () => { const next = !open; setOpen(next); try { localStorage.setItem(storageKey, String(next)); } catch { /* memory remains usable */ } };
  return <section className="pkos-task-group overflow-hidden rounded-2xl border border-border bg-card/35">
    <h2><button type="button" onClick={toggle} disabled={!count} aria-expanded={expanded} aria-controls={id} className="flex min-h-12 w-full items-center justify-between gap-3 bg-secondary/45 px-4 py-3 text-left">
      <span><span className="font-semibold text-foreground">{title}</span>{subtitle && <span className="block text-xs font-normal text-muted-foreground">{subtitle}</span>}</span>
      <span className="flex shrink-0 items-center gap-2"><span className="rounded-full bg-background/70 px-2.5 py-1 text-xs">{count}</span><ChevronDown className={`h-4 w-4 ${expanded ? 'rotate-180' : ''}`}/></span>
    </button></h2>
    <div id={id} hidden={!expanded}>
      {expanded && children(limit)}
      {expanded && count > 5 && <div className="flex flex-wrap items-center gap-2 border-t border-border p-3">
        <span className="mr-auto text-xs text-muted-foreground" role="status">Showing {Math.min(limit, count)} of {count}</span>
        {limit < count && <button type="button" className="min-h-11 rounded-lg border border-border px-3 text-sm" onClick={() => setLimit(n => Math.min(count, n + 5))}>Show 5 More</button>}
        {limit > 5 && <button type="button" className="min-h-11 rounded-lg border border-border px-3 text-sm" onClick={e => { setLimit(5); const group = e.currentTarget.closest('section'); requestAnimationFrame(() => { if (group.getBoundingClientRect().top < 80) group.scrollIntoView({ behavior: 'instant', block: 'start' }); }); }}>Show Fewer</button>}
      </div>}
    </div>
  </section>;
}
