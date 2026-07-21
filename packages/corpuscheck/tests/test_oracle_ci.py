from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

from corpuscheck.oracle_ci import (
    OracleCIError,
    _build_stage,
    _runtime_stage,
    changed_oracle_slugs,
    load_judge_servers,
)


def completed(
    command: list[str] | None = None,
    *,
    code: int = 0,
    stdout: str = "",
    stderr: str = "",
) -> subprocess.CompletedProcess[str]:
    return subprocess.CompletedProcess(command or [], code, stdout, stderr)


def test_semantic_diff_excludes_only_matching_autonomous_paths() -> None:
    helper = (
        Path(__file__).parents[1]
        / "src/corpuscheck/assets/oracle_ci_semantics.mjs"
    )
    script = f"""
      import {{ causalMutationPaths, changedPaths }} from {json.dumps(helper.as_uri())};
      const before = {{ body: {{ clock: '10:00', dialog: false, className: 'closed', rows: ['a'] }} }};
      const control = {{ body: {{ clock: '10:01', dialog: false, className: 'closed', rows: ['a'] }} }};
      const after = {{ body: {{ clock: '10:01', dialog: true, className: 'open', rows: ['a', 'b'] }} }};
      const autonomous = new Set(changedPaths(before, control));
      console.log(JSON.stringify(causalMutationPaths(before, after, autonomous)));
    """
    result = subprocess.run(
        ["node", "--input-type=module", "--eval", script],
        check=True,
        capture_output=True,
        text=True,
    )
    assert json.loads(result.stdout) == [
        "$.body.dialog",
        "$.body.className",
        "$.body.rows[1]",
    ]


def test_autonomous_analysis_uses_final_same_page_sample_as_before() -> None:
    helper = (
        Path(__file__).parents[1]
        / "src/corpuscheck/assets/oracle_ci_semantics.mjs"
    )
    script = f"""
      import {{ analyzeAutonomousSnapshots, causalMutationPaths }} from {json.dumps(helper.as_uri())};
      const samples = [
        {{ body: {{ clock: '10:00', dialog: false }} }},
        {{ body: {{ clock: '10:01', dialog: false }} }},
        {{ body: {{ clock: '10:02', dialog: false }} }},
      ];
      const {{ autonomousPaths, before }} = analyzeAutonomousSnapshots(samples);
      const after = {{ body: {{ clock: '10:03', dialog: true }} }};
      console.log(JSON.stringify({{
        before,
        causal: causalMutationPaths(before, after, autonomousPaths),
      }}));
    """
    result = subprocess.run(
        ["node", "--input-type=module", "--eval", script],
        check=True,
        capture_output=True,
        text=True,
    )
    payload = json.loads(result.stdout)
    assert payload["before"] == {"body": {"clock": "10:02", "dialog": False}}
    assert payload["causal"] == ["$.body.dialog"]


def test_changed_oracle_slugs_filters_and_deduplicates_solution_paths(
    tmp_path: Path,
) -> None:
    seen: list[list[str]] = []

    def run(command, **_kwargs):
        seen.append(command)
        return completed(
            command,
            stdout=(
                "tasks/frontend-b/solution/app/src/App.tsx\n"
                "tasks/frontend-a/instruction.md\n"
                "tasks/frontend-b/solution/app/package.json\n"
                "tasks/frontend-a/solution/dist/index.html\n"
                "packages/corpuscheck/src/corpuscheck/cli.py\n"
            ),
        )

    assert changed_oracle_slugs(tmp_path, run=run) == ["frontend-a", "frontend-b"]
    assert seen == [["git", "diff", "--name-only", "origin/main...HEAD"]]


def test_changed_oracle_slugs_reports_git_diff_failure(tmp_path: Path) -> None:
    def run(*_args, **_kwargs):
        return completed(code=128, stderr="fatal: bad revision")

    with pytest.raises(
        OracleCIError, match=r"--changed \[static\]: fatal: bad revision"
    ):
        changed_oracle_slugs(tmp_path, run=run)


