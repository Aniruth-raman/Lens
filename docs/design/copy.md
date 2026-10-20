# Lens copy deck

Use these strings verbatim unless a platform requires a shorter accessibility label. Use **Save** for creating a format, **Share** for sending it to another app, **Rename** for changing a document name, and **Delete** for removing a document from Lens. Avoid “Export” and generic success messages.

## Gallery

| Context | String |
| --- | --- |
| Screen title / brand | Lens |
| Scan action | Scan document |
| Search action (accessibility) | Search documents |
| Search placeholder | Search documents |
| Clear query action | Clear search |
| Count, one | 1 document |
| Count, many | {count} documents |
| Count, filtered | {count} of {total} documents |
| Loading state | Loading documents… |
| Empty title | No documents yet |
| Empty body | Scan a document to save it here. |
| No search results | No results for “{query}” |
| No-results body | Try another name or clear your search. |
| No-results action | Clear search |
| Load error title | Couldn’t load documents |
| Load error action | Try again |
| Scanner error title | Scanner unavailable |
| Scanner error body | Lens couldn’t open the document scanner. Try again. |
| Search field clear action (accessibility) | Clear search |
| Document options | Document options |
| Rename action | Rename |
| Delete action | Delete |
| Rename dialog title | Rename document |
| Rename field label | Document name |
| Blank name title | Name required |
| Blank name body | Enter a name for this document. |
| Rename confirm | Save name |
| Cancel action | Cancel |
| Rename error title | Couldn’t rename document |
| Rename error fallback | Try again. |
| Delete confirmation title | Delete document? |
| Delete confirmation body | This removes “{name}” from Lens. Copies already saved to Downloads or Pictures will remain there. |
| Delete confirm | Delete from Lens |
| Delete error title | Couldn’t delete document |
| Delete error fallback | Try again. |
| Delete progress | Deleting document… |

## Review

| Context | String |
| --- | --- |
| Screen title | Review scan |
| Name field label | Document name |
| Name placeholder | Document name |
| Page count, one | 1 page |
| Page count, many | {count} pages |
| Page label | Page {number} |
| Remove page action | Remove page {number} |
| Last-page error title | Cannot remove page |
| Last-page error body | A document needs at least one page. |
| Empty review title | No pages to save |
| Empty review action | Back to Gallery |
| Save as PDF action | Save as PDF |
| Save as images action | Save as images |
| Preparing PDF | Preparing PDF… |
| Saving PDF | Saving PDF… |
| Preparing images | Preparing images… |
| Saving images | Saving images… |
| Progress count | {done} of {total} pages |
| Blank name title | Name required |
| Blank name body | Enter a name for this document. |
| Save error title | Couldn’t save document |
| Save PDF error fallback | The document is still in Review. Try saving the PDF again. |
| Save images error fallback | The document is still in Review. Try saving the images again. |
| Save error fallback when format is unknown | Your scan is still in Review. Try again. |
| Public PDF warning title | Saved in Lens |
| Public PDF warning | The PDF is saved in Lens, but couldn’t be copied to Downloads. You can try again from the document. |
| Public images warning title | Saved in Lens |
| Public images warning | The images are saved in Lens, but couldn’t be copied to Pictures. You can try again from the document. |
| Warning dismissal | Continue |
| Leave review title | Discard this scan? |
| Leave review body | Your scanned pages will be lost if you leave Review. |
| Stay action | Keep reviewing |
| Discard action | Discard scan |

## Preview

| Context | String |
| --- | --- |
| Back action | Back to Gallery |
| PDF selector | PDF |
| Images selector | Images |
| Save PDF action | Save as PDF |
| Save images action | Save as images |
| Share PDF action | Share PDF |
| Share page action | Share page {number} |
| PDF loading | Loading PDF… |
| Image loading | Loading page… |
| PDF progress | Page {current} of {total} |
| Saving PDF | Saving PDF… |
| Saving images | Saving images… |
| Preview error title | Preview unavailable |
| Preview retry | Try again |
| Page error | This page couldn’t be opened. |
| No preview available | No preview available. |
| Missing document title | Document not found |
| Missing document body | This document may have been removed. |
| Delete action (icon accessibility) | Delete document |
| Delete confirmation title | Delete document? |
| Delete confirmation body | This removes “{name}” from Lens. Copies already saved to Downloads or Pictures will remain there. |
| Delete confirm | Delete from Lens |
| Delete progress | Deleting document… |
| Delete error title | Couldn’t delete document |
| Delete error fallback | Try again. |
| Share progress | Opening share sheet… |
| Share unavailable title | Sharing unavailable |
| Share unavailable body | Sharing isn’t available on this device. |
| PDF share error title | Couldn’t share PDF |
| Image share error title | Couldn’t share page |
| Share error fallback | Try again. |
| Save PDF error title | Couldn’t save PDF |
| Save images error title | Couldn’t save images |
| Save error fallback | Your document is still in Lens. Try again. |
| PDF preparation before page progress | Preparing PDF… |
| Image preparation before page progress | Preparing images… |
| Public PDF warning title | Saved in Lens |
| Public PDF warning | The PDF is saved in Lens, but couldn’t be copied to Downloads. You can try again here. |
| Public images warning title | Saved in Lens |
| Public images warning | The images are saved in Lens, but couldn’t be copied to Pictures. You can try again here. |
| Warning dismissal | OK |

## Screen-reader labels and announcements

- Document card: **{name}, {count} pages, scanned {date}**.
- Page removal: **Remove page {number}**.
- Format selector: **Show PDF** and **Show images**; announce the selected format.
- Progress: **{operation}, {done} of {total} pages**; while preparing, announce the relevant preparing string.
- Disable state: expose saving, sharing, and deleting as busy; announce completion or failure using the corresponding message above.

## Naming and punctuation

- Use sentence case in buttons and dialogs: “Save as images”, not “Save as Images”.
- Use an ellipsis character for an in-progress label. Do not append punctuation to button labels.
- Use “page” for one and “pages” for more than one. Use “document” rather than “doc”.
- Insert the actual saved location in public-copy warnings: Downloads for PDF, Pictures for images. Keep the document saved in Lens when this copy fails.

