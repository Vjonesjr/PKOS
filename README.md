# MindForge

MindForge is a local-first personal command center for Ideas, Notes, Writing Outlines, Projects, and prioritized Actions. It keeps related work linked, shows Project progress and attention needs, supports a daily action review, and provides local JSON backup/restore plus local file import, JSON backup/restore, and sample-data controls. It is a Vite web app prepared for Capacitor Android packaging, plus a separate static marketing site.

## Run the product locally

```bat
cd C:\Users\vinni\OS3\mindforge
npm install
npm run dev -- --host 127.0.0.1
```

Open the URL Vite prints, normally `http://127.0.0.1:5173`.

## Build the web app

```bat
npm run build
```

The production web app is written to `dist`.

## Data, demo workspace, and backup

Records are stored locally in the browser/app. MindForge keeps a **Personal workspace** and a separate **Demo workspace**. The demo contains fictional, representative records for a student, data analyst, entrepreneur, app builder, writer, and veteran-support project; it is not your real data.

Open **Settings → Workspaces → Explore demo workspace** to use the richer demo data. Choose **Use personal workspace** to return to your own records. The two workspaces are stored separately, so loading, changing, or resetting the demo does not replace personal records. **Reset demo dataset** restores only the fictional demo workspace.

Use **Settings → Data & Backup → Import Files** to add `.md`, `.markdown`, or `.txt` files as Notes in the active workspace. Import adds records and does not replace existing data.

Use **Settings → Data & Backup → Back Up MindForge** before clearing browser data, reinstalling, or moving devices. Backups export the workspace currently open. Restore replaces only the currently open workspace with a valid MindForge JSON backup, so select the intended workspace first.

## Android project

```bat
npm install
npm run android:sync
npm run android:open
```

`android:sync` builds the web app and creates/synchronizes the Capacitor Android project. Android Studio, a compatible Android SDK, and a publisher-owned signing key are required to build a signed release AAB. Use `android-assets/icon.svg` and `android-assets/splash.svg` as the source art for Android adaptive icon and splash setup in Android Studio.

For an unsigned development APK after Android Studio/SDK setup:

```bat
cd android
gradlew.bat assembleDebug
```

For a Play Store release, configure the upload key in Android Studio or Gradle, increment version code, and create a signed AAB. Do not submit an unsigned APK to Play Console.

## Marketing site

The independently deployable static site is in `marketing`.

```bat
cd C:\Users\vinni\OS3\mindforge\marketing
python -m http.server 8080
```

Open `http://127.0.0.1:8080`.

Deploy the entire `marketing` folder to any static host (GitHub Pages, Cloudflare Pages, Netlify, or Vercel). Before deploying publicly, replace every `SUPPORT_EMAIL_PLACEHOLDER`, set the policy effective date, and have the policy/terms reviewed for the publisher and markets. No domain, hosting account, or public deployment has been created.

## Store and monetization materials

- `STORE_LISTING.md` — Play listing copy, disclosure guidance, and submission checklist
- `MONETIZATION.md` — realistic Google Play Billing integration path
- `marketing/privacy.html` and `marketing/terms.html` — public-page drafts requiring publisher details and review


## Local AI Assistance

MindForge 1.6 adds **Shape Capture**, **Develop Record**, and **Suggest Connections** as reviewable record-level helpers. In this release they are deterministic local suggestions: they examine only the selected record plus local metadata such as tags, explicit links, project membership, categories, and short title/description text. They make no network request and no generative model is configured.

Open a Capture and choose **Shape Capture** to edit and apply a proposed title, description, next action, and tags. Open a Note, Outline, Idea, Project, or Action and choose **Develop Record** to review a structured local draft; Notes and Outlines can append it as a draft or replace content only after review. **Suggest Connections** ranks up to three candidates using readable evidence and requires an explicit Link action. Rejected suggestions remain local.

Personal and Demo workspace records stay separate. AI activity, dismissals, and future local cache metadata are stored on-device only; no provider key, cloud model, embedding index, or background generation is included. A future on-device model or explicitly disclosed provider adapter would be required for model-generated output.

## 1.6.6 visual-polish candidate

- Refined typography, spacing, card hierarchy, button states, and responsive density without changing the local-first data model.
- Improved bottom-navigation layout so icon labels stay readable on phones.
- Improved preset-aware primary-button contrast, including Neon Grid.
- Standardized Search, Settings, More, Connected Work, and dashboard surface treatments.
- Preserved theme, preset, density, font-size, motion, glow, hero, and card-style preferences.
- This is a visual-QA candidate; release signing/publishing is not claimed complete until the Android build is visually verified.

## v1.6.7 visual QA refinement

- Replaced native Android project filter/view selects with in-theme custom menus.
- Restored a compact two-column More grid at common phone widths.
- No storage keys, signing materials, Personal/Demo separation, or backup/restore behavior changed.


## v1.6.8 native-control polish

- Replaced the remaining Android native select popups in create/edit flows with in-theme MindForge menus.
- Changed the local Shape Capture recommended type from a misleading editable native select to a styled read-only recommendation.
- Preserved existing save behavior, storage keys, workspace separation, import, backup/restore, and signing materials.

