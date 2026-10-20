# Lens screen specifications

These specs cover the Gallery, Review, and Preview screens. Use the Stitch images as visual intent: `screen_1_gallery_*.png`, `screen_2_review_*.png`, and `screen_3_preview_*.png`. Keep the dark palette and clear page previews, while following the current design tokens and minimum type and touch-target sizes.

The mockups include prototype-only state switchers and a 10-page limit example. Do not build those controls or the limit. Keep the page cards, dark surfaces, fixed save/share actions, and confirmation dialog as visual references; apply the locked product decisions and the behavior below.

## Shared behavior

- Use the device safe areas. Every icon-only control has an accessibility label and a touch target of at least 44 dp.
- Use 16 px body text, 14 px secondary text, 12 px captions, and 11 px only for non-essential metadata.
- Show one visually dominant primary action per screen. Disable actions while their operation is in progress and expose busy/progress state to assistive technology.
- Use a shared button hierarchy: **primary** is accent-filled, has an icon and label, is 52 dp tall, has rounded corners and subtle elevation; **secondary/tonal** uses a raised-surface fill and has an icon and label; **destructive** uses the destructive colour with an icon and label. Button targets are at least 48 dp; other actionable targets are at least 44 dp.
- Use Ionicons `document-text-outline` for PDF, `images-outline` for images, and `share-outline` for sharing.
- Keep sheets, dialogs, and fixed action bars above top and bottom safe areas. On both 3-button navigation and gesture navigation, no content or action may overlap the system navigation bar or gesture area. Rename and confirmation dialogs adjust to the keyboard and scroll internally when needed so no field or button is hidden. Dismissible dialogs close on scrim tap or Back.
- Keep Review limited to naming and deleting scanned pages. Do not add editing tools.
- Exports are copied to shared storage automatically: PDFs to Downloads/Lens and images to Pictures/Lens on Android; friendly named exports are visible in Files on iOS.

## Gallery

**Primary action:** Scan document.

### Loading

- While the saved-document index loads, show the Gallery header and scan action, plus document-card skeletons.
- Do not show an empty state or a zero count until loading finishes.
- If loading fails, show a recoverable error with **Try again**. Do not present an empty gallery as if no documents exist.

### Empty

- With no documents and no active search, show the Lens mark, **No documents yet**, a short explanation, and the scan action.
- Keep the scan action available as the clear next step.

### Documents

- Show a two-column grid of document cards. Each card shows a page thumbnail, name, page count, and locale-formatted scan date. Long names use a single-line ellipsis.
- The card opens Preview. Its options control offers Rename and Delete; long press may open the same options.
- Show the total document count beside Search. When filtered, show the number of matching documents.

### Search

- Tapping Search opens a name field. Filter as the query changes, ignoring surrounding whitespace and matching case-insensitively.
- A clear control empties the query. Closing Search clears the query and restores all documents.
- If there are no matches, show **No results for “[query]”**, a brief suggestion, and **Clear search**. Keep the count at 0.

### Rename

- The rename dialog opens with the current name selected. Save is disabled for a blank/whitespace-only name or while saving.
- Save updates the card name and any future friendly-named export. Cancel closes without changes.
- On failure, keep the dialog and entered name open and show a recoverable error.

### Delete

- Ask for confirmation before removing a document from Lens.
- State plainly that copies already saved to Downloads or Pictures are not removed.
- While deleting, prevent duplicate submission. On success, remove the card. On failure, keep the card and show an error.

### Document options sheet

- Use a bottom sheet with a drag handle, document name, then icon rows **Rename** and **Delete**, in that order. Show Delete in the destructive colour.
- Each row is at least 48 dp tall and spans the sheet width. Do not show a Cancel button.
- Dismiss on scrim tap, Back/back gesture, or swipe down. Keep all content above the system navigation bar and gesture area on 3-button and gesture navigation; apply the bottom safe-area inset to the sheet.

### Scanner result / error

- If the scanner is cancelled or returns no pages, remain in Gallery without an error dialog.
- If it cannot open, show **Scanner unavailable** and tell the user to try again. Preserve the gallery state.

