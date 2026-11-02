# Smart PKOS — Release Candidate Stabilization Checkpoint

Date: 2026-10-26
Baseline APK: Smart-PKOS-MVP-20261026.apk
Baseline source: Smart-PKOS-source-20261026.zip

## User-observed issues addressed

1. Mobile close/X controls sometimes did not react reliably.
   - Enlarged shared Dialog close target to 44x44 with touch-manipulation and higher stacking priority.
   - Enlarged shared Sheet/drawer close target to 44x44.
   - Enlarged project milestone remove target.
   - Enlarged Universal Search clear-X target.

2. AI milestone/subtask generation failed in the APK.
   - Removed direct frontend privileged InvokeLLM usage from the Android source path.
   - Aligned milestone/subtask generation with the existing authenticated `aiAssist` backend actions:
     - `suggest_milestones`
     - `generate_subtasks`
   - Generation remains review-only until the user explicitly saves selected steps.
   - Existing items are deduplicated before save.
   - Null/empty values are normalized before string slicing/processing.

3. AI Tool Router recommendations were too vague and could create decision paralysis.
   - Router now asks for concrete comparison candidates when a category recommendation is generic.
   - Each candidate can include provider/manufacturer, exact product/model, size/class/version, fit, and tradeoff/reason.
   - Local-model routes request parameter size and quantization class when useful.
   - Router identifies likely bottlenecks such as RAM, VRAM, CPU, storage, context size, or unsupported runtime.
   - UI now displays a "Likely bottlenecks to clear first" section and "Specific options to compare" cards.

## Validation completed

### Live Base44 app
- `npm run lint`: PASS
- `npm run build`: PASS
- Direct frontend `integrations.Core.InvokeLLM` references: 0
- Base44 checkpoint: `Release candidate stabilization: AI routing + mobile close controls`
- Checkpoint ID: `6adffa3cdccb0dce81dbeb6e`
- Git commit: `ff115d18ffaf044a70899e250b115435978b8d23`

### Android-source checkpoint
- Source parser validation: 334 JS/JSX/TS/TSX files parsed
- Syntax errors: 0
- Direct frontend `integrations.Core.InvokeLLM` references: 0
- Backend generator routes present: `suggest_milestones`, `generate_subtasks`
- Router concrete-options/bottleneck schema present

## Known non-blocking / remaining gates

- `npm run typecheck` on the live Base44 project reports a broad pre-existing JSX/component-prop typing backlog across many older UI files. Lint and the production Vite build pass. This stabilization pass does not attempt a repo-wide typing rewrite.
- This ChatGPT container does not have the configured Android SDK/signing environment required to produce an upgrade-compatible APK. Java is present, but Android SDK variables/tools are absent. The next APK must be built in the existing Windows/Work/Codex Android build environment where the original signing identity is available.
- Device proof is still required for the new release candidate: install/update, launch, X/close interactions, milestone generation, subtask generation, Tool Router specificity, and regression smoke test of Home/Projects/Capture/Settings.

## Next production phase

Build the next signed Android release candidate from this source checkpoint, install it over the current Smart PKOS app, and run the targeted device regression list above. Do not label it final until those phone checks pass.
