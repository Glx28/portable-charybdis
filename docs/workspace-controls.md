# Charybdis workspace controls

Version: `L2-direct-workspaces-20261110`

## Current L2 workspace map

Fill the easy y2 row before using y1. The shared actions lead; work-only actions follow. No workspace shortcut uses y0.

| L2 position | Coach label | HID to AHK | Personal PC | Work PC |
|---|---|---|---|---|
| x7,y2 | 🔁 Full | F13 | Full-screen work context | M-Files/Copilot full-screen context |
| x8,y2 | 🔁 Split | F14 | Split browser/web-app context | M-Files/Copilot/Jira split context |
| x9,y2 | 🔁 Browser | F15 | Brave YouTube + ChatGPT web apps | Edge + Copilot + Jira |
| x10,y2 | 🔁 Collab | F16 | Discord collaboration | Jira + Salesforce + Teams |
| x11,y2 | 💼 Admin | F17 | Work-only slot | M-Files Admin + Copilot + Jira |
| x12,y2 | 💼 Excel | F18 | Work-only slot | Excel + Copilot + Teams |
| x7,y1 | 💼 M-Files | F19 | Work-only slot | M-Files + Copilot + Teams |
| x8,y1 | 💼 Jira+MF | F20 | Work-only slot | Jira + Admin + two M-Files windows |

🔁 means the same physical key invokes a same-purpose workspace on both PCs. 💼 means work-PC-only workspace. Coach shows these names and icons; F13–F20 are internal HID transport keys. L2 Workspaces and FancyZones editor actions remain x7,y0/x8,y0. Preserve L0, L1, L7, thumb keys, and the Norwegian cluster, including backslash.

## Workspace launcher behavior

The portable AHK helper resolves Desktop shortcuts named `Charybdis Workspace - <name>.lnk` to host-local PowerToys workspace IDs. It checks the launcher path and GUID arguments, reports missing aliases, and blocks overlapping launches while PowerToys is launching a workspace. Modified F-key chords remain reserved for Coach. Each PC keeps its own workspace IDs and monitor geometry; do not put host IDs in ZMK.

PowerToys profiles use **Move existing windows**. Existing apps are repositioned; missing apps are launched. Do not include File Explorer, Settings, or PowerToys windows as workspace targets. M-Files Explorer (MFDesktop) is a valid work app.

## Personal PC profile status

- **Full:** Edge stays on the left monitor, Brave on the center, Terminal on the right.
- **Split:** Edge stays left; ChatGPT Edge PWA and YouTube Brave PWA share the center; Terminal stays right.
- **Browser:** only YouTube (Brave) and ChatGPT (Edge PWA) in the saved center halves. Left Edge/Coach and right Terminal are excluded.
- **Collab:** existing Discord collaboration profile.

Browser profile `{E7898CCE-D924-4567-A42D-AC803FEF0BA7}` was corrected directly in PowerToys `workspaces.json`. The matching Desktop alias points to this ID. Its apps were tested: both web apps opened in the center halves while normal Edge and Terminal remained in place. The launcher was tested via F15; an immediate duplicate was rejected while launch was in progress. Full, Split, and Collab launches have not each been retested in this session.

## Work PC profile status

Profiles already exist on the work PC and IDs remain host-local. The portable host helper/aliases need to be updated there using [work-pc-workspace-handoff.md](work-pc-workspace-handoff.md). That handoff captures the three-monitor arrangement, exact profile IDs, window groupings, current placement decision, and host-side steps. Do not design for the temporary one-monitor state.

The profile groupings use the work usage logs: frequent Edge/Teams transitions; M-Files Desktop with Copilot; and Teams with Excel. Teams stays in right-side splits, not the middle full-screen slot. The left Edge/Coach setup stays outside captures except when a profile deliberately places another app full-screen there. Ignore File Explorer as a workspace target.

## Why the earlier triggers failed

The original F15/F16 aliases pointed at captured profiles containing Discord, generic Edge, and Terminal rather than the intended browser/web apps. Multiple workspace keys were also pressed within seconds, overlapping PowerToys launches. The usage logger proved that HID keys fired, not that apps opened. The Browser profile and AHK launch serialization now address both issues.

## Layout application status

Candidate and Coach data: `L2-direct-workspaces-20261110`. Applied and saved through the existing connected ZMK Studio tab on 2026-11-10. ZMK verification: `37 pass, 0 fail`. Shared actions occupy x7–x10,y2, work-only actions x11–x12,y2, then x7–x8,y1. Existing L2 application shortcuts were moved as part of the layout; L0/L1/L7 remain unchanged.

## Usage evidence

Personal-host logs cover 2026-11-06 through 2026-11-09 (19,024 events): Edge 5,856; Windows Terminal 3,444; Discord 1,501; PowerToys Settings 1,186. Imported work-host logs cover 2026-10-27 through 2026-10-31 (28,236 events): Edge 7,063; M-Files Desktop 4,508; Excel 3,404; Teams 3,135; M365 Copilot 2,394. These are logger events, not active time. The workspace keys are a usage trial; future per-layer usage determines what stays.
