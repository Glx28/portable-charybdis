# Charybdis workspace controls

## Shared L2 right-hand pool

These positions are identical on every host. Existing L1 utilities remain on L1; L2 adds workspace and work-app actions.

| L2 position | Output | Purpose |
|---|---|---|
| x7,y0 | Win+Ctrl+Ø | PowerToys Workspaces editor |
| x8,y0 | Win+Shift+Ø | PowerToys FancyZones editor |
| x9,y0 | F13 | Launch this host's full-screen workspace |
| x10,y0 | F14 | Launch this host's Split workspace |
| x11,y0 | Ctrl+Shift+E | M-Files check in |
| x12,y0 | Ctrl+E | M-Files check out / Teams search |
| x7,y1 | Ctrl+G | M-Files go to vault |
| x8,y1 | Alt+Enter | M-Files properties |
| x9,y1 | Ctrl+N | New M-Files item / Teams chat |
| x10,y1 | Ctrl+O | Open M-Files item |
| x11,y1 | Ctrl+Shift+D | M-Files download copy |
| x12,y1 | Ctrl+Shift+C | M-Files copy object link |
| x7,y2 | Ctrl+Shift+X | Expand Teams compose box |
| x8,y2 | Shift+Enter | New line in Teams message |
| x9,y2 | Ctrl+Enter | Send expanded Teams message |
| x10,y2 | Ctrl+Shift+M | Toggle Teams call mute |
| x11,y2 | Ctrl+R | Outlook reply |
| x12,y2 | Ctrl+Shift+R | Outlook reply all |
| x9,y3 | Ctrl+PageUp | Previous Excel worksheet |
| x10,y3 | Ctrl+PageDown | Next Excel worksheet |
| x11,y3 | Ctrl+1 | Excel Format Cells |
| x12,y3 | Ctrl+H | Excel Find and Replace |

For the two editor shortcuts, configure each host's PowerToys hotkeys to the same keycode and modifiers. On a Norwegian layout the physical `ø` key maps to keycode `0xC0`; Ctrl and Shift distinguish the editor actions.

## Host-local workspace aliases

The portable AHK helper resolves these Desktop links at runtime:

- `Charybdis Workspace - Full.lnk`
- `Charybdis Workspace - Split.lnk`

Each link points to that host's own PowerToys Workspace ID. The keyboard sends the same F13/F14 outputs on both computers; no host-specific IDs are stored in ZMK. If an alias is missing, AHK shows a notice and does not launch a fallback workspace.

Create work-PC profiles through PowerToys Workspaces on that host so saved monitor IDs and geometry come from that computer. The normal design target is always three monitors. The personal PC currently has one monitor attached only temporarily; do not design or capture a one-monitor workspace.

The personal PC now has host-local profiles behind the existing Full/Split aliases:

- **Full:** Edge on the left, Brave full-screen on the center display, Terminal full-screen on the right.
- **Split:** Edge on the left, ChatGPT Edge PWA and YouTube Brave PWA side by side on the center display, Terminal on the right.

The saved `di br te`, `di br te split`, and temporary capture remain unchanged. The work-PC profiles still need to be created on that host from its own three-monitor setup.

On each host, set the Workspaces editor hotkey to Win+Ctrl+Ø and the FancyZones editor hotkey to Win+Shift+Ø, using the same keycode and modifiers. The personal PC currently has these distinct bindings at keycode 192. Confirm the work PC uses the Norwegian keyboard layout so the physical Ø key resolves to that keycode. Keep FancyZones `windowSwitching` disabled on both hosts so its Win+PgUp/PgDn same-zone action does not intercept the existing spatial focus controls; this is already disabled on the personal PC.

## Placement constraints

- Personal PC: keep Terminal on the right monitor and preserve the existing left Edge placement.
- Work PC: keep the existing Edge/Coach setup on the left monitor outside workspace captures.
- Ignore File Explorer as a workspace target.
- Save at least one full-screen arrangement and one split-window arrangement on each PC.
- Work PC application/monitor assignments must be confirmed on that computer before saving its profiles.
- Create host-local `Full` and `Split` PowerToys profiles, then point the identically named Desktop aliases at each host's own workspace IDs.

## Provisional work-PC profile pairing

The imported work log records frequent Edge↔Teams focus transitions (107 and 106 in the two directions). In co-use windows, M-Files Desktop appeared with M365 Copilot 35 times, and Teams with Excel 24 times. Starting arrangement to capture on the work PC:

- **Full:** leave Edge/Coach on the left untouched; place Teams on the adjacent monitor and M-Files Desktop on the other monitor.
- **Split:** keep Edge/Coach untouched; split Teams with Excel on one remaining monitor, and M-Files Desktop with M365 Copilot on the other.

These are starting pairings from logger events, not measured active time. Confirm on the work machine that the chosen windows and monitor positions match the actual work setup before saving either profile. Exclude File Explorer from both captures.

## L2 shortcut evidence

The work log recorded 3,135 Teams, 4,508 M-Files Desktop, 3,404 Excel, and 858 Outlook events in its post-layout window. Teams `Shift+Enter` appeared 16 times. The remaining app-specific actions are proposed learning-pool bindings, not claims that those exact shortcuts already occur in the logs. The L2 right non-thumb area is populated; the L2 layer-access keys remain at x7/x8,y3 and thumb positions remain unchanged. Reassess this pool after the user exercises it on both hosts.

## Usage evidence

The personal-host log covers 2026-11-06 through 2026-11-09 (19,024 events); its most-recorded apps include Edge (5,856), Windows Terminal (3,444), Discord (1,501), and PowerToys Settings (1,186). The imported work-host log covers 2026-10-27 through 2026-10-31 (28,236 events); its most-recorded apps include Edge (7,063), M-Files Desktop (4,508), Excel (3,404), Teams (3,135), and M365 Copilot (2,394). Counts are logger events, not active time. L2 had 213 personal-host events and 31 imported work-host events in these windows, mostly Norwegian-symbol and layer events. This new L2 pool is a trial; future per-layer use decides what stays.
