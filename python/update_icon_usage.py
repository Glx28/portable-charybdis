#!/usr/bin/env python3
"""Regenerate Coach app-icon choices from layer-aware shortcut logs.

Reads logger events and keybinding CSVs; writes only selected icon choices, never
per-app usage counts or raw events.
"""
from __future__ import annotations

import argparse
import collections
import csv
import json
import os
import pathlib
import re
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
APP_BY_EXE = {
    "msedge.exe": "browser (chrome/edge)", "chrome.exe": "browser (chrome/edge)",
    "windowsterminal.exe": "windows terminal / powershell", "powershell.exe": "windows terminal / powershell",
    "pwsh.exe": "windows terminal / powershell", "discord.exe": "discord", "explorer.exe": "file explorer",
    "code.exe": "visual studio code", "code - insiders.exe": "visual studio code", "excel.exe": "microsoft excel",
    "outlook.exe": "microsoft outlook", "olk.exe": "microsoft outlook", "winword.exe": "microsoft word",
    "powerpnt.exe": "microsoft powerpoint", "teams.exe": "microsoft teams", "ms-teams.exe": "microsoft teams",
    "taskmgr.exe": "windows 11", "searchhost.exe": "windows 11", "shellexperiencehost.exe": "windows 11",
    "startmenuexperiencehost.exe": "windows 11", "systemsettings.exe": "windows 11",
    "powertoys.exe": "powertoys", "powertoys.settings.exe": "powertoys", "m-files.exe": "m-files desktop client",
}
BROWSER_BY_EXE = {"msedge.exe": "edge", "chrome.exe": "chrome"}
BROWSER_ASSETS = {"edge": ("edge.png", "Microsoft Edge"), "chrome": ("chrome.png", "Google Chrome")}


def norm_key(value: object) -> str:
    key = "".join(str(value or "").lower().split())
    return key.replace("++", "+plus")


def exe_name(value: object) -> str:
    return re.split(r"[\\/]", str(value or ""))[-1].lower()


def app_for_row(row: dict) -> str:
    match = re.search(r"\bApp:\s*([^,;]+)", row.get("usage_notes", ""), re.I)
    return match.group(1).strip().lower() if match else str(row.get("app", "")).strip().lower()


def load_bindings(csv_path: pathlib.Path) -> tuple[dict, dict]:
    by_layer: dict[str, dict[str, list[str]]] = collections.defaultdict(lambda: collections.defaultdict(list))
    global_apps: dict[str, list[str]] = collections.defaultdict(list)
    with csv_path.open(encoding="utf-8-sig", newline="") as source:
        for row in csv.DictReader(source):
            key, app, layer = norm_key(row.get("visual_label")), app_for_row(row), str(row.get("layer", ""))
            if not key or not app or not row.get("purpose") or row["purpose"].startswith("Dynamic layer access"):
                continue
            if app not in by_layer[layer][key]:
                by_layer[layer][key].append(app)
            if app not in global_apps[key]:
                global_apps[key].append(app)
    return dict(by_layer), dict(global_apps)


def read_usage(log_path: pathlib.Path) -> tuple[dict, dict, dict, dict, dict]:
    global_apps: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
    layer_apps: dict[str, dict[str, collections.Counter]] = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
    global_browser: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
    layer_browser: dict[str, dict[str, collections.Counter]] = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
    latest = ""
    total_rows = mapped_rows = unmapped_rows = 0
    with log_path.open(encoding="utf-8") as source:
        for line in source:
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            latest = max(latest, str(event.get("ts", "")))
            if event.get("type") != "shortcut":
                continue
            shortcut = norm_key(event.get("keys"))
            if not shortcut:
                continue
            total_rows += 1
            exe = exe_name(event.get("app"))
            app = APP_BY_EXE.get(exe)
            if app is None:
                unmapped_rows += 1
                continue
            mapped_rows += 1
            layer = str(event.get("layer", ""))
            global_apps[shortcut][app] += 1
            if layer:
                layer_apps[layer][shortcut][app] += 1
            browser = BROWSER_BY_EXE.get(exe)
            if browser:
                global_browser[shortcut][browser] += 1
                if layer:
                    layer_browser[layer][shortcut][browser] += 1
    source_info = {"file": log_path.name, "event_type": "shortcut", "observed_through": latest,
                   "app_resolution": "Known foreground executable names mapped to Coach app labels; unknown executables ignored."}
    stats = {"event_rows": total_rows, "mapped_rows": mapped_rows, "unmapped_rows": unmapped_rows}
    return global_apps, layer_apps, global_browser, layer_browser, {"source": source_info, "stats": stats}


def preferred(candidates: list[str], observed: collections.Counter | dict) -> str | None:
    ranked = sorted(((int(observed.get(app, 0)), app) for app in candidates), reverse=True)
    if not ranked or ranked[0][0] <= 0:
        return None
    if len(ranked) > 1 and ranked[0][0] == ranked[1][0]:
        return None
    return ranked[0][1]


