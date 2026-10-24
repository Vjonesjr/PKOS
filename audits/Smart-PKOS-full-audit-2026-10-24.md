# Smart PKOS — UI, behavior, integration, and release audit

Date: 2026-10-24
Status: **FINDINGS / REPAIR SPEC — NOT A VERIFIED CODE FIX OR APK**
Evidence: user-supplied two annotated Smart PKOS screenshots; inspected Base44 Smart PKOS app `6ab97588d935cf6dad456bf1`; Google Drive Neon source files dated 2026-10-22 and Oct 23 APK; GitHub `Vjonesjr/PKOS` main branch. The private Grok project conversation was not accessible, so this is not a review of that conversation.

## Critical discovery: versions are out of sync (P0)
- `Vjonesjr/PKOS` main latest observed commit 2026-10-20, `b57e336bb15cbefa0c8b544f5f08cc5f04ffa532`. Its root `package.json` and `android/app/build.gradle` still describe MindForge (`com.mindforge.app`, versionName `MindForge 3 (1.6.8)`); this root must **never** be assumed to be the Smart PKOS Android release source.
- The repo's `smart-pkos/` snapshot identifies the Base44 app as source of truth but contains only selected changed files, not a complete ready-to-build source tree.
- Google Drive `Smart PKOS` folder has `Smart-PKOS-neon-final-20261023.apk` (2026-10-23, 4,801,783 bytes) and prior builds; a separate collection of neon React source files was modified 2026-10-22.
- The Base44 live editable tree inspected here contains a cyan/green React UI and backend functions, but does not include the later `Diagrams.jsx` in the Drive neon source. The Drive Oct 22 `Diagrams.jsx` uses **placeholder** graph, list, and grid content, so do not replace the newer displayed Knowledge Map with that older placeholder.
- **Release gate:** identify the exact editable source matching the Oct 23 APK, make an immutable backup with source SHA, preserve Android package ID/signing identity, and build from that source only. Each APK release must name the source commit SHA, package ID, versionCode, signature fingerprint, SHA-256, installed Android API/emulator/device, launch result, and Drive/PC/GitHub locations. Do not label as fixed until install+launch tested.

## P0 — AI milestone generation fails
Evidence: UI displays `Core integration 'InvokeLLM' is blocked from direct app-runtime calls. This is a routing restriction ... call it from a backend function using its supported service-role API.`
Likely cause: the APK's frontend invokes the privileged LLM integration directly rather than calling a backend endpoint. A different Base44 tree does have a working pattern in `base44/functions/aiAssist/entry.ts` where `base44.asServiceRole.integrations.Core.InvokeLLM` is called server-side, but its current action list does NOT expose a dedicated three-level subtask generator.
**Fix:** route `suggest_milestones` / `generate_subtasks` requests through a user-authenticated backend function that validates workspace, parent record ownership and quota, and invokes the supported server-side LLM. Return structured proposals; show friendly failure, retry, and manual entry when unavailable. Do not expose backend stack trace. Never save or overwrite without approval. Three specificity levels: Basic 3–5, Detailed 6–10, Step-by-step up to 15–20 when justified; allow edit/reorder/deselect/regenerate before apply.
**Acceptance:** generation works in Demo and Personal with isolation; no direct browser `InvokeLLM` call; errors do not clear existing milestones; saving does not duplicate milestones; manual add works while AI unavailable.

## P1 — Knowledge Map unreadable / overwhelming
Evidence: graph initially shows 295 records and 248 connections at 35% zoom; nodes crowded into long narrow columns. List/grid views show 'View connections (n)' links but no obvious focus-on-node. Another screenshot showed 127 records and 83 connections; investigate whether this is a different filter/workspace or stale counts rather than assume data loss.
**Fix:** default to focused List or Grid on narrow devices; Graph opens an ego-network from selected/search-matched record (one-hop by default), with expand-neighbors, search, filters, centered Fit-to-screen, pan/zoom, reset, readable labels, and connection panel. Tapping 'View connections' must open the selected node and **only relevant links**, not dump the entire 295-node global graph. Distinguish link direction and relationship type where available. No placeholder/fake nodes.
**Acceptance:** user can select 'Land a Data Analyst Role' and see its three connections legibly at normal phone width; pan/zoom/reset work; Back returns to prior view; count consistency verified with active filters.

