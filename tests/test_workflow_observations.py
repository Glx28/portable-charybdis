import argparse
import importlib.util
import pathlib
import tempfile
import unittest

MODULE_PATH = pathlib.Path(__file__).resolve().parents[1] / "python" / "workflow_observations.py"
SPEC = importlib.util.spec_from_file_location("workflow_observations", MODULE_PATH)
workflow = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(workflow)


class WorkflowObservationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.log = pathlib.Path(self.temp.name) / "observations.jsonl"

    def tearDown(self):
        self.temp.cleanup()

    def args(self, **changes):
        values = dict(
            id="copy-latest", slug="copy", task="Copy latest response",
            app=["Edge"], friction=["manual-selection"],
            candidate="Use the response copy control", mechanism=["browser-extension"],
            evidence=["synthetic-test"], frequency="medium", seconds_low=2,
            seconds_high=5, confidence=0.7,
        )
        values.update(changes)
        return argparse.Namespace(**values)

    def test_add_update_and_daily_view(self):
        identifier = workflow.add_observation(self.log, self.args())
        workflow.update_observation(self.log, identifier, "validated", "worked")
        current = workflow.current_observations(workflow.load_events(self.log))
        item = current[identifier]
        report = workflow.render_daily(current, item["timestamp"][:10])
        self.assertIn("Copy latest response", report)
        self.assertIn("Status:** validated", report)
        self.assertIn("Result", report)
        self.assertEqual(len(workflow.load_events(self.log)), 2)

    def test_duplicate_id_rejected(self):
        workflow.add_observation(self.log, self.args())
        with self.assertRaisesRegex(ValueError, "already exists"):
            workflow.add_observation(self.log, self.args())

    def test_invalid_benefit_ranges_rejected(self):
        with self.assertRaisesRegex(ValueError, "seconds-high"):
            workflow.add_observation(self.log, self.args(seconds_low=6, seconds_high=2))
        with self.assertRaisesRegex(ValueError, "confidence"):
            workflow.add_observation(self.log, self.args(id="other", confidence=1.1))

    def test_daily_report_written_atomically(self):
        workflow.add_observation(self.log, self.args())
        day = workflow.load_events(self.log)[0]["timestamp"][:10]
        path = workflow.write_daily(self.log, day)
        self.assertTrue(path.is_file())
        self.assertIn("Copy latest response", path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
