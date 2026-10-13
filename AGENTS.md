# Lens agent guide

## Project at a glance

Lens is a React Native document-scanning app built on Expo SDK 56. Users scan one or more pages, review and name them, save a PDF or image export, then browse, preview, share, rename, delete, or add the other export format later.

The main runtime path is:

```text
index.ts → App.tsx → GalleryScreen ──scan──→ ReviewScreen
                  │                              │
                  │                              └──save──→ documentsStore ──→ AsyncStorage
                  │                                             │
                  └──navigation─────────────────────────────────┤
                                                                ├──→ documentExportService ──→ documentHtml
PdfPreviewScreen ──lookup/action────────────────────────────────┘
```

`App.tsx` owns navigation and triggers the one initial document-index load. Screens own presentation and user interactions. `documentsStore` owns document metadata and coordinates persistence/export operations. `documentExportService` owns app-private files and platform export behavior. `documentHtml` builds the print HTML used for PDF generation.

## Source map and module relationships

### Entrypoints and app shell

- `index.ts` registers `App` with Expo via `registerRootComponent`.
- `App.tsx` creates the native-stack navigator, wraps it in `SafeAreaProvider` and `NavigationContainer`, applies the background/transition options, and calls the store's `load()` once at startup. Keep the startup load centralized here; screens subscribe to the shared store.
- Navigation currently has `Gallery`, `Review`, and `PdfPreview` routes. The route parameter types live in `src/types/index.ts`.

### Screens

- `src/screens/GalleryScreen.tsx` is the home screen. It launches `react-native-document-scanner-plugin`, sends scanned image URIs to `Review`, subscribes to stored documents, and handles opening, renaming, and deleting a document.
- `src/screens/ReviewScreen.tsx` receives scanned image URIs, lets the user remove pages and set a name, and calls `createDocument` with either PDF or image export selected. Successful saves navigate to PDF preview by document ID.
- `src/screens/PdfPreviewScreen.tsx` looks up the document by ID in the store. It previews the PDF when present, otherwise displays saved image pages; it also shares a PDF and can generate whichever export format is missing.

### Reusable UI

- `src/components/DocumentCard.tsx` renders a document thumbnail, page count, name, date, and options affordance for the gallery. It receives its document and callbacks through props; it does not own persistence.

### State and data types

- `src/store/documentsStore.ts` defines the Zustand store and uses AsyncStorage key `lens_docs` for the document metadata index. It loads and validates persisted records, creates/renames/deletes records, coordinates PDF/image re-exports, serializes index writes, and exposes loading/exporting state.
- `src/types/index.ts` defines `ScannedDoc`, `ExportMode`, and `RootStackParamList`. A document's durable source page URIs are the basis for its thumbnail and future exports; PDF and image exports are optional fields.
- The store calls `documentExportService` for file work. Keep screen components from duplicating the storage/index logic.

### File and export services

- `src/services/documentExportService.ts` persists scan pages under app-private document storage (`scans/<document-id>/source`), generates PDFs, returns source pages for image exports, handles Android MediaStore publication, and removes the app-private files associated with a document.
- `src/services/documentHtml.ts` is a pure string builder for the HTML passed to `expo-print`. It escapes HTML-sensitive values and lays each scanned page out as a page in the generated PDF.
- The app's canonical preview/source files are private copies. Android additionally publishes exports to the public Downloads or Pictures MediaStore collections. Deleting a Lens record removes its private source/PDF files; already-published Android copies are outside the app's private cleanup.

### Configuration and styling

- `app.json` contains app identity, platform configuration, iOS usage/file-sharing settings, web favicon, EAS project ID, and the document-scanner config plugin and camera permission description.
- `package.json` is authoritative for declared dependencies and scripts. The current stack includes Expo SDK 56, React Native 0.85, React 19, React Navigation native stack, Zustand, AsyncStorage, NativeWind, scanner/PDF packages, and Expo file/print/sharing packages.
- `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`, and `nativewind-env.d.ts` configure NativeWind and styling. Use the existing styling system and theme tokens when changing UI.
- `tsconfig.json` configures TypeScript. `eas.json` contains EAS build profiles. `assets/` contains app artwork and web favicon assets.
- `README.md` describes setup and product behavior; use source and config as the authority if it conflicts with implementation. `CLAUDE.md` delegates to this file.

## Working agreements for agents

1. **Read the exact Expo docs before changing code.** This repository requires the versioned SDK 56 docs: <https://docs.expo.dev/versions/v56.0.0/>. Check the relevant SDK 56 API page for Expo packages and configuration plugins; do not assume unversioned/latest docs match this project's installed SDK. The SDK 56 reference targets React Native 0.85, React 19.2.3, and Node.js 20.19.x minimum.
2. **Keep version alignment in mind.** `package.json` and `package-lock.json` describe installed versions. For Expo SDK package additions or version changes, consult SDK 56 docs and use Expo's compatible install flow (`npx expo install`) where applicable, then keep the lockfile in sync.
3. **Preserve module boundaries.** Put screen interaction/presentation in screens, reusable cards in components, document-index operations in the Zustand store, platform/file/export operations in the export service, and PDF markup generation in the pure HTML service. Update `src/types/index.ts` when changing document fields or navigation parameters.
4. **Preserve document durability.** Exports are derived from persisted private source pages, allowing the missing format to be generated later without rescanning. When changing creation, re-export, or deletion, consider interrupted saves, old records, missing source files, Android shared copies, and the preview's dependence on private URIs.
5. **Keep navigation data small and consistent.** `PdfPreview` takes a document ID and resolves full data from the store. `Review` takes the scan URI array. Update route declarations and all call sites together when changing these contracts.
6. **Use existing UI conventions.** Screens use React Native components, NativeWind `className` styling, theme colors from `tailwind.config.js`, safe-area wrappers, accessible labels/roles, and visible handling for loading/error/empty states. Follow the patterns in adjacent screens/components.
7. **Check platform behavior for native features.** The scanner, PDF preview, file sharing, filesystem, and Android MediaStore paths rely on native modules. Verify behavior on the affected platform(s); the scanner plugin requires a development build according to the project setup, so Expo Go alone is not sufficient to validate scanning.
8. **Use existing project commands.** `npm start`, `npm run android`, `npm run ios`, and `npm run web` are declared in `package.json`. Native modules and device APIs may not be represented by web behavior. There is no test script currently declared; do not assume a test suite exists.
9. **Keep documentation aligned with reality.** When changing a flow, persisted format, setup requirement, or platform behavior, update the relevant source comments and README as part of the change. Treat source/config as current truth and flag documentation inconsistencies rather than copying them forward.

## Change checklist

Before completing a code change, check the relevant points:

- Did the change affect route parameters, document metadata, or persisted records? Update the types, store validation, and all consumers together.
- Does the change alter source page, PDF, or image file lifecycle? Check creation, re-export, preview/share, failure cleanup, deletion, and Android publication.
- Does it rely on Expo or native package behavior? Verify against the SDK 56 versioned docs and the target platform.
- Does it alter NativeWind configuration or styling tokens? Check the Babel/Metro/Tailwind/CSS setup as a connected configuration.
- Are setup and user-facing behavior descriptions still accurate?

