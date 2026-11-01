# Portable Charybdis

One Windows repo for using the Charybdis keyboard. Includes the complete web coach, desktop coach/logger/beacon helper, Norwegian layout and app data, and a one-click launcher. No firmware, optimizer, developer tools, installed Python, or installed AutoHotkey required.

## Start

Clone this repo, then double-click `Start-Charybdis.cmd`. First run downloads small, pinned portable AHK and Python runtimes into this repo's ignored `runtime\dependencies\` folder. Download hashes are checked before extraction. Coach and logger start together. The browser does not open automatically; use `-OpenBrowser` when you want a tab.

```powershell
git clone https://github.com/Glx28/portable-charybdis.git
cd portable-charybdis
.\Start-Charybdis.cmd
.\Start-Charybdis.cmd -OpenBrowser
```

You need Windows 10/11, internet access for the first launch, and Git to clone/pull. Runtime files and keyboard usage logs stay under `runtime\` and are excluded from Git. Move or copy the whole folder to another computer; its local runtime is portable too. A fresh clone downloads the runtimes on first start.

## Use

- `Start-Charybdis.cmd` — start logger, beacon handler, and coach
- `Start-Charybdis.cmd -OpenBrowser` — start the stack and open Coach in the default browser
- `Start-Charybdis.cmd -Action Status` — show component status and coach URL
- `Start-Charybdis.cmd -Action Restart` — restart both components
- `Start-Charybdis.cmd -Action Stop` — stop both components
- `Start-Charybdis.cmd -Action InstallStartup` — start automatically at Windows sign-in
- `Start-Charybdis.cmd -Action UninstallStartup` — remove automatic startup

For input fault diagnosis, run `runtime\dependencies\autohotkey-2.0.28\AutoHotkey64.exe ahk\device_diagnostic.ahk`. It passively records physical key identifiers and mouse movement to `runtime\device_diagnostic.jsonl`; it does not capture typed characters or consume input. Exit from its tray icon menu.

The Coach always uses `coach_server_port` from `keyboard-data\config\charybdis_helper.json` (8765 by default). If another process owns that port, startup stops with an error; it never starts a second Coach on a nearby port. The browser coach is available from the helper tray menu as “Open Web Coach.”

To update, open this folder in PowerShell and run `git pull`, then run `Start-Charybdis.cmd -Action Restart`.

## Current keyboard layout

`coach\data\keybindings_explained.csv` is the single authoritative layout table. Coach reads it directly; the Windows logger reads the same file for coordinate and layer attribution. `coach\data\final_user_layout_v2.json` and the matching apply/verify scripts are the companion export artifacts. There is no second layout copy under `keyboard-data\` that can silently drift. This repository supplies layout and Coach files, not firmware.

Starting after `git pull` replaces helper/server processes from older Portable Charybdis folders and repoints recognized Portable Charybdis sign-in shortcuts to this checkout. Other applications and unrelated AHK/Python processes are left alone. It keeps one configured Coach port; a conflicting listener causes an explicit startup error instead of a stale browser tab silently reaching another instance.

`Start-Charybdis.cmd` starts both Coach and the keyboard logger. Startup waits for the current logger version to register its hooks and fails with a `hook_debug.log` path if logging did not initialize. Usage events are written to `runtime\shortcut_usage.jsonl` with the active layer. Norwegian symbol events include the physical key, translated output, modifier state (including AltGr), and active layer.

On L1, x2,y1 opens PowerToys Command Palette (`Win+Alt+Space`). Adjacent x1,y1 is the dedicated **Walk This Way** switcher key. It opens the palette, waits until that window has focus, then types `<` to activate Walk This Way. Type part of the target app or window title and press Enter. Install and enable the Walk This Way Command Palette extension once on each computer; the portable helper handles the one-key sequence. Its internal trigger chord is `Ctrl+Alt+Win+F11` and is only consumed while Coach reports L1. L1 x1,y0 remains PowerToys Run (`Alt+Space`).

The helper counts Norwegian punctuation keys from the matching Charybdis USB device, grouped by physical key, Shift/AltGr state, app process, and Coach layer. It does not store emitted characters or ordinary typed text.

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
