# Lens work plan

Source of truth for scope: the "Locked product decisions" in `AGENTS.md`. This plan covers bug fixes, robustness and polish within that scope. Nothing here adds features.

Findings come from a read-through of the code at commit `8d4e0c5`, plus `tsc --noEmit` (clean) and `expo-doctor`. Items marked **(verify)** could not be confirmed without a device.

## Phases and order

| Phase | Goal | Roles | Can run in parallel |
| --- | --- | --- | --- |
| 0 | Settle the platform: baseline hygiene and the SDK 57 spike | QA/Release | No. Everything waits for it. |
| 1 | Foundations: brand and tokens, export engine, UX specs | Brand, Export, UX | Yes. File sets do not overlap. |
| 2 | Screens and flows built on the Phase 1 output | Mobile | No. One owner for all screens. |
| 3 | Tests, CI, cleanup, device pass, acceptance | QA/Release, UX, PM | Partly. |

Why Phase 0 comes first: if SDK 57 is adopted, upgrading later would churn every dependency the other phases touch.

## File ownership

| Role | Owns | Must not edit |
| --- | --- | --- |
| QA/Release | `package.json`, `package-lock.json`, `eas.json`, `app.json` (non-brand fields), `.github/`, `jest.config.*`, `**/__tests__/` | screens, services logic |
| Brand | `assets/`, `src/theme/`, `tailwind.config.js`, `global.css`, brand fields of `app.json` (`icon`, `splash`, adaptive icon, splash plugin) | screens, store, services |
| Export | `src/services/`, `src/store/`, `src/types/index.ts` | screens, theme |
| Mobile | `src/screens/`, `src/components/`, `App.tsx` | services internals, theme tokens |
| UX | `docs/design/` | all code |
| PM | `docs/PLAN.md`, `docs/agents/`, `README.md` | all code |

Two roles must never edit `app.json` at the same time. Brand edits it in Phase 1, QA/Release in Phases 0 and 3.

## Decisions needing owner confirmation (defaults given)

- **D-1 PDF page size.** Default: each PDF page has the same aspect ratio as its scanned image, 595 pt wide (A4 width), no white borders. Alternative: fixed A4 with margins.
- **D-2 PDF image quality.** Default: long edge capped at 3508 px (A4 at 300 dpi), JPEG quality 0.9, one setting with no UI. Image export keeps the original scanner files untouched.
- **D-3 Accent colour.** Default: keep the UI indigo `#6366F1` and use it in the icon, replacing the icon's current blue `#2563EB`.
- **D-4 Sharing images.** Default: share one page at a time from the image viewer. Multi-file sharing needs a new dependency and is not worth it when the public copies already exist in Pictures/Lens.

---

## Phase 0: platform (QA/Release)

### P0-1 Baseline hygiene
- Add `"typecheck": "tsc --noEmit"` to `package.json` scripts.
- Remove the `web` script and the `web.favicon` entry. There is no `react-native-web` or `react-dom`, so the script cannot work.
- Do not remove `react-native-reanimated` or `react-native-worklets` (see AGENTS.md decision 8).
- **Done when:** `npm run typecheck` passes.

### P0-2 SDK 57 spike
Background: `expo-doctor` on SDK 56 reports a Hermes V1 memory regression, fixed in React Native 0.86.2+ (that is, Expo SDK 57, `expo@57.0.9` or later). The scanner plugin declares `react-native: "*"` as a peer dependency and is already a TurboModule, so it may well work on 57, but nobody has confirmed it. Expo SDK 57 requires Node 22.13 or newer.

Steps, on a throwaway branch `spike/sdk-57`:
1. Upgrade with `npx expo install expo@^57 --fix` (use Node 22.13+).
2. Build a development client for Android.
3. Run the checks below.

**Pass criteria (all required):**
- `npx tsc --noEmit` clean, and `npx expo-doctor` shows no failures other than ones caused by having no network.
- Scanner opens and returns file paths for a 3-page scan.
- PDF export, in-app preview and share work.
- Image export lands in `Pictures/Lens`.
- NativeWind styling renders as on SDK 56.
- A 30-page scan completes with no crash. Note that Reanimated plus Hermes V1 has a reported 25–30% Android memory increase on 57 with a worklets-bundle-mode workaround; record memory behaviour and whether the workaround is needed.

**Outcome:** pass → merge the upgrade to main and update `AGENTS.md` SDK references. Fail → record the exact error in this file under "Spike result" and stay on SDK 56. Either way, report.

**Spike result:** _not run yet._

