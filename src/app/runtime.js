(function () {
  let e = document.createElement(`link`).relList;
  if (e && e.supports && e.supports(`modulepreload`)) return;
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
  new MutationObserver((e) => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes)
          e.tagName === `LINK` && e.rel === `modulepreload` && n(e);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(e) {
    let t = {};
    return (
      e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      (t.credentials =
        e.crossOrigin === `use-credentials`
          ? `include`
          : e.crossOrigin === `anonymous`
            ? `omit`
            : `same-origin`),
      t
    );
  }
  function n(e) {
    if (e.ep) return;
    e.ep = !0;
    let n = t(e);
    fetch(e.href, n);
  }
})();
import { demoFixtures, personalFixtures } from "./fixtures.js";
import { connectedWorkRefs, uniqueRelationshipRefs } from "./relationships.js";
import { buildConnectionSuggestions, buildDevelopRecordProposal, buildShapeCaptureProposal } from "./ai-proposal-workflows.js";
import { appendReviewedDevelopDraft, applyReviewedConnectionSuggestion, applyReviewedShapeProposal, dismissConnectionSuggestion, replaceWithReviewedDevelopDraft } from "./ai-review-actions.js";
import { SEARCH_BUCKETS, addRecentSearch, clearRecentSearches, conciseSearchContext, filterSearchRecords, groupSearchResults, highlightMatch, normalizeSearchHistory } from "./search.js";

import { syncNativeTheme, saveBackupFile } from "./native-device.js";
import { canImportTextFile, createImportedNote, readTextFileInChunks } from "./import-files.js";
import { exportPkosWorkspace } from "./pkos-export.js";
import { MAX_IMPORT_BYTES, parsePkosMarkdown, parseStructuredImport, previewPkosImport, stagePkosImport, applySuggestedTasks, commitPkosImport } from "./pkos-import.js";

async function readTextFileInChunksCompat(file, chunkSize = 256 * 1024) {
  if (typeof file.slice !== 'function') return file.text();
  const parts = [];
  for (let offset = 0; offset < file.size; offset += chunkSize) parts.push(await file.slice(offset, Math.min(offset + chunkSize, file.size)).text());
  return parts.join('');
}

