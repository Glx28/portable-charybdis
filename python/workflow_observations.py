#!/usr/bin/env python3
"""Store metadata-only workflow improvement observations in portable runtime."""
from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import re
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_LOG = ROOT / "runtime" / "workflow-optimization" / "observations.jsonl"
STATUSES = {"discovered", "validated", "implemented", "rejected"}
FEEDBACK = {"worked", "failed", "needs-adjustment", "not-tested"}


def now_utc() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_events(path: pathlib.Path) -> list[dict]:
    if not path.exists():
        return []
    events = []
    with path.open(encoding="utf-8") as source:
        for number, line in enumerate(source, 1):
            if not line.strip():
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as error:
                raise ValueError(f"Invalid JSONL at {path}:{number}: {error}") from error
            if isinstance(value, dict):
                events.append(value)
    return events


def current_observations(events: list[dict]) -> dict[str, dict]:
    current: dict[str, dict] = {}
    for event in events:
        observation_id = event.get("id")
        if not observation_id:
            continue
        if event.get("event") == "observation":
            current[observation_id] = {**event, "feedback": []}
        elif event.get("event") == "update" and observation_id in current:
            record = current[observation_id]
            record["status"] = event["status"]
            record["feedback"].append({"at": event["timestamp"], "result": event["result"]})
    return current


def append_event(path: pathlib.Path, event: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as target:
        target.write(json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n")


def clean_list(values: list[str]) -> list[str]:
    return [value.strip() for value in values if value.strip()]


def add_observation(path: pathlib.Path, args: argparse.Namespace) -> str:
    events = load_events(path)
    identifier = args.id or dt.datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + re.sub(
        r"[^a-z0-9]+", "-", args.slug.lower()
    ).strip("-")
    if identifier in current_observations(events):
        raise ValueError(f"Observation already exists: {identifier}")
    if args.seconds_high < args.seconds_low:
        raise ValueError("--seconds-high must be greater than or equal to --seconds-low")
    if not 0 <= args.confidence <= 1:
        raise ValueError("--confidence must be between 0 and 1")

    event = {
        "event": "observation",
        "id": identifier,
        "timestamp": now_utc(),
        "task": args.task.strip(),
        "apps": clean_list(args.app),
        "friction": clean_list(args.friction),
        "candidate": args.candidate.strip(),
        "mechanism": clean_list(args.mechanism),
        "evidence": clean_list(args.evidence),
        "benefit": {
            "frequency": args.frequency,
            "seconds_low": args.seconds_low,
            "seconds_high": args.seconds_high,
            "confidence": args.confidence,
        },
        "status": "discovered",
    }
    append_event(path, event)
    return identifier


def update_observation(path: pathlib.Path, identifier: str, status: str, result: str) -> None:
    observations = current_observations(load_events(path))
    if identifier not in observations:
        raise ValueError(f"Unknown observation: {identifier}")
    append_event(path, {
        "event": "update", "id": identifier, "timestamp": now_utc(),
        "status": status, "result": result,
    })


def render_daily(observations: dict[str, dict], day: str) -> str:
    selected = [item for item in observations.values() if item["timestamp"][:10] == day]
    lines = [f"# Workflow observations — {day}", ""]
    if not selected:
        return "\n".join(lines + ["No observations recorded.", ""])
    for item in sorted(selected, key=lambda row: row["timestamp"]):
        benefit = item["benefit"]
        lines += [
            f"## {item['task']}",
            "",
            f"**ID:** `{item['id']}`  ",
            f"**Status:** {item['status']}  ",
            f"**Apps:** {', '.join(item['apps']) or 'unspecified'}  ",
            f"**Frequency:** {benefit['frequency']} · **Estimated saving:** "
            f"{benefit['seconds_low']}–{benefit['seconds_high']} sec/use · "
            f"**Confidence:** {benefit['confidence']:.0%}",
            "",
            f"**Friction:** {', '.join(item['friction']) or 'unspecified'}  ",
            f"**Candidate:** {item['candidate']}  ",
            f"**Mechanism:** {', '.join(item['mechanism']) or 'unspecified'}  ",
            f"**Evidence:** {', '.join(item['evidence']) or 'not recorded'}",
        ]
        for update in item["feedback"]:
            lines.append(f"**Result ({update['at']}):** {update['result']}")
        lines.append("")
    return "\n".join(lines)


def write_daily(path: pathlib.Path, day: str) -> pathlib.Path:
    destination = path.parent / "daily" / f"{day}.md"
    destination.parent.mkdir(parents=True, exist_ok=True)
    content = render_daily(current_observations(load_events(path)), day)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=destination.parent,
                                     delete=False, newline="\n") as handle:
        handle.write(content)
        temporary = pathlib.Path(handle.name)
    temporary.replace(destination)
    return destination


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("--log", type=pathlib.Path, default=DEFAULT_LOG)
    commands = root.add_subparsers(dest="command", required=True)

    add = commands.add_parser("add", help="record a material workflow improvement")
    add.add_argument("--id")
    add.add_argument("--slug", default="workflow")
    add.add_argument("--task", required=True, help="short workflow label; do not include source text")
    add.add_argument("--app", action="append", default=[])
    add.add_argument("--friction", action="append", default=[])
    add.add_argument("--candidate", required=True)
    add.add_argument("--mechanism", action="append", default=[])
    add.add_argument("--evidence", action="append", default=[])
    add.add_argument("--frequency", choices=["high", "medium", "low", "unknown"], default="unknown")
    add.add_argument("--seconds-low", type=float, default=0)
    add.add_argument("--seconds-high", type=float, default=0)
    add.add_argument("--confidence", type=float, default=0.5)

    update = commands.add_parser("update", help="append a test result to an observation")
    update.add_argument("id")
    update.add_argument("--status", choices=sorted(STATUSES), required=True)
    update.add_argument("--result", choices=sorted(FEEDBACK), required=True)

    report = commands.add_parser("report", help="write a daily Markdown view")
    report.add_argument("--date", default=dt.datetime.now(dt.timezone.utc).date().isoformat())
    return root


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        if args.command == "add":
            identifier = add_observation(args.log, args)
            print(identifier)
        elif args.command == "update":
            update_observation(args.log, args.id, args.status, args.result)
            print(f"updated {args.id}")
        else:
            print(write_daily(args.log, args.date))
    except (OSError, ValueError) as error:
        print(error, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
