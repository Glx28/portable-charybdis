#!/usr/bin/env python3
"""Summarize layer-aware shortcut usage and conjunctions after a chosen date."""
from __future__ import annotations

import argparse
import collections
import csv
import datetime as dt
import json
import pathlib
import re
import tempfile
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_LAYOUT = ROOT / "coach" / "data" / "keybindings_explained.csv"
DEFAULT_HOST_MAP = ROOT / "coach" / "data" / "windows_norwegian_host.json"
DEFAULT_REPORTS = ROOT / "runtime" / "workflow-optimization" / "reports"


def parse_date(value: str | None, option: str) -> dt.date | None:
    if value is None:
        return None
    try:
        return dt.date.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"{option} must use YYYY-MM-DD") from error


def event_date(value: Any) -> dt.date | None:
    if not isinstance(value, str):
        return None
    try:
        return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def norm(value: Any) -> str:
    return re.sub(r"\s+", "", str(value or "")).casefold()


def load_bindings(path: pathlib.Path, host_map_path: pathlib.Path
                  ) -> tuple[dict[tuple[str, str], list[dict[str, str]]],
                             dict[tuple[str, str], list[dict[str, str]]]]:
    index: dict[tuple[str, str], list[dict[str, str]]] = collections.defaultdict(list)
    output_index: dict[tuple[str, str], list[dict[str, str]]] = collections.defaultdict(list)
    host_map = json.loads(host_map_path.read_text(encoding="utf-8"))
    outputs = host_map.get("zmk_to_host_output", {})
    with path.open(encoding="utf-8-sig", newline="") as source:
        for row in csv.DictReader(source):
            if not row.get("visual_label") or row["visual_label"].lower() == "transparent":
                continue
            binding = {
                "x": row.get("x", ""), "y": row.get("y", ""),
                "label": row.get("visual_label", ""), "purpose": row.get("purpose", ""),
                "parameter": row.get("parameter", ""),
            }
            layer = str(row.get("layer", ""))
            index[(layer, norm(row["visual_label"]))].append(binding)
            host_output = outputs.get(row.get("parameter", ""), {})
            if isinstance(host_output, dict):
                modifiers = row.get("modifiers", "").casefold()
                shifted = "shift" in modifiers
                altgr = "r alt" in modifiers or "altgr" in modifiers
                for state in ("normal", "shift", "altgr", "altgr_shift"):
                    state_shift = "shift" in state
                    state_altgr = "altgr" in state
                    if shifted and not state_shift or altgr and not state_altgr:
                        continue
                    value = host_output.get(state)
                    if value:
                        output_index[(layer, norm(value))].append({**binding, "output_state": state})
    return dict(index), dict(output_index)


