# Pass 4 UI / AI / Timer investigation — 2026-11-01

## Device evidence
User's Samsung screenshots: Settings > Display control panel offers font, text size, **line spacing** Compact/Normal/Relaxed/Airy, and content width. This Compact is not the task view. Project Copilot Ask and Briefing both display failure messages. Focus screen shows 25:00 with 15/25/45/60 presets; user rejects this timer presentation. Scroll-to-top works.

## Repository evidence
- `build-assets/smart-pkos-test-pass2.py` adds `["grid", "Grid"]` to `app/src/pages/Tasks.jsx` during CI reconstruction, and asserts Cards/List/Compact/Grid strings exist. This is a **source-string check**, not a runtime visibility check.
- `smart-pkos/src/components/queue/QueueControls.jsx` on Pass 4 branch defines a distinct VIEWS array List/Grid/Cards and an accessible 'Task queue view' select. This file is **not proof** it is the component used by the reconstructed APK; the workflow restores a separate source ZIP to `app/`.
- Pass 4 workflow packages the ZIP-restored app, not necessarily the `smart-pkos/` tree. Do not edit the latter expecting APK changes.

## Required engineering checks before patch/build
1. Inspect exact `app/src/pages/Tasks.jsx` extracted from the source ZIP and trace routes/navigation from Home to Tasks. Confirm view selector actually renders and is reachable on mobile.
2. Reproduce mobile-width task view and validate visible selector controls, not only string presence. Ensure Cards/List/Compact/Grid all appear and produce distinct layouts.
3. Trace actual Project Copilot Ask and Briefing calls, backend/AI configuration, and error handling; do not fake success or embed secrets.
4. Retrieve the user's original approved timer/clock specification before changing the 25:00 focus timer.
5. Preserve original source, create checkpoint before code edits, and keep installed app identities/data untouched. Build only after evidence-backed fixes and smoke tests.

## Status
Investigation documented; **no code fix, new APK, or physical AI repair has been completed**.
