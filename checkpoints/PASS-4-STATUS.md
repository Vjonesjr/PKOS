# Smart PKOS — Pass 4 GitHub checkpoint

## Reproducible build source
The GitHub branch includes the complete base source as `build-input/pkos-source-20261031.zip.b64` and the Pass 4 feature restoration patch as `build-assets/smart-pkos-test-pass2.py`.

The workflow `.github/workflows/pkos-apk-build.yml` reconstructs source, applies Pass 4 changes, verifies feature code, compiles an APK, verifies its package and signature, and installs/launches on an Android emulator.

The separately saved local source snapshot `Smart-PKOS-PASS-4-FEATURE-RESTORATION-SOURCE.zip` has not been committed as a binary ZIP. Do not claim otherwise. The GitHub build uses the checked-in base archive and feature patch.

## Pass 4 requirements
- Cards, List, Compact, responsive Grid task views
- Scroll-to-top control
- Package ID `com.smartpkos.pass4` to avoid overwriting working versions
- Build, signing verification, emulator installation and launch

## Known limitation
CI debug signing keys are ephemeral. A permanent signing key is still required for future upgrades to this same package. Keep existing phone installations untouched.
