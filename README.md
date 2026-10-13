# Lens

A React Native document scanner app built with Expo. Scan documents using your phone camera, review pages, export to PDF, and share.

## Features

- 📷 Native document scanning with edge detection + perspective correction
- 📄 Multi-page scan support (up to 10 pages per session)
- 🗂️ Gallery to browse all scanned documents
- 📑 PDF export via `expo-print`
- 📤 Share PDFs via system share sheet
- 🗑️ Delete documents (removes the Lens record and its private source/PDF files)

## Tech stack

| Package                                     | Purpose                                          |
| ------------------------------------------- | ------------------------------------------------ |
| `react-native-document-scanner-plugin`      | Camera + edge detection + perspective correction |
| `expo-print`                                | Generate PDF from scanned images                 |
| `expo-sharing`                              | Share PDF via native share sheet                 |
| `expo-file-system`                          | Persist PDF files on device                      |
| `@react-native-async-storage/async-storage` | Store document metadata                          |
| `@react-navigation/native-stack`            | Screen navigation                                |
| `react-native-pdf`                          | In-app PDF preview                               |
| `zustand`                                   | Shared document index and loading/export state   |

## Project structure

```
src/
  screens/
    GalleryScreen.tsx    # Home screen — lists all scanned docs, FAB to start scan
    ReviewScreen.tsx     # Review scanned pages, name doc, remove pages, export
    PdfPreviewScreen.tsx # View PDF in-app, share button
  components/
    DocumentCard.tsx     # Thumbnail card used in gallery grid
  store/
    documentsStore.ts   # Load, create, rename, delete, and export documents
  services/
    documentExportService.ts # Persist source pages and generate PDF/image exports
    documentHtml.ts     # Build printable PDF HTML
  types/
    index.ts             # ScannedDoc type, navigation param list
App.tsx                  # Navigation container + stack setup
app.json                 # Expo config with plugin + permissions
```

## Setup

### 1. Prerequisites

- Node.js 20.19.x or newer
- EAS CLI: `npm install -g eas-cli` (for cloud builds)
- EAS account: `eas login`

### 2. Install

```bash
npm install
```

### 3. Configure EAS

```bash
eas build:configure
```

This creates `eas.json`. Make sure it has a `development` profile:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

### 4. Build dev client

> ⚠️ `react-native-document-scanner-plugin` requires a development build — it will NOT work in Expo Go.

```bash
# Android
eas build --profile development --platform android

# iOS (requires macOS)
eas build --profile development --platform ios
```

Install the resulting `.apk` / `.ipa` on your device.

### 5. Start dev server

```bash
npx expo start --dev-client
```

Scan the QR code with your development build.

## Flow

```
GalleryScreen
  └─ [+ FAB] → DocumentScanner.scanDocument()
                  └─ returns corrected image URIs
                       └─ ReviewScreen
                            └─ [Export as PDF / Save as Images]
                                 └─ PdfPreviewScreen
                                      └─ [Add another format / Share PDF]
                                           └─ Gallery
```

Scanned pages and PDFs are kept in app-private document storage so they remain
available for previews and later format exports. On Android, exports are also
copied to Downloads/Lens or Pictures/Lens. Deleting a Lens document removes its
private files; copies already exported to shared Android storage remain there.

## Android permission note

You don't need to request camera permissions manually unless another plugin in your project adds `<uses-permission android:name="android.permission.CAMERA" />` to `AndroidManifest.xml`. If you get a "Permission Denial" error opening the camera, add this before your export call:

```tsx
import { Platform, PermissionsAndroid } from "react-native";

if (Platform.OS === "android") {
  await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
}
```

## PDF preview

`react-native-pdf` previews the app-private PDF locally on iOS and Android.
