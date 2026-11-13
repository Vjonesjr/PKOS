# Smart PKOS — Android installation certificate diagnosis
Date: 2026-11-13
Status: **Verified build-to-build signing incompatibility. Physical Samsung package/certificate not yet read.**

## Exact binaries inspected

The ZIP artifacts were downloaded from GitHub Actions with authenticated access, integrity-tested, and the APKs independently inspected using `keytool -printcert -jarfile` and Android binary-manifest parsing. Source APKs from Google Drive were also inspected; no APK or user installation was modified.

| APK | Android package ID | versionCode | Signing certificate SHA-256 |
|---|---|---:|---|
| Oct 24 theme | `com.smartpkos.app` | 20261024 | `1b2adac2a4ceab88c34e413b74b523471623d58937985ea1436f064f7534756c` |
| Oct 26 MVP | `com.smartpkos.app` | 20261026 | **same original** `1b2adac2...` |
| Oct 27 good baseline | `com.smartpkos.app` | 20261028 | **same original** `1b2adac2...` |
| Oct 31 UX pass | `com.smartpkos.app` | 20261032 | **same original** `1b2adac2...` |
| Oct 31 TEST-FIXED uploaded | `com.smartpkos.preview` | 2 | `94daf17e25715b8aeaba025667148503884f063b22fe376f05df3e9fbcecfa33` |
| GitHub Build 7 / run 42955066037 | `com.smartpkos.app.scrolltest` | 20261032 | `463999c9d36fa3f0afa1b8f290df023e4e4c06aae328e32bc0048ac1c83fcd0a` |
| GitHub Build 9 / run 43042360708 | `com.smartpkos.app.scrolltest` | 20261033 | `863c04a715fae34561b10dab4d317d0b8cea786c92659b4d1d67f70a2048700c` |
| CI signed isolated test / run 43236780437 | `com.smartpkos.app.signingtest` | 20261111 | **same original** `1b2adac2...` |
| CI signed main candidate / run 43236780437 | `com.smartpkos.app` | 20261111 | **same original** `1b2adac2...` |

All examined APK manifest `minSdkVersion` values are 23 (not an obvious Android 17 incompatibility).

## Proven install conflict

Build 7 and Build 9 share the **identical** package ID `com.smartpkos.app.scrolltest` but have **different signing certificates**: `463999...` vs `863c04...`.

Android cannot install Build 9 as an in-place update over an installed Build 7, despite Build 9 having a higher versionCode. The likely Package Manager failure is `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, but that exact status has **not** been captured from the user's phone.

The older GitHub Actions workflow built using its runner-local debug keystore, without a pinned signing configuration, so test APK signer identity changed between CI runs. This is a verified release-process defect, not a React/Vite compilation error.

The uploaded Oct 31 TEST-FIXED APK is `com.smartpkos.preview`, a **separate** package. Its different certificate does not conflict with `com.smartpkos.app` merely by being different. Do not misdiagnose it as an update to the main app.

## Existing remediation already built

The `codex/pkos-signing-continuity-20261111` branch has a successful CI workflow that checks a pinned original certificate and produces separate `com.smartpkos.app.signingtest` and main `com.smartpkos.app` candidates:
https://github.com/Vjonesjr/PKOS/actions/runs/43236780437/artifacts/13951993968

The new `.signingtest` package does not overwrite either the original app or the `.scrolltest` package. The main candidate is compatible *in package and signer* with the examined October main APKs, but **phone installation compatibility is unproven** until the installed package, versionCode and signer are read on the device. Do not install the main candidate yet.

## Device verification gate (no destructive actions)

1. Connect the Samsung via authorized ADB and list installed `com.smartpkos.app`, `com.smartpkos.app.scrolltest`, `com.smartpkos.app.signingtest`, `com.smartpkos.preview` packages.
2. For every installed package, read `pm path`, `dumpsys package` versionCode and, if readable, pull its base.apk and inspect signing SHA-256 with Android SDK `apksigner verify --print-certs`.
3. If installed `.scrolltest` is signed by `463999...`, Build 9 `863c04...` definitively cannot replace it. Do not uninstall or clear data while diagnosing.
4. Only once current installed signatures are known select an update path, with explicit backup and user authorization for any data-affecting change.
5. Test login and UI separately after install; a correct signature does not prove the app operates.

## Verification fingerprints

- Build 7 APK SHA-256: `dd3f38991e4848b82302dd5e70142c0939c6a2e4a4aef38ff63ed00fceeecce7`
- Build 9 APK SHA-256: `43765c31afd6c4bafcfa437d95443b39a5d935cb5bb40d32d7624ca2595f3973`
- CI signed isolated APK SHA-256: `ec75e77ae5e6951b0db196b888a3bd93223b197035ae152b367c1b3e3cd2d060`
- CI signed main APK SHA-256: `f004f8b3c16a6a780dc2ba9e9548f4ffd205d41f863bf153dc622287ff3aeacc`

No existing source files, APKs, backup archives, or GitHub production branches were overwritten during this diagnosis.