var e = `mindforge-data-v3`,
  t = `mindforge-workspaces-v1`,
  n = `mindforge-preferences-v2`,
  r = `mindforge-ai-v1`,
  z = `mindforge-search-history-v1`,
  i = `1.6.8`,
  a = {
    captures: `Capture`,
    ideas: `Idea`,
    notes: `Note`,
    outlines: `Outline`,
    projects: `Project`,
    goals: `Goal`,
    plans: `Plan`,
    tasks: `Action`,
  },
  o = (e) => JSON.parse(JSON.stringify(e)),
  s = () => new Date().toISOString().slice(0, 10),
  c = () => Date.now() + Math.floor(Math.random() * 999),
  l = (e) =>
    String(e ?? ``).replace(
      /[&<>"']/g,
      (e) =>
        ({
          "&": `&amp;`,
          "<": `&lt;`,
          ">": `&gt;`,
          '"': `&quot;`,
          "'": `&#39;`,
        })[e],
    ),
  u = personalFixtures,
  f = demoFixtures;
function p(e) {
  let t = e?.data || e;
  return !t ||
    ![`ideas`, `notes`, `outlines`, `projects`].every((e) =>
      Array.isArray(t[e]),
    )
    ? null
    : ((t = {
        ...t,
        captures: Array.isArray(t.captures) ? t.captures : [],
        goals: Array.isArray(t.goals) ? t.goals : [],
        plans: Array.isArray(t.plans) ? t.plans : [],
        tasks: Array.isArray(t.tasks) ? t.tasks : [],
        trash: Array.isArray(t.trash) ? t.trash : [],
      }),
      Object.keys(a)
        .filter((e) => e !== `trash`)
        .forEach((e) =>
          t[e].forEach((e) => {
            ((e.links = Array.isArray(e.links) ? e.links : []),
              (e.tags = Array.isArray(e.tags) ? e.tags : []),
              (e.priority = e.priority || `Medium`));
          }),
        ),
      t);
}
function m() {
  try {
    return (
      p(JSON.parse(localStorage.getItem(e))) ||
      p(
        JSON.parse(
          localStorage.getItem(`mindforge-data-v2`) ||
            localStorage.getItem(`mindforge-data`),
        ),
      ) ||
      o(u)
    );
  } catch {
    return o(u);
  }
}
function ee() {
  try {
    let e = JSON.parse(localStorage.getItem(t));
    if (e?.personal && e?.demo)
      return { personal: p(e.personal) || m(), demo: p(e.demo) || o(f) };
  } catch {}
  let e = { personal: m(), demo: o(f) };
  try {
    localStorage.setItem(t, JSON.stringify(e));
  } catch {}
  return e;
}
var h = ee(),
  g = {
    theme: `system`,
    preset: `Forge Dark`,
    density: `standard`,
    font: `standard`,
    motion: `on`,
    glow: !0,
    hero: !0,
    card: `layered`,
    nav: [`dashboard`, `capture`, `projects`, `review`, `more`],
    modules: [`next`, `capture`, `projects`, `recent`, `ideas`, `overdue`],
    views: {},
    onboarded: !1,
    doubleBackExit: !1,
    workspace: `personal`,
  },
  _ = {};
try {
  _ = JSON.parse(localStorage.getItem(n) || `{}`);
} catch {}
var v = { ...g, ..._ };
((v.nav = Array.isArray(v.nav) ? v.nav : g.nav),
  (v.modules = Array.isArray(v.modules) ? v.modules : g.modules),
  (v.views =
    v.views && typeof v.views == `object` && !Array.isArray(v.views)
      ? v.views
      : g.views),
  (v.workspace = h[v.workspace] ? v.workspace : g.workspace));
var y = h[v.workspace] || h.personal,
  b = `dashboard`,
  x = null,
  S = null,
  C = ``,
  w = ``,
  T = ``,
  R = [],
  routeHistory = [],
  lastBackAt = 0;
var Zz = { personal: [], demo: [] };
function routeState() { return { page: b, record: x, search: w, filter: T, types: [...R] }; }
function navigate(next) { routeHistory.push(routeState()); b = next.page ?? b; x = next.record ?? null; w = next.search ?? ``; T = next.filter ?? ``; R = next.types ? [...next.types] : []; $(); }
function goBack() {
  if (routeHistory.length) { const previous = routeHistory.pop(); b = previous.page; x = previous.record; w = previous.search; T = previous.filter; R = [...previous.types]; $(); return; }
  if (v.doubleBackExit) { const now = Date.now(); if (now - lastBackAt < 900 && window.Capacitor?.Plugins?.App?.exitApp) window.Capacitor.Plugins.App.exitApp(); else { lastBackAt = now; A(`Press Back again to exit.`); } }
}
try {
  let e = JSON.parse(localStorage.getItem(z) || `{}`);
  Zz = { personal: normalizeSearchHistory(e.personal), demo: normalizeSearchHistory(e.demo) };
} catch {}
function Ee() {
  try { localStorage.setItem(z, JSON.stringify(Zz)); } catch {}
}
function E() {
  try {
    return (
      (h[v.workspace] = y),
      localStorage.setItem(t, JSON.stringify(h)),
      localStorage.setItem(e, JSON.stringify(h.personal)),
      localStorage.setItem(`mindforge-data`, JSON.stringify(h.personal)),
      localStorage.setItem(n, JSON.stringify(v)),
      !0
    );
  } catch {
    return (
      (C = `This device could not save the change. Back up MindForge before closing.`),
      !1
    );
  }
}
function te(e) {
  ((v.workspace = e),
    (y = h[e]),
    (x = null),
    (w = ``),
    (T = ``),
    (R = []),
    E(),
    A(
      e === `demo`
        ? `Demo workspace loaded. Your personal records remain separate.`
        : `Personal workspace restored.`,
    ));
}
function D() {
  return Object.entries(a)
    .filter(([e]) => e !== `trash`)
    .flatMap(([e, t]) =>
      y[e].map((n) => ({ ...n, bucket: e, kind: t, title: n.title || n.name })),
    );
}
function O(e) {
  let [t, n] = String(e || ``).split(`:`);
  return [t, y[t]?.find((e) => String(e.id) === n)];
}
function k(e, t) {
  return `${e}:${t.id}`;
}
function A(e) {
  ((C = e),
    $(),
    setTimeout(() => {
      C === e && ((C = ``), $());
    }, 3200));
}
function j(e, t = ``, n = ``) {
  return `<button class="${n}" ${t}>${e}</button>`;
}
function M(e) {
  return e.length
    ? `<div class="linked-list">${e
        .map((e) => {
          let [t, n] = O(e);
          return n
            ? `<button class="linked-record" data-open="${e}"><span>${a[t]}</span>${l(n.title || n.name)}<b>›</b></button>`
            : ``;
        })
        .join(``)}</div>`
    : `<p class="empty small">Nothing connected yet.</p>`;
}
function N(e) {
  let t = y.tasks.filter((t) => !e || String(t.projectId) === String(e.id)),
    n = t.filter((e) => e.status !== `Done`);
  return {
    ts: t,
    open: n,
    openCount: n.length,
    over: n.filter((e) => e.due && e.due < s()),
    done: t.length - n.length,
    pct: Number.isFinite(Number(e?.progress)) ? Math.max(0, Math.min(100, Number(e.progress))) : t.length ? Math.round(((t.length - n.length) * 100) / t.length) : 0,
  };
}
function oe(e, t) {
  return `${e} ${e === 1 ? t : `${t}s`}`;
}
function ne(e) {
  return y.tasks.filter((t) => String(t.projectId) === String(e.id));
}
function re() {
  let e =
    v.theme === `system`
      ? matchMedia(`(prefers-color-scheme: light)`).matches
        ? `light`
        : `dark`
      : v.theme;
  ((document.documentElement.dataset.theme = e),
    (document.documentElement.dataset.preset = v.preset),
    (document.documentElement.dataset.density = v.density),
    (document.documentElement.dataset.font = v.font),
    (document.documentElement.dataset.motion = v.motion),
    (document.documentElement.dataset.glow = v.glow ? `on` : `off`),
    (document.documentElement.dataset.card = v.card));
  syncNativeTheme(e);
}
var P = {
    schemaVersion: 1,
    workspaces: {
      personal: { activity: [], dismissals: {}, cache: {} },
      demo: { activity: [], dismissals: {}, cache: {} },
    },
  },
  F;
try {
  let e = JSON.parse(localStorage.getItem(r) || `{}`);
  F = e.workspaces
    ? { ...P, ...e, workspaces: { ...P.workspaces, ...e.workspaces } }
    : {
        ...P,
        workspaces: {
          ...P.workspaces,
          personal: {
            activity: e.activity || [],
            dismissals: e.dismissals || {},
            cache: e.cache || {},
          },
        },
      };
} catch {
  F = o(P);
}
function I() {
  return (
    F.workspaces[v.workspace] ||
    (F.workspaces[v.workspace] = { activity: [], dismissals: {}, cache: {} })
  );
}
function L() {
  try {
    localStorage.setItem(r, JSON.stringify(F));
  } catch {}
}
function se() {
  let e = S.ai,
    [t, n] = O(e.ref);
  if (!n) return ``;
  let r = e.proposal,
    i = e.kind === `connections`;
  return `<div class="overlay"><section class="modal ai-sheet"><button class="close" data-close>×</button><div class="eyebrow">${i ? `Suggest Connections` : e.kind === `shape` ? `Shape Capture` : `Develop Record`} · Local suggestion</div><h2>Review before applying</h2><p class="ai-disclosure">Processed locally with deterministic rules. No model is configured, and no record text left this device.</p>${
    i
      ? `<div class="proposal-list">${
          r
            .map((t, n) => {
              let [, r] = O(t.targetRef);
              return `<article><b>${l(r?.title || r?.name || t.targetRef)}</b><span>${Math.round(t.confidence * 100)}% confidence</span><p>${l(t.evidence.join(` · `))}</p>${j(`Link`, `data-apply-link="${e.ref}:${t.targetRef}"`, `primary`)}${j(`Not related`, `data-dismiss-link="${e.ref}:${t.targetRef}"`, `secondary`)}</article>`;
            })
            .join(``) ||
          `<p class="empty">No supported local suggestions yet.</p>`
        }</div>`
      : e.kind === `shape`
        ? `<label>Recommended type<div class="readout-pill">${l(r.recommendedType)}</div></label><label>Title<input id="ai-title" value="${l(r.title)}"></label><label>Description<textarea id="ai-description">${l(r.description)}</textarea></label><label>Next action<input id="ai-next" value="${l(r.next)}"></label><label>Tags (comma separated)<input id="ai-tags" value="${l(r.tags.join(`, `))}"></label><p class="hint">${l(r.reasoning.join(` · `))}</p>${j(`Apply selected fields`, `data-apply-shape`, `primary`)}`
        : `<label>Draft content<textarea id="ai-content" class="editor">${l(r.content)}</textarea></label><p class="hint">${l(r.reasoning.join(` · `))}</p>${j(`Append as draft`, `data-append-draft`, `secondary`)}${j(`Replace content`, `data-replace-content`, `primary`)}`
  }${j(`Discard`, `data-close`, `secondary`)}</section></div>`;
}
function ce(e, t) {
  let n = connectedWorkRefs(e, t, { records: D(), refFor: k })
    .map((e) => {
      let [t, n] = O(e);
      return n
        ? `<button class="map-node" data-open="${e}"><span>${a[t]}</span>${l(n.title || n.name)}</button>`
        : ``;
    })
    .join(``);
  return `<section class="connections map"><div class="section-head"><h2>Record Map</h2><span class="hint">Explicit links only</span></div><div class="map-canvas"><article class="map-center"><span>${a[e]}</span>${l(t.title || t.name)}</article><div class="map-spokes">${n || `<p class="empty small">No explicit connections yet.</p>`}</div></div><p class="hint">Suggested connections remain outside the map until you choose Link.</p></section>`;
}
function le() {
  return `<header><button class="wordmark" data-page="dashboard" aria-label="MindForge 3 Home"><i></i>MindForge 3</button><div class="header-actions">${j(`⌕`, `data-page="search" aria-label="Search"`)}${j(`◐`, `data-page="appearance" aria-label="Appearance"`)}</div></header>`;
}
var H = {
  dashboard: `Home`,
  capture: `Capture`,
  projects: `Projects`,
  review: `Review`,
  more: `More`,
};
function U() {
  return `<nav aria-label="Primary navigation">${v.nav.map((e) => `<button class="nav-item ${b === e ? `active` : ``}" data-page="${e}">${H[e]}</button>`).join(``)}</nav>`;
}
function W(e, t, n) {
  return v.modules.includes(e)
    ? `<section class="module"><div class="section-head"><h2>${t}</h2></div>${n}</section>`
    : ``;
}
function G() {
  return v.workspace === `demo`
    ? `<div class="demo-banner"><b>Demo workspace</b><span>Representative fictional records for exploring MindForge. Your personal records are separate.</span>${j(`Return to personal`, `data-workspace="personal"`, `secondary`)}</div>`
    : ``;
}
function K() {
  let e = y.tasks
      .filter((e) => e.status === `Next`)
      .sort((e, t) => (e.priority === `High` ? -1 : 1))[0],
    t = D()
      .filter((e) => e.bucket !== `tasks`)
      .slice(0, 4),
    n = y.projects.slice(0, 3),
    r = y.tasks.filter((e) => e.status !== `Done` && e.due && e.due < s());
  return `${G()}${v.hero ? `<section class="hero"><div><div class="eyebrow">Capture → Connect → Develop → Act</div><h1>Turn thought<br>into work.</h1><p>MindForge turns scattered thoughts into connected work and a clear next action.</p></div><button class="capture-orb" data-page="capture" aria-label="Quick Capture">+</button></section>` : ``}${W(`next`, `Clear next action`, e ? `<button class="focus" data-open="tasks:${e.id}"><div><span>Next action</span><b>${l(e.title)}</b><small>${l(e.description || e.next || `Open and move it forward.`)}</small></div><strong>→</strong></button>` : `<p class="empty">No next action yet. Capture what is on your mind.</p>`)}${W(`capture`, `Quick Capture`, `<button class="capture-call" data-page="capture">+ Capture a messy thought <span>No category required</span></button>`)}${W(`overdue`, `Needs attention`, r.length ? r.map((e) => `<button class="row" data-open="tasks:${e.id}"><span>Overdue</span><b>${l(e.title)}</b><i>→</i></button>`).join(``) : `<p class="empty small">Nothing overdue.</p>`)}${W(
    `projects`,
    `Active Projects`,
    n
      .map((e) => {
        let t = N(e);
        return `<button class="row" data-open="projects:${e.id}"><span>${oe(t.openCount, `open Action`)}</span><b>${l(e.title || e.name)}</b><i>${t.pct}%</i></button>`;
      })
      .join(``) ||
      `<p class="empty small">Create a Project when a thought becomes committed work.</p>`,
  )}${W(`recent`, `Recently Modified`, t.map((e) => `<button class="row" data-open="${e.bucket}:${e.id}"><span>${e.kind}</span><b>${l(e.title)}</b><i>›</i></button>`).join(``))}${W(
    `ideas`,
    `Unreviewed Ideas`,
    y.captures
      .filter((e) => !e.processed)
      .slice(0, 3)
      .map(
        (e) =>
          `<button class="row" data-open="captures:${e.id}"><span>Capture</span><b>${l(e.title)}</b><i>Shape</i></button>`,
      )
      .join(``) || `<p class="empty small">Every capture has been shaped.</p>`,
  )}`;
}
function ue() {
  return `${G()}<section class="page-title"><div><div class="eyebrow">First, get it out</div><h1>Quick Capture</h1><p>Drop the messy version here. Classification can wait.</p></div></section><section class="capture-stage"><textarea id="quick-thought" placeholder="A thought, problem, question, or fragment…" autofocus></textarea><div><span>Saved in the ${v.workspace === `demo` ? `demo` : `personal`} workspace on this device</span>${j(`Capture it`, `id="save-capture"`, `primary`)}</div></section>`;
}
function q(e) {
  let t = e.links?.length
    ? `${e.links.length} connected`
    : e.projectId
      ? `Project work`
      : `Unconnected`;
  return `<article class="item" tabindex="0" data-open="${e.bucket}:${e.id}"><div class="eyebrow">${e.kind} · ${l(t)} · ${l(e.status || `Raw`)}</div><h3>${l(e.title)}</h3><p>${l(e.description || `No details yet.`)}</p><div class="tags">${(
    e.tags || []
  )
    .slice(0, 4)
    .map((e) => `<span>${l(e)}</span>`)
    .join(
      ``,
    )}<span>${l(e.priority || `Medium`)}</span>${e.due ? `<span>${l(e.due)}</span>` : ``}</div></article>`;
}
function J(e, t) {
  let n = y[e].filter(
      (e) =>
        JSON.stringify(e).toLowerCase().includes(w.toLowerCase()) &&
        (!T ||
          e.status === T ||
          e.priority === T ||
          (e.tags || []).includes(T) ||
          e.category === T),
    ),
    r = [
      ...new Set(
        y[e]
          .flatMap((e) => [e.status, e.priority, e.category, ...(e.tags || [])])
          .filter(Boolean),
      ),
    ].sort();
  let currentView = v.views[e] || `list`,
    filterLabel = T || `All statuses, priorities, and tags`;
  return `${G()}<section class="page-title"><div><div class="eyebrow">${oe(n.length, `Record`)}</div><h1>${t}</h1></div>${j(`+ New`, `data-modal="${e}"`, `primary`)}</section><section class="controls"><input id="search" value="${l(w)}" placeholder="Search ${t}"><details class="control-menu" id="filter-menu"><summary>${l(filterLabel)}</summary><div class="control-menu-options"><button type="button" class="control-menu-option ${T ? `` : `chosen`}" data-filter-value="">All statuses, priorities, and tags</button>${r.map((value) => `<button type="button" class="control-menu-option ${T === value ? `chosen` : ``}" data-filter-value="${l(value)}">${l(value)}</button>`).join(``)}</div></details><details class="control-menu" id="view-menu"><summary>${currentView[0].toUpperCase() + currentView.slice(1)} View</summary><div class="control-menu-options">${[`list`, `grid`, `card`].map((value) => `<button type="button" class="control-menu-option ${currentView === value ? `chosen` : ``}" data-view-value="${value}">${value[0].toUpperCase() + value.slice(1)} View</button>`).join(``)}</div></details></section><section class="list ${currentView}">${n.map((t) => q({ ...t, bucket: e, kind: a[e], title: t.title || t.name })).join(``) || `<p class="empty">Nothing matches this search or filter.</p>`}</section>`;
}
function Y() {
  let e = {};
  return (
    D().forEach((t) =>
      (t.tags || []).forEach((n) => {
        (e[n] ??= []).push(t);
      }),
    ),
    `${G()}<section class="page-title"><div><div class="eyebrow">Cross-project context</div><h1>Tags</h1><p>Tags are local labels shown across every record type.</p></div></section><section class="tag-index">${
      Object.entries(e)
        .sort()
        .map(
          ([e, t]) =>
            `<button class="tag-summary" data-tag="${l(e)}"><b>${l(e)}</b><span>${oe(t.length, `record`)}</span></button>`,
        )
        .join(``) || `<p class="empty">No tags yet.</p>`
    }</section>`
  );
}
function de(e, t) {
  let n = [],
    r = new Set([k(e, t)]),
    i = (e) => {
      if (!e || r.has(e)) return;
      r.add(e);
      let [t, a] = O(e);
      a && ((a.links || []).forEach(i), n.push({ b: t, x: a }));
    };
  if (((t.links || []).forEach(i), n.push({ b: e, x: t }), t.projectId)) {
    let e = O(`projects:` + t.projectId);
    e[1] && !n.some((t) => t.x === e[1]) && n.push({ b: `projects`, x: e[1] });
  }
  let o =
    e === `projects`
      ? N(t).open.find((e) => e.status === `Next`) || N(t).open[0]
      : y.tasks.find(
          (n) => (n.links || []).includes(k(e, t)) && n.status !== `Done`,
        );
  return (
    o && !n.some((e) => e.x === o) && n.push({ b: `tasks`, x: o }),
    `<div class="path">${n.map((e, t) => `<button data-open="${e.b}:${e.x.id}" class="${t === n.length - 1 ? `current` : ``}"><span>${a[e.b]}</span>${l(e.x.title || e.x.name)}</button>`).join(`<i>→</i>`)}</div>`
  );
}
function fe() {
  let [e, t] = O(x);
  if (!t) return ((x = null), K());
  let n = D()
      .filter((n) => (n.links || []).includes(k(e, t)))
      .map((e) => k(e.bucket, e)),
    r = [`notes`, `outlines`, `ideas`, `projects`, `tasks`].includes(e);
  return `${j(`← Back`, `data-back`, `back`)}<section class="detail-title"><div class="eyebrow">${a[e]} · ${l(t.status || `Raw`)} · ${l(t.priority || `Medium`)}</div><h1>${l(t.title || t.name)}</h1><p>${l(t.description || `No details yet.`)}</p></section><section class="connections"><div class="section-head"><h2>Connected Work</h2><div>${j(`Suggest Connections`, `data-ai-connections="${e}:${t.id}"`, `secondary`)}${j(`Connect`, `data-link="${e}:${t.id}"`, `secondary`)}</div></div>${de(e, t)}<p class="hint">Explicit links are shown here. Suggestions require review.</p></section><section class="detail-grid"><article><h2>Develop</h2><p>${l(t.description || `No description yet.`)}</p>${e === `notes` || e === `outlines` ? `<textarea class="editor" data-editor="${e}:${t.id}" aria-label="Structured content">${l(t.content || ``)}</textarea><p class="hint">Plain-text structured sections are saved locally.</p>` : ``}<p><b>Next Action</b><br>${l(t.next || `Choose one concrete move.`)}</p><div class="tags">${(t.tags || []).map((e) => `<span>${l(e)}</span>`).join(``)}</div></article><aside><div class="record-actions">${e === `captures` ? j(`Shape Capture`, `data-ai-shape="${e}:${t.id}"`, `primary`) + j(`Make Idea`, `data-convert="ideas:${e}:${t.id}"`, `secondary`) + j(`Make Note`, `data-convert="notes:${e}:${t.id}"`, `secondary`) + j(`Make Project`, `data-convert="projects:${e}:${t.id}"`, `secondary`) + j(`Make Action`, `data-convert="tasks:${e}:${t.id}"`, `secondary`) : ``}${r ? j(`Develop Record`, `data-ai-develop="${e}:${t.id}"`, `primary`) : ``}${e === `tasks` && t.status !== `Done` ? j(`Complete`, `data-done="${e}:${t.id}"`, `primary`) : ``}${j(`Edit`, `data-edit="${e}:${t.id}"`, `secondary`)}${j(`Move to Recently Deleted`, `data-delete="${e}:${t.id}"`, `danger`)}</div></aside></section>${ce(e, t)}${
    e === `projects`
      ? `<section class="connections"><div class="section-head"><h2>Project Actions</h2>${j(`Add Action`, `data-modal="tasks:${t.id}"`, `secondary`)}</div>${
          ne(t)
            .map(
              (e) =>
                `<button class="row" data-open="tasks:${e.id}"><span>${l(e.status || `Next`)}</span><b>${l(e.title)}</b><i>${e.due ? l(e.due) : `→`}</i></button>`,
            )
            .join(``) ||
          `<p class="empty small">No actions are assigned to this Project yet.</p>`
        }</section>`
      : ``
  }<section class="connections progress-panel"><div class="section-head"><div><h2>Progress</h2><p class="readout-pill">${e === `projects` || e === `goals` ? `${Number.isFinite(Number(t.progress)) ? Number(t.progress) : N(t).pct}%` : `—`}</p></div>${e === `projects` || e === `goals` ? j(`Update Progress`, `data-update-progress="${e}:${t.id}"`, `secondary`) : ``}</div><p class="hint">${e === `projects` ? `Derived from completed Actions unless you set a numeric value.` : `A single numeric progress value for this Goal.`}</p></section><section class="connections"><div class="section-head"><h2>Linked Records</h2></div>${M(t.links || [])}</section><section class="connections"><div class="section-head"><h2>Referenced By</h2></div>${M(n)}</section>`;
}
function pe() {
  let e = y.tasks.filter((e) => e.status !== `Done`),
    t = e.filter((e) => e.due && e.due < s()),
    n = e.filter(
      (e) =>
        e.due &&
        e.due >= s() &&
        e.due <= new Date(Date.now() + 2592e5).toISOString().slice(0, 10),
    ),
    r = y.captures
      .filter((e) => !e.processed)
      .map((e) => ({ ...e, bucket: `captures` })),
    i = y.projects
      .filter((e) => !N(e).open.length)
      .map((e) => ({ ...e, bucket: `projects` })),
    a = y.projects
      .filter(
        (e) => N(e).open.length && !N(e).open.some((e) => e.status === `Next`),
      )
      .map((e) => ({ ...e, bucket: `projects` }));
  return `${G()}<section class="page-title"><div><div class="eyebrow">Task Queue / Command Center</div><h1>Command Center</h1><p>Use what is already on this device to decide what moves next.</p></div></section><section class="review-grid">${[
    [`Overdue`, t.length],
    [`Due soon`, n.length],
    [`Unprocessed captures`, r.length],
    [`Stalled projects`, a.length],
  ]
    .map(
      ([e, t]) => `<article><span>${e}</span><strong>${t}</strong></article>`,
    )
    .join(``)}</section><section class="connections"><h2>Act now</h2>${
    [...t, ...n]
      .slice(0, 5)
      .map(
        (e) =>
          `<button class="row" data-open="tasks:${e.id}"><span>${e.due < s() ? `Overdue` : `Soon`}</span><b>${l(e.title)}</b><i>→</i></button>`,
      )
      .join(``) ||
    `<p class="empty small">Nothing urgent is asking for attention.</p>`
  }</section><section class="connections"><h2>Work to reconnect</h2>${
    [...r, ...i, ...a]
      .slice(0, 6)
      .map(
        (e) =>
          `<button class="row" data-open="${e.bucket || `projects`}:${e.id}"><span>${e.bucket === `captures` ? `Capture` : `Project`}</span><b>${l(e.title || e.description.slice(0, 60))}</b><i>→</i></button>`,
      )
      .join(``) ||
    `<p class="empty small">No stalled or unprocessed work detected.</p>`
  }</section>`;
}
function me() {
  return `<section class="page-title"><div><div class="eyebrow">Organize your workspace</div><h1>More</h1></div></section><section class="more-grid">${[
    [`ideas`, `Ideas`],
    [`notes`, `Notes`],
    [`outlines`, `Outlines`],
    [`goals`, `Goals`],
    [`plans`, `Plans`],
    [`tasks`, `Task Queue`],
    [`tags`, `Tags`],
    [`search`, `Search`],
    [`appearance`, `Appearance`],
    [`settings`, `Settings`],
    [`trash`, `Recently Deleted`],
  ]
    .map(([e, t]) => j(t, `data-page="${e}"`, `tile`))
    .join(``)}</section>`;
}
function he() {
  let typeControls = SEARCH_BUCKETS.map((bucket) => {
    let selected = R.includes(bucket);
    return `<button type="button" class="choice search-filter ${selected ? `chosen` : ``}" data-search-type="${bucket}" aria-pressed="${selected}">${l(a[bucket])}</button>`;
  }).join(``);
  return `${G()}<section class="page-title"><div><div class="eyebrow">Find connected work</div><h1>Search</h1><p>Searches only the supported records in this workspace.</p></div></section><section class="search-panel"><label class="search-label" for="search">Search local records</label><input id="search" value="${l(w)}" placeholder="Search thoughts, projects, notes, outlines, and actions" autocomplete="off" enterkeyhint="search"><div class="search-filter-row" aria-label="Filter search results by record type"><span>Record types</span>${typeControls}</div></section><section id="search-results" aria-live="polite">${we()}</section>`;
}
function we() {
  let query = w.trim(), history = normalizeSearchHistory(Zz[v.workspace]);
  if (!query) return `<section class="search-history"><div class="section-head"><h2>Recent searches</h2>${history.length ? j(`Clear`, `id="clear-search-history"`, `secondary`) : ``}</div>${history.length ? `<div class="search-history-list">${history.map((item) => j(l(item), `data-reuse-search="${l(item)}"`, `secondary`)).join(``)}</div>` : `<p class="empty">Start typing to search local records.</p>`}</section>`;
  let results = filterSearchRecords(D(), query, R), groups = groupSearchResults(results);
  if (!results.length) return `<p class="empty">No ${R.length ? `matching record types ` : ``}results for “${l(query)}”.</p>`;
  return `<p class="search-summary">${oe(results.length, `local result`)} in ${v.workspace === `demo` ? `Demo` : `Personal`}.</p>${groups.map((group) => `<section class="search-group"><h2>${l(a[group.bucket])}s <span>${group.records.length}</span></h2><div class="search-result-list">${group.records.map((record) => { let context = conciseSearchContext(record, query); return `<button class="search-result" data-open="${record.bucket}:${record.id}"><span class="search-result-type">${l(record.kind)}</span><b>${highlightMatch(record.title, query)}</b>${context ? `<p>${highlightMatch(context, query)}</p>` : ``}</button>`; }).join(``)}</div></section>`).join(``)}`;
}
function ge() {
  return `<section class="page-title"><div><div class="eyebrow">Your workspace, your rules</div><h1>Appearance</h1></div></section>${Q(`Theme`, X(`theme`, [`system`, `light`, `dark`, `oled`, `amoled`, `light-blue`, `red`]))}${Q(`Visual preset`, X(`preset`, [`Forge Dark`, `AMOLED Black`, `Ember`, `Neon Grid`, `Paper`, `Graphite`]))}${Q(`Comfort`, X(`density`, [`compact`, `standard`, `rich`]) + X(`font`, [`small`, `standard`, `large`]) + X(`motion`, [`on`, `reduced`, `off`]) + Z(`glow`, `Ambient glow`) + Z(`hero`, `Show Home hero`) + Z(`doubleBackExit`, `Double-back exits at root`) + X(`card`, [`flat`, `layered`]))}`;
}
function X(e, t) {
  return `<div class="setting-options">${t.map((t) => `<button data-pref="${e}" data-value="${t}" class="choice ${v[e] === t ? `chosen` : ``}">${l(t)}</button>`).join(``)}</div>`;
}
function Z(e, t) {
  return `<button data-toggle="${e}" class="choice ${v[e] ? `chosen` : ``}">${v[e] ? `✓` : `○`} ${t}</button>`;
}
function Q(e, t) {
  return `<section class="settings-block"><h2>${e}</h2>${t}</section>`;
}
function _e() {
  return `<section class="page-title"><div><div class="eyebrow">Local-first control</div><h1>Settings</h1></div></section>${Q(`Workspaces`, `<p><b>${v.workspace === `demo` ? `Demo` : `Personal`} workspace active.</b> Demo data is fictional and representative; it never replaces personal records. Backup exports the workspace currently open.</p><div class="record-actions">${j(`Use personal workspace`, `data-workspace="personal"`, `secondary`)}${j(`Explore demo workspace`, `data-workspace="demo"`, `primary`)}${j(`Reset demo dataset`, `id="reset-demo"`, `danger`)}</div>`)}${Q(`Data & Backup`, `<p>Back Up MindForge creates a JSON file with the currently open workspace. Restore Backup replaces only the currently open workspace with a valid MindForge JSON backup.</p><p><b>Import Files</b> adds ordinary Markdown and text as traceable Notes. <b>Import Knowledge</b> reviews structured Project, Goal, Plan, Task, and linked-record data before saving.</p><div class="record-actions">${j(`Import Files`, `id="content-import-trigger"`, `primary`)}${j(`Back Up MindForge`, `id="export-settings"`, `secondary`)}${j(`Restore Backup`, `id="import-trigger"`, `secondary`)}${j(`Export Knowledge`, `id="export-knowledge"`, `secondary`)}${j(`Import Knowledge`, `id="import-knowledge"`, `secondary`)}${v.workspace === `demo` ? j(`Try demo import`, `id="demo-knowledge-import"`, `secondary`) : ``}</div><p>Knowledge imports are staged, duplicate-checked, and reviewable. Nothing is saved until confirmation.</p><input id="content-import-file" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" multiple hidden><input id="knowledge-file" type="file" accept=".md,text/markdown,text/plain" hidden><input id="import-file" type="file" accept="application/json" hidden>`) }${Q(`AI Assistance`, `<p><b>Local suggestions are active.</b> They use deterministic text, tags, projects, and explicit links on this device. No generative model, provider, account, or network processing is configured.</p><p>Model-generated drafts require a future on-device capability or an explicitly configured provider. This release does not store keys or send requests.</p>${j(`Clear local AI activity`, `id="clear-ai"`, `secondary`)}`)}${Q(`Privacy`, `<p>Records remain on this device unless you choose to export and share a JSON backup or Markdown knowledge file. Local suggestions do not send content off-device. There is no account, cloud sync, analytics, or external AI in this release.</p>`)}${Q(`Advanced`, `<p>Clear All Records applies only to the currently active workspace. Personal and demo records remain separate.</p>${j(`Clear active workspace`, `id="clear-all"`, `danger`)}`)}${Q(`Help & Support`, `<p><b>The method:</b> Capture it. Connect it. Move it forward. Use Connected Work to follow the path from raw thought to next action.</p><p><b>MindForge 3 (${i})</b></p><p><b>Find your records:</b> Check the active workspace above, then use Search. Personal and Demo records are separate.</p><p><b>Keep a copy:</b> Use Back Up MindForge and keep the JSON file somewhere safe before reinstalling or clearing app data.</p><p><b>Report a problem:</b> Note this version, your Android version, the steps you took, and what you expected. No in-app support or automatic report submission is configured.</p>`)}`;
}
function ve() {
  return `<section class="page-title"><div><div class="eyebrow">Recovery</div><h1>Recently Deleted</h1></div></section><p>Records remain here until you empty this list. Restore keeps the original relationships where possible.</p>${y.trash.map((e) => `<button class="row" data-restore="${e.bucket}:${e.record.id}"><span>${a[e.bucket]}</span><b>${l(e.record.title || e.record.name)}</b><i>Restore</i></button>`).join(``) || `<p class="empty">Recently Deleted is empty.</p>`}`;
}
function ye() {
  return `<div class="overlay"><section class="modal onboarding"><div class="eyebrow">Welcome to MindForge</div><h2>Messy thought.<br>Clear next action.</h2><p>Use the demo workspace in Settings to explore representative fictional records. Your own workspace stays separate.</p>${j(`Start with Quick Capture`, `id="finish-onboard"`, `primary`)}${j(`Skip for now`, `id="skip-onboard"`, `secondary`)}</section></div>`;
}
function selectMenu(name, value, options) {
  const selected = options.find(([optionValue]) => String(optionValue) === String(value)) || options[0] || [``, `Choose`];
  return `<details class="control-menu form-control-menu" data-form-select="${l(name)}"><summary>${l(selected[1])}</summary><div class="control-menu-options">${options.map(([optionValue, label]) => `<button type="button" class="control-menu-option ${String(optionValue) === String(value) ? `chosen` : ``}" data-form-select-value="${l(optionValue)}">${l(label)}</button>`).join(``)}</div><input type="hidden" name="${l(name)}" value="${l(value || ``)}"></details>`;
}
function be() {
  let e = S?.ref ? O(S.ref)[1] : null,
    t = S?.bucket || `ideas`,
    n = e || { projectId: S?.projectId || `` };
  return `<div class="overlay"><form class="modal" id="entry"><button type="button" class="close" data-close>×</button><div class="eyebrow">${e ? `Edit` : `Create`} ${a[t]}</div><h2>${e ? `Develop it` : `Shape it`}</h2><label>Title<input name="title" required value="${l(n.title || n.name || ``)}"></label><label>Description<textarea name="description" required>${l(n.description || ``)}</textarea></label><label>Next action<input name="next" value="${l(n.next || ``)}" placeholder="One concrete move"></label>${t === `tasks` ? `<label>Due date<input name="due" type="date" value="${l(n.due || ``)}"></label><label>Project${selectMenu(`projectId`, String(n.projectId || ``), [[``, `No project`], ...y.projects.map((project) => [String(project.id), project.title || project.name])])}</label>` : ``}<label>Link to existing work${selectMenu(`link`, ``, [[``, `No link`], ...D().filter((record) => record.bucket !== t).map((record) => [`${record.bucket}:${record.id}`, `${record.kind} · ${record.title}`])])}</label>${j(e ? `Save Changes` : `Save`, `type="submit"`, `primary`)}</form></div>`;
}
function $() {
  re();
  let e = x
    ? fe()
    : (
        {
          dashboard: K,
          capture: ue,
          projects: () => J(`projects`, `Projects`),
          ideas: () => J(`ideas`, `Ideas`),
          notes: () => J(`notes`, `Notes`),
          outlines: () => J(`outlines`, `Outlines`),
          goals: () => J(`goals`, `Goals`),
          plans: () => J(`plans`, `Plans`),
          tasks: () => J(`tasks`, `Actions`),
          tags: Y,
          review: pe,
          more: me,
          search: he,
          appearance: ge,
          settings: _e,
          trash: ve,
        }[b] || K
      )();
  ((document.querySelector(`#app`).innerHTML =
    le() +
    `<main>${C ? `<div class="notice">${l(C)}</div>` : ``}${e}</main>` +
    U() +
    (knowledgeImport ? knowledgeImportView() : S?.ai ? se() : S ? be() : ``) +
    (v.onboarded ? `` : ye())),
    Se(),
    // Re-rendering on search input must not drop the user's typing focus.
    document.querySelector(`#search`)?.focus());
}
async function xe() {
  const data = JSON.stringify({ app: 'MindForge', version: i, workspace: v.workspace,
    exportedAt: new Date().toISOString(), data: y }, null, 2);
  try {
    const result = await saveBackupFile(data, 'mindforge-' + v.workspace + '-backup-' + s() + '.json');
    A(result.cancelled ? 'Backup cancelled. Your records are unchanged.' : result.native ? 'MindForge backup saved.' : 'Backup download requested. Check your Downloads folder.');
  } catch {
    A('Backup could not be saved. Try again and choose a writable location. Your records are unchanged.');
  }
}
async function exportKnowledge() {
  try {
    A(await exportPkosWorkspace(y, { workspace: v.workspace, version: i, sourceId: v.pkosSourceId }, saveBackupFile));
  } catch {
    A('Knowledge export could not be saved. Try again and choose a writable location. Your records are unchanged.');
  }
}
var knowledgeImport = null;
async function readTextFileInChunksUi(file, chunkSize = 256 * 1024) {
  if (typeof file.slice !== 'function') return file.text();
  const parts = [];
  for (let offset = 0; offset < file.size; offset += chunkSize) parts.push(await file.slice(offset, Math.min(offset + chunkSize, file.size)).text());
  return parts.join('');
}
function knowledgeRecordText(record) {
  const labels = { title: 'Title', name: 'Name', description: 'Description', content: 'Content', next: 'Next action', category: 'Category' };
  return [...Object.entries(labels).filter(([field]) => record[field] !== undefined).map(([field, label]) => `${label}: ${record[field]}`),
    `Tags: ${(record.tags || []).join(', ') || 'None'}`,
    `Connections: ${(record.links || []).join(', ') || 'None'}`,
    `Project reference: ${record.projectId ?? 'None'}`].join('\n\n');
}
function knowledgeImportView() {
  const preview = knowledgeImport;
  if (preview.confirmation) {
    const summary = preview.confirmation.summary;
    return `<div class="overlay"><section class="modal knowledge-import" role="dialog" aria-modal="true"><h2>Confirm knowledge import</h2><p>Into <b>${l(preview.workspace)}</b>: ${summary.created} new records, ${summary.updated} updates, ${summary.skipped} skipped.</p><p>${summary.warnings.length ? `${summary.warnings.length} records have source references that could not be connected. Those references will be retained.` : 'Reviewed record links will be connected where a destination is available.'}</p><p>Updates replace reviewed text fields. Local status, priority, due dates, and existing links stay intact.</p><div class="record-actions"><button id="back-knowledge-review" class="secondary">Back to review</button><button id="cancel-knowledge-import" class="secondary">Cancel import</button><button id="confirm-knowledge-import" class="primary">Confirm import</button></div></section></div>`;
  }
  const duplicates = preview.rows.filter(row => row.candidates.length || row.sourceDuplicate).length;
  const suggestions = preview.suggestions || [];
  return `<div class="overlay"><section class="modal knowledge-import" role="dialog" aria-modal="true"><h2>Review knowledge import</h2><p>${preview.rows.length} records from ${l(preview.sourceWorkspace)} into <b>${l(preview.workspace)}</b>. ${duplicates} possible duplicates start with Skip. Nothing is saved until confirmation.</p><p>Update changes reviewed text only. Create makes a separate record. Missing source links are retained as source information.</p><form id="knowledge-review">${preview.rows.map(row => { const choice = preview.selections?.[row.index]?.choice || row.choice; const target = preview.selections?.[row.index]?.target ?? row.target; return `<article class="settings-block"><h3>${l(row.entry.record.title || row.entry.record.name || 'Untitled')}</h3><p>${l(a[row.entry.bucket] || row.entry.bucket)} · ${l(row.reason)}</p><details><summary>Compare record text</summary><pre class="import-text">${l(knowledgeRecordText(row.entry.record))}</pre>${row.candidates.map(candidate => `<p>Existing: ${l(candidate.record.title || candidate.record.name || 'Untitled')}</p><pre class="import-text">${l(knowledgeRecordText(candidate.record))}</pre>`).join('')}</details><label>Import choice</label><div class="import-choice-group"><button type="button" class="control-menu-option ${choice === 'skip' ? 'chosen' : ''}" data-import-option="${row.index}:skip">Skip</button><button type="button" class="control-menu-option ${choice === 'create' ? 'chosen' : ''}" data-import-option="${row.index}:create">Create</button>${row.candidates.length ? `<button type="button" class="control-menu-option ${choice === 'update' ? 'chosen' : ''}" data-import-option="${row.index}:update">Update</button>` : ''}</div><input type="hidden" data-import-choice="${row.index}" value="${choice}">${row.candidates.length ? `<label>Existing record for Update or linked Skip</label><div class="import-target-group">${row.candidates.map(candidate => `<button type="button" class="control-menu-option ${candidate.ref === target ? 'chosen' : ''}" data-import-target-option="${row.index}:${l(candidate.ref)}">${l(candidate.record.title || candidate.record.name || 'Untitled')} (${l(candidate.ref)})</button>`).join('')}</div><input type="hidden" data-import-target="${row.index}" value="${l(target)}">` : ''}</article>`; }).join('')}${suggestions.length ? `<section class="settings-block import-suggestions"><h3>Suggested follow-up tasks</h3><p>These are drafts. They will only be saved if you leave them checked.</p>${suggestions.map((suggestion, index) => `<label class="suggestion-row"><input type="checkbox" data-import-suggestion="${index}" value="${l(suggestion.key)}" checked><span><b>${l(suggestion.title)}</b><small>${l(suggestion.reason)}</small></span></label>`).join('')}</section>` : ''}<p id="knowledge-selection-summary" aria-live="polite"></p><div class="record-actions"><button type="button" id="cancel-knowledge-import" class="secondary">Cancel import</button><button type="submit" class="primary">Apply reviewed import</button></div></form></section></div>`;
}
function bindKnowledgeImport() {
  document.querySelector('#demo-knowledge-import')?.addEventListener('click', () => {
    if (v.workspace !== 'demo') return;
    const sample = { format: 'mindforge-pkos-markdown', schemaVersion: 1, workspace: 'demo', sourceId: 'mindforge-demo-import-v1', records: [{ bucket: 'notes', ref: `notes:${f.notes[0].id}`, record: o(f.notes[0]) }, { bucket: 'goals', ref: 'goals:demo-goal', record: { id: 'demo-goal', title: 'Import review goal', description: 'Fictional goal for testing reviewed routing.', links: [], pkos: { kind: 'goal', sourceLabel: 'Fictional demo import' } } }] };
    knowledgeImport = previewPkosImport(sample, y, 'demo'); S = null; $();
  });
  document.querySelector('#import-knowledge')?.addEventListener('click', () => document.querySelector('#knowledge-file').click());
  const knowledgeFileInput = document.querySelector('#knowledge-file');
  if (knowledgeFileInput) knowledgeFileInput.accept = '.md,.json,.csv,text/markdown,text/plain,application/json,text/csv';
    document.querySelector(['#export-knowledge'].join(''))?.addEventListener('click', () => { if (typeof exportKnowledge === 'function') exportKnowledge(); });
  document.querySelector('#knowledge-file')?.addEventListener('change', async event => {
    const file = event.target.files?.[0], workspace = v.workspace, original = y;
    if (!file) return;
    const baseline = JSON.stringify(original);
    try {
      const text = /\.(json|csv)$/i.test(file.name) ? await file.text() : await readTextFileInChunksUi(file);
      const manifest = /\.(json|csv)$/i.test(file.name) ? parseStructuredImport(text, file.name) : parsePkosMarkdown(text);
      if (workspace !== v.workspace || original !== y || JSON.stringify(y) !== baseline) throw new Error('Workspace or records changed. Select the file again.');
      knowledgeImport = previewPkosImport(manifest, y, workspace); S = null; $();
    } catch (error) { A(error.message || 'Knowledge import could not be read. Your records are unchanged.'); }
    finally { event.target.value = ''; }
  });
  document.querySelector('#cancel-knowledge-import')?.addEventListener('click', () => { knowledgeImport = null; A('Knowledge import cancelled. Your records are unchanged.'); });
  document.querySelector('#back-knowledge-review')?.addEventListener('click', () => { knowledgeImport.confirmation = null; $(); });
  document.querySelector('#confirm-knowledge-import')?.addEventListener('click', () => {
    try {
      const staged = stagePkosImport(knowledgeImport, knowledgeImport.confirmation.selections, y, v.workspace);
      const verified = typeof applySuggestedTasks === 'function' ? applySuggestedTasks(staged, knowledgeImport.suggestions, knowledgeImport.confirmation.suggestionSelections || []) : staged;
      h = commitPkosImport(localStorage, h, v.workspace, verified); y = h[v.workspace]; knowledgeImport = null;
      A(`Knowledge imported: ${verified.created} created, ${verified.updated} updated, ${verified.suggestedCreated || 0} follow-up tasks added, ${verified.skipped} skipped.${verified.warnings.length ? ' Unconnected source references were retained.' : ''}`);
    } catch (error) { A(error.message || 'Knowledge import could not be saved.'); }
  });
  const form = document.querySelector('#knowledge-review');
  if (!form) return;
  form.querySelectorAll('[data-import-option]').forEach(button => button.addEventListener('click', () => {
    if (!button.dataset.importOption) return;
    const [index, choice] = button.dataset.importOption.split(':');
    const input = form.querySelector(`[data-import-choice="${index}"]`); if (input) input.value = choice;
    form.querySelectorAll(`[data-import-option^="${index}:"]`).forEach(option => option.classList.toggle('chosen', option === button)); summarize();
  }));
  form.querySelectorAll('[data-import-target-option]').forEach(button => button.addEventListener('click', () => {
    if (!button.dataset.importTargetOption) return;
    const [index, ...refParts] = button.dataset.importTargetOption.split(':');
    const input = form.querySelector(`[data-import-target="${index}"]`); if (input) input.value = refParts.join(':');
    form.querySelectorAll(`[data-import-target-option^="${index}:"]`).forEach(option => option.classList.toggle('chosen', option === button));
  }));
  const summarize = () => { const counts = { skip: 0, create: 0, update: 0 }; form.querySelectorAll('[data-import-choice]').forEach(select => { counts[select.value]++; }); document.querySelector('#knowledge-selection-summary').textContent = `${counts.create} new · ${counts.update} updates · ${counts.skip} skipped`; };
  form.addEventListener('change', summarize); summarize();
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const selections = {}; form.querySelectorAll('[data-import-choice]').forEach(select => { selections[select.dataset.importChoice] = { choice: select.value, target: form.querySelector(`[data-import-target="${select.dataset.importChoice}"]`)?.value || '' }; });
      const suggestionSelections = []; form.querySelectorAll('[data-import-suggestion]').forEach(input => { if (input.checked && input.value) suggestionSelections.push(input.value); });
      const baseStaged = stagePkosImport(knowledgeImport, selections, y, v.workspace);
      const staged = typeof applySuggestedTasks === 'function' ? applySuggestedTasks(baseStaged, knowledgeImport.suggestions, suggestionSelections) : baseStaged;
      if (!staged.created && !staged.updated && !staged.suggestedCreated) { knowledgeImport = null; return A('All records skipped. Your records are unchanged.'); }
      knowledgeImport.selections = selections; knowledgeImport.confirmation = { selections, suggestionSelections, summary: { created: staged.created, updated: staged.updated, suggestedCreated: staged.suggestedCreated || 0, skipped: staged.skipped, warnings: staged.warnings } }; $();
    } catch (error) { A(error.message || 'Knowledge import could not be saved.'); }
  });
}
function Se() {
  bindKnowledgeImport();
  (document.querySelectorAll(`[data-page]`).forEach(
    (e) =>
      (e.onclick = () => {
        navigate({ page: e.dataset.page, record: null, search: ``, filter: `` });
      }),
  ),
    document.querySelectorAll(`[data-open]`).forEach(
      (e) =>
        (e.onclick = () => {
        navigate({ page: b, record: e.dataset.open });
        }),
    ),
    document.querySelectorAll(`[data-ai-shape]`).forEach(
      (e) =>
        (e.onclick = () => {
          let [, t] = O(e.dataset.aiShape);
          ((S = {
            ai: { kind: `shape`, ref: e.dataset.aiShape, proposal: buildShapeCaptureProposal(t, { records: D(), dismissals: I().dismissals, refFor: k }) },
          }),
            $());
        }),
    ),
    document.querySelectorAll(`[data-ai-develop]`).forEach(
      (e) =>
        (e.onclick = () => {
          let [t, n] = O(e.dataset.aiDevelop);
          ((S = {
            ai: {
              kind: `develop`,
              ref: e.dataset.aiDevelop,
              proposal: buildDevelopRecordProposal(t, n, `structured draft`),
            },
          }),
            $());
        }),
    ),
    document.querySelectorAll(`[data-ai-connections]`).forEach(
      (e) =>
        (e.onclick = () => {
          let [t, n] = O(e.dataset.aiConnections);
          ((S = {
            ai: {
              kind: `connections`,
              ref: e.dataset.aiConnections,
              proposal: buildConnectionSuggestions(t, n, { records: D(), dismissals: I().dismissals, refFor: k }),
            },
          }),
            $());
        }),
    ),
    document.querySelectorAll(`[data-modal]`).forEach(
      (e) =>
        (e.onclick = () => {
          let [t, n] = e.dataset.modal.split(`:`);
          ((S = { bucket: t, projectId: n }), $());
        }),
    ),
    document
      .querySelectorAll(`[data-workspace]`)
      .forEach((e) => (e.onclick = () => te(e.dataset.workspace))),
    document.querySelectorAll(`[data-tag]`).forEach(
      (e) =>
        (e.onclick = () => {
          ((b = `search`), (w = e.dataset.tag), $());
        }),
    ),
    document.querySelector(`[data-back]`)?.addEventListener(`click`, () => {
      goBack();
    }),
    document.querySelectorAll(`[data-update-progress]`).forEach((button) => button.addEventListener(`click`, () => {
      const [bucket, id] = button.dataset.updateProgress.split(`:`);
      const record = y[bucket]?.find((item) => String(item.id) === String(id));
      if (!record) return;
      const current = Number.isFinite(Number(record.progress)) ? Number(record.progress) : N(record).pct;
      const value = prompt(`Progress for ${record.title || record.name} (0–100)`, String(current));
      if (value === null) return;
      const next = Number(value);
      if (!Number.isFinite(next) || next < 0 || next > 100) return A(`Progress must be a number from 0 to 100.`);
      record.progress = Math.round(next); E(); A(`Progress updated to ${record.progress}%.`);
    })),
    document.querySelectorAll(`[data-close]`).forEach((e) =>
      e.addEventListener(`click`, () => {
        ((S = null), $());
      }),
    ),
    document.querySelector(`#clear-ai`)?.addEventListener(`click`, () => {
      ((I().activity = []),
        (I().dismissals = {}),
        (I().cache = {}),
        L(),
        A(`Local AI activity cleared for this workspace.`));
    }),
    document
      .querySelector(`[data-apply-shape]`)
      ?.addEventListener(`click`, () => {
        let [e, t] = O(S.ai.ref);
        let applied = applyReviewedShapeProposal(t, S.ai.proposal, {
          title: document.querySelector(`#ai-title`).value,
          description: document.querySelector(`#ai-description`).value,
          next: document.querySelector(`#ai-next`).value,
          tags: document.querySelector(`#ai-tags`).value,
        }, z);
        if (!applied) return A(`Suggestion could not be applied.`);
        (I().activity.unshift({
          operation: `Shape Capture`, at: new Date().toISOString(), workspace: v.workspace,
          mode: `deterministic`, applied: !0,
        }), L(), E(), (S = null), A(`Selected local suggestions applied.`));
      }),
    document
      .querySelector(`[data-append-draft]`)
      ?.addEventListener(`click`, () => {
        let [e, t] = O(S.ai.ref);
        if (!appendReviewedDevelopDraft(t, S.ai.proposal, document.querySelector(`#ai-content`).value)) return A(`Draft could not be applied.`);
        (E(), (S = null), A(`Draft appended locally.`));
      }),
    document
      .querySelector(`[data-replace-content]`)
      ?.addEventListener(`click`, () => {
        let [e, t] = O(S.ai.ref);
        if (!replaceWithReviewedDevelopDraft(t, S.ai.proposal, document.querySelector(`#ai-content`).value)) return A(`Draft could not be applied.`);
        (E(), (S = null), A(`Content replaced with reviewed draft.`));
      }),
    document.querySelectorAll(`[data-apply-link]`).forEach(
      (e) =>
        (e.onclick = () => {
          let [t, n] = e.dataset.applyLink.split(/:(.+)/), [, source] = O(t);
          if (!applyReviewedConnectionSuggestion(source, n, I().dismissals[t] || [])) return A(`Suggestion could not be linked.`);
          (E(), (S = null), A(`Link created from your reviewed suggestion.`));
        }),
    ),
    document.querySelectorAll(`[data-dismiss-link]`).forEach(
      (e) =>
        (e.onclick = () => {
          let [t, n] = e.dataset.dismissLink.split(/:(.+)/);
          if (!dismissConnectionSuggestion(I().dismissals, t, n)) return A(`Suggestion could not be dismissed.`);
          (L(), (S = null), A(`Suggestion dismissed locally.`));
        }),
    ),
    document.querySelector(`#save-capture`)?.addEventListener(`click`, () => {
      let e = document.querySelector(`#quick-thought`).value.trim();
      if (!e) return A(`Write the thought first.`);
      let t = {
        id: c(),
        title: e.split(/[.!?\n]/)[0].slice(0, 120) || `Untitled thought`,
        description: e,
        created: s(),
        processed: !1,
        links: [],
        tags: [],
      };
      (y.captures.unshift(t), E(), (x = `captures:` + t.id), $());
    }),
    document.querySelectorAll(`[data-convert]`).forEach(
      (e) =>
        (e.onclick = () => {
          let [t, n, r] = e.dataset.convert.split(`:`),
            i = O(n + `:` + r)[1],
            o = {
              ...i,
              id: c(),
              title: i.title,
              links: [n + `:` + r],
              status: t === `tasks` ? `Next` : `Raw`,
            };
          (t === `projects` && (o.name = o.title),
            t === `tasks` && (o.due = ``),
            y[t].unshift(o),
            (i.processed = !0),
            E(),
            (x = t + `:` + o.id),
            A(`${a[t]} created and connected.`));
        }),
    ),
    document.querySelectorAll(`[data-done]`).forEach(
      (e) =>
        (e.onclick = () => {
          let [, t] = O(e.dataset.done);
          ((t.status = `Done`), E(), A(`Action completed.`));
        }),
    ),
    document.querySelectorAll(`[data-delete]`).forEach(
      (e) =>
        (e.onclick = () => {
          let [t, n] = O(e.dataset.delete);
          n &&
            confirm(`Move this record to Recently Deleted?`) &&
            ((y[t] = y[t].filter((e) => e !== n)),
            y.trash.unshift({ bucket: t, record: n, deletedAt: Date.now() }),
            E(),
            (x = null),
            A(`Moved to Recently Deleted.`));
        }),
    ),
    document.querySelectorAll(`[data-restore]`).forEach(
      (e) =>
        (e.onclick = () => {
          let [t, n] = e.dataset.restore.split(`:`),
            r = y.trash.findIndex(
              (e) => e.bucket === t && String(e.record.id) === n,
            );
          r >= 0 &&
            (y[t].unshift(y.trash[r].record),
            y.trash.splice(r, 1),
            E(),
            A(`Record restored.`));
        }),
    ),
    document.querySelectorAll(`[data-edit]`).forEach(
      (e) =>
        (e.onclick = () => {
          ((S = { ref: e.dataset.edit, bucket: e.dataset.edit.split(`:`)[0] }),
            $());
        }),
    ),
    document.querySelectorAll(`[data-link]`).forEach(
      (e) =>
        (e.onclick = () => {
          ((S = { ref: e.dataset.link, bucket: e.dataset.link.split(`:`)[0] }),
            $());
        }),
    ),
    document.querySelectorAll(`[data-pref]`).forEach(
      (e) =>
        (e.onclick = () => {
          ((v[e.dataset.pref] = e.dataset.value), E(), $());
        }),
    ),
    document.querySelectorAll(`[data-toggle]`).forEach(
      (e) =>
        (e.onclick = () => {
          let t = e.dataset.toggle;
          ((v[t] = !v[t]), E(), $());
        }),
    ),
    document
      .querySelectorAll(`#export-settings`)
      .forEach((e) => (e.onclick = xe)),
    document
      .querySelector(`#content-import-trigger`)
      ?.addEventListener(`click`, () =>
        document.querySelector(`#content-import-file`).click(),
      ),
    document.querySelector(`#content-import-file`)?.addEventListener(`change`, async (event) => {
      const readFileText = async (file, chunkSize = 256 * 1024) => {
        if (typeof file.slice !== 'function') return file.text();
        const parts = [];
        for (let offset = 0; offset < file.size; offset += chunkSize) parts.push(await file.slice(offset, Math.min(offset + chunkSize, file.size)).text());
        return parts.join('');
      };
      const files = Array.from(event.target.files || []), workspace = v.workspace, original = y, baseline = JSON.stringify(y);
      if (!files.length) return;
      const imported = [];
      let skipped = 0;
      try {
        for (const file of files) {
          if (!canImportTextFile(file)) { skipped += 1; continue; }
          const text = await readFileText(file);
          if (workspace !== v.workspace || original !== y || JSON.stringify(y) !== baseline) {
            A(`Workspace or records changed. Select the files again in the intended workspace.`);
            return;
          }
          const note = createImportedNote({ filename: file.name, text, id: c(), created: s() });
          if (note) imported.push(note); else skipped += 1;
        }
        if (!imported.length) {
          A(`No supported non-empty Markdown or text files were imported.`);
          return;
        }
        const next = JSON.parse(JSON.stringify(y));
        next.notes.unshift(...imported);
        h = commitPkosImport(localStorage, h, workspace, { data: next });
        y = h[workspace];
        A(`${imported.length} ${imported.length === 1 ? `file` : `files`} imported as Notes${skipped ? `; ${skipped} skipped` : ``}.`);
      } catch {
        A(`Import could not be completed. Your existing records are unchanged.`);
      } finally { event.target.value = ``; }
    }),
    document.querySelector("#export-knowledge")?.addEventListener('click', exportKnowledge),
    document
      .querySelector(`#import-trigger`)
      ?.addEventListener(`click`, () =>
        document.querySelector(`#import-file`).click(),
      ),
    document.querySelector('#import-file')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0], workspace = v.workspace;
      if (!file) return;
      try {
        const restored = p(JSON.parse(await file.text()));
        if (!restored) throw new Error('Invalid backup');
        if (workspace !== v.workspace) return A('Workspace changed. Select the backup again in the intended workspace.');
        if (!confirm('Replace only the ' + workspace + ' workspace with this backup? Back up its current records first.')) return;
        y = restored;
        if (E()) A('Backup restored into the active workspace.');
      } catch {
        A('That file is not a valid MindForge backup. Your records are unchanged.');
      } finally { event.target.value = ''; }
    }),
    document.querySelector(`#reset-demo`)?.addEventListener(`click`, () => {
      confirm(
        `Reset only the demo workspace to its original fictional records? Personal records will not change.`,
      ) &&
        ((h.demo = o(f)),
        v.workspace === `demo` && (y = h.demo),
        E(),
        A(`Demo workspace reset. Personal records were not changed.`));
    }),
    document.querySelector(`#clear-all`)?.addEventListener(`click`, () => {
      confirm(
        `Move all records in the active workspace to Recently Deleted?`,
      ) &&
        (Object.keys(a)
          .filter((e) => e !== `trash`)
          .forEach((e) => {
            (y[e].forEach((t) => y.trash.push({ bucket: e, record: t })),
              (y[e] = []));
          }),
        E(),
        A(`Active workspace records moved to Recently Deleted.`));
    }),
    document.querySelector(`#search`)?.addEventListener(`input`, (e) => {
      w = e.target.value;
      if (b === `search` && !x) {
        document.querySelector(`#search-results`).innerHTML = we();
        return;
      }
      $();
    }),
    document.querySelector(`#search`)?.addEventListener(`change`, () => {
      if (b === `search` && w.trim()) { Zz = addRecentSearch(Zz, v.workspace, w); Ee(); }
    }),
    document.querySelector(`#search`)?.addEventListener(`keydown`, (e) => {
      if (b === `search` && e.key === `Enter` && w.trim()) { Zz = addRecentSearch(Zz, v.workspace, w); Ee(); }
    }),
    document.querySelectorAll(`[data-search-type]`).forEach((e) => (e.onclick = () => {
      let type = e.dataset.searchType;
      R = R.includes(type) ? R.filter((item) => item !== type) : [...R, type];
      $();
    })),
    document.querySelectorAll(`[data-reuse-search]`).forEach((e) => (e.onclick = () => {
      w = e.dataset.reuseSearch; Zz = addRecentSearch(Zz, v.workspace, w); Ee(); $();
    })),
    document.querySelector(`#clear-search-history`)?.addEventListener(`click`, () => {
      Zz = clearRecentSearches(Zz, v.workspace); Ee(); document.querySelector(`#search-results`).innerHTML = we();
    }),
    document.querySelectorAll(`[data-filter-value]`).forEach((e) => (e.onclick = () => {
      T = e.dataset.filterValue || ``;
      $();
    })),
    document.querySelectorAll(`[data-view-value]`).forEach((e) => (e.onclick = () => {
      let value = e.dataset.viewValue || `standard`;
      v.views[b] = value === `standard` ? `` : value;
      E();
      $();
    })),
    document.querySelectorAll(`[data-form-select-value]`).forEach((e) => (e.onclick = () => {
      const menu = e.closest(`[data-form-select]`);
      const input = menu?.querySelector(`input[type="hidden"]`);
      const summary = menu?.querySelector(`summary`);
      if (!menu || !input || !summary) return;
      input.value = e.dataset.formSelectValue || ``;
      summary.textContent = e.textContent.trim();
      menu.querySelectorAll(`[data-form-select-value]`).forEach((option) => option.classList.toggle(`chosen`, option === e));
      menu.open = !1;
    })),
    document.querySelectorAll(`[data-editor]`).forEach(
      (e) =>
        (e.onchange = () => {
          let [t, n] = O(e.dataset.editor);
          ((n.content = e.target.value), E(), A(`Structured text saved.`));
        }),
    ),
    document.querySelector(`#finish-onboard`)?.addEventListener(`click`, () => {
      ((v.onboarded = !0), (b = `capture`), E(), $());
    }),
    document.querySelector(`#skip-onboard`)?.addEventListener(`click`, () => {
      ((v.onboarded = !0), E(), $());
    }),
    document.querySelector(`#entry`)?.addEventListener(`submit`, (e) => {
      e.preventDefault();
      let t = Object.fromEntries(new FormData(e.target)),
        n = S.bucket,
        r = S.ref ? O(S.ref)[1] : null,
        i = {
          ...r,
          id: r?.id || c(),
          title: t.title.trim(),
          description: t.description.trim(),
          next: t.next.trim(),
          links: [
            ...new Set([...(r?.links || []), ...(t.link ? [t.link] : [])]),
          ],
          created: r?.created || s(),
          status: r?.status || (n === `tasks` ? `Next` : `Raw`),
          priority: r?.priority || `Medium`,
          tags: r?.tags || [],
        };
      i.pkos = { ...(r?.pkos || {}) };
      if (t.knowledgeKind) i.pkos.kind = t.knowledgeKind.trim();
      if (t.sourceLabel) i.pkos.sourceLabel = t.sourceLabel.trim();
      if (t.sourceReference) i.pkos.sourceReference = t.sourceReference.trim();
      (n === `projects` && (i.name = i.title),
        n === `tasks` &&
          ((i.due = t.due || ``), (i.projectId = t.projectId || ``)),
        r ? Object.assign(r, i) : y[n].unshift(i),
        E(),
        (S = null),
        A(`Saved locally.`));
    }));
}
matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => { if (v.theme === "system") re(); });
window.Capacitor?.Plugins?.App?.addListener?.('backButton', goBack);
window.addEventListener("resize", () => {
  const focused = document.activeElement;
  if (focused?.matches("input, textarea")) focused.scrollIntoView({ block: "center" });
});
$();

