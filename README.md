# Lens

A React Native document scanner app built with Expo. Scan documents using your phone camera, review pages, export to PDF, and share.

## Features

- 📷 Native document scanning with edge detection + perspective correction
- 📄 Multi-page scan support (up to 10 pages per session)
- 🗂️ Gallery to browse all scanned documents
- 📑 PDF export via `expo-print`
- 📤 Share PDFs via system share sheet
- 🗑️ Delete documents (clears PDF from disk)

## Tech stack

| Package | Purpose |
|---|---|
| `react-native-document-scanner-plugin` | Camera + edge detection + perspective correction |
| `expo-print` | Generate PDF from scanned images |
| `expo-sharing` | Share PDF via native share sheet |
| `expo-file-system` | Persist PDF files on device |
| `@react-native-async-storage/async-storage` | Store document metadata |
| `@react-navigation/native-stack` | Screen navigation |
| `react-native-webview` | In-app PDF preview |

## Project structure

```
src/
  screens/
    GalleryScreen.tsx    # Home screen — lists all scanned docs, FAB to start scan
    ReviewScreen.tsx     # Review scanned pages, name doc, remove pages, export
    PdfPreviewScreen.tsx # View PDF in-app, share button
  components/
    DocumentCard.tsx     # Thumbnail card used in gallery grid
  hooks/
    useScannedDocs.ts    # Load/save/delete doc metadata (AsyncStorage + FileSystem)
    usePdfExport.ts      # Build HTML → PDF, move to docs dir, share
  utils/
    theme.ts             # Color tokens, spacing, border radius
  types/
    index.ts             # ScannedDoc type, navigation param list
App.tsx                  # Navigation container + stack setup
app.json                 # Expo config with plugin + permissions
```

## Setup

### 1. Prerequisites

- Node 18+
- Expo CLI: `npm install -g eas-cli`
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
                            └─ [Export as PDF] → PDF file on disk
                                 └─ PdfPreviewScreen
                                      └─ [Share] or [Done → Gallery]
```

## Android permission note

You don't need to request camera permissions manually unless another plugin in your project adds `<uses-permission android:name="android.permission.CAMERA" />` to `AndroidManifest.xml`. If you get a "Permission Denial" error opening the camera, add this before your export call:

```tsx
import { Platform, PermissionsAndroid } from 'react-native';

if (Platform.OS === 'android') {
  await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
}
```

## iOS PDF preview note

On iOS, `react-native-webview` renders local `file://` PDFs directly. On Android, the WebView falls back to Google Docs viewer, which requires an internet connection. For a fully offline Android PDF viewer, consider `react-native-pdf` as an alternative.
