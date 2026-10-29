# Portable Charybdis

One Windows repo for using the Charybdis keyboard. Includes the complete web coach, desktop coach/logger/beacon helper, Norwegian layout and app data, and a one-click launcher. No firmware, optimizer, developer tools, installed Python, or installed AutoHotkey required.

## Start

Clone this repo, then double-click `Start-Charybdis.cmd`. First run downloads small, pinned portable AHK and Python runtimes into this repo's ignored `runtime\dependencies\` folder. Download hashes are checked before extraction. Coach and logger start together; the browser opens automatically.

```powershell
git clone https://github.com/Glx28/portable-charybdis.git
cd portable-charybdis
.\Start-Charybdis.cmd
```

You need Windows 10/11, internet access for the first launch, and Git to clone/pull. Runtime files and keyboard usage logs stay under `runtime\` and are excluded from Git. Move or copy the whole folder to another computer; its local runtime is portable too. A fresh clone downloads the runtimes on first start.

## Use

- `Start-Charybdis.cmd` — start logger, beacon handler, and coach
- `Start-Charybdis.cmd -Action Status` — show component status and coach URL
- `Start-Charybdis.cmd -Action Restart` — restart both components
- `Start-Charybdis.cmd -Action Stop` — stop both components
- `Start-Charybdis.cmd -Action InstallStartup` — start automatically at Windows sign-in
- `Start-Charybdis.cmd -Action UninstallStartup` — remove automatic startup

For input fault diagnosis, run `runtime\dependencies\autohotkey-2.0.28\AutoHotkey64.exe ahk\device_diagnostic.ahk`. It passively records physical key identifiers and mouse movement to `runtime\device_diagnostic.jsonl`; it does not capture typed characters or consume input. Exit from its tray icon menu.

When port 8765 is occupied, the launcher finds another free local port and gives the coach that port. The browser coach is available from the helper tray menu as “Open Web Coach.”

To update, open this folder in PowerShell and run `git pull`, then run `Start-Charybdis.cmd -Action Restart`.

## Current keyboard layout

`keyboard-data\layout\keybindings_explained.csv`, `final_user_layout_v2.json`, and the matching ZMK Studio apply/verify scripts use the gen6500 owner-feedback checkpoint re-evaluated at gen12000. Its 616 key positions are unchanged by the self-layer lock fix; same-layer toggles on L1–L10 now use lock-on behaviors, including the requested L7 self-toggle at `(8,4)`. The earlier frozen-config review recorded 20/20 eligible mouse-session shortcuts on L5 at mean effort 0.7375 and gap 87088.490. Recheck against the current owner constraints fails, including hold-target conflicts and owner-shortcut placement; this is a behavior correction to the existing layout, not a newly accepted candidate.

The current bundle is the gen5000 review candidate with the requested L0 `(7,4)` change from `Ctrl+6` to a momentary L7 hold. It was applied to the connected keyboard: 560 non-L7 positions completed, then 438 eligible positions verified with 0 failures (L7 remains frozen and excluded). The ZMK Studio Save RPC request was submitted. This repository supplies layout and Coach files, not firmware.

Starting after `git pull` replaces helper/server processes from older Portable Charybdis folders and repoints recognized Portable Charybdis sign-in shortcuts to this checkout. Other applications and unrelated AHK/Python processes are left alone.

## Keyboard connection

Coach layer tracking works automatically over USB. Firmware sends layer changes on a separate vendor-defined HID interface; the Windows helper reads that private interface, so layer keys never become host keypresses. USB switching between computers requires no Bluetooth pairing. Bluetooth-only use remains available through **Connect over Bluetooth** in Edge or Chrome; it is optional when connected by USB. Both channels require firmware with the Coach beacon feature.

## Contents

- `coach\` — full static browser coach, workflows, and data
- `ahk\charybdis_helpers.ahk` — desktop coach, shortcut/mouse logger, and beacon state bridge
- `keyboard-data\` — Norwegian keyboard map and host preferences used by the helper
- `python\coach_http_server.py` — restricted loopback-only web server
- `Start-Charybdis.ps1` — portable runtime setup, start/stop, status, and sign-in shortcut

No other Charybdis repository is read or required. No layout training or firmware build occurs.

## Runtime sources

First launch fetches official Windows portable runtime archives and verifies SHA-256 before use:

- [AutoHotkey v2.0.28 release](https://github.com/AutoHotkey/AutoHotkey/releases/tag/v2.0.28), GPL-2.0-or-later; SHA-256 `b63be7548792b4ad0dfe424d91cc69376694ed2f758245b7a75a0c77d693b478`.
- [Python 3.13.15 embeddable package](https://www.python.org/downloads/release/python-31315/), PSF license. x64 SHA-256 `d1f04d990aee1253d8569e8e5104e30fa9f5fa830899f14843448872d936a2cf`; ARM64 SHA-256 `cd992cbfb33be433ff20f150691595efb2862e56f4f1bec684c6077d4775af8e`.

The AHK license and Python license are included beside their downloaded runtimes. Runtime downloads are not committed to the repo.