---

## Phase 1A: brand and tokens (Brand)

### B-1 One logo mark
Today there are four different marks: a camera-aperture launcher icon, a stock Material "document-scanner" glyph in the Gallery header, a camera on the FAB, and a different mark in the Stitch mockup. An aperture also reads as "camera app", not "document scanner".
- Design one mark that says *scanned document*: for example a page with a folded corner inside scan-corner brackets. Deliver the source as SVG in `assets/brand/` plus a short rationale (`assets/brand/README.md`) covering at least two rejected alternatives.
- Use the accent from D-3.

### B-2 Launcher and splash assets
Current problems: `splash-icon.png` is still the Expo template placeholder (concentric circles on a grid) and `app.json` does not appear to configure a splash **(verify against the SDK docs)**; the Android adaptive foreground is 487×446 (not square) with the glyph filling only about 230 px; the adaptive background is a 1-bit PNG.
- `icon.png`: 1024×1024, opaque (no alpha), mark centred.
- Android adaptive icon: 1024×1024 transparent foreground with the mark inside the safe zone (a 66 dp circle within the 108 dp canvas, about 61% of the width, roughly 626 px at 1024). Use `backgroundColor` instead of a background image. Monochrome layer: single-colour silhouette on transparency.
- Splash: real splash with the mark on the app background `#111317`. Configure it the way the installed SDK's docs describe. Confirm there is no white flash on cold start.
- **Done when:** assets render correctly in an Android launcher in round, squircle and themed-icon modes, and on a cold start.

### B-3 Mark inside the app
- Provide the mark as a component (`src/theme/LogoMark.tsx`, using `react-native-svg` via `npx expo install` if needed) or as a PNG, and use it in the Gallery header and empty state, replacing the stock glyph. Coordinate the call-site change with the Mobile role through your report.
- Choose one scan-themed icon for the FAB and document the choice.

### B-4 Single token source
Problems: `tailwind.config.js` has duplicated tokens (`bg` = `surface`; `accent` = `primary`; `border` = `outlineVariant`; `secondary` = `onSurfaceVariant`; `surface-alt` = `surfaceContainer`), mixed naming styles, and components hard-code hexes (`#0F1115`, `#161920`, `#FAFAFA`, `#E2E2E6`, `#111317/95`). Every screen also imports `tailwind.config` at runtime just to read colours, which pulls the whole Tailwind config into the app bundle.
- Create `src/theme/colors.js` (plain CommonJS, so Tailwind running in Node can load it) with `src/theme/colors.d.ts` for types. Tailwind config imports it. Screens import from it, not from `tailwind.config`.
- One name per colour, consistent casing, a small semantic set (background, surface levels, outline, text, text-muted, primary, destructive, warning).
- Provide a replacement table (old token or hex → new token) in your report so Mobile can migrate call sites.
- Check contrast: `muted` (`#6B7280`) and `onSurfaceVariant/60` on `#111317` fail WCAG AA for body text; fix or restrict to non-essential use.

### B-5 Typography
The Stitch mockups use Inter, but no font is loaded, so the app renders Roboto or SF. `font-mono` has no native fallback. Text goes as small as 7–11 px.
- Load Inter (for example `@expo-google-fonts/inter` with `expo-font`, or bundled files) and wire it into Tailwind `fontFamily`. Hold the splash until fonts are ready.
- Define a type scale. Body text at least 14, secondary at least 12, captions never below 11. Replace `font-mono` with a bundled mono font or remove it.
- Document the scale in `src/theme/README.md`.

---

## Phase 1B: export engine (Export)

Current design, for context: pages are copied once to `scans/<id>/source`; the PDF is built by base64-encoding every page into one HTML string and calling `expo-print`; on Android the results are copied to MediaStore.

### E-1 Replace the PDF pipeline
Problem: all pages as base64 in one HTML string means memory use grows with page count (a 30–40 page scan of multi-megabyte photos is the failure case), and `expo-print` page size and `100vh` layout behave differently on iOS and Android. You have no control over PDF size or page dimensions.
- Replace `documentHtml.ts` and `Print.printToFileAsync` with a direct PDF writer. Candidate: `pdf-lib` (embed JPEG, page size from D-1). Fallback to evaluate if `pdf-lib` is too heavy under Hermes: `react-native-images-to-pdf` (compatibility with the installed SDK not verified).
- Process pages one at a time. Never hold all pages in memory at once.
- Scanner output is JPEG. If a page is not JPEG, convert it first.
- **Done when:** a 30-page scan exports on a mid-range Android phone with no crash; the PDF opens in the in-app preview and an external viewer; page dimensions match D-1 on both platforms. Record peak memory before and after.

