# Smart PKOS — original-source recovery manifest
Date: 2026-11-13
Status: **Recovery inventory and comparison only. No APK build, installer fix, release, source overwrite or data migration performed.**

## Source of truth: preserved original archives (Google Drive)

These ZIPs remain UNCHANGED in Drive. This repository is currently **PUBLIC** and neither raw ZIP has been committed here, to avoid exposing original files, configuration, or unpublished content.

| Snapshot | Exact original Drive file | ZIP SHA-256 | ZIP integrity | Files |
|---|---|---|---|---:|
| Oct 20 | [Smart-PKOS-checkpoint-20261020-0645.zip](https://drive.google.com/file/d/1KMPNwt_nUpty6_2TVdkILzRZ0hoccvQz/view) | `d9e0e49080bce7191dfdc3b015b6501227558f45233d9970fdf43ad1fc23794a` | PASS | 294 |
| Oct 31 | [Smart-PKOS-UX-PASS-SOURCE-20261031.zip](https://drive.google.com/file/d/1KS5zDquNd7m8IXx66ZG3dO8j0lytIPNZ/view) | `2b475a3d0a83bedb2912580efc2fd387c2d1105c2487e9ae53e9d2f79fb6ad67` | PASS | 499 |

Oct 31 archive contains `src/`, `android/`, `base44/`, `backend/`, `verification/`, and project configuration. Its `.npmrc` and `.env.production` are deliberately NOT published here. Preserve all originals in Drive, including their existing file IDs, metadata and access permissions.

## Oct 20 -> Oct 31 exact archive comparison

- 184 identical files by exact file bytes.
- 107 common paths with changed bytes.
- 208 new paths added in Oct 31.
- 3 paths absent in Oct 31: `.app.jsonc`, `CHECKPOINT.md`, `config.jsonc`.
- New major source areas: Android (62 files), Base44 (50), verification (26), and additional source UI/function files (46).
- Changed paths include `src/components/Layout.jsx`, `src/lib/AuthContext.jsx`, `src/pages/Home.jsx`, `src/pages/Settings.jsx`, `src/pages/Projects.jsx`, `src/pages/ImportPlans.jsx`, and `src/index.css`.

## Oct 31 vs the Nov 2 GitHub integration branch

Compared Git blob SHA-1 of archived bytes with `smart-pkos-final-integration-20261102` tree. Selected anchor files:

| File | Exact match to Oct 31? |
|---|---|
| `src/pages/Home.jsx` | YES |
| `src/pages/ImportPlans.jsx` | YES |
| `package.json` | YES |
| `src/App.jsx` | NO |
| `src/components/Layout.jsx` | NO |
| `src/pages/Settings.jsx` | NO |
| `src/lib/AuthContext.jsx` | NO |
| `src/pages/Projects.jsx` | NO |
| `src/components/ScrollToTop.jsx` | NO |
| `src/index.css` | NO |
| `package-lock.json` | NO |
| `android/app/build.gradle` | NO |

These mismatches indicate later code changes, **not** by themselves regressions or the root cause of phone installation failure. The Nov 2 integration branch has 555 blob entries, so do not replace it with the older 499-file archive wholesale.

## Controlled recovery next steps

1. Keep both original archives unchanged; use the October 31 source as an inspectable comparison baseline, not an unconditional replacement.
2. Compare the installed Samsung application ID, versionCode, certificate SHA-256, and the exact Android installer failure before changing signing/version/package settings.
3. Confirm build lineage for `com.smartpkos.app` separately from `com.smartpkos.app.scrolltest` and `com.smartpkos.app.signingtest`.
4. Patch only the demonstrated installation cause on a new branch; run Android package/signature and upgrade/install tests with preserved data.
5. If complete archival GitHub storage is required, first use a verified PRIVATE PKOS repository, not this public repository, then upload raw ZIPs there without changing the Drive originals.

## Safety

No keys, passwords, keystores, personal content archives, or original ZIP contents were committed as part of this manifest. Do not merge this recovery branch into an unrelated MindForge checkout or mistake a compiling APK for a verified installation.
