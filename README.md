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

When port 8765 is occupied, the launcher finds another free local port and gives the coach that port. The browser coach is available from the helper tray menu as “Open Web Coach.”

To update, open this folder in PowerShell and run `git pull`, then run `Start-Charybdis.cmd -Action Restart`.

## Keyboard connection

Coach layer tracking uses the Charybdis private BLE beacon service. On first use, open Coach in Microsoft Edge or Chrome and click **Connect keyboard**, then choose `V&Z-Charydbis`. The browser remembers permission and reconnects on later starts. The keyboard needs firmware with the Coach GATT beacon service; regular keyboard HID reports remain unchanged.

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