def make_choices(bindings: tuple[dict, dict], usage: tuple[dict, dict, dict, dict, dict]) -> dict:
    by_layer, global_candidates = bindings
    global_apps, layer_apps, global_browser, layer_browser, _meta = usage
    app_global: dict[str, str] = {}
    app_layer: dict[str, dict[str, str]] = collections.defaultdict(dict)
    browser_global: dict[str, str] = {}
    browser_layer: dict[str, dict[str, str]] = collections.defaultdict(dict)

    for shortcut, candidates in global_candidates.items():
        if len(candidates) > 1:
            choice = preferred(candidates, global_apps.get(shortcut, {}))
            if choice:
                app_global[shortcut] = choice
        if "browser (chrome/edge)" in candidates:
            choice = preferred(["edge", "chrome"], global_browser.get(shortcut, {}))
            if choice:
                browser_global[shortcut] = choice

    for layer, entries in by_layer.items():
        for shortcut, candidates in entries.items():
            if len(candidates) > 1:
                layer_counts = layer_apps.get(layer, {}).get(shortcut, {})
                layer_choice = preferred(candidates, layer_counts)
                if layer_choice is None:
                    layer_choice = preferred(candidates, global_apps.get(shortcut, {}))
                if layer_choice:
                    app_layer[layer][shortcut] = layer_choice
            if "browser (chrome/edge)" in candidates:
                brand = preferred(["edge", "chrome"], layer_browser.get(layer, {}).get(shortcut, {}))
                if brand is None:
                    brand = preferred(["edge", "chrome"], global_browser.get(shortcut, {}))
                if brand:
                    browser_layer[layer][shortcut] = brand
    return {"shortcutAppChoice": app_global, "shortcutAppChoiceByLayer": dict(app_layer),
            "browserShortcutChoice": browser_global, "browserShortcutChoiceByLayer": dict(browser_layer)}


def write_json(path: pathlib.Path, data: dict) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as target:
            json.dump(data, target, ensure_ascii=False, indent=2)
            target.write("\n")
        os.replace(temp_name, path)
    except Exception:
        pathlib.Path(temp_name).unlink(missing_ok=True)
        raise


def update_manifest(path: pathlib.Path, bindings: tuple[dict, dict], usage: tuple, source_csv: pathlib.Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    data.update(make_choices(bindings, usage))
    data["usageSource"] = usage[4]["source"] | {"layout": source_csv.name}
    for key in ("shortcutAppUsage", "shortcutAppUsageByLayer", "browserShortcutUsage", "browserShortcutUsageByLayer"):
        data.pop(key, None)
    for shortcut in ("Ctrl+C", "Ctrl+V"):
        data.get("shortcutOverrides", {}).pop(shortcut, None)
        data.get("overrideLabels", {}).pop(shortcut, None)
    write_json(path, data)
    return data


def update_source_manifest(path: pathlib.Path, bindings: tuple[dict, dict], usage: tuple, source_csv: pathlib.Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    choices = make_choices(bindings, usage)
    data["shortcut_app_choice"] = choices["shortcutAppChoice"]
    data["shortcut_app_choice_by_layer"] = choices["shortcutAppChoiceByLayer"]
    data["browser_shortcut_choice"] = choices["browserShortcutChoice"]
    data["browser_shortcut_choice_by_layer"] = choices["browserShortcutChoiceByLayer"]
    data["usage_source"] = usage[4]["source"] | {"layout": source_csv.name}
    for key in ("shortcut_app_usage", "shortcut_app_usage_by_layer", "browser_shortcut_usage", "browser_shortcut_usage_by_layer"):
        data.pop(key, None)
    browser = data.setdefault("browser", {})
    for icon in browser.setdefault("by_shortcut", {}).values():
        icon.pop("shortcut_uses", None)
    for shortcut, brand in choices["browserShortcutChoice"].items():
        file, name = BROWSER_ASSETS[brand]
        browser.setdefault("by_shortcut", {})[shortcut] = {"src": f"./assets/app-icons/{file[:-4]}.ico", "name": name}
    write_json(path, data)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--log", type=pathlib.Path, required=True, help="Portable runtime shortcut_usage.jsonl")
    parser.add_argument("--layout", type=pathlib.Path, default=ROOT / "coach/data/keybindings_explained.csv")
    parser.add_argument("--portable-icons", type=pathlib.Path, default=ROOT / "coach/data/shortcut_app_icons.json")
    parser.add_argument("--source-icons", type=pathlib.Path, help="Optional standalone Coach app_icon_manifest.json")
    parser.add_argument("--source-layout", type=pathlib.Path, help="CSV matching --source-icons")
    args = parser.parse_args()
    if not args.log.is_file(): parser.error(f"usage log not found: {args.log}")
    if args.source_icons and not args.source_layout: parser.error("--source-layout is required with --source-icons")
    usage = read_usage(args.log)
    bindings = load_bindings(args.layout)
    portable = update_manifest(args.portable_icons, bindings, usage, args.layout)
    if args.source_icons:
        source_bindings = load_bindings(args.source_layout)
        update_source_manifest(args.source_icons, source_bindings, usage, args.source_layout)
    stats = usage[4]["stats"]
    print(f"shortcut rows={stats['event_rows']}; mapped app rows={stats['mapped_rows']}; unmapped rows={stats['unmapped_rows']}; observed through={usage[4]['source']['observed_through']}")
    print(f"portable conflicts with choices={len(portable['shortcutAppChoice'])}; layer choices={sum(map(len, portable['shortcutAppChoiceByLayer'].values()))}; browser brands={len(portable['browserShortcutChoice'])}")


if __name__ == "__main__":
    main()
