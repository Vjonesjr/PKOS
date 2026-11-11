# Smart PKOS Android signing continuity — 2026-11-11

## Scope and saved source
- Based on existing branch `smart-pkos-final-integration-20261102` at `7593538698b82caf7bfe5d1ff6a33e2e1ffa7f14`.
- Work branch: `codex/pkos-signing-continuity-20261111`. The base commit is the pre-change checkpoint.
- The main app keeps package ID `com.smartpkos.app`. Its update candidate has versionCode `20261111`.
- A new test package, `com.smartpkos.app.signingtest`, avoids replacing either the main app or the older `com.smartpkos.app.scrolltest` test installation.

## Signing-key investigation
- The checked-in Android source contains no keystore. Previous workflows generated ephemeral signing keys or relied on runner-local debug signing; those artifacts cannot establish repeatable updates.
- The locally recovered `C:\Users\vinni\.android\debug.keystore` contains alias `androiddebugkey`, certificate SHA-256 `1B:2A:DA:C2:A4:CE:AB:88:C3:4E:41:3B:74:B5:23:47:16:23:D5:89:37:98:5E:A1:43:6F:06:4F:75:34:75:6C`.
- Independent `apksigner` reads of archived main Smart PKOS APKs in `C:\Users\vinni\Downloads\PKOS-Backups` show that same certificate. The archive named `Smart-PKOS-installed-current-before-theme.apk` is `com.smartpkos.app`, versionCode `20261023`; the theme APK is versionCode `20261024`. Repository verification of the 2026-10-26 MVP APK records package `com.smartpkos.app`, versionCode `20261026`, and the same certificate.
- This proves continuity with those *examined APKs*. No Android phone was attached during this investigation, so the package, versionCode, and signer of the current phone installation remain unknown. Later separately signed APKs may be incompatible.
- The key is also a standard Android debug identity and is **not a Play Store release key**. The signed main-package APK is an update candidate for matching debug-signed installations only.

## CI secret and build contract
Repository Actions secrets (encrypted in GitHub, never checked in):
- `PKOS_SIGNING_KEYSTORE_BASE64`: base64 of the recovered keystore bytes.
- `PKOS_SIGNING_STORE_PASSWORD`: keystore password.
- `PKOS_SIGNING_KEY_ALIAS`: `androiddebugkey`.
- `PKOS_SIGNING_KEY_PASSWORD`: key password.

CI must decode the keystore outside the checkout, set `PKOS_SIGNING_KEYSTORE` to that temporary file, and pass only the four secret values into the Gradle signing step. It must fail if any secret is absent or the certificate differs from the pinned SHA-256. It must never upload the keystore or a password in an artifact or log.

## Install compatibility gate
An APK can update an installed app while preserving its app data only when the package ID and signing identity match and Android accepts its versionCode. The main candidate is **not approved for installation on the user's phone** until the currently installed app is inspected. No uninstall, reset, or downgrade is part of this workflow.

1. Connect the phone with USB debugging, then run `adb devices -l`. Expected: one authorized device row. If blank or `unauthorized`, enable USB debugging/approve the prompt and repeat this step; do not proceed.
2. Run `adb shell pm path com.smartpkos.app`. Expected: `package:/data/app/.../base.apk`. If empty, the main package is absent or the device is wrong; stop and identify the installed app.
3. Read its `versionCode` with `adb shell dumpsys package com.smartpkos.app | Select-String versionCode`. Expected: an integer below `20261111`. If equal/higher, stop; a different candidate versionCode is needed.
4. Pull the installed `base.apk` to a private local path and run Android SDK `apksigner verify --print-certs` on it. Expected certificate SHA-256: `1b2adac2a4ceab88c34e413b74b523471623d58937985ea1436f064f7534756c`. If different, **stop**: this candidate cannot update that installation without an appropriate signing lineage/key. Keep the installation and its data intact.
5. Only after steps 1–4 pass, test `adb install -r <candidate.apk>` with an appropriate data backup. Expected `Success`. If Android rejects the update, stop and retain the installed app; do not add `-d`, uninstall, or clear data.

The separate `com.smartpkos.app.signingtest` APK can be installed alongside the existing main and earlier scroll-test apps. Its successful install or launch does not prove main-package update compatibility, login, or data preservation on the phone.

## Local build and emulator evidence (2026-11-11)
- `npm ci --no-audit --no-fund`, `npm run lint`, Vite build with the public Base44 app context, and `npx cap sync android` passed.
- An initial Android build failed because the shared Windows Gradle cache had missing `metadata.bin` files. An isolated task-specific Gradle cache and the installed Android SDK path allowed `assembleDebug assembleRelease` to pass (325 executed tasks).
- Android `apksigner` verified v2 signatures and the pinned original certificate for both APKs; `aapt` verified package IDs and versionCode `20261111`; `zipalign -c -v 4` passed.
- Local isolated test APK: `android/app/build/outputs/apk/debug/app-debug.apk`, SHA-256 `9ff80ae0bd7c59f86e21b768e9c388885ac8d603d8d6614bc3770c10151d7e07`.
- Local main update candidate: `android/app/build/outputs/apk/release/app-release.apk`, SHA-256 `bdbae05b30784491c1bee024e9f58ff962ec71207ad063f4d1e3632ca36f7419`.
- A clean Android 35 emulator installed and foreground-launched the isolated test APK. `am start -W` returned `Status: ok`, a process remained running, and the sampled AndroidRuntime log had no fatal exception.
- On that clean emulator, the archived `Smart-PKOS-theme-20261024-debug.apk` (versionCode `20261024`) installed. A disposable private data marker was created. `adb install -r` of the new main candidate returned `Success`, the installed versionCode became `20261111`, and the marker remained. The updated main app also launched without a sampled fatal Android exception.
- These tests establish update/data continuity **for that examined archived APK on the emulator only**. They do not establish the package, signer, version, current data state, or app functionality on the user's physical phone.

## Evidence ledger
- Existing Build 7 source APK: https://github.com/Vjonesjr/PKOS/actions/runs/42955066037/artifacts/13826328196 — `com.smartpkos.app.scrolltest`, earlier runner debug signer. It is not a main-app update.
- The new CI run and exact artifact links must be appended after a successful signed build. Until then, signing and install gates remain pending.