## Review

**Primary action:** Save as PDF. **Secondary action:** Save as images.

### Initial review

- Show an editable document name, the number of scanned pages, a vertical list of page previews, and fixed PDF/image actions.
- Show each save action as an icon button with a title and one-line caption. PDF uses `document-text-outline`, **Save as PDF**, and **One PDF file · Saved to Downloads/Lens** on Android (on iOS, say it is available in Files). Images uses `images-outline`, **Save as images**, and **One image per page · Saved to Pictures/Lens** on Android (on iOS, say it is available in Files). PDF is primary; images is secondary/tonal.
- A default name includes the date and time. The user can rename it before saving.
- Each page has a numbered badge and a remove action. Removing a page updates the count and numbering. The final remaining page cannot be removed; explain that a document needs at least one page.
- Do not impose a page limit or show a limit banner.

### Empty / invalid draft

- Review should only open with at least one scanned page. If no pages are supplied, show **No pages to save** and **Back to Gallery**; do not show enabled save actions.
- A blank name keeps the draft in Review and asks for a name before saving.

### Saving with progress

- When either format is being saved, disable both format buttons and page removal. Keep the entered name and pages visible.
- Show a determinate progress bar and “Saving PDF” or “Saving images” with completed pages / total pages when available. Before page work begins, show **Preparing PDF** or **Preparing images** with an activity indicator.
- On completion, open Preview for the saved document. If the private document is saved but its public copy fails, show the relevant warning before continuing.
- A private PDF/image creation failure is different from a public-copy failure. Keep the draft in Review and let the user retry; only show “Saved in Lens” when the requested private format was created and its public copy alone failed.

### Save error

- If saving the scan or requested export fails, remain in Review with the name and pages intact. Re-enable actions and show a concise error with a retry path.
- A failure to copy a public export must not be reported as a lost scan. Tell the user that the document remains in Lens and which shared-storage copy could not be made.
- Keep error content and actions within the dialog safe area; when the keyboard is open or space is limited, allow the message body to scroll while keeping actions reachable.

### Leaving Review

- If pages remain and the document has not been saved, Back, system Back, and swipe-back all ask whether to discard the scan.
- **Keep reviewing** returns to the draft. **Discard scan** returns to the previous screen and drops the unsaved scan.
- Once saving succeeds, do not show the discard prompt during navigation to Preview.

## Preview

The Preview bottom bar has exactly one primary action in each ready, busy, or error state. Each share call shares one file only. Tapping an image page remains a shortcut to share that page.

| Preview state | Single primary action | Secondary actions |
| --- | --- | --- |
| PDF only, ready | **Share PDF** (`share-outline`) | **Save as images** (`images-outline`) |
| Images only, ready | **Share page {number}** (`share-outline`) for the page currently on screen | **Save as PDF** (`document-text-outline`) |
| Both formats, PDF selected | **Share PDF** (`share-outline`) | PDF / Images selector; no save-format action |
| Both formats, Images selected | **Share page {number}** (`share-outline`) for the page currently on screen | PDF / Images selector; no save-format action |
| Saving a missing format | One disabled **Saving PDF…** or **Saving images…** progress action | Hide or disable other actions |
| Opening the share sheet | One disabled **Opening share sheet…** progress action | Hide or disable other actions |
| Retryable preview, save, or share error | **Try again** (`refresh-outline`) | Keep other available actions secondary |
| Document missing | **Back to Gallery** | None |

The Images-selected states always show the current page’s share action, including images-only documents. Sharing sends only that one image per call.

The mockup’s **Add another format** means “save the missing format” when one format exists. When both exist, replace it with the PDF / Images selector; it must never create another copy.

### Loading

- Show the document name and a loading indicator while the selected format opens. For a PDF, show page progress when the viewer reports it.
- Keep share and format actions disabled until the selected format is ready.
- Keep the bottom action area above the system navigation and gesture area. While the selected format loads, show one disabled primary progress action; do not leave another enabled primary action beside it.

### PDF only