## P1 — Today shows repeated automation suggestions
Evidence: multiple 'Send thank-you note after Tuesday interview', repeated LLC follow-up entries, each labeled 'Surfaced · High priority task watch', with individual X buttons.
Code reference: `src/components/automations/AutomationFlags.jsx` from the Base44 tree renders every open `AutomationRun` independently and has no UI deduplication. `src/lib/automation/engine.js` has claim-based event guards by recipe/record, but multiple recipes/events or stale rows can still surface semantically duplicate flags; `src/pages/Today.jsx` also resets its in-memory dismissed AI suggestions on generation.
**Fix:** aggregate display entries per workspace + normalized record identity + actionable cause; show a single item with 'raised by N rules' if needed. Persist snoozed/dismissed state; prevent equivalent repeated active runs with a stable semantic/action key and time window, while retaining history for audit. Reopen/retrigger only on a **meaningful** state transition or new date as appropriate, never every refresh. Keep archive/dismiss separate from deleting the underlying task.
**Acceptance:** one row per underlying action, X removes it reliably across refresh, and no duplicates reappear without a new qualifying event. Regression-test different recipes, tabs, and demo/personal workspaces.

## P1 — Capture inbox and narrow card text
Evidence: capture question is displayed in a very narrow column with words wrapped after only a few characters even though space exists; action icons and controls collide with content.
**Fix:** use single-column `minmax(0,1fr)` card layout on phone; large enough touch targets (44x44px), sensible `min-width:0`, `overflow-wrap:anywhere` only for long unbroken text, not normal words. Put actions in an anchored overflow menu or a separate row, not beside the title at the expense of content width. Clear tags, date and state.
**Acceptance:** capture titles and body are legible at ~360–412 CSS px without horizontal scrolling; status and action buttons visible.

## P1 — Data integrity / imports / connections
- Preserve working duplicate prevention: imported existing goal/project must link, not recreate; show distinct **Created**, **Linked to existing**, **Skipped**, **Needs review** counts.
- Long files must be processed in deterministic chunks with progress/resume; **never** silently parse only first part.
- Respect explicit record type/destination/project/goal fields. Derive downstream tasks conservatively only with review; avoid invented facts. Link subtasks to parent and project.
- Prevent accidental cross-workspace references and keep Personal/Demo separate.

## P2 — Navigation, queue, progress and appearance
- Back must lead to actual prior screen; optional double-Back exit only when navigation history is empty and platform permits it. Test especially import preview/results and graph.
- Task queue: readable List, Grid/Card, and optional grouped views; project/date/status visible; minimum 44px controls; responsive 1-col narrow and 2-col only if usable. No giant truncated one-line labels.
- Numeric progress: clear `Update` control adjacent to bounded 0–100 percentage field; validate, save, persist, and show feedback. Distinguish manual progress from calculated rollups.
- Preserve Dark (black, neon green, white, gray), OLED, Light Blue, Red palettes. Respect reduced motion and contrast.
- Replace fake actions, dead links, and placeholder records before release.

## Audit/test sequence — do in this order
1. **Inventory** current Oct 23 exact editable source, lock source hash and backup; compare with Base44/Drive/GitHub snapshots. No edits to stale clones.
2. Confirm APK identity vs source: package, versionCode, signers, compile/target/min SDK; segregate from MindForge. Block build if root `android/app/build.gradle` still targets `com.mindforge.app`.
3. Repair AI service boundary. Unit-test backend authorization, response schema, three specificity levels, timeouts and quota/fallback.
4. Fix graph focus and card responsive layout. Device test at 360, 393, 412 CSS px; zoom/pan/back/search/filters.
5. Repair semantic dedupe and dismissal persistence for Today; regression-test event triggers, retries, multiple recipes and workspace switching.
6. Run import tests (long documents, duplicates, foreign links, project/goal/task relations, intentional malformed inputs), preserve user data.
7. Test every navigation tab, creation/editor modal, no-op/failed control, theme preference, accessibility, save/reopen, backup restore dry run.
8. Build Android from one source and test exact APK: signature/zipalign/aapt or bundletool, `adb install`, launch MainActivity, inspect logcat and app screen. Only then upload tested build to PC, GitHub release, and Google Drive. Include provenance manifest.

## Release PASS/FAIL
**Currently FAIL / UNVERIFIED**: P0 LLM routing in screenshot; global graph UX; repeat automation flags; latest source provenance. Do not publish or present a new APK as fixed until all P0/P1 issues have evidence of passing. No user content or installation was changed by creating this audit.
