# Layer 1 right-hand review candidate

Candidate only. Generated from `coach/data/keybindings_explained.csv` (the portable Coach copy, dated 2026-11-04). Does not replace the active Coach, ZMK layout, or keyboard state.

## Proposed right-hand non-thumb map

| Position | Candidate binding | Rationale |
|---|---|---|
| x7,y0 | Ctrl+Shift+Tab — Previous tab | Paired with Next tab at x8,y0 |
| x8,y0 | Ctrl+Tab — Next tab | Adjacent to Previous tab |
| x9,y0 | Transparent | Vacated when Win+C moved to x5,y3 |
| x10,y0 | L1 toggle/lock | Preserve layer control |
| x11,y0 | Win+Shift+C — Color Picker | Move from L1 left side; higher utility than launcher duplicate |
| x12,y0 | Win+Shift+R — Screen Ruler | Move from L1 left side |
| x7,y1 | Ctrl+F — M-Files Quick Search | Moved here from x12,y2 as a lower-priority shortcut |
| x8,y1 | Ctrl+- — Zoom out | Correct Norwegian HID mapping to emit `-` |
| x9,y1 | Ctrl++ — Zoom in | Correct Norwegian HID mapping to emit `+` |
| x10,y1 | Alt+Left — Back | Paired horizontally with Alt+Right |
| x11,y1 | Alt+Right — Forward | Paired horizontally with Alt+Left; usage on current host not confirmed |
| x12,y1 | Ctrl+Shift+F — M-Files Advanced Search | M-Files shortcut reference; no work-laptop usage imported |
| x7,y2 | Win+V — Clipboard history | User-nominated move |
| x8,y2 | MB1 — Left click | Fixed |
| x9,y2 | MB2 — Right click | Fixed |
| x10,y2 | Scroll_L1 | Fixed |
| x11,y2 | Win+Shift+T — Text Extractor | User-nominated move, effort 0.0 |
| x12,y2 | Ctrl+F — M-Files Quick Search | M-Files shortcut reference; no work-laptop usage imported |
| x5,y3 | Win+C — Open Copilot | Moved here as requested; Windows may route this to Search if Copilot is unavailable/disabled |
| x7,y3 | Ctrl+O — Claude transcript | Preserve current Claude workflow |
| x8,y3 | Win+PgUp — Previous window in same FancyZones zone | Requested window-cycle workflow |
| x9,y3 | Win+PgDn — Next window in same FancyZones zone | Adjacent to previous-window action |
| x10,y3 | MB4 — Back | User-requested position |
| x11,y3 | MB5 — Forward | User-requested position; adjacent to MB4 |
| x12,y3 | MB3 — Middle click | Move clear of FancyZones pair |

## Effort and scope

Optimizer position costs: Text Extractor x11,y2 = 0.0; Clipboard x7,y2 = 1.25; File Explorer x12,y2 = 1.25. Their previous left-side positions cost 2.0 each. FancyZones pair and MB4/MB5 positions each cost 1.0. Alt+Left/Right at x10,y1 and x11,y1 each cost 1.0. M-Files Quick Search moves from x12,y2 (1.25) to x7,y1 (1.75), reflecting its lower use. File Explorer moves to x12,y2 (1.25).

Win+C moves from candidate L2 x3,y1 to L1 x5,y3. The existing L1 Command Palette and Walk This Way pair remains together on the left. PowerToys Run is removed from L1 as redundant with Command Palette. Ctrl+Alt+Up and Ctrl+Alt+Down move together to the newly freed left positions x2,y0 and x3,y0. This candidate does not import the untransferred work-laptop logs.

The zoom corrections use the Norwegian host map: `ForwardSlash and QuestionMark` emits `-`; `Dash and Underscore` emits `+`. The FancyZones shortcuts require same-zone window cycling enabled in PowerToys.

## Provenance and limits

The candidate is a separate 616-row CSV. It preserves L7 and leaves the current files unchanged. The canonical ZMK CSV (2026-10-31) and portable Coach CSV (2026-11-04) currently differ; this candidate uses the latter because it contains the three left-side keys the user identified. Reconcile both sources before any promotion or application.
