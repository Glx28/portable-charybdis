# Work PC PowerToys Workspaces: capture instructions

## Goal and status

Create two host-local PowerToys Workspaces profiles on the work PC. This file is for the coding agent operating on that PC, where its actual displays and windows are available. Do not copy monitor coordinates or workspace IDs from the personal PC.

The normal workspace target is always three monitors. A temporary one-monitor state on the personal PC is not a design target. Keep the personal machine's left Edge and right Windows Terminal placements.

The personal machine now has host-local profiles behind its Full/Split desktop aliases. Full keeps Edge left, puts Brave full-screen on the center monitor, and keeps Terminal full-screen on the right. Split keeps Edge left, puts the ChatGPT Edge PWA and YouTube Brave PWA side by side on the center monitor, and keeps Terminal on the right. Existing `di br te` and `di br te split` profiles remain unchanged. Do not copy personal monitor IDs or workspace IDs to the work PC.

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
- Enable **Move existing windows** and **Create desktop shortcut**.

This gives the two highest-use work apps dedicated full-monitor space while preserving the user's Edge/Coach anchor.

### `Charybdis Work - Split`

- Keep Edge/Coach untouched on the left monitor.
- On the adjacent monitor, split Teams and Outlook side by side.
- On the remaining monitor, split M-Files Desktop and M365 Copilot side by side.
- Reuse the already-open Teams and M-Files Desktop windows from the Full capture; add Outlook and Copilot.
- Enable **Move existing windows** and **Create desktop shortcut**.

These are the strongest work-app pairs by measured co-use. Excel had more total events than Outlook, but its Teams co-use and transitions were lower. Leave Excel available as an app; do not substitute it in this first capture.

## Capture steps

1. Confirm all three monitors are connected in their normal arrangement and Workspaces is enabled. The one-monitor personal-PC state is temporary and must not drive this setup.
2. Keep Edge/Coach on the left monitor in its current position. Do not include it in the capture.
3. Open Teams and M-Files Desktop. Arrange and capture the Full profile; exclude Edge/Coach and unrelated windows.
4. Name it `Charybdis Work - Full`; enable **Move existing windows** and **Create desktop shortcut**; save.
5. Keep Teams and M-Files Desktop open. Add Outlook and M365 Copilot, arrange the Split profile, and capture only those four work apps.
6. Name it `Charybdis Work - Split`; enable **Move existing windows** and **Create desktop shortcut**; save.
7. Keep the two existing host-local keyboard alias names; retarget them to the new profile IDs instead of adding another keyboard shortcut or a second shortcut manager:
   - `Charybdis Workspace - Full.lnk`
   - `Charybdis Workspace - Split.lnk`
8. If an alias already exists, update its launcher arguments in place and retain its icon. If missing, rename the PowerToys-created link to that alias. Do not leave duplicate Full/Split launcher links.
9. Verify both aliases with the work apps already open. With **Move existing windows** enabled, existing apps should move to saved positions and missing apps should launch. App reuse can vary; add an app-supported reuse argument only if a duplicate appears.
10. Record each local PowerToys workspace ID and alias target in the task notes; do not put IDs into ZMK. Do not move or resize the left Edge/Coach window.

Microsoft documents **Move existing windows** as moving existing apps to their saved positions and launching the remaining apps ([PowerToys Workspaces](https://learn.microsoft.com/windows/powertoys/workspaces)). This option is enabled on the personal Full/Split profiles.

## Shared keyboard routing

Portable Charybdis routes bare F13 and F14 to the two host-local desktop aliases. L2's review candidate places these at x9,y0 (Full) and x10,y0 (Split). The candidate is not applied to firmware. Keep the same physical positions and HID outputs on both computers; only the local shortcut targets differ.

PowerToys editor hotkeys are separate from FancyZones:

- Workspaces Editor: Win+Ctrl+Ø
- FancyZones Editor: Win+Shift+Ø

Keep the current spatial window-navigation bindings unchanged. Do not enable FancyZones' same-zone Win+PgUp/PgDn switching.

## Verification report

After saving, report workspace names, IDs, desktop shortcut paths, app-to-monitor/zone placements, and whether the left Edge/Coach anchor stayed fixed. Test launching Full and Split from their desktop shortcuts. Do not apply or flash the L2 keyboard candidate as part of this host-side capture task.
