# Lens agent guide

Lens is a React Native document scanner built on Expo. The user scans pages with the phone camera, names the document, exports it as a PDF and/or images, shares it, and finds it again in a gallery.

Read this file first. The work plan is in `docs/PLAN.md`. If you were started as a specific role, your brief is in `docs/agents/`.

## Locked product decisions

These were decided by the project owner. Do not reopen them, and do not build features that contradict them. If you think one is wrong, say so in your report and carry on.

1. **Scope.** Gallery → native scanner → Review (name the document, delete pages) → export PDF or images → Preview and share. Nothing else is in scope.
2. **No page limit.** Remove the 10-page cap everywhere (scanner call, banner, "x / 10" badge). The PDF pipeline must be safe for large scans first (see `docs/PLAN.md`, E-1 and M-2).
3. **No editing tools in Review.** No reorder, rotate, retake, crop, filters or add-page. The native scanner (ML Kit on Android, VisionKit on iOS) already does crop, rotate and retake. Review only lets the user rename and delete pages.
4. **Exports are public by default.** Every export is copied to shared storage automatically so other apps can see it: Android `Downloads/Lens` (PDF) and `Pictures/Lens` (images), iOS via the Files app. There is no privacy setting, no opt-in, no "save to device" step. Keep this working and make it robust: a failed copy must never lose the scan.
5. **The production EAS profile builds an APK on purpose.** Do not change it to AAB.
6. **Scanner library stays.** `react-native-document-scanner-plugin` stays, wrapped behind a `ScannerService`. The app stays on Expo SDK 56 unless the Phase 0 spike proves SDK 57 works (see `docs/PLAN.md`, P0-2).
7. **Dark theme only.** `userInterfaceStyle` stays `dark`.
8. **Keep `react-native-reanimated` and `react-native-worklets`.** They look unused, but NativeWind's `react-native-css-interop` requires Reanimated at runtime. Do not remove them.

## Project at a glance

```text
index.ts → App.tsx → GalleryScreen ──scan──→ ReviewScreen
                  │                              │
                  │                              └──save──→ documentsStore ──→ AsyncStorage
                  │                                             │
                  └──navigation─────────────────────────────────┤
                                                                ├──→ documentExportService
PdfPreviewScreen ──lookup/action────────────────────────────────┘
```

`App.tsx` owns navigation and triggers the one initial document-index load. Screens own presentation and interaction. `documentsStore` owns document metadata and coordinates persistence and export. `documentExportService` owns app-private files and platform export behaviour. Planned: `scannerService` wraps the scanner plugin; `src/theme/` holds the design tokens.

## Source map

- `index.ts`, `App.tsx`: entry and navigation (`Gallery`, `Review`, `PdfPreview`). Route param types live in `src/types/index.ts`.
- `src/screens/GalleryScreen.tsx`: home. Launches the scanner, lists documents, search, rename, delete.
- `src/screens/ReviewScreen.tsx`: receives scanned image URIs; name, delete pages, export as PDF or images.
- `src/screens/PdfPreviewScreen.tsx`: looks up a document by ID; previews the PDF or image pages; shares; creates the missing format.
- `src/components/DocumentCard.tsx`: gallery card. Props only; no persistence.
- `src/store/documentsStore.ts`: Zustand store. AsyncStorage key `lens_docs`. Create, rename, delete, re-export, validation, serialised index writes.
- `src/services/documentExportService.ts`: private source pages (`scans/<id>/source`), PDF generation, Android MediaStore publishing, deletion of private files.
- `src/services/documentHtml.ts`: print HTML for the current PDF pipeline. Scheduled for replacement (E-1).
- `src/types/index.ts`: `ScannedDoc`, `ExportMode`, `RootStackParamList`.
- `app.json`, `eas.json`, `package.json`: config. `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`: NativeWind setup, one connected configuration.
- `assets/`: icons and splash. `stitch mockup/`: the owner's original design mockups; treat as intent, not as pixel spec.

## Working agreements

1. **Read the versioned Expo docs for the installed SDK** before changing code (currently SDK 56: <https://docs.expo.dev/versions/v56.0.0/>). If the Phase 0 spike upgrades the SDK, use that version's docs. Never rely on unversioned "latest" docs. Never assume an API from memory; check it.
2. **Dependencies.** Use `npx expo install` for Expo-managed packages so versions stay aligned, and keep `package-lock.json` in sync. Do not add a dependency without stating in your PR why nothing existing will do.
3. **Module boundaries.** Interaction and presentation in screens; reusable UI in components; document-index operations in the store; file, platform and export work in services; tokens in `src/theme/`. Update `src/types/index.ts` when document fields or route params change.
4. **Durability.** Exports are derived from persisted private source pages. When touching creation, export or deletion, consider interrupted saves, old persisted records (keep them loading), missing files, and the public copies.
5. **Navigation params stay small.** `PdfPreview` takes a document ID. `Review` takes the scanned URI array.
6. **UI conventions.** React Native components, NativeWind `className`, tokens from `src/theme/`, safe-area wrappers, accessibility roles and labels, visible loading, error and empty states. Do not use NativeWind classes that do nothing on native (`hover:`, `backdrop-blur-*`, `truncate`).
7. **Native behaviour must be verified on a device or emulator.** The scanner, PDF preview, sharing, file system and MediaStore are native. Expo Go cannot run the scanner. If you cannot verify on a device, say so explicitly; do not claim it works.
8. **Commands.** `npm run typecheck`, `npm test`, `npm run lint` once added (Q-1). Until then `npx tsc --noEmit` must pass before every commit.
9. **Docs match reality.** Update the README and this file when you change a flow, a persisted format, or a setup step. If source and docs disagree, source wins; fix the docs.

## How agents collaborate

- Work in phases (see `docs/PLAN.md`). Do not start a task whose dependencies are not merged.
- Stay inside the files your role owns. If you need a change elsewhere, write it in your report as a request. Do not edit it yourself.
- One branch per task: `agent/<role>/<task-id>`. Small commits, imperative messages, one task per PR.
- End every task with a short report: what changed, what you verified and how, what you could not verify, and any decision you need from the owner.

## Change checklist

Before finishing a change:

- Did route params, document fields or persisted records change? Update types, store validation and all consumers, and make sure documents saved by older builds still load.
- Did the file lifecycle change (source pages, PDF, images, public copies)? Check creation, re-export, preview, share, failure cleanup, deletion, and Android publication.
- Did you rely on an Expo or native API? Confirm it against the docs for the installed SDK.
- Did you touch tokens or NativeWind config? Check Babel, Metro, Tailwind and `global.css` as one system.
- Are the README and this file still accurate?

## Definition of done (whole project)

- Scan, name, export as PDF and as images, share both, and reopen later, on a real Android phone (and iOS if available).
- A 30-page scan exports without a crash, and the PDF is a reasonable size.
- A document with a non-English name (for example Tamil) exports with that name intact.
- Exporting twice does not create duplicate files in Downloads or Pictures. A failed copy to shared storage never deletes the scan.
- One logo and one colour palette everywhere: launcher icon, splash, in-app header.
- `typecheck`, `lint` and tests pass in CI.