def analyze(log_path: pathlib.Path, layout_path: pathlib.Path,
            since: dt.date, until: dt.date | None = None,
            host_map_path: pathlib.Path = DEFAULT_HOST_MAP) -> dict:
    if until is not None and until <= since:
        raise ValueError("--until must be after --since (exclusive)")
    binding_index, output_binding_index = load_bindings(layout_path, host_map_path)
    shortcut_counts: collections.Counter = collections.Counter()
    shortcut_apps: dict[tuple, collections.Counter] = collections.defaultdict(collections.Counter)
    shortcut_event_types: dict[tuple, collections.Counter] = collections.defaultdict(collections.Counter)
    sequence_counts: collections.Counter = collections.Counter()
    sequence_gaps: dict[tuple, list[int]] = collections.defaultdict(list)
    sequence_apps: dict[tuple, collections.Counter] = collections.defaultdict(collections.Counter)
    symbol_counts: collections.Counter = collections.Counter()
    symbol_apps: dict[tuple, collections.Counter] = collections.defaultdict(collections.Counter)
    dates: collections.Counter = collections.Counter()
    total_shortcuts = total_layer_keys = total_sequences = total_symbols = malformed = 0
    first_ts = last_ts = None

    with log_path.open(encoding="utf-8-sig") as source:
        for line in source:
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                malformed += 1
                continue
            day = event_date(event.get("ts"))
            if day is None or day < since or (until and day >= until):
                continue
            kind = event.get("type")
            if kind not in {"shortcut", "layer_key", "shortcut_sequence", "norwegian_symbol_key"}:
                continue
            if first_ts is None or event["ts"] < first_ts:
                first_ts = event["ts"]
            if last_ts is None or event["ts"] > last_ts:
                last_ts = event["ts"]
            dates[day.isoformat()] += 1

            if kind in {"shortcut", "layer_key"}:
                key = str(event.get("keys", "")).strip()
                layer = str(event.get("layer", "?"))
                if not key:
                    continue
                identity = (layer, key)
                shortcut_counts[identity] += 1
                shortcut_apps[identity][str(event.get("app", "unknown"))] += 1
                shortcut_event_types[identity][kind] += 1
                if kind == "shortcut":
                    total_shortcuts += 1
                else:
                    total_layer_keys += 1
                continue

            if kind == "norwegian_symbol_key":
                output = str(event.get("produced_output", ""))
                if not output:
                    continue
                identity = (
                    str(event.get("layer", "?")), output,
                    str(event.get("modifier_state", "unknown")),
                    str(event.get("physical_key", "unknown")),
                )
                symbol_counts[identity] += 1
                symbol_apps[identity][str(event.get("app", "unknown"))] += 1
                total_symbols += 1
                continue

            source_key, target_key = str(event.get("from", "")).strip(), str(event.get("to", "")).strip()
            if not source_key or not target_key:
                continue
            identity = (
                str(event.get("from_layer", "?")), source_key,
                str(event.get("to_layer", "?")), target_key,
            )
            sequence_counts[identity] += 1
            gap = event.get("gap_ms")
            if isinstance(gap, (int, float)) and gap >= 0:
                sequence_gaps[identity].append(int(gap))
            app_pair = f"{event.get('from_app', 'unknown')} → {event.get('to_app', 'unknown')}"
            sequence_apps[identity][app_pair] += 1
            total_sequences += 1

    def binding(layer: str, key: str) -> list[dict[str, str]]:
        return binding_index.get((layer, norm(key)), [])

    def output_binding(layer: str, value: str) -> list[dict[str, str]]:
        return output_binding_index.get((layer, norm(value)), [])

    shortcuts = []
    for (layer, key), count in shortcut_counts.most_common():
        shortcuts.append({
            "layer": layer, "key": key, "count": count,
            "apps": dict(shortcut_apps[(layer, key)].most_common()),
            "event_types": dict(shortcut_event_types[(layer, key)].most_common()),
            "current_bindings": binding(layer, key),
        })

    sequences = []
    for identity, count in sequence_counts.most_common():
        from_layer, from_key, to_layer, to_key = identity
        gaps = sequence_gaps[identity]
        sequences.append({
            "from_layer": from_layer, "from": from_key,
            "to_layer": to_layer, "to": to_key, "count": count,
            "mean_gap_ms": round(sum(gaps) / len(gaps), 1) if gaps else None,
            "app_pairs": dict(sequence_apps[identity].most_common()),
            "from_bindings": binding(from_layer, from_key),
            "to_bindings": binding(to_layer, to_key),
        })

    symbols = []
    for (layer, output, modifier_state, physical_key), count in symbol_counts.most_common():
        symbols.append({
            "layer": layer, "output": output, "modifier_state": modifier_state,
            "physical_key": physical_key, "count": count,
            "apps": dict(symbol_apps[(layer, output, modifier_state, physical_key)].most_common()),
            "current_bindings": output_binding(layer, output),
        })

    return {
        "source": {"log": log_path.name, "layout": layout_path.name,
                   "host_map": host_map_path.name,
                   "since_inclusive": since.isoformat(),
                   "until_exclusive": until.isoformat() if until else None,
                   "first_included_ts": first_ts, "last_included_ts": last_ts,
                   "malformed_lines_total": malformed},
        "coverage": {"active_days": len(dates), "events_by_day": dict(sorted(dates.items()))},
        "counts": {"shortcut_events": total_shortcuts, "layer_key_events": total_layer_keys,
                   "sequence_events": total_sequences,
                   "symbol_events": total_symbols},
        "shortcuts": shortcuts,
        "sequences": sequences,
        "symbols": symbols,
    }


