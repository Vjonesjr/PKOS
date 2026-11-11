# Smart PKOS login-repair test checkpoint — 2026-11-11

## Scope
Fix the existing Base44 sign-in/session startup so the Android test app can reach Home and stay signed in. No new OAuth provider, no auth bypass, no change to production package identity.

## Branch & source
Branch: `smart-pkos-login-repair-20261111`
Build source commit: `9d42036da4c00f26e9aa34f893688e4c1b02ab8b`.
Previous integration branch: `smart-pkos-final-integration-20261102` (preserved).

## Root cause addressed
`AuthContext.jsx` required `appParams.token` captured at module initialization before checking `base44.auth.me()`; startup also could leave loading/authChecked inconsistent when public settings failed. On app reload that could prevent restoring a valid SDK session or trap a screen behind the spinner.

## Changes
- `src/lib/AuthContext.jsx`: always ask SDK for current authenticated user, independent of module-import token; ensure public-settings loading finishes even on failure; let failed auth settle to signed-out state.
- `android/app/build.gradle`: raise `versionCode` from `20261032` to `20261033` and `versionName` to `2026.11.11-login-repair-8`; retains debug test package suffix `.scrolltest`.
- `tests/auth/session-contract.test.mjs`: five source-contract regression checks (not live backend or device interaction tests).
- `.github/workflows/smart-pkos-build.yml`: run regression checks, package/version/signature verification and numbered APK upload on this branch.

## Verified
GitHub Actions run https://github.com/Vjonesjr/PKOS/actions/runs/43042360708 completed successfully: npm ci, lint, Vite build, five static regression checks, Gradle assembleDebug, Android signature and version/package checks, artifact upload.

## Artifact
ZIP: https://github.com/Vjonesjr/PKOS/actions/runs/43042360708/artifacts/13866895309
Inside: `Smart-PKOS-ScrollTest-Build-9-Run-43042360708.apk`
Android version code: `20261033`
Android version name (debug): `2026.11.11-login-repair-8-scroll-test`
Android application ID: `com.smartpkos.app.scrolltest`

## Verification outstanding
No emulator/physical-phone installation, launch, login or relaunch verification was performed. Build success is NOT proof of functional phone authentication. The test APK may be blocked if the installed test app has a different signing key; do not uninstall the original production application or delete its data. User should install this only over the separate test app and report whether it opens and retains a login. If Android rejects replacement due to signature mismatch, capture exact installer error without removing production data.
