# Lens screen specifications

These specs cover the Gallery, Review, and Preview screens. Use the Stitch images as visual intent: `screen_1_gallery_*.png`, `screen_2_review_*.png`, and `screen_3_preview_*.png`. Keep the dark palette and clear page previews, while following the current design tokens and minimum type and touch-target sizes.

The mockups include prototype-only state switchers and a 10-page limit example. Do not build those controls or the limit. Keep the page cards, dark surfaces, fixed save/share actions, and confirmation dialog as visual references; apply the locked product decisions and the behavior below.

## Shared behavior

- Use the device safe areas. Every icon-only control has an accessibility label and a touch target of at least 44 dp.
- Use 16 px body text, 14 px secondary text, 12 px captions, and 11 px only for non-essential metadata.
- Show one visually dominant primary action per screen. Disable actions while their operation is in progress and expose busy/progress state to assistive technology.
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

### Scanner result / error

- If the scanner is cancelled or returns no pages, remain in Gallery without an error dialog.
- If it cannot open, show **Scanner unavailable** and tell the user to try again. Preserve the gallery state.

## Review

**Primary action:** Save as PDF. **Secondary action:** Save as images.

### Initial review

- Show an editable document name, the number of scanned pages, a vertical list of page previews, and fixed PDF/image actions.
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

### Leaving Review

- If pages remain and the document has not been saved, Back, system Back, and swipe-back all ask whether to discard the scan.
- **Keep reviewing** returns to the draft. **Discard scan** returns to the previous screen and drops the unsaved scan.
- Once saving succeeds, do not show the discard prompt during navigation to Preview.

## Preview

**Primary action:** Share PDF when a PDF exists; otherwise Save as PDF. Image pages can also be tapped to share that page.

The mockup’s **Add another format** means “save the missing format” when one format exists. When both exist, replace it with the PDF / Images selector; it must never create another copy.

### Loading

- Show the document name and a loading indicator while the selected format opens. For a PDF, show page progress when the viewer reports it.
- Keep share and format actions disabled until the selected format is ready.

### PDF only

- Show the PDF viewer, document name, page count, **Share PDF**, and **Save as images**.
- **Save as images** creates only the missing image format, copies it to shared storage, then switches the preview to images. Do not offer “Save as PDF” or start PDF generation again.

### Images only

- Show the image pages in a vertical viewer. Tapping a page shares that single page.
- Show **Save as PDF** as the primary action. After it succeeds, switch to the PDF viewer; do not regenerate images. Tapping a page shares that page.

### PDF and images

- Show a two-option PDF / Images selector, initially on PDF. Changing the selected format changes only the preview.
- Keep **Share PDF** as the primary action while PDF is selected. When Images is selected, each page is a **Share page** action.
- Do not show a format-creation action because both formats already exist. Do not create another copy when the user changes the selected format.

### Exporting a missing format

- Show progress and disable conflicting actions while the missing format is being created.
- On success, switch to the newly created format. On failure, keep the existing format usable and show a retryable error.
- If the private export exists but its public copy fails, retain the document and explain that the copy is missing from Downloads/Lens or Pictures/Lens.

### Share states

- Share PDF opens the native share sheet for the existing PDF. Share page opens it for the selected image only.
- While the share sheet is opening, show a busy label and prevent another share request. If sharing is unavailable or fails, keep the preview and offer a retry.

### Preview / document errors

- If PDF preview fails, retain the document title and show **Preview unavailable**, a short error, and **Try again**. Sharing and format creation remain available when their source files are available.
- If a requested image cannot load, show a page-level unavailable placeholder; other pages remain usable.
- If the document record is missing, show **Document not found** and **Back to Gallery** without a transient flash during deletion.

### Delete

- The delete action asks for confirmation and says that copies already saved to Downloads or Pictures remain there.
- On success, return to Gallery. On failure, keep Preview open and show an error.

## Differences from merged Mobile screens

These are specification gaps observed in the current Gallery, Review, and Preview implementations, including the merged M-1, M-4, M-5, and M-7 work. M-2 (removing the page limit) and M-6 (shared components) are separate planned tasks.

| Area | Current merged behavior | Specified behavior |
| --- | --- | --- |
| Gallery load failure | `load` failure is logged and becomes an empty document list. | Show a recoverable load error and retry; never imply the Gallery is genuinely empty. |
| Gallery count | Loading appears as “Loading...” in the count badge; the count uses “doc/docs” and filtered results do not show the total. | Keep loading in the loading state; spell out “document(s)” and show matching/total counts while filtered. |
| Gallery option and error flows | Options use a native Alert; rename/delete failures use Alerts. The delete confirmation itself correctly says public copies remain. | Use the shared accessible dialog/sheet patterns from M-6, with a clear retry path and 44 dp targets. Keep the accurate public-copy warning. |
| Scanner error | All scanner exceptions say “Scan failed” and “Could not open the document scanner.” | Use “Scanner unavailable” and the copy deck wording; cancellation or zero pages should return quietly to Gallery. |
| Review page limit (M-2 pending) | Review still shows `n / 10` and a “10 page limit reached” banner. | Show the page count only; the product has no page limit. |
| Review saving | Progress is shown, but page removal stays enabled and labels vary between “Exporting” and “Saving”. | Disable page removal too; use “Saving PDF” / “Saving images” consistently. |
| Review saved warning and failures | The saved warning appears in an Alert. The store also reports private-format creation failures through the same warning path and navigates to Preview. | Identify the destination only for a public-copy failure. For private-format failure, keep the draft in Review with a retry. |
| Preview format controls | PDF-only has “Save as images”, but after success the PDF remains selected. Both formats use “View images” / “View PDF” as a toggle button. Images-only uses “Create PDF” as the primary action and has no second action. | Switch to Images after image creation; use a PDF / Images selector when both exist; label the missing format “Save as PDF” / “Save as images”. Never regenerate an existing format. |
| Preview terminology | Missing PDF is labeled “Create PDF”; operation dialogs say “Success”, “Failed to create PDF”, and “Failed to save images”. | Use “Save as PDF” / “Save as images” for creation and direct outcome copy without generic success messages. |
| Preview loading / share | PDF has an activity indicator; image pages have no load-error state. Share uses Alerts for outcomes. | Disable conflicting actions while loading; show a page-level image error and retryable share feedback. |
| Delete progress | Preview shows “Deleting document...” after the record disappears. | Keep a clear busy state and navigate only after successful deletion; preserve Preview on failure. |
| Typography / targets | Several labels are 10–13 px; the Gallery options control is 28 dp with 6 dp hit slop. | Follow the Brand type scale; give every actionable target at least 44 dp. |
| Date (M-7) | Uses device locale and includes the year outside the current year. | Matches the spec. |

