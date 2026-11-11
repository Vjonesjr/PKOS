# Smart PKOS — Agent Workflow Card
Status: ACTIVE / unverified build. Applies to the existing PKOS source on this branch. This file defines execution and stop conditions; it is not evidence of a passing build.

## 1. Finished result
A separately installable Smart PKOS test APK containing the integrated advanced scrolling and paged Task Queue, with passing applicable frontend checks, verified Android package/signature, successful emulator installation and launch, full source preserved, and exact artifact/checkpoint links. The working Pass 4 app and user data must remain untouched.

## 2. Steps (perform in order)
Identify branch/source and read current CI failures → preserve current commit as checkpoint → inspect failures and source → implement the smallest safe correction → run lint, frontend build and relevant UI tests → build Android debug APK → verify signature and distinct package ID → install and foreground-launch on emulator → publish artifacts/test evidence → provide handoff and device QA checklist.

## 3. Ownership
AI developer: inspect, patch, write tests, checkpoint, keep handoff accurate.
GitHub Actions: deterministic build, automated tests, signature/package checks, artifact upload.
User: test the APK on physical Samsung Android phone and approve any destructive step, production publishing, purchase, or changes to core requirements.
Never assume an AI agent can see or control a browser unless tool access confirms it.

## 4. Yes/no completion gates
- Latest complete source confirmed and source checkpoint exists?
- Four bottom tabs and existing projects, data, Focus, imports and themes preserved?
- Scrolling modes, proportional indicator and scroll-to-top verified?
- Today/Upcoming/Someday groups, five-at-a-time paging and Cards/List/Compact verified?
- Lint/web build/UI tests pass, or each failure clearly documented?
- APK file exists, signature verifies, test app ID is distinct?
- Emulator install AND foreground launch pass?
- Exact SHA, artifact location, remaining limitations and source links recorded?
A build is NOT a verified release without the requested proof. Physical-device QA is a separate gate.

## 5. User decision gates
Stop and request approval before deleting/modifying production data, uninstalling or replacing the working application, changing the production package ID/signing identity, spending money, publishing publicly, sending messages externally, or materially changing requirements. Normal inspect/patch/test/checkpoint activity does not require repeated 'Go' prompts.

## 6. Failure and interruption contract
Checkpoint before modifying source and after each meaningful repair. If any command fails, preserve the complete current source and logs; do not discard successful work. If limited by time/context/credits, commit an honest partial checkpoint, write the last passed stage, exact failure, next command/step, and a continuation handoff. Provide partial APK only if buildable; clearly label it unverified/incomplete until validation. Do not claim a backup, test or release succeeded unless verified.

## Current checkpoint context
Working branch: smart-pkos-final-integration-20261102
Earlier scrolling branch: smart-pkos-advanced-scroll-20261101
Original preserved branch: smart-pkos-scroll-original-20261101
CI workflow: .github/workflows/smart-pkos-build.yml
The 2026-11-10 report screenshot showed failed workflow runs #1 and #2. Their precise job-level root causes have NOT yet been established in this file. Retrieve their run/job logs before prescribing a technical fix.
