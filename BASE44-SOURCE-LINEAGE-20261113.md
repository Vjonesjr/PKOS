# Smart PKOS source lineage — 2026-11-13

## Verified sources
- The original Base44 app is **Smart PKOS**, app ID `6ab97588d935cf6dad456bf1`, created on 2026-09-27. Its current saved main source was read at commit `b506dd097612eead9b449f9b532328e126ef4744`.
- Base44 reports that this app has **no connected GitHub repository** (`connected: false`). Its current saved source does not automatically synchronize with `Vjonesjr/PKOS`. The generic Base44 `README.md` describes a GitHub sync workflow, but that is not the app's current connection state.
- The separate Base44 app **Smart PKOS Copy**, ID `6ad73abbd1714b10d43b5164`, has a much smaller auth-focused tree. It was not used as the source for this comparison.
- The GitHub signing branch `codex/pkos-signing-continuity-20261111` was based on `smart-pkos-final-integration-20261102`; it supplies the Android/Capacitor wrapper and the signed APK artifact. Base44's current source has no tracked `android/` directory.

## Read-only comparison
`src/` and `base44/` tracked files were compared by path and SHA-256 after normalizing Windows line endings in the GitHub checkout. The Base44 app has 344 files in those trees; the GitHub signing checkout has 394. There are 12 Base44-only files, 62 GitHub-only files, 115 shared paths with different contents, and 217 matching shared files.

Examples of Base44-only files include `src/pages/NativeAuth.jsx`, `src/pages/KnowledgeMap.jsx`, `src/pages/Mfa.jsx`, `src/components/import/FlatTaskImportReview.jsx`, and `base44/entities/ProjectFile.jsonc`. The Base44 `src/App.jsx` routes `/native-auth` to a callback that attempts to return an authentication token to the Android app through `com.smartpkos.app://auth`; that route and page are absent from the examined GitHub signing checkout. This callback has not been validated on the phone. Examples of GitHub-only code include its Stage 1 runtime, local import/export modules, and mobile navigation components. The codebases must be reconciled feature by feature; one cannot safely replace the other wholesale.

## Recovery and APK boundary
- A read-only snapshot of all 358 tracked files at Base44 commit `b506dd097612eead9b449f9b532328e126ef4744` was saved outside the repository as `Smart-PKOS-Base44-Source-20261113.zip` (SHA-256 `782bd128e60d203da02979b9ee1b538e5b91456627b80ea17cb56822aaa4c363`). The parallel source TAR.GZ SHA-256 is `da8fc3d749cd4d2f00624a41a11069688501dbf3ae2d8b722086453154f0f302`. Both archives contain `NativeAuth.jsx`; neither includes a tracked keystore/private-key file.
- The signed artifact from GitHub Actions run `43236780437` proves package, certificate, versionCode, build, and isolated-emulator checks for the **GitHub branch at that run's commit**. It does **not** prove that the APK contains all current Base44 features or that its login works on the user's phone.
- No Base44 app code, published app, phone installation, or user data was changed during this audit. A future integration should keep the Android signing configuration, compare the Base44-only and differing files, preserve the GitHub Stage 1 features, then rebuild and test login and update behavior before calling a new APK current.

