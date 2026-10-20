---
name: pkos-source-repair
description: "Maintain Smart PKOS safely: create Base44 restore points, preserve the PC copy, update GitHub and Google Drive, run checks, and report saved locations after every source change."
---

# Smart PKOS Source Repair

Use this skill whenever editing, repairing, building, or packaging Smart PKOS.

## Source location

- Primary editable source: Base44 app **Smart PKOS**, app ID `6ab97588d935cf6dad456bf1`
- Local backup folder: `C:\Users\vinni\Downloads\PKOS-Backups`
- Standalone APK reference only: `C:\Users\vinni\Downloads\Local Files\Project Experiments\PKOS\Smart PKOS.apk`
- Old local folder `C:\Users\vinni\OS3\mindforge` is a separate MindForge app. Never build or publish it as Smart PKOS.
- GitHub repository: `Vjonesjr/PKOS` (private). Verify contents before claiming it is current.

## Required workflow

1. Inspect Smart PKOS before editing.
2. Start a Base44 checkpoint session before changing the app.
3. Make the change in the Smart PKOS Base44 app.
4. Run the Smart PKOS build and direct checks for changed files.
5. Finish the Base44 checkpoint and record its ID and commit hash.
6. Save a local backup/export when available.
7. Update GitHub with the actual Smart PKOS source snapshot and checkpoint note; read it back before claiming success.
8. Upload the source snapshot and checkpoint to Google Drive when the connector is available.
9. Clearly separate source checks, APK creation, APK signing, installation, emulator testing, phone testing, and store submission.

## Safety rules

- Never delete the original MindForge history, prior backups, GitHub history, or Drive files.
- Do not call MindForge an APK for Smart PKOS.
- Keep personal data and source artifacts private.
- A successful source build does not prove phone runtime behavior.
