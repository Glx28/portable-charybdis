# Work PC workspaces: handoff for the layout / coding agent

Host: `LPT-MA2FJDMSO5J` (work PC). Updated 2026-11-10. Host-local data, not shared ZMK data. Do not put workspace IDs into ZMK, `layout_spec.json` or any shared candidate.
Status: Workspaces exist on the work PC. Physical L2 placement `L2-direct-workspaces-20261110` was applied and saved through ZMK Studio on 2026-11-10; ZMK verification reported 37 pass, 0 fail. The work host is not connected to this session. Its workspace IDs remain host-local; reuse its saved profiles and create/update host-local aliases from the updated keymap.

## Monitors (three, normal arrangement)

| PowerToys monitor | Id | Position | Role |
|---|---|---|---|
| 1 | LGD07BF | x=-1920 (laptop panel) | MFEE / Coach web app, maximized (in every profile unless Jira is full-screen there). |
| 3 | HPN3469 | x=0 (primary) | "adjacent" |
| 2 | DEL40F4 | x=1920 | "remaining" |

## Owner layout rules (2026-11-09, supersede the earlier "leave left Edge/Coach out" rule)

- No floating windows. Every window is full, half-left or half-right of one monitor. No empty halves or empty monitors.
- Monitor 1 (left-most): MFEE or Coach web app, always MAXIMIZED, never split. Profiles hold both as maximized windows stacked on monitor 1 so either one that is open gets covered. Sometimes an important app (Jira, browser, M-Files Admin, M-Files Explorer) is full-screen there instead.
- Monitor 3 (middle): the main app, maximized.
- Monitor 2 (right-most): usually split in two. If Copilot is there it is the LEFT half.
- Only one M-Files Admin open at a time. M-Files Explorer (MFDesktop) often has 1 or 2 windows open.

## Profiles (host-local aliases on the Desktop)