- Show the PDF viewer, document name, page count, **Share PDF**, and **Save as images**. Bottom bar: **Share PDF** is the single primary action with the share icon; **Save as images** is secondary/tonal with the images icon.
- **Save as images** creates only the missing image format, copies it to shared storage, then switches the preview to images. Do not offer “Save as PDF” or start PDF generation again.

### Images only

- Show the image pages in a vertical viewer. Every page card has a visible share icon, and tapping the page remains a sharing shortcut. Both share only that page.
- Track the one-based page currently on screen as the user scrolls. Keep a visible **Share page {number}** bottom action with the share icon, including when the document has only images.
- Bottom bar: **Share page {number}** is the single primary action; **Save as PDF** is secondary/tonal with the PDF icon. After PDF creation succeeds, switch to PDF; do not regenerate images.

### PDF and images

- Show a two-option PDF / Images selector, initially on PDF. Changing the selected format changes only the preview.
- When PDF is selected, **Share PDF** is the single primary action. When Images is selected, show the current-page **Share page {number}** primary action and a visible share icon on every page card; tapping a page also shares it.
- Do not show a format-creation action because both formats already exist. Do not create another copy when the user changes the selected format.

### Exporting a missing format

- Show one disabled primary progress action, **Saving PDF…** or **Saving images…**, and hide or disable conflicting actions while the missing format is being created.
- On success, switch to the newly created format. On failure, keep the existing format usable and show a retryable error.
- If the private export exists but its public copy fails, retain the document and explain that the copy is missing from Downloads/Lens or Pictures/Lens.

### Share states

- Share PDF opens the native share sheet for the existing PDF. Share page opens it for the selected image only.
- While the share sheet is opening, show a busy label and prevent another share request. If sharing is unavailable or fails, keep the preview and offer a retry.
- While sharing, the single primary bottom-bar control becomes **Opening share sheet…** with a spinner and disabled state. On a retryable share error, show **Try again** as the only primary action in the error feedback; keep other available actions secondary.

### Preview / document errors

- If PDF preview fails, retain the document title and show **Preview unavailable**, a short error, and **Try again**. Sharing and format creation remain available when their source files are available.
- If a requested image cannot load, show a page-level unavailable placeholder; other pages remain usable.
- If the document record is missing, show **Document not found** and **Back to Gallery** without a transient flash during deletion.
- For a retryable PDF preview or save error, show one primary **Try again** action in the error feedback. Keep any other available action secondary, and keep the document title and error actions within safe areas.

### Delete

- The delete action asks for confirmation and says that copies already saved to Downloads or Pictures remain there.
- On success, return to Gallery. On failure, keep Preview open and show an error.
- Confirmation dialogs follow the shared safe-area and keyboard rules; no confirm or cancel button may be hidden by system bars or the keyboard.

## Differences from merged Mobile screens

These are the remaining specification gaps and Android device findings to resolve. The share and sheet changes below supersede the earlier tap-only image-sharing and Cancel-button decisions.

| Area | Current merged behavior | Specified behavior |
| --- | --- | --- |
| Gallery load failure | The store logs a load failure and returns an empty document list. | Show a recoverable load error and Try again; do not imply the Gallery is empty. |
| Gallery options sheet | On Android, the sheet is clipped by the system navigation area and Cancel cannot be tapped. | Use the safe-area-aware bottom sheet with drag handle, document name, and 48 dp icon rows Rename/Delete; omit Cancel and dismiss by scrim, Back gesture, or swipe down. |
| Images view sharing | There is no visible share control; users must discover that tapping a page shares it. | Keep tap-to-share as a shortcut, add a share icon to each page card, and show a bottom Share page {number} primary action for the current visible page in every Images view. Each share call sends one image. |
| Button hierarchy and safe areas | Action buttons look plain, and sheet/dialog controls can be obscured by system navigation or the keyboard. | Apply the icon-led primary/tonal/destructive hierarchy, 52 dp primary buttons, and safe-area/keyboard behavior for sheets, rename dialogs, and confirmation dialogs. Define exactly one primary Preview action in each ready, saving, sharing, and error state. |