def write_dimension(path: Path, *, env_ref: str = "$WEBMCP_CDP_ENDPOINT") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        """
[judge]
judge = "codex"

[[judge.mcp_servers]]
name = "webmcp"
transport = "stdio"
command = "node"
args = ["/tests/webmcp_stdio_server.mjs"]

[[judge.mcp_servers]]
name = "playwright"
transport = "stdio"
command = "npx"
args = ["-y", "@playwright/mcp@0.0.76", "--cdp-endpoint", "ENV_REF", "--output-dir", "/logs/verifier/screenshots"]
""".replace("ENV_REF", env_ref)
    )


def test_load_judge_servers_parses_every_dimension_and_deduplicates(
    tmp_path: Path,
) -> None:
    task = tmp_path / "tasks/frontend-example"
    write_dimension(task / "tests/core_features/core_features.toml")
    write_dimension(task / "tests/motion/motion.toml")
    runtime = tmp_path / "runtime"

    servers = load_judge_servers(task, runtime)

    assert [server.name for server in servers] == ["webmcp", "playwright"]
    assert servers[0].dimensions == ("core_features", "motion")
    assert servers[0].args == (str(task / "tests/webmcp_stdio_server.mjs"),)
    assert "http://127.0.0.1:9222" in servers[1].args
    assert str(runtime / "logs/screenshots") in servers[1].args


def test_load_judge_servers_rejects_bad_toml(tmp_path: Path) -> None:
    task = tmp_path / "tasks/frontend-example"
    rubric = task / "tests/motion/motion.toml"
    rubric.parent.mkdir(parents=True)
    rubric.write_text("[[judge.mcp_servers]\n")

    with pytest.raises(
        OracleCIError, match=r"\[judge-setup\]: invalid tests/motion/motion.toml"
    ):
        load_judge_servers(task, tmp_path / "runtime")


def test_load_judge_servers_rejects_unknown_environment_reference(
    tmp_path: Path,
) -> None:
    task = tmp_path / "tasks/frontend-example"
    write_dimension(
        task / "tests/motion/motion.toml",
        env_ref="$MISSING_CDP_ENDPOINT",
    )

    with pytest.raises(
        OracleCIError, match="unknown environment variable.*MISSING_CDP_ENDPOINT"
    ):
        load_judge_servers(task, tmp_path / "runtime")


def test_build_stage_names_verify_build_failure(tmp_path: Path) -> None:
    task = tmp_path / "frontend-example"
    app = task / "solution/app"
    app.mkdir(parents=True)
    (app / "package-lock.json").write_text("{}")
    (app / "package.json").write_text(
        json.dumps({"scripts": {"start": "serve", "verify:build": "exit 1"}})
    )
    calls = 0

    def run(command, **_kwargs):
        nonlocal calls
        calls += 1
        return completed(command, code=1 if calls == 2 else 0, stdout="compiler failed")

    with pytest.raises(
        OracleCIError, match=r"frontend-example \[build\]: compiler failed"
    ):
        _build_stage(task, run=run)


@pytest.mark.parametrize("stage", ["serve-browser", "webmcp", "judge-setup"])
def test_runtime_stage_preserves_named_runtime_failure(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    stage: str,
) -> None:
    task = tmp_path / "tasks/frontend-example"
    write_dimension(task / "tests/core_features/core_features.toml")
    monkeypatch.setattr(
        "corpuscheck.oracle_ci.schemas_path", lambda *_: tmp_path / "assignments.json"
    )
    monkeypatch.setattr(
        "corpuscheck.oracle_ci.package_data", lambda *_: tmp_path / "runtime.mjs"
    )

    def run(command, **_kwargs):
        payload = json.dumps({"stage": stage, "message": "expected failure"})
        return completed(command, code=1, stdout=f"ORACLE_CI_FAILURE {payload}\n")

    with pytest.raises(OracleCIError) as caught:
        _runtime_stage(task, tmp_path, run=run)
    assert caught.value.stage == stage
    assert caught.value.message == "expected failure"
