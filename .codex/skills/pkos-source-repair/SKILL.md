---
name: pkos-source-repair
description: "Maintain PKOS source code safely: create restore points, preserve the PC copy, update GitHub and Google Drive, run the relevant checks, and report the saved locations after every source change."
---

# PKOS Source Repair

Use this skill whenever editing, repairing, building, or packaging the PKOS source code.

## Source location

- Primary editable source: `C:\Users\vinni\OS3\mindforge`
- Local backup folder: `C:\Users\vinni\Downloads\PKOS-Backups`
- GitHub repository: `Vjonesjr/PKOS` (private)
- Keep the product name as PKOS. “MindForge” is only the old local folder/package name.

## Required workflow

1. Inspect the current source and existing changes before editing. Do not overwrite unrelated work.
2. Make the requested source change in the primary source folder.
3. Run proportionate checks. For the current PKOS web/runtime work, use `npm.cmd run validate:source`, `node --test test\\*.test.mjs`, and `npm.cmd run build`. If Android output is affected, run `npm.cmd run android:sync` and build `android\\app:assembleDebug` with a task-specific Gradle cache when the normal cache is broken.
4. Before stopping, create a dated restore archive in `C:\Users\vinni\Downloads\PKOS-Backups`. Include the source, tests, package files, Android project configuration, and a checkpoint note with test/build results and APK checksum when an APK exists.
5. Update the private GitHub repository `Vjonesjr/PKOS` with the actual changed source files and a `CHECKPOINT.md` note. Verify the repository contents after writing. Do not claim GitHub is updated until readback confirms it.
6. Upload the same checkpoint artifact or source snapshot to Google Drive in a clearly named PKOS backup folder. Verify the Drive file or folder after upload.
7. Report the result in plain English with links/paths for the PC backup, GitHub repository, Drive item, and any APK. Clearly separate “checks passed” from “APK installed or tested on a device.”

## Safety rules

- Never delete the original source, prior backups, GitHub history, or Drive files just to make room.
- Do not guess a GitHub repository or Drive destination. Use the configured PKOS repository and create/find a clearly named backup folder when needed.
- Keep PKOS personal data and source artifacts private. Do not publish the repository or change sharing to public.
- If a connector is unavailable, save the local backup first, state exactly what could not be synced, and continue with the remaining safe copies.
- A source test pass does not prove phone runtime behavior; label emulator, physical-phone, signing, and store evidence separately.