def markdown(report: dict) -> str:
    source, coverage, counts = report["source"], report["coverage"], report["counts"]
    lines = [
        "# Layer-aware workflow usage", "",
        f"**Log:** `{source['log']}` · **Layout:** `{source['layout']}`",
        f"**Range:** {source['since_inclusive']} inclusive to "
        f"{source['until_exclusive'] or 'present'} exclusive",
        f"**Observed:** {source['first_included_ts'] or 'no matching events'} → "
        f"{source['last_included_ts'] or 'no matching events'}",
        f"**Coverage:** {coverage['active_days']} active days · "
        f"{counts['shortcut_events']} L0 shortcuts · {counts['layer_key_events']} layer-key actions · "
        f"{counts['sequence_events']} sequences · "
        f"{counts['symbol_events']} symbols",
        "",
        "This report describes observed events only. Active days do not prove logger uptime.",
        "The logger calls L0 actions `shortcut` and non-L0 actions `layer_key`; both appear in the action table.",
        "Symbol outputs are matched through the nb-NO host map, not by US-HID labels. An unmatched output has no current binding in that layer.",
        "",
        "## Shortcut use by layer", "",
        "| Layer | Shortcut | Uses | Logger event types | Current binding | Apps |",
        "|---:|---|---:|---|---|---|",
    ]
    for item in report["shortcuts"]:
        places = ", ".join(f"x{b['x']} y{b['y']}" for b in item["current_bindings"]) or "unmatched"
        apps = ", ".join(f"{name} ({count})" for name, count in list(item["apps"].items())[:3])
        types = ", ".join(f"{name}: {count}" for name, count in item["event_types"].items())
        lines.append(f"| {item['layer']} | {item['key']} | {item['count']} | {types} | {places} | {apps} |")
    lines += ["", "## Shortcuts used in conjunction", "",
              "| From | To | Uses | Mean gap | App pairs |",
              "|---|---|---:|---:|---|"]
    for item in report["sequences"][:100]:
        source_binding = ", ".join(f"x{b['x']} y{b['y']}" for b in item["from_bindings"]) or "unmatched"
        target_binding = ", ".join(f"x{b['x']} y{b['y']}" for b in item["to_bindings"]) or "unmatched"
        apps = ", ".join(f"{name} ({count})" for name, count in list(item["app_pairs"].items())[:2])
        gap = f"{item['mean_gap_ms']} ms" if item["mean_gap_ms"] is not None else "n/a"
        lines.append(f"| L{item['from_layer']} {item['from']} ({source_binding}) | "
                     f"L{item['to_layer']} {item['to']} ({target_binding}) | {item['count']} | {gap} | {apps} |")
    lines += ["", "## Norwegian symbol output", "",
              "| Layer | Output | Modifier | Physical key | Uses | Current binding (HID label/parameter) | Apps |",
              "|---:|---|---|---|---:|---|---|"]
    for item in report["symbols"]:
        places = ", ".join(
            f"x{b['x']} y{b['y']} label `{b['label']}` / HID `{b['parameter']}` "
            f"({b['output_state']})" for b in item["current_bindings"]
        ) or "unmatched"
        apps = ", ".join(f"{name} ({count})" for name, count in list(item["apps"].items())[:3])
        output = item["output"].replace("|", "\\|").replace("\n", "\\n")
        lines.append(f"| {item['layer']} | `{output}` | {item['modifier_state']} | "
                     f"{item['physical_key']} | {item['count']} | {places} | {apps} |")
    lines.append("")
    return "\n".join(lines)


def write_report(report: dict, out_dir: pathlib.Path) -> tuple[pathlib.Path, pathlib.Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    day = dt.datetime.now(dt.timezone.utc).date().isoformat()
    stem = f"usage-{report['source']['since_inclusive']}-through-{report['source']['until_exclusive'] or day}"
    json_path, md_path = out_dir / f"{stem}.json", out_dir / f"{stem}.md"
    for path, content in ((json_path, json.dumps(report, ensure_ascii=False, indent=2) + "\n"),
                          (md_path, markdown(report))):
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=out_dir,
                                         delete=False, newline="\n") as handle:
            handle.write(content)
            temporary = pathlib.Path(handle.name)
        temporary.replace(path)
    return json_path, md_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--log", type=pathlib.Path, required=True)
    parser.add_argument("--layout", type=pathlib.Path, default=DEFAULT_LAYOUT)
    parser.add_argument("--host-map", type=pathlib.Path, default=DEFAULT_HOST_MAP)
    parser.add_argument("--since", required=True, help="YYYY-MM-DD inclusive; use layout application date")
    parser.add_argument("--until", help="YYYY-MM-DD exclusive")
    parser.add_argument("--out-dir", type=pathlib.Path, default=DEFAULT_REPORTS)
    args = parser.parse_args()
    try:
        report = analyze(args.log, args.layout, parse_date(args.since, "--since"),
                         parse_date(args.until, "--until"), args.host_map)
        for path in write_report(report, args.out_dir):
            print(path)
    except (OSError, ValueError) as error:
        parser.error(str(error))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
