import { reduceScrollMotion } from '@/lib/scrollNavigation';
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Session storage survives app reloads without retaining positions indefinitely.
const STORAGE_KEY = 'pkos_scroll_positions_v1';
const positions = (() => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    return new Map(Array.isArray(saved) ? saved.filter(([k, y]) => typeof k === 'string' && Number.isFinite(y)) : []);
  } catch { return new Map(); }
})();
const savePosition = (key, y) => {
  positions.set(key, y);
  try {
    // Cap the cache to avoid growing storage indefinitely.
    while (positions.size > 60) positions.delete(positions.keys().next().value);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...positions]));
  } catch { /* Storage can be unavailable; in-memory navigation still works. */ }
};
const readMode = () => {
  try { return JSON.parse(localStorage.getItem('pkos_display') || '{}').scroll || 'standard'; }
  catch { return 'standard'; }
};
const reducedMotion = reduceScrollMotion;
const keyFor = ({ pathname, search }) => pathname + search;

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { pathname, search, hash } = location;

  useEffect(() => {
    const key = keyFor(location);
    const remember = () => savePosition(key, window.scrollY);
    window.addEventListener('scroll', remember, { passive: true });
    return () => { remember(); window.removeEventListener('scroll', remember); };
  }, [pathname, search]);

  useEffect(() => {
    const mode = readMode();
    const behavior = mode === 'smooth' && !reducedMotion() ? 'smooth' : 'instant';
    if (hash) {
      let id;
      try { id = decodeURIComponent(hash.slice(1)); } catch { id = hash.slice(1); }
      let frame;
      let attempts = 0;
      const find = () => {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' });
        else if (++attempts < 180) frame = window.requestAnimationFrame(find);
      };
      frame = window.requestAnimationFrame(find);
      return () => window.cancelAnimationFrame(frame);
    }
    if (navigationType === 'POP' || mode === 'remember') {
      const position = positions.get(keyFor(location));
      if (position !== undefined) {
        let frame;
        let attempts = 0;
        const restore = () => {
          window.scrollTo({ top: position, behavior: 'instant' });
          // Content can arrive asynchronously; retry briefly until it is tall enough.
          if (window.scrollY + 2 < position && ++attempts < 90) {
            frame = window.requestAnimationFrame(restore);
          }
        };
        frame = window.requestAnimationFrame(restore);
        return () => window.cancelAnimationFrame(frame);
      }
      if (navigationType === 'POP') return;
    }
    window.scrollTo({ top: 0, left: 0, behavior });
  }, [pathname, search, hash, navigationType]);

  return null;
}