Workspace names stay `<left> - <middle> - <right>` in app abbreviations (MFEE, Coach, "M" = MFEE and Coach, MF = M-Files Desktop, Adm = M-Files Admin, Cop = Copilot web, XL = Excel, TM = Teams, JR = Jira, SF = Salesforce timecard). Desktop aliases are deliberately stable and differ from profile names. Every L2 workspace key opens one fixed alias; F15 is no longer a picker. Launch target: `PowerToys.WorkspacesLauncher.exe {id} 1`. Keep Move existing windows ON. M1 = monitor 1, M3 = monitor 3, M2 = monitor 2. "MFEE|Coach" = MFEE left half, Coach right half. Monitor 1 is maximized (PowerToys' DPI-unaware rect -1920, 1536x960). Half windows on monitors 2/3 use X=x0-7 or x0+953, width 974, height 1087 to cover the ~7px invisible Windows 11 border; exact pixel halves leave gaps.

| Workspace name | M1 (left) | M3 (middle, max) | M2 (right) | Workspace ID (host-local) | Status |
|---|---|---|---|---|---|
| M - MF - Cop | MFEE+Coach max | M-Files Desktop | Copilot web max | {76A17134-86F3-4C27-B373-C60B35B6CD90} | F13 · `Charybdis Workspace - Full.lnk` |
| M - MF - Cop+JR | MFEE+Coach max | M-Files Desktop | Copilot web \| Jira | {89F00F95-FBB0-40D3-BE20-33AEA154F2E3} | F14 · `Charybdis Workspace - Split.lnk` |
| M - Edge - Cop+JR | MFEE+Coach max | Edge (normal browser) | Copilot web \| Jira | {E43EA5B1-0064-43E6-91F1-C19A96866D1D} | F15 · `Charybdis Workspace - Browser.lnk` |
| M - JR - SF+TM | MFEE+Coach max | Jira | Salesforce timecard \| Teams | {810CAF85-0993-4A6C-9A36-B03BA1F2BAA9} | F16 · `Charybdis Workspace - Collaboration.lnk` |
| M - Adm - Cop+JR | MFEE+Coach max | M-Files Admin | Copilot web \| Jira | {004C4673-C81E-4025-A38A-370950F2DDC0} | F17 · `Charybdis Workspace - M-Files Admin.lnk` |
| M - XL - Cop+TM | MFEE+Coach max | Excel | Copilot web \| Teams | {C5B74492-D902-4346-88C6-076E6D8C33EA} | F18 · `Charybdis Workspace - Excel Teams.lnk` |
| M - MF - Cop+TM | MFEE+Coach max | M-Files Desktop | Copilot web \| Teams | {8E42B2C9-D90B-4050-AD3B-2057AB16428F} | F19 · `Charybdis Workspace - M-Files Teams.lnk` |
| JR - Adm - MF+MF | Jira max | M-Files Admin | M-Files Desktop \| M-Files Desktop (2 windows) | {78CB235A-505F-4240-8E8C-889187428C5C} | F20 · `Charybdis Workspace - Jira M-Files Admin.lnk` |

Owner decision 2026-11-10: fill L2 y2 workspace row first. Shared Full/Split/Browser/Collaboration use x7-x10,y2, then work-only Admin/Excel use x11-x12,y2. Remaining work-only M-Files/Jira+MF use x7-x8,y1. Coach labels shared actions with 🔁 and work-only actions with 💼. F13-F20 are internal HID outputs. Preserve L0/L1/L7 and Norwegian symbols. Latest candidate `L2-direct-workspaces-20261110` uses y2 before y1.

Notes:
- The exact arrangements are the agent's reading of the rules above, not measured. Left-monitor and M2 app choices per profile are placeholders to adjust after use.
- Owner 2026-11-09: Teams is not used often, never as the middle full-screen app. It is only a right-half app in TeamsExcel and TeamsMFiles. Middle apps are M-Files Desktop, Excel, Jira or Admin. Outlook is in no profile now (it was in the first Split). Add it where wanted.
- Copilot is the web app (PWA `oobdgmacjfhikkaggfkkpgoodopnjffp`), by owner choice.
- M-Files Admin is `mmc.exe "C:\Program Files\M-Files\26.11.16675.0\ServerTools\MFAdmin.msc"`, `is-elevated: true`, added by hand because the PowerToys snapshot cannot see elevated windows. Aliases Admin and AdminMFiles have Run as administrator set (UAC prompt). The version folder is pinned and breaks on an M-Files upgrade.
- Earlier test workspace `m-files admin and copilot web app test` launched 34 apps because Move existing windows was OFF; now ON. Re-check the launcher log for reuse before trusting it.

## Tasks for the layout / coding agent

1. Create the six F15-F20 Desktop aliases exactly as listed in the table. Use each profile ID and `PowerToys.WorkspacesLauncher.exe {id} 1`; preserve the existing Full/Split aliases.
2. Map bare F13-F20 to those aliases in the work-PC AHK helper. Modified Coach beacon chords remain unchanged. Bare F19/F20 app-specific helpers must stay off those keys because the new ZMK bindings use them for workspaces.
3. Copy the updated Coach CSV and verify the visible L2 positions; default preview must start unlocked. Workspace labels are Full, Split, Browser, Collab, Admin, Excel, M-Files, Jira+MF; do not display F13-F20 as the key names. Use x7-x12,y2 first, then x7-x8,y1.
4. Parse/reload AHK and key-conflict-check F13-F20. The AHK helper now validates each `.lnk`, launches its saved target/GUID directly, and blocks a second workspace while PowerToys status is active. Test remaining profiles one at a time.

## Constraints that still apply

- Never include File Explorer, Notepad, Settings or PowerToys windows in profiles. (M-Files Explorer = MFDesktop is allowed.)
- Close the PowerToys Workspaces editor before editing `workspaces.json` by script: the open editor overwrites it on save and already erased these profiles once.
- Backups of `workspaces.json` are the `.bak-*` files next to it.
