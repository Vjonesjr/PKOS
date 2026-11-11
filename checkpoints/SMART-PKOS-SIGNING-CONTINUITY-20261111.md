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

## Pending
1. After action-time authorization, store the recovered key and credentials in encrypted GitHub Actions secrets. This key also signs some older MindForge debug APKs, so access must be treated as security-sensitive.
2. Enable the new workflow's push trigger on this work branch; inspect the CI run and exact artifact links.
3. Independently inspect the phone's installed package, versionCode, and certificate before recommending any main-app installation. Do not uninstall, clear data, or downgrade.
4. Physical phone login and app functionality remain separate unpassed gates.

## Resume command
Review `.github/workflows/pkos-signing-continuity.yml`, enable its work-branch push trigger only after secrets exist, then follow the new Actions run to completion. Do not describe the main update as compatible with the current phone installation until its signer and version have been read.
