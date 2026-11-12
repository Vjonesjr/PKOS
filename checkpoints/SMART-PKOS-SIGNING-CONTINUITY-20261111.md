# Smart PKOS signing continuity checkpoint — 2026-11-11

## Source and branch
- Base: `smart-pkos-final-integration-20261102` at `7593538698b82caf7bfe5d1ff6a33e2e1ffa7f14`.
- Work branch: `codex/pkos-signing-continuity-20261111`.
- Detailed investigation and install gate: [ANDROID-SIGNING-CONTINUITY-20261111.md](../ANDROID-SIGNING-CONTINUITY-20261111.md).
- No existing phone app, phone data, earlier artifact, or Base44 application was modified.

## Last passed stage
- Recovered original debug keystore locally; certificate SHA-256 `1b2adac2a4ceab88c34e413b74b523471623d58937985ea1436f064f7534756c` matches examined archived main Smart PKOS APKs.
- Local `npm ci`, lint, Vite build, Capacitor sync, and Gradle debug/release builds passed. The initial shared Gradle cache failed due missing metadata; the isolated cache build passed.
- Both local APKs passed `apksigner` v2/certificate, `aapt` package/versionCode, and `zipalign`.
- Local test APK: `com.smartpkos.app.signingtest`, versionCode `20261111`, SHA-256 `9ff80ae0bd7c59f86e21b768e9c388885ac8d603d8d6614bc3770c10151d7e07`.
- Local main update candidate: `com.smartpkos.app`, versionCode `20261111`, SHA-256 `bdbae05b30784491c1bee024e9f58ff962ec71207ad063f4d1e3632ca36f7419`.
- Clean Android 35 emulator: signing-test package installed and launched; archived main `20261024` APK updated in place to `20261111`, disposable app-data marker survived, and the updated main app launched. No sampled AndroidRuntime fatal exceptions.
- Physical phone package/version/signature remains unknown because no phone was attached.

## CI and artifact
- The owner approved encrypted GitHub Actions secret storage. All four signing secrets were saved; the key and credentials were never committed. The recovered key also signs some older MindForge debug APKs, so repository Actions access remains security-sensitive.
- Work-branch CI passed on 2026-11-12: https://github.com/Vjonesjr/PKOS/actions/runs/43236780437 at source commit `56c5ff2e9e3e043b5c8d5664472d68a48feaa094`.
- Signed APK ZIP: https://github.com/Vjonesjr/PKOS/actions/runs/43236780437/artifacts/13951993968. It contains separate signing-test and main update-candidate APKs plus signature, package, checksum, and source-commit reports.
- Emulator evidence: https://github.com/Vjonesjr/PKOS/actions/runs/43236780437/artifacts/13954115529. CI clean-install and launch passed. The local archived-main in-place update/data-marker test remains the stronger continuity evidence for that examined APK only.
- CI verified the APKs before upload. An independent post-download recheck of the CI ZIP was blocked by the browser's artifact redirect; see the detailed report.

## Remaining gate
1. Independently inspect the phone's installed package, versionCode, and certificate before recommending any main-app installation. Do not uninstall, clear data, or downgrade.
2. Physical phone login and app functionality remain separate unpassed gates.

## Resume command
Review the successful run and exact artifact above. Before any main-package installation, follow the phone inspection steps in `ANDROID-SIGNING-CONTINUITY-20261111.md`. Do not describe the main update as compatible with the current phone installation until its signer and version have been read.

