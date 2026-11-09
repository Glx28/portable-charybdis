# Charybdis workspace controls

## Shared L2 controls

These positions are identical on every host:

| L2 position | Output | Purpose |
|---|---|---|
| x7,y0 | Win+Ctrl+Ø | PowerToys Workspaces editor |
| x8,y0 | Win+Shift+Ø | PowerToys FancyZones editor |
| x9,y0 | F13 | Launch this host's Primary workspace |
| x10,y0 | F14 | Launch this host's Split workspace |
| x11,y0 | F15 | Launch this host's Full workspace |

For the two editor shortcuts, configure each host's PowerToys hotkeys to the same keycode and modifiers. On a Norwegian layout the physical `ø` key maps to keycode `0xC0`; Ctrl and Shift distinguish the editor actions.

## Host-local workspace aliases

The portable AHK helper resolves these Desktop links at runtime:

- `Charybdis Workspace - Primary.lnk`
- `Charybdis Workspace - Split.lnk`
- `Charybdis Workspace - Full.lnk`

Each link points to that host's own PowerToys Workspace ID. The keyboard sends the same F13/F14/F15 outputs on both computers; no host-specific IDs are stored in ZMK. If an alias is missing, AHK shows a notice and does not launch a fallback workspace.

Create each workspace through PowerToys Workspaces on the target host so saved monitor IDs and geometry come from that computer. Use real windows and monitors when capturing; do not hand-edit PowerToys workspace JSON.

## Placement constraints

- Personal PC: keep Terminal on the right monitor and preserve the existing left Edge placement.
- Work PC: keep the existing Edge/Coach setup on the left monitor outside workspace captures.
- Ignore File Explorer as a workspace target.
- Save at least one full-screen arrangement and one split-window arrangement.
- Work PC application/monitor assignments must be confirmed on that computer before saving its profiles.
