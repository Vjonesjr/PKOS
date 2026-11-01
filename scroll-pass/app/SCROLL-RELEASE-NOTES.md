# Advanced scrolling — 2026-11-01

Based on the complete Pass 4 feature-restoration source, preserved before edits in GitHub branch smart-pkos-scroll-original-20261101 (commit cf1de0e63df93a9120cf9504529d6cb10be51983) and local Git tag scroll-original-20261101. The previous APK remains untouched. The Pass 5 binary-only pagination experiment is superseded by source integration.

- Proportional right-edge indicator uses actual scrollHeight, clientHeight and scrollTop. Handles document and active scrolling detail panes, content/viewport resize, safe areas and bottom navigation. Hidden on short pages; theme variables preserve all themes.
- Settings → Display → Scrolling & Navigation: Standard, Compact, Section Navigation and indicator toggle. Existing page-transition, font, spacing and width preferences retained independently.
- Small section menu only on suitable pages; scroll-to-top appears after scrolling. Both respect device and application reduced motion. Finger scrolling remains native.
- Tasks, repeating schedules, Home Today list and Home/project Task Queue start at five records per group, with More/Fewer and remembered expansion. Empty content stays collapsed. Today initially expanded; Upcoming and Someday initially collapsed.
- Cards, List and Compact preserved; obsolete Grid selections fall back to Cards. No task records deleted or merged. Recurring templates and occurrences remain distinct; no automatic deduplication performed.
- Exactly four bottom tabs retained. Focus, Copilot, schema, auth and task persistence code unchanged.
- Debug APK uses com.smartpkos.app.scrolltest and label Smart PKOS Scroll Test. It cannot replace com.smartpkos.app. It has isolated app storage and does not copy private local data from the working installation. Signing in can access the existing cloud account; web tests use isolated fixtures.

Verification is recorded under verification/scroll and the GitHub Actions run. Local web production build and lint pass. CI must pass UI interaction tests, Android v2 signature check, package identity, emulator installation and foreground launch before a verified APK is published. Physical S23 Ultra testing remains a separate device check.
