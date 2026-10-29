import collections
import json
import pathlib
import tempfile
import unittest

from python.update_icon_usage import make_choices, norm_key, read_usage


class IconUsageTests(unittest.TestCase):
    def test_shortcut_normalization_matches_symbols(self):
        self.assertEqual(norm_key("Ctrl + C"), "ctrl+c")
        self.assertEqual(norm_key("Ctrl++"), "ctrl+plus")

    def test_log_aggregation_preserves_layer_and_browser_identity(self):
        rows = [
            {"ts": "2026-10-29T10:00:00Z", "type": "shortcut", "keys": "Ctrl+C", "app": r"C:\\Program Files\\Microsoft\\Edge\\msedge.exe", "layer": "1"},
            {"ts": "2026-10-29T10:00:01Z", "type": "shortcut", "keys": "Ctrl+C", "app": "chrome.exe", "layer": "0"},
            {"ts": "2026-10-29T10:00:02Z", "type": "shortcut", "keys": "Ctrl+C", "app": "discord.exe", "layer": "1"},
            {"ts": "2026-10-29T10:00:03Z", "type": "typing_counter", "keys": "Enter", "app": "msedge.exe", "layer": "0"},
            {"ts": "2026-10-29T10:00:04Z", "type": "shortcut", "keys": "Ctrl+C", "app": "mystery.exe", "layer": "1"},
        ]
        with tempfile.TemporaryDirectory() as temp:
            log = pathlib.Path(temp) / "shortcut_usage.jsonl"
            log.write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")
            global_apps, by_layer, browser, browser_by_layer, meta = read_usage(log)
        self.assertEqual(global_apps["ctrl+c"]["browser (chrome/edge)"], 2)
        self.assertEqual(global_apps["ctrl+c"]["discord"], 1)
        self.assertEqual(by_layer["1"]["ctrl+c"]["discord"], 1)
        self.assertEqual(browser_by_layer["1"]["ctrl+c"]["edge"], 1)
        self.assertEqual(browser["ctrl+c"]["chrome"], 1)
        self.assertEqual(meta["stats"]["unmapped_rows"], 1)

    def test_layer_choice_overrides_global_and_ties_do_not_guess(self):
        bindings = (
            {"1": {"ctrl+c": ["discord", "browser (chrome/edge)"]}},
            {"ctrl+c": ["browser (chrome/edge)", "discord"], "ctrl+v": ["discord", "microsoft excel"]},
        )
        global_apps = {"ctrl+c": collections.Counter({"browser (chrome/edge)": 20, "discord": 2}),
                       "ctrl+v": collections.Counter({"discord": 3, "microsoft excel": 3})}
        layer_apps = {"1": {"ctrl+c": collections.Counter({"discord": 5, "browser (chrome/edge)": 1})}}
        global_browser = {"ctrl+c": collections.Counter({"edge": 10, "chrome": 2})}
        layer_browser = {"1": {"ctrl+c": collections.Counter({"chrome": 4, "edge": 1})}}
        usage = (global_apps, layer_apps, global_browser, layer_browser, {"source": {}, "stats": {}})
        result = make_choices(bindings, usage)
        self.assertEqual(result["shortcutAppChoice"]["ctrl+c"], "browser (chrome/edge)")
        self.assertEqual(result["shortcutAppChoiceByLayer"]["1"]["ctrl+c"], "discord")
        self.assertEqual(result["browserShortcutChoiceByLayer"]["1"]["ctrl+c"], "chrome")
        self.assertNotIn("ctrl+v", result["shortcutAppChoice"])


if __name__ == "__main__":
    unittest.main()
