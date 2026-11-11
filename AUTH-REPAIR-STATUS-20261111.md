# Smart PKOS test APK — Login loop repair (2026-11-11 UTC)

## User report
The separate Smart PKOS Scroll Test APK returned repeatedly to the login screen.

## Cause investigated
The Android workflow ran bare `npm run build` without supplying the public `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL` values required by the Base44 SDK. This produced a web bundle that could lack its backend app context. Base44 CLI documentation confirms bare Vite builds do not automatically inject the app ID.

## Minimal repair
Set the production build step's public values to app ID `6ab97588d935cf6dad456bf1` and hosted app base URL `https://gorgeous-smart-brain-flow.base44.app`. Include a build-time grep confirming the app ID is actually embedded. No private keys/tokens were committed. Only `.github/workflows/smart-pkos-build.yml` changed.

- Fix source commit: `bf24ee20e5e80074d43d5526e9a17ca63817fe5b`
- Green GitHub workflow run: https://github.com/Vjonesjr/PKOS/actions/runs/42949702627
- Test APK ZIP artifact: https://github.com/Vjonesjr/PKOS/actions/runs/42949702627/artifacts/13824333007
- Build diagnostics: https://github.com/Vjonesjr/PKOS/actions/runs/42949702627/artifacts/13824696848
- CI verified web build includes the app ID, APK compiles, v2 signing/package identity verify, and artifact upload.

## NOT YET VERIFIED
Real user login on Android and authenticated session persistence. Existing Google OAuth handling has an additional potential callback collision: `src/lib/native.js` and the manifest use `com.smartpkos.app://auth` while the debug APK package is `com.smartpkos.app.scrolltest`. Google callback behavior needs explicit device testing; do not assume it works just because the build is green. Email-password should be tried first in the test app. No emulator installation/launch validation was performed in this workflow.

## Safe next steps
1. Install the new test APK ZIP's `app-debug.apk` over the *test* installation only; retain original `com.smartpkos.app`.
2. Test email/password sign-in and access the Home screen. If the issue persists, record exact visible screen/error and which auth method was used; do not reset passwords or delete user data.
3. Separately investigate native Google OAuth return route without hijacking the existing production app's deep links.
4. Continue advanced scrolling and Task Queue device QA only after login is confirmed.
