# Charybdis workspace controls

## Shared L2 controls

These positions are identical on every host:

| L2 position | Output | Purpose |
|---|---|---|
| x7,y0 | Win+Ctrl+Ø | PowerToys Workspaces editor |
| x8,y0 | Win+Shift+Ø | PowerToys FancyZones editor |
| x9,y0 | F13 | Launch this host's full-screen workspace |
| x10,y0 | F14 | Launch this host's Split workspace |
| x11,y0 | Transparent | Spare position |

For the two editor shortcuts, configure each host's PowerToys hotkeys to the same keycode and modifiers. On a Norwegian layout the physical `ø` key maps to keycode `0xC0`; Ctrl and Shift distinguish the editor actions.

## Host-local workspace aliases

The portable AHK helper resolves these Desktop links at runtime:

- `Charybdis Workspace - Full.lnk`
- `Charybdis Workspace - Split.lnk`

Each link points to that host's own PowerToys Workspace ID. The keyboard sends the same F13/F14/F15 outputs on both computers; no host-specific IDs are stored in ZMK. If an alias is missing, AHK shows a notice and does not launch a fallback workspace.

Create each workspace through PowerToys Workspaces on the target host so saved monitor IDs and geometry come from that computer. Use real windows and monitors when capturing; do not hand-edit PowerToys workspace JSON.

On each host, set the Workspaces editor hotkey to Win+Ctrl+Ø and the FancyZones editor hotkey to Win+Shift+Ø, using the same keycode and modifiers. The personal PC currently has these distinct bindings at keycode 192. Confirm the work PC uses the Norwegian keyboard layout so the physical Ø key resolves to that keycode. Keep FancyZones `windowSwitching` disabled on both hosts so its Win+PgUp/PgDn same-zone action does not intercept the existing spatial focus controls; this is already disabled on the personal PC.

## Placement constraints

- Personal PC: keep Terminal on the right monitor and preserve the existing left Edge placement.
- Work PC: keep the existing Edge/Coach setup on the left monitor outside workspace captures.
- Ignore File Explorer as a workspace target.
- Save at least one full-screen arrangement and one split-window arrangement.
- Work PC application/monitor assignments must be confirmed on that computer before saving its profiles.
- Create host-local `Full` and `Split` PowerToys profiles, then point the identically named Desktop aliases at each host's own workspace IDs.

## Usage evidence

The personal-host log covers 2026-11-06 through 2026-11-09 (19,024 events); its most-recorded apps include Edge (5,856), Windows Terminal (3,444), Discord (1,501), and PowerToys Settings (1,186). The imported work-host log covers 2026-10-27 through 2026-10-31 (28,236 events); its most-recorded apps include Edge (7,063), M-Files Desktop (4,508), Excel (3,404), Teams (3,135), and M365 Copilot (2,394). Counts are logger events, not active time. L2 had 213 personal-host events and 31 imported work-host events in these windows, mostly Norwegian-symbol and layer events. The new editor/workspace bindings are therefore a user-requested trial pool; keep or move them based on future per-layer usage.
