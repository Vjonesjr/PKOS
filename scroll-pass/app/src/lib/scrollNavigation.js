// Geometry comes directly from the scrolling element, including nested detail panes.
export function scrollGeometry(element, trackLength) {
  const viewport = element.clientHeight;
  const range = Math.max(0, element.scrollHeight - viewport);
  const height = element.scrollHeight ? trackLength * viewport / element.scrollHeight : trackLength;
  return { visible: range > 1, height, offset: range ? Math.max(0, Math.min(range, element.scrollTop)) / range * (trackLength - height) : 0 };
}
export function activeScroller() {
  const current = document.querySelector('[data-pkos-active-scroll="true"]');
  return current?.isConnected && current.scrollHeight > current.clientHeight + 1 ? current : document.scrollingElement;
}
export function reduceScrollMotion() {
  return document.documentElement.dataset.reduceMotion === 'true' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
export function scrollToStart(element = activeScroller()) {
  element?.scrollTo({ top: 0, behavior: reduceScrollMotion() ? 'instant' : 'smooth' });
}
export function readDisplay() {
  try { return { scroll: 'standard', scrollStyle: 'standard', scrollIndicator: true, ...JSON.parse(localStorage.getItem('pkos_display') || '{}') }; }
  catch { return { scroll: 'standard', scrollStyle: 'standard', scrollIndicator: true }; }
}