### E-2 Downscale pages for the PDF (D-2)
- Use `expo-image-manipulator` (check the SDK docs for the current API) to cap the long edge and set JPEG quality for PDF pages only. Constants live in `src/services/exportConfig.ts`.
- Image export stays untouched originals.
- **Done when:** a typical 10-page scan produces a noticeably smaller PDF with text still sharp at 100% zoom. Report before and after sizes.

### E-3 Real thumbnails
Today `thumbUri` points at the full-size original, so the gallery grid decodes full photos.
- Generate a thumbnail (about 480 px long edge) at save time, stored under the document's private directory.
- Documents saved by older builds still load. Generate their thumbnails lazily in the background after load, without blocking the UI. Keep `isScannedDoc` accepting old records.

### E-4 File names
`safeFileName` replaces every non-ASCII character, so a Tamil or Hindi name becomes `scan`, and two such documents collide. Default names (`Scan YYYY-MM-DD`) also collide within a day.
- Keep Unicode letters and digits. Remove only characters illegal on Android and iOS file systems (`/ \ : * ? " < > |`, control characters), collapse whitespace, cap length.
- Ensure uniqueness when publishing (append a counter).
- Provide a helper for the default document name that includes the time (no colons), for Mobile to use in Review.
- Pure function in its own module with unit tests.

### E-5 Robust public copies (AGENTS.md decision 4)
Problems: the Android MediaStore copy happens inside `createDocument`; if it throws, the catch block deletes the entire document, including the PDF that was generated successfully. Re-exports copy again, which likely creates duplicates in Downloads/Pictures **(verify)**.
- A failed public copy is non-fatal. The document is saved. `createDocument` returns the document plus a warning the UI can show, for example "Saved in Lens, but couldn't copy to Downloads."
- Record what was published (add an optional `publishedUris` field to `ScannedDoc`; update validation) so Lens never publishes the same file twice.
- Re-export creates only the format that is missing. Never republish an existing one. Remove the "export PDF again" path.
- Check older Android versions (9 and below) for storage-permission needs; report whether it matters for the app's minimum SDK.

### E-6 iOS visibility
`UIFileSharingEnabled` makes everything in the Documents directory visible in the Files app, but what the user would see today are internal names (`scans/<id>/source/page-001.jpg`, `<id>.pdf`).
- Keep internals out of the user-visible location where the SDK allows, and put friendly-named exports where Files shows them (for example `Lens/<name>.pdf`). Check the installed SDK's file system docs for what each `Paths.*` location means.
- Existing documents must keep working. If internals move, write a migration that runs once.
- **(verify)** on an iOS device or simulator. If you have no iOS environment, deliver the change and flag it clearly as unverified.

### E-7 Sharing images
- Add what the screens need to share a single image page (see D-4). `expo-sharing` shares one file per call; confirm in the SDK docs.
- Expose it through the service so screens stay free of file logic.

### E-8 Progress and orphan cleanup
- `generatePdf` and image export accept an `onProgress(done, total)` callback. The store exposes it as state so Review can show real progress (today the bar is a fixed `w-3/4`).
- On startup, before any export, remove directories under `scans/` that have no matching record in the index (left by interrupted saves). Never remove a directory belonging to an export in progress.

### E-9 Validation module
- Move `isScannedDoc` out of the store into `src/store/validation.ts` so it can be tested.

---

## Phase 1C: UX specs (UX)

### U-1 Screen specs
For Gallery, Review and Preview, specify every state: loading, empty, no search results, error, saving with progress, PDF only, images only, both formats. Use `stitch mockup/` as intent. Put specs in `docs/design/screens.md`.
- Note that the mockup's "Add another format" button differs from the code's current labels; decide and spec one behaviour.

### U-2 Copy deck
One document, `docs/design/copy.md`, with every user-facing string: buttons, dialogs, empty states, errors, the "saved in Lens but not copied" warning. Use one verb per action (the code mixes "Export", "Save", "Create").

### U-3 Spec review (Phase 3)
Review the built screens against U-1 and U-2 on a device. Produce a list of deviations ranked by user impact.

---

## Phase 2: screens and flows (Mobile)

Depends on: B-4 (tokens), E-1 to E-8 as noted.

### M-1 Gallery search
Closing the search bar leaves the filter active, so documents look missing. A search with no results shows "No documents yet".
- Closing search clears the query. Distinguish "no documents yet" from "no results for 'x'". The count badge reflects the filter.

