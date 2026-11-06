# Usage-ranked layer review candidate

Promoted and applied on 2026-11-06. This file preserves the review artifact; the active Portable Coach CSV and canonical ZMK CSV now match it.

## Layer ordering

| New layer | Previous content | Reason |
|---|---:|---|
| L1 | L1 | Mouse layer stays fixed at L1. |
| L2 | L5 | Highest non-mouse use in available portable logs: 2,048 sessions, 139.7 minutes, and 7,535 scroll events. Norwegian punctuation cluster added here per request. |
| L3 | L10 | Explicitly assigned to L0 x8,y4; high access count (364). |
| L4 | L9 | Explicitly assigned to L0 x5,y5; includes remaining L9 functions. |
| L5 | L3 | Next high access count (440); preserved as a layer with distinct workflows. |
| L6 | L2 | Remaining layer order by measured usage. |
| L7 | L7 | Frozen and unchanged. |
| L8 | L6 | Remaining layer order by measured usage. |
| L9 | L8 | Remaining layer order by measured usage; ordinary momentary access added from L2. |
| L10 | L4 | Lowest recorded use (8 accesses, 4 sessions). |

Usage counts come from the available portable logger data. They reflect current layer numbers and known logger coverage; they are not a complete measure of lifetime usage across other computers.

## L0 thumb access

- x3,y4 → L1, unchanged.
- x5,y4 → L2, retargeted as requested.
- x8,y4 → L3, retargeted as requested.
- x5,y5 → L4, retargeted as requested.
- Space, Left Alt, L7, and Enter retain their positions.

All other access bindings were renumbered with their target content. L7 rows remain unchanged.

## L2 Norwegian cluster

L2 x1–x5,y2, left to right: `<`, `@`, `=`, `+`, `?`. These adjacent home-row positions have optimizer effort 0.0, 0.0, 0.0, 0.0, and 1.25. Visual labels show the produced symbols; usage notes show the Norwegian physical chord (for example `AltGr+0` for `=`). Lower-priority Ctrl+B, Alt+F, Win+Home, Alt+F4, and Ctrl+Shift+F5 bindings moved to L2 x0–x4,y0; Ctrl+T remains adjacent to Ctrl+Shift+T elsewhere on L2.

The raw `<`, `-`, and `=` bindings on former L9 were removed from new L4 because their old `-` and `=` HID parameters do not produce the intended Norwegian symbols. `>` and `|` remain available as shifted/AltGr variants of the `<` key.

## L1 retained review changes

Includes the previously reviewed mouse placement and fixed mouse trio, MB4/MB5 at x10/x11,y3, zoom pair at x8/x9,y1, Alt+Left/Right at x10/x11,y1, and the requested app/function shortcuts.

## Validation

- 616 rows; 56 rows per layer; no duplicate layer coordinates.
- L7 rows exactly equal to the source candidate.
- L1 fixed MB1 x8,y2, MB2 x9,y2, and Scroll_L1 x10,y2 retained.
- MB4 and MB5 adjacent, same row, MB4 left of MB5.
- Exactly three current-layer scroll bindings: L1, L6, L10.
- All layers have a momentary access path from L0; L9’s path is L0 → L2 → L9.
- L0 fixed access bindings match requested layer numbers.

ZMK Studio apply result: 560 planned non-L7 rows, 560 completed, 0 failed. Read-only verification: 430 checked bindings passed, 0 failed. Layout saved in Studio. L7 stayed frozen and unchanged.
