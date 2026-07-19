"""Unit checks for WebMCP XML contract renderer + assignment corpus (no paid judge runs)."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import webmcp_h3  # noqa: E402


class TestWebmcpContract(unittest.TestCase):
    def test_every_task_has_dimension_tomls(self) -> None:
        existing = {"core_features", "visual_design", "motion", "technical"}
        full = existing | {
            "user_flows", "edge_cases", "responsiveness", "accessibility",
            "performance", "writing", "innovation", "design_fidelity",
            "mcp_contract", "anticheat", "behavioral",
        }
        task_dirs = sorted(
            path for path in (ROOT / "tasks").iterdir()
            if path.is_dir() and path.name.startswith("frontend-")
            and (path / "instruction.md").is_file()
        )
        self.assertTrue(task_dirs)
        anticheat_count = sum(
            (task / "tests" / "anticheat").is_dir() for task in task_dirs
        )
        required = full if anticheat_count > len(task_dirs) / 2 else existing
        missing = [
            f"{task.name}/tests/{dim}/{dim}.toml"
            for task in task_dirs
            for dim in sorted(required)
            if not (task / "tests" / dim / f"{dim}.toml").is_file()
        ]
        self.assertEqual(missing, [], f"tasks missing required dimension tomls: {missing}")

    def test_task_toml_artifact_excludes(self) -> None:
        """Every task.toml must carry the full canonical artifact-exclude set
        (build outputs like dist/ must never be collected into artifacts)."""
        import tomllib
        import package_frontend_tasks as pft

        tomls = sorted(ROOT.glob("tasks/*/task.toml"))
        self.assertGreaterEqual(len(tomls), 65)
        for f in tomls:
            data = tomllib.loads(f.read_text())
            artifacts = data.get("artifacts") or []
            self.assertTrue(artifacts, f"{f} has no [[artifacts]]")
            for art in artifacts:
                excludes = set(art.get("exclude") or [])
                missing = set(pft.ARTIFACT_EXCLUDES) - excludes
                self.assertFalse(
                    missing,
                    f"{f} artifact {art.get('source')} missing excludes: {sorted(missing)}",
                )

    def test_canonical_prompts_policy(self) -> None:
        builder = ROOT / "scripts/canonical/agent_system_prompt.md"
        self.assertFalse(
            builder.exists(),
            "builder agent_system_prompt.md must be deleted; policy lives in instruction.md",
        )
        judge = (ROOT / "scripts/canonical/system_prompt.md").read_text()
        self.assertNotIn("Baseline Quality Bar", judge)
        self.assertIn("webmcp_list_tools", judge)
        self.assertIn("webmcp_action_contract", judge)
        self.assertIn("not a scoring criterion", judge)
        self.assertIn("{criteria}", judge)
        # Judge gets a brief non-scoring note only — no builder implement guidance.
        self.assertNotIn("### How to implement", judge)
        self.assertNotIn("@zto/webmcp-contracts", judge)
        self.assertNotIn("/opt/webmcp-contracts", judge)

    def test_mcp_templates_pins_and_tool_surface(self) -> None:
        allowed = json.loads(
            (ROOT / "scripts/canonical/mcp/allowed_tools.json").read_text()
        )
        self.assertEqual(
            allowed["webmcp"],
            ["webmcp_session_info", "webmcp_list_tools", "webmcp_invoke_tool"],
        )
        for name in ("act", "observe", "extract", "agent"):
            self.assertNotIn(name, allowed["webmcp"])
        self.assertEqual(allowed["pins"]["playwright_mcp"], "@playwright/mcp@0.0.76")

        for fname in ("builder.mcp.json", "judge.mcp.json"):
            payload = json.loads((ROOT / "scripts/canonical/mcp" / fname).read_text())
            servers = payload["mcpServers"]
            self.assertIn("webmcp", servers)
            self.assertIn("playwright", servers)
            self.assertEqual(servers["webmcp"]["command"], "node")
            self.assertIn("webmcp_stdio_server.mjs", " ".join(servers["webmcp"]["args"]))
            pw_args = " ".join(servers["playwright"]["args"])
            self.assertIn("@playwright/mcp@0.0.76", pw_args)
            self.assertIn("$WEBMCP_CDP_ENDPOINT", pw_args)

    def test_assignment_map_covers_103(self) -> None:
        data = json.loads((ROOT / "schemas/webmcp-assignments.json").read_text())
        self.assertEqual(data["contract_version"], "zto-webmcp-v1")
        self.assertEqual(len(data["assignments"]), 103)
        for entry in data["assignments"]:
            contract = webmcp_h3.render_contract(entry)
            self.assertIn("<webmcp_action_contract>", contract)
            self.assertIn("</webmcp_action_contract>", contract)
            self.assertIn("zto-webmcp-v1", contract)
            self.assertIn("Module specs:", contract)
            self.assertIn("Implementation:", contract)
            self.assertNotIn("### WebMCP Action Contract", contract)
            self.assertNotIn("Baseline Quality Bar", contract)
            self.assertNotIn("/opt/webmcp-contracts", contract)
            for module_id in entry["modules"]:
                self.assertIn(f'<module_spec id="{module_id}">', contract)
                # Exact authoring SoT JSON body is inlined.
                spec_text = webmcp_h3.load_module_spec_text(module_id).rstrip()
                self.assertIn(spec_text, contract)
            self.assertTrue(1 <= len(entry["modules"]) <= 4)

            section = webmcp_h3.render_instruction_webmcp_section(entry)
            self.assertIn("<integrity>", section)
            self.assertIn("</integrity>", section)
            self.assertIn("<delivery>", section)
            self.assertIn("</delivery>", section)
            self.assertNotIn("## Delivery and integrity", section)
            self.assertIn("`verify:build`", section)
            self.assertIn("`start`", section)
            self.assertIn("port 3000", section)
            self.assertIn("webmcp_session_info", section)
            self.assertNotIn("Baseline Quality Bar", section)
            self.assertNotIn("/opt/webmcp-contracts", section)

    def test_every_task_dir_has_assignment_and_contract(self) -> None:
        """A contract-less task dir is a corpus defect: the judge's webmcp bridge
        discovers its tool surface from the rendered <webmcp_action_contract>, so
        every tasks/frontend-* instruction must carry one and have an assignment.
        (Guard added after a 24-task authoring wave shipped without contracts.)"""
        data = json.loads((ROOT / "schemas/webmcp-assignments.json").read_text())
        assigned = {e["task"] for e in data["assignments"]}
        task_dirs = sorted(
            p.name for p in (ROOT / "tasks").iterdir()
            if p.is_dir() and p.name.startswith("frontend-")
            and (p / "instruction.md").exists()
        )
        missing_assignment = [t for t in task_dirs if t not in assigned]
        self.assertEqual(missing_assignment, [],
                         f"task dirs without a webmcp assignment: {missing_assignment}")
        missing_contract = []
        for t in task_dirs:
            text = (ROOT / "tasks" / t / "instruction.md").read_text()
            if "<webmcp_action_contract>" not in text or "</webmcp_action_contract>" not in text:
                missing_contract.append(t)
        self.assertEqual(missing_contract, [],
                         f"instructions missing <webmcp_action_contract>: {missing_contract}")

    def test_delivery_requires_package_json_scripts(self) -> None:
        preamble = webmcp_h3.render_instruction_preamble()
        self.assertIn("<integrity>", preamble)
        self.assertIn("<delivery>", preamble)
        self.assertIn("/app/package.json", preamble)
        self.assertIn("`start`", preamble)
        self.assertIn("`verify:build`", preamble)
        self.assertIn("port 3000", preamble)
        self.assertIn("app entry/build is present and succeeds", preamble)
        self.assertNotIn("## Delivery and integrity", preamble)
        self.assertNotIn("index.html", preamble)
        self.assertNotIn("Dashboard.html", preamble)

    def test_upsert_idempotent(self) -> None:
        assignment = json.loads(
            (ROOT / "schemas/webmcp-assignments.json").read_text()
        )["assignments"][0]
        section = webmcp_h3.render_instruction_webmcp_section(assignment)
        base = "<summary>\nDemo\n</summary>\n\n<requirements>\nStack\n</requirements>\n"
        once = webmcp_h3.upsert_contract(base, section)
        twice = webmcp_h3.upsert_contract(once, section)
        # Preamble mentions the tag name in prose; count real open/close tags only.
        self.assertEqual(once.count("<webmcp_action_contract>\n"), 1)
        self.assertEqual(once.count("</webmcp_action_contract>"), 1)
        self.assertEqual(once.count("<integrity>"), 1)
        self.assertEqual(once.count("<delivery>"), 1)
        self.assertEqual(twice.count("<webmcp_action_contract>\n"), 1)
        self.assertEqual(twice.count("</webmcp_action_contract>"), 1)
        self.assertEqual(twice.count("<integrity>"), 1)
        self.assertEqual(twice.count("<delivery>"), 1)
        self.assertEqual(once, twice)
        self.assertNotIn("## Delivery and integrity", once)
        self.assertNotIn("### WebMCP Action Contract", once)
        self.assertNotIn("## Product Requirements", once)
        self.assertIn("<module_spec", once)
        self.assertIn("Implementation:", once)

    def test_strips_legacy_markdown(self) -> None:
        assignment = json.loads(
            (ROOT / "schemas/webmcp-assignments.json").read_text()
        )["assignments"][0]
        section = webmcp_h3.render_instruction_webmcp_section(assignment)
        legacy = (
            "<requirements>\nStack\n</requirements>\n\n"
            "## Product Requirements\n\n"
            "### WebMCP Action Contract\n\n"
            "Contract version: `zto-webmcp-v1`\n\n"
            "Modules:\n\n- `browse-query-v1`\n"
        )
        updated = webmcp_h3.upsert_contract(legacy, section)
        self.assertNotIn("## Product Requirements", updated)
        self.assertNotIn("### WebMCP Action Contract", updated)
        self.assertNotIn("## Delivery and integrity", updated)
        self.assertIn("<webmcp_action_contract>", updated)
        self.assertIn("<integrity>", updated)
        self.assertIn("<delivery>", updated)

    def test_upsert_replaces_legacy_delivery_heading(self) -> None:
        assignment = json.loads(
            (ROOT / "schemas/webmcp-assignments.json").read_text()
        )["assignments"][0]
        section = webmcp_h3.render_instruction_webmcp_section(assignment)
        legacy = (
            "<requirements>\nStack\n</requirements>\n\n"
            "## Delivery and integrity\n\n"
            "- Integrity: old markdown bullet\n"
            "- Delivery: old markdown bullet\n\n"
            "<webmcp_action_contract>\nold</webmcp_action_contract>\n"
        )
        updated = webmcp_h3.upsert_contract(legacy, section)
        self.assertNotIn("## Delivery and integrity", updated)
        self.assertNotIn("old markdown bullet", updated)
        self.assertEqual(updated.count("<integrity>"), 1)
        self.assertEqual(updated.count("<delivery>"), 1)
        self.assertEqual(updated.count("<webmcp_action_contract>\n"), 1)

    def test_reject_unknown_module(self) -> None:
        with self.assertRaises(ValueError):
            webmcp_h3.render_contract(
                {
                    "task": "frontend-x",
                    "modules": ["not-a-module-v1"],
                    "bindings": {},
                    "mechanics_exclusions": [],
                }
            )

    def test_admin_analytics_bindings_are_product_specific(self) -> None:
        data = json.loads((ROOT / "schemas/webmcp-assignments.json").read_text())
        entry = next(
            a for a in data["assignments"] if a["task"] == "frontend-data-tracking-admin-analytics-dashboard"
        )
        self.assertEqual(entry["bindings"]["browsable_entity"], "users")
        self.assertEqual(entry["bindings"]["entity"], "user")
        self.assertIn("operations-overview", entry["bindings"]["destinations"])
        self.assertNotIn("records", entry["bindings"]["browsable_entity"])

    def test_canonical_dockerfile_has_no_webmcp_pkg(self) -> None:
        df = (ROOT / "scripts/canonical/environment/Dockerfile").read_text()
        self.assertNotIn("/opt/webmcp-contracts", df)
        self.assertNotIn("webmcp-contracts", df)
        self.assertFalse(
            (ROOT / "scripts/canonical/environment/webmcp-contracts").exists()
        )


if __name__ == "__main__":
    unittest.main()
