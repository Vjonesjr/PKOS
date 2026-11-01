# Smart PKOS Pass 4 — physical device QA checkpoint
Date: 2026-11-01
Base commit: 28c9c7795b612eb868ab43cbebc4f2bbf3e3aeba
Workflow run: 41293524634
Artifact: 13078616653

## Confirmed
- User reports Pass 4 successfully installed and runs on Samsung Galaxy S23 Ultra.
- Installation succeeded by selecting an alternate Android app/handler from the installation choices. Do not claim the APK bytes were changed or that a different version was installed.
- Previous installation path failed; the specific Android rejection code remains undetermined and is no longer blocking.
- GitHub CI passed source restoration, frontend build, Android build, signature verification, and API 29 emulator launch.
- Feature patch source checks Cards/List/Compact/Grid, responsive grid, scroll-to-top; physical feature behavior has NOT been independently verified.

## Preservation rules
- Preserve Smart PKOS, Smart PKOS Test, and Smart PKOS Pass 3; do not uninstall, clear data, or overwrite without explicit permission.
- No speculative rebuild. No new feature pass until physical QA is recorded.
- Preserve signing continuity for future upgrades.

## Physical QA checklist
- [ ] Home / Projects / Capture / Settings navigation and back behavior
- [ ] Tasks Cards / List / Compact / Grid controls
- [ ] Grid responsive layout on Samsung
- [ ] Scroll-to-top button
- [ ] Task create, edit, complete, undo, persistence after restart
- [ ] Capture and project flows
- [ ] Text readability, task groupings, theme, and control panel
- [ ] Report crashes and missing features separately from planned improvements

## Evidence
User report is authoritative for successful Samsung installation; no independent device instrumentation was performed.

## Samsung screenshot findings (2026-11-01)
- User confirms Scroll to top and Cards; reports Compact works, but screenshots show Compact under Settings > Display control panel > Line spacing. This is not evidence of Compact task-view mode.
- List and Grid task-view controls not found by user; screenshots show Projects detail, Focus timer, and Settings rather than Tasks page. Exact placement remains unverified.
- Focus timer shows 25:00 and presets 15/25/45/60 minutes; user explicitly rejects this clock design. Must retrieve original clock specification before altering.
- Project Copilot Ask shows 'Sorry, I couldn't answer that. Please try again.'
- Project Copilot Briefing shows 'Couldn't generate a briefing. Please try again.'
- Do not claim AI functions work or treat task-view controls as physically verified.
- Next engineering investigation: locate actual Tasks navigation/rendering, determine if task-view selector is reachable; inspect Copilot error paths; compare Focus timer to approved spec. Do not change user data or overwrite installed versions.
