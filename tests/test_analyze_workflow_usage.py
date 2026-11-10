import csv
import datetime as dt
import importlib.util
import json
import pathlib
import tempfile
import unittest

MODULE_PATH = pathlib.Path(__file__).resolve().parents[1] / "python" / "analyze_workflow_usage.py"
SPEC = importlib.util.spec_from_file_location("analyze_workflow_usage", MODULE_PATH)
analyzer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(analyzer)


class WorkflowUsageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.temp.name)
        self.log = self.root / "usage.jsonl"
        self.layout = self.root / "layout.csv"
        self.host_map = self.root / "host-map.json"
        with self.layout.open("w", encoding="utf-8", newline="") as target:
            writer = csv.DictWriter(target, fieldnames=["layer", "x", "y", "visual_label", "purpose", "parameter", "modifiers"])
            writer.writeheader()
            writer.writerows([
                {"layer": "0", "x": "12", "y": "3", "visual_label": "\\", "purpose": "US HID label", "parameter": "Backslash and Pipe"},
                {"layer": "2", "x": "1", "y": "2", "visual_label": "<", "purpose": "Norwegian less-than", "parameter": "Non-US Backslash and Pipe"},
                {"layer": "2", "x": "2", "y": "2", "visual_label": "@", "purpose": "At symbol", "parameter": "2 and At", "modifiers": "R Alt"},
                {"layer": "2", "x": "3", "y": "2", "visual_label": "=", "purpose": "Equals", "parameter": "0 and Right Bracket", "modifiers": "R Alt"},
                {"layer": "2", "x": "4", "y": "2", "visual_label": "+", "purpose": "Plus", "parameter": "Dash and Underscore"},
                {"layer": "2", "x": "5", "y": "2", "visual_label": "?", "purpose": "Question mark", "parameter": "Dash and Underscore", "modifiers": "L Shift"},
                {"layer": "3", "x": "8", "y": "1", "visual_label": "Ctrl+V", "purpose": "Paste", "parameter": "V", "modifiers": "L Ctrl"},
            ])
        self.host_map.write_text(json.dumps({"zmk_to_host_output": {
            "Backslash and Pipe": {"normal": "'", "shift": "*"},
            "Non-US Backslash and Pipe": {"normal": "<", "shift": ">", "altgr": "|"},
            "2 and At": {"normal": "2", "shift": '"', "altgr": "@"},
            "0 and Right Bracket": {"normal": "0", "shift": "=", "altgr": "}"},
            "Dash and Underscore": {"normal": "+", "shift": "?"},
        }}), encoding="utf-8")
        events = [
            {"type": "shortcut", "ts": "2026-11-05T12:00:00Z", "layer": "2", "keys": "<", "app": "code.exe"},
            {"type": "layer_key", "ts": "2026-11-05T12:00:01Z", "layer": "2", "keys": "Ctrl+F", "app": "msedge.exe"},
            {"type": "shortcut", "ts": "2026-11-05T12:00:02Z", "layer": "3", "keys": "Ctrl+V", "app": "msedge.exe"},
            {"type": "shortcut_sequence", "ts": "2026-11-05T12:00:02Z", "from_layer": "2", "from": "<", "to_layer": "3", "to": "Ctrl+V", "gap_ms": 800, "from_app": "code.exe", "to_app": "msedge.exe"},
            {"type": "norwegian_symbol_key", "ts": "2026-11-05T12:01:00Z", "layer": "0", "physical_key": "SC00D", "produced_output": "\\", "modifier_state": "normal", "app": "code.exe"},
            {"type": "norwegian_symbol_key", "ts": "2026-11-05T12:01:05Z", "layer": "0", "physical_key": "SC02B", "produced_output": "'", "modifier_state": "normal", "app": "code.exe"},
            {"type": "norwegian_symbol_key", "ts": "2026-11-05T12:01:10Z", "layer": "2", "physical_key": "SC056", "produced_output": "<", "modifier_state": "normal", "app": "code.exe"},
            {"type": "norwegian_symbol_key", "ts": "2026-11-05T12:01:11Z", "layer": "2", "physical_key": "SC056", "produced_output": ">", "modifier_state": "shift", "app": "code.exe"},
            {"type": "norwegian_symbol_key", "ts": "2026-11-05T12:01:12Z", "layer": "2", "physical_key": "SC056", "produced_output": "|", "modifier_state": "altgr", "app": "code.exe"},
            {"type": "norwegian_symbol_key", "ts": "2026-11-05T12:01:13Z", "layer": "2", "physical_key": "2", "produced_output": "@", "modifier_state": "altgr", "app": "code.exe"},
            {"type": "norwegian_symbol_key", "ts": "2026-11-05T12:01:14Z", "layer": "2", "physical_key": "0", "produced_output": "=", "modifier_state": "shift", "app": "code.exe"},
            {"type": "norwegian_symbol_key", "ts": "2026-11-05T12:01:15Z", "layer": "2", "physical_key": "SC00C", "produced_output": "+", "modifier_state": "normal", "app": "code.exe"},
            {"type": "norwegian_symbol_key", "ts": "2026-11-05T12:01:16Z", "layer": "2", "physical_key": "SC00C", "produced_output": "?", "modifier_state": "shift", "app": "code.exe"},
            {"type": "shortcut", "ts": "2026-11-04T12:00:00Z", "layer": "0", "keys": "Ctrl+C", "app": "msedge.exe"},
        ]
        self.log.write_text("\n".join(json.dumps(event) for event in events) + "\n", encoding="utf-8")

    def tearDown(self):
        self.temp.cleanup()

    def test_filters_by_since_and_joins_bindings_and_sequences(self):
        report = analyzer.analyze(self.log, self.layout, dt.date(2026, 11, 5), host_map_path=self.host_map)
        self.assertEqual(report["counts"], {"shortcut_events": 2, "layer_key_events": 1, "sequence_events": 1, "symbol_events": 9})
        self.assertEqual(report["coverage"]["active_days"], 1)
        self.assertEqual(report["shortcuts"][0]["current_bindings"][0]["x"], "1")
        pair = report["sequences"][0]
        self.assertEqual((pair["from"], pair["to"], pair["mean_gap_ms"]), ("<", "Ctrl+V", 800))
        symbol = report["symbols"][0]
        outputs = {item["output"] for item in report["symbols"]}
        self.assertEqual(outputs, {"\\", "'", "<", ">", "|", "@", "=", "+", "?"})
        backslash = next(item for item in report["symbols"] if item["output"] == "\\")
        self.assertEqual(backslash["current_bindings"], [])
        apostrophe = next(item for item in report["symbols"] if item["output"] == "'")
        self.assertEqual(apostrophe["current_bindings"][0]["label"], "\\")
        self.assertIn("x12 y3 label `\\`", analyzer.markdown(report))
        layer_action = next(item for item in report["shortcuts"] if item["key"] == "Ctrl+F")
        self.assertEqual(layer_action["event_types"], {"layer_key": 1})
        equals = next(item for item in report["symbols"] if item["output"] == "=")
        self.assertEqual(equals["current_bindings"], [])
        self.assertIn("`\\`", analyzer.markdown(report))

    def test_invalid_date_window_fails(self):
        with self.assertRaisesRegex(ValueError, "after --since"):
            analyzer.analyze(self.log, self.layout, dt.date(2026, 11, 5), dt.date(2026, 11, 5), host_map_path=self.host_map)


if __name__ == "__main__":
    unittest.main()