### M-2 Remove the page limit (depends on E-1, E-2)
- Remove `maxNumDocuments` from the scanner call, the `isAtLimit` banner and the "n / 10" badge in Review. The badge becomes a page count.
- **Done when:** a 30-page scan reaches Review and exports.

### M-3 ScannerService
- Create `src/services/scannerService.ts` wrapping `react-native-document-scanner-plugin`: handle the cancel status, normalise paths to `file://` URIs, and turn errors into one typed error. Screens call only this wrapper. This is what makes the library swappable later.
- Note: the plugin uses Google ML Kit on Android, which needs Google Play Services. Show a clear message when the scanner is unavailable.

### M-4 Review screen
- Back (header button, Android hardware back, iOS swipe) asks for confirmation when pages exist. Use `usePreventRemove` from React Navigation.
- Key list items by URI, not index.
- Real export progress from E-8; no fake bar.
- Default name from the E-4 helper. Disable both export buttons while saving.
- Show the E-5 warning if the public copy failed.
- No editing tools. Do not add any.

### M-5 Preview screen
- When both formats exist, a PDF / Images toggle. Share PDF stays the primary action; images: tap a page to share it (E-7).
- Button labels and states per U-1 and U-2. Remove "Export PDF again".
- Delete: no "Document not found" flash. Navigate away before the record disappears, or guard the render.

### M-6 Shared components
- `Button` (primary, secondary, destructive; loading and disabled states), `ConfirmDialog`, `RenameDialog`, `DocumentActionsSheet`, `PageCard` (used by Review and Preview).
- Replace the duplicated delete dialog (Gallery and Preview) and the `Alert`-as-action-sheet in Gallery.

### M-7 Dates
- Use the device locale (`toLocaleDateString(undefined, …)`) and include the year when it is not the current year.

### M-8 Polish pass
- Replace tokens and hard-coded hexes using the B-4 table. Apply the B-5 type scale.
- Remove NativeWind classes that do nothing on native (`hover:`, `backdrop-blur-sm`, `truncate`). Use `elevation` for Android shadows.
- Touch targets at least 44 dp (the card menu button is about 28 dp plus hit slop).
- Accessibility: `accessibilityState` for disabled and busy, labels on icon-only buttons, check large font sizes.
- Use the logo from B-3 and the FAB icon from B-3.

---

## Phase 3: tests, release hygiene, acceptance

### Q-1 Tooling
- Scripts: `typecheck`, `lint` (Expo's ESLint config), `format` (Prettier), `test` (`jest-expo`; install with `npx expo install`).

### Q-2 Unit tests
- File-name helper (Unicode, illegal characters, length, uniqueness), `isScannedDoc` (old and new records), date formatting, store behaviour with a mocked export service (create success, publish failure keeps the document, delete, rename, orphan cleanup).

### Q-3 CI
- GitHub Actions on push and PR: install, typecheck, lint, test. Use the Node version required by the installed SDK.

### Q-4 Config cleanup
- `app.json`: add `ios.bundleIdentifier` (`com.aniruth.lens`); remove `NSPhotoLibraryUsageDescription` unless something in the app actually uses the photo library.
- `eas.json`: leave the production APK build as is. If the `//` comments cause any EAS CLI parse warning, remove them; otherwise leave it.
- README: remove the web claims, add the new flow and the sharing behaviour. Keep `AGENTS.md` consistent.

### Q-5 Device checklist
Run on a real Android phone (and iOS if available) and report results in `docs/QA.md`:
1. First launch: splash shows the mark, no white flash.
2. Scan 1 page, name it, export PDF. Share it. Find it in Downloads/Lens.
3. Scan 3 pages, export as images. Find them in Pictures/Lens. Share one.
4. Scan 30 pages, export PDF. No crash; file size reasonable.
5. Name a document in Tamil. File name preserved in Downloads.
6. Export the same document in both formats. No duplicates in shared storage.
7. Turn on airplane mode; everything still works.
8. Kill the app during a save; reopen. No broken gallery card, no leftover files (E-8).
9. Back out of Review with pages: confirmation shown.
10. Search, close search: all documents visible again.
11. Delete a document: it disappears; the dialog says public copies remain.
12. Install the new build over a build from before this work: old documents still open.

### Q-6 Acceptance (PM)
- Walk the "Definition of done" in `AGENTS.md`, mark each item pass or fail with evidence, and list anything deferred.
