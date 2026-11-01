import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { activeScroller, readDisplay, reduceScrollMotion, scrollGeometry, scrollToStart } from '@/lib/scrollNavigation';

export default function ScrollNavigation() {
  const location = useLocation();
  const [display, setDisplay] = useState(readDisplay);
  const [metrics, setMetrics] = useState({ visible: false, height: 0, offset: 0, top: 80, length: 0, down: false });
  const [sections, setSections] = useState([]);
  useEffect(() => {
    const update = () => setDisplay(readDisplay());
    window.addEventListener('pkos:display-changed', update);
    return () => window.removeEventListener('pkos:display-changed', update);
  }, []);
  useEffect(() => {
    let frame = 0;
    let sequence = 0;
    const main = document.querySelector('main');
    const resetActive = () => document.querySelectorAll('[data-pkos-active-scroll]').forEach(e => e.removeAttribute('data-pkos-active-scroll'));
    resetActive();
    const measure = () => {
      frame = 0;
      const element = activeScroller();
      if (!element) return;
      const header = document.querySelector('[data-pkos-header]');
      const nav = document.querySelector('nav[aria-label="Bottom navigation"]');
      const rect = element === document.scrollingElement ? { top: 0, bottom: window.innerHeight } : element.getBoundingClientRect();
      const top = Math.max(8, (header?.getBoundingClientRect().bottom || 0) + 8, rect.top);
      const bottom = Math.min(window.innerHeight - 8, (nav?.getBoundingClientRect().top || window.innerHeight) - 8, rect.bottom);
      const length = Math.max(0, bottom - top);
      setMetrics({ ...scrollGeometry(element, length), top, length, down: element.scrollTop > Math.min(320, element.clientHeight / 2) });
      const headings = [...(main?.querySelectorAll('h2, [data-scroll-section]') || [])].filter(e => e.getClientRects().length && !e.closest('[role="dialog"]'));
      // IDs stay with DOM nodes, so asynchronous content and collapsed groups remain accurate.
      const next = headings.map((node, i) => {
        if (!node.id) { do { sequence++; } while (document.getElementById(`pkos-section-${sequence}`)); node.id = `pkos-section-${sequence}`; }
        return { id: node.id, label: (node.dataset.scrollSection || node.textContent || '').trim() };
      }).filter(s => s.label);
      setSections(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const scrolled = event => {
      const target = event.target;
      // Ignore dialog, popover, and menu scrolling. Never intercept touch events.
      if (target instanceof Element && main?.contains(target) && !target.closest('[role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper]') && target.scrollHeight > target.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(target).overflowY)) {
        resetActive(); target.dataset.pkosActiveScroll = 'true';
      } else if (target === document) resetActive();
      schedule();
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(document.documentElement);
    if (main) resize.observe(main);
    const mutations = new MutationObserver(schedule);
    if (main) mutations.observe(main, { childList: true, subtree: true, characterData: true });
    document.addEventListener('scroll', scrolled, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); resetActive(); resize.disconnect(); mutations.disconnect(); document.removeEventListener('scroll', scrolled, true); window.removeEventListener('resize', schedule); window.visualViewport?.removeEventListener('resize', schedule); };
  }, [location.pathname, location.search]);
  const sectionMode = display.scrollStyle === 'sections' && sections.length > 1;
  return <>
    {(metrics.down || sectionMode) && <div className="pkos-scroll-tools" aria-label="Page scrolling controls">
      {sectionMode && <label className="min-w-0 flex-1 text-sm"><span className="sr-only">Jump to section</span><select aria-label="Jump to section" className="min-h-11 w-full rounded-lg border border-border bg-background px-2" value="" onChange={e => { document.getElementById(e.target.value)?.scrollIntoView({ behavior: reduceScrollMotion() ? 'instant' : 'smooth', block: 'start' }); }}><option value="" disabled>Jump to section…</option>{sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>}
      {metrics.down && <button type="button" className="ml-auto flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm" aria-label="Scroll to top" onClick={() => scrollToStart()}><ArrowUp className="h-4 w-4"/>Top</button>}
    </div>}
    {display.scrollIndicator !== false && metrics.visible && metrics.length > 0 && <div data-testid="scroll-position-indicator" aria-hidden="true" className="pkos-scroll-track" style={{ top: metrics.top, height: metrics.length }}><div className="pkos-scroll-thumb" style={{ height: metrics.height, transform: `translateY(${metrics.offset}px)` }}/></div>}
  </>;
}
