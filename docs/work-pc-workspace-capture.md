# Work PC PowerToys Workspaces: capture instructions

## Goal and status

Create two host-local PowerToys Workspaces profiles on the work PC. This file is for the coding agent operating on that PC, where its actual displays and windows are available. Do not copy monitor coordinates or workspace IDs from the personal PC.

The personal machine has different monitor assignments: keep its left Edge window and right Windows Terminal window in place. The personal Full/Split profiles `di br te` and `di br te split` already exist. They are not new profiles from this task. The requested new personal capture remains pending.

## Work-log evidence

Source: imported work-host `shortcut_usage.jsonl`, events dated 2026-10-27 through 2026-10-31 (28,236 events). These are logger events, not active-time measurements.

| App | Events |
|---|---:|
| M-Files Desktop | 4,508 |
| Excel | 3,404 |
| Teams | 3,135 |
| M365 Copilot | 2,394 |
| Outlook | 858 |
| Edge | 7,063 |

The user-designated left monitor is reserved for the existing Edge/Coach setup. Do not reposition or include those windows in either capture. File Explorer is a popup for this user; exclude it.

Co-use and transitions from `app_workflow_window` and `app_transition` records:

| Pair | Co-use windows | Focus transitions |
|---|---:|---:|
| Teams + Outlook | 226 | 28 |
| M-Files + M365 Copilot | 237 | 52 |
| Teams + M-Files | 213 | 43 |
| Teams + Excel | 59 | 20 |

## Profiles to create

Use the two monitors to the right of the reserved Edge/Coach monitor.

### `Charybdis Work - Full`

- Leave Edge/Coach on the left monitor untouched and outside the workspace capture.
- Teams: full-screen on the adjacent work monitor.
- M-Files Desktop: full-screen on the remaining work monitor.
- Create a desktop shortcut during save.

This gives the two highest-use work apps dedicated full-monitor space while preserving the user's Edge/Coach anchor.

### `Charybdis Work - Split`

- Keep Edge/Coach untouched on the left monitor.
- On the adjacent monitor, split Teams and Outlook side by side.
- On the remaining monitor, split M-Files Desktop and M365 Copilot side by side.
- Create a desktop shortcut during save.

These are the strongest work-app pairs by measured co-use. Excel had more total events than Outlook, but its Teams co-use and transitions were lower. Leave Excel available as an app; do not substitute it in this first capture.

## Capture steps

1. Confirm Workspaces and FancyZones are enabled and the work monitor arrangement is connected as normally used.
2. Keep Edge/Coach on the left monitor in its current position. Do not include it in the capture.
3. Open Teams, Outlook, M-Files Desktop, and M365 Copilot as needed. Arrange the Full profile first and capture only Teams and M-Files Desktop.
4. In the Workspaces Editor, remove unrelated/minimized apps before saving. Do not include File Explorer, Edge/Coach, PowerToys Settings, terminals, or stale windows.
5. Name it `Charybdis Work - Full`; enable **Create desktop shortcut**; leave **Move existing windows** off; save.
6. Arrange and capture the Split profile with Teams/Outlook on one monitor and M-Files/Copilot on the other. Remove unrelated/minimized apps before saving.
7. Name it `Charybdis Work - Split`; enable **Create desktop shortcut**; leave **Move existing windows** off; save.
8. Confirm both profiles appear in the Workspaces Editor and that the Edge/Coach window never moved.
9. Rename or copy the generated desktop shortcuts to the portable helper's expected aliases:
   - `Charybdis Workspace - Full.lnk`
   - `Charybdis Workspace - Split.lnk`
10. Verify each shortcut launches the intended profile on this host. Record each local PowerToys workspace ID and shortcut target in the task notes; do not put IDs into ZMK.

## Shared keyboard routing

Portable Charybdis routes bare F13 and F14 to the two host-local desktop aliases. L2's review candidate places these at x9,y0 (Full) and x10,y0 (Split). The candidate is not applied to firmware. Keep the same physical positions and HID outputs on both computers; only the local shortcut targets differ.

PowerToys editor hotkeys are separate from FancyZones:

- Workspaces Editor: Win+Ctrl+Ø
- FancyZones Editor: Win+Shift+Ø

Keep the current spatial window-navigation bindings unchanged. Do not enable FancyZones' same-zone Win+PgUp/PgDn switching.

## Verification report

After saving, report workspace names, IDs, desktop shortcut paths, app-to-monitor/zone placements, and whether the left Edge/Coach anchor stayed fixed. Test launching Full and Split from their desktop shortcuts. Do not apply or flash the L2 keyboard candidate as part of this host-side capture task.
