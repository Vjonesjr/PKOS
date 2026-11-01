# Smart PKOS — APK recovery checkpoint

This is a non-destructive record of the later Smart PKOS build work.

## Source and identity
- Smart PKOS lives under `smart-pkos/` in this repository. The repository root also contains legacy MindForge material; do not replace it.
- Android package ID: `com.smartpkos.app`.
- Earlier source checkpoint: 2026-10-20, documented in `smart-pkos/CHECKPOINT.md`.
- Newer local source package: `Smart-PKOS-PASS-11-SAFE-CI-SOURCE.zip` (saved separately in the ChatGPT conversation; not yet uploaded to GitHub).
- The later package contains 500 ZIP entries, including Android sources and a manual GitHub Actions workflow.

## Newer changes awaiting integration
- Settings scrolling modes: Standard, Smooth, Remember position.
- Remember mode improved to restore positions during navigation and delayed rendering.
- Build workflow records diagnostics and only publishes a debug APK on successful compilation.
- Source checkpoints and build diagnostics are preserved separately.

## Known blocker
- Local npm installation failed with DNS `EAI_AGAIN` and `Exit handler never called!`.
- The later source has **not** been compiled into a verified APK.
- Do not claim the new APK was installed or tested.

## Safe next steps
1. Compare newer source against `smart-pkos/` and preserve the existing source.
2. Integrate into a dedicated branch, not directly over the legacy root.
3. Ensure the workflow uses the correct working directory and lockfile.
4. Build web assets, sync Capacitor, assemble the Android debug APK, and verify package ID and version.
5. Test installation and launch before distributing.

No source files should be deleted as part of this checkpoint.
