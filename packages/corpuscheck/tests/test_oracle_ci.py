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


def test_runtime_rejects_both_standard_false_success_shapes() -> None:
    runtime = (
        Path(__file__).parents[1]
        / "src/corpuscheck/assets/oracle_ci_semantics.mjs"
    )
    script = f"""
      import {{ isErrorResult }} from {json.dumps(runtime.as_uri())};
      console.log(JSON.stringify([
        isErrorResult({{ ok: false }}),
        isErrorResult({{ success: false }}),
        isErrorResult({{ success: true }}),
      ]));
    """
    result = subprocess.run(
        ["node", "--input-type=module", "--eval", script],
        check=True,
        capture_output=True,
        text=True,
    )
    assert json.loads(result.stdout) == [True, True, False]


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


@pytest.mark.parametrize("stage", ["serve-browser", "webmcp", "e2e", "judge-setup"])
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


# --- e2e stage (assets/oracle_ci_e2e.mjs) ------------------------------------

_E2E_HELPER = Path(__file__).parents[1] / "src/corpuscheck/assets/oracle_ci_e2e.mjs"
_REPO_NODE_MODULES = Path(__file__).parents[3] / "node_modules"

requires_playwright_test = pytest.mark.skipif(
    not (_REPO_NODE_MODULES / "@playwright/test/package.json").is_file(),
    reason="@playwright/test is not installed at the repo root (run npm ci)",
)

_PASSING_SPEC = """
import { test, expect } from '@playwright/test';
test('adds numbers', () => { expect(1 + 1).toBe(2); });
test('joins strings', () => { expect('a' + 'b').toBe('ab'); });
"""
_FAILING_SPEC = """
import { test, expect } from '@playwright/test';
test('adds numbers', () => { expect(1 + 1).toBe(2); });
test('states a falsehood', () => { expect(1).toBe(2); });
"""
_SKIP_HEAVY_SPEC = """
import { test, expect } from '@playwright/test';
test('adds numbers', () => { expect(1 + 1).toBe(2); });
test.skip('first stub', () => { expect(1).toBe(2); });
test.skip('second stub', () => { expect(1).toBe(2); });
"""
_DECOY_CONFIG = "module.exports = { testDir: '.', testMatch: 'decoy.spec.mjs' };\n"
_DECOY_SPEC = """
import { test, expect } from '@playwright/test';
test('decoy must never run', () => { expect(true).toBe(false); });
"""
_CANONICAL_CONFIG = """
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: 'e2e.spec.mjs',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
});
"""


def make_e2e_app(
    tmp_path: Path, *, spec: str | None, extra: dict[str, str] | None = None
) -> Path:
    app = tmp_path / "app"
    app.mkdir()
    (app / "package.json").write_text('{"name": "fixture", "private": true}')
    if spec is not None:
        (app / "e2e.spec.mjs").write_text(spec)
    for name, content in (extra or {}).items():
        (app / name).write_text(content)
    if _REPO_NODE_MODULES.is_dir():
        (app / "node_modules").symlink_to(_REPO_NODE_MODULES, target_is_directory=True)
    return app


def run_e2e_suite(tmp_path: Path, app: Path) -> dict:
    runtime = tmp_path / "runtime"
    runtime.mkdir(exist_ok=True)
    script = f"""
      import {{ runE2eSuite }} from {json.dumps(_E2E_HELPER.as_uri())};
      const result = await runE2eSuite({{
        slug: 'fixture',
        appDir: {json.dumps(str(app))},
        runtimeDir: {json.dumps(str(runtime))},
      }});
      console.log(JSON.stringify(result));
    """
    completed = subprocess.run(
        ["node", "--input-type=module", "--eval", script],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout.strip().splitlines()[-1])


def test_e2e_stage_skips_when_task_has_no_spec(tmp_path: Path) -> None:
    app = tmp_path / "app"
    app.mkdir()
    (app / "package.json").write_text('{"name": "fixture", "private": true}')

    assert run_e2e_suite(tmp_path, app) == {"status": "skip"}


def test_e2e_stage_fails_clearly_when_playwright_test_is_missing(
    tmp_path: Path,
) -> None:
    app = tmp_path / "app"
    app.mkdir()
    (app / "package.json").write_text('{"name": "fixture", "private": true}')
    (app / "e2e.spec.mjs").write_text(_PASSING_SPEC)

    result = run_e2e_suite(tmp_path, app)

    assert result["status"] == "fail"
    assert "@playwright/test is not resolvable" in result["message"]


def test_e2e_stage_names_task_directory_when_playwright_test_is_missing(
    tmp_path: Path,
) -> None:
    app = tmp_path / "app"
    app.mkdir()
    (app / "package.json").write_text('{"name": "fixture", "private": true}')
    (app / "e2e").mkdir()
    (app / "e2e/core_features.spec.ts").write_text(_PASSING_SPEC)

    result = run_e2e_suite(tmp_path, app)

    assert result["status"] == "fail"
    assert "e2e/*.spec.*" in result["message"]
    assert "e2e.spec.mjs exists" not in result["message"]


def test_playwright_workflow_uses_the_shared_pinned_discovery_runner() -> None:
    workflow = (
        Path(__file__).parents[3] / ".github/workflows/playwright.yml"
    ).read_text()

    assert "runE2eSuite" in workflow
    assert "oracle_ci_e2e.mjs" in workflow
    assert "npx playwright test e2e/" not in workflow
    assert "solution/app/e2e/**" not in workflow


@requires_playwright_test
def test_e2e_stage_passes_with_stub_passing_suite(tmp_path: Path) -> None:
    app = make_e2e_app(tmp_path, spec=_PASSING_SPEC)

    result = run_e2e_suite(tmp_path, app)

    assert result["status"] == "pass"
    assert (result["passed"], result["failed"], result["skipped"]) == (2, 0, 0)
    assert "warning" not in result
    assert result["detail"] == "passed=2 failed=0 skipped=0 flaky=0 (suites: canonical)"


@requires_playwright_test
def test_e2e_stage_fails_and_names_the_failing_tests(tmp_path: Path) -> None:
    app = make_e2e_app(tmp_path, spec=_FAILING_SPEC)

    result = run_e2e_suite(tmp_path, app)

    assert result["status"] == "fail"
    assert "passed=1 failed=1" in result["message"]
    assert "states a falsehood" in result["message"]


@requires_playwright_test
def test_e2e_stage_warns_when_skipped_exceeds_passed(tmp_path: Path) -> None:
    app = make_e2e_app(tmp_path, spec=_SKIP_HEAVY_SPEC)

    result = run_e2e_suite(tmp_path, app)

    assert result["status"] == "pass"
    assert (result["passed"], result["skipped"]) == (1, 2)
    assert "skip stub" in result["warning"]


@requires_playwright_test
def test_e2e_stage_discovery_ignores_app_local_playwright_config(
    tmp_path: Path,
) -> None:
    app = make_e2e_app(
        tmp_path,
        spec=_PASSING_SPEC,
        extra={"playwright.config.js": _DECOY_CONFIG, "decoy.spec.mjs": _DECOY_SPEC},
    )

    result = run_e2e_suite(tmp_path, app)

    assert result["status"] == "pass"
    assert (result["passed"], result["failed"]) == (2, 0)


_DIR_SPEC_TS = """
import { test, expect } from '@playwright/test';
test('task-dir spec runs', () => { expect(2 * 2).toBe(4); });
"""
_DIR_SPEC_FAILING_TS = """
import { test, expect } from '@playwright/test';
test('task-dir spec fails', () => { expect(2 * 2).toBe(5); });
"""


@requires_playwright_test
def test_e2e_stage_runs_task_owned_e2e_directory_suite(tmp_path: Path) -> None:
    """The PR #895 layout: solution/app/e2e/*.spec.ts with NO e2e.spec.mjs."""
    app = make_e2e_app(tmp_path, spec=None)
    (app / "e2e").mkdir()
    (app / "e2e/core_features.spec.ts").write_text(_DIR_SPEC_TS)

    result = run_e2e_suite(tmp_path, app)

    assert result["status"] == "pass"
    assert (result["passed"], result["failed"]) == (1, 0)
    assert "(suites: task-dir)" in result["detail"]


@requires_playwright_test
def test_e2e_stage_runs_both_canonical_and_task_dir_suites(tmp_path: Path) -> None:
    app = make_e2e_app(tmp_path, spec=_PASSING_SPEC)
    (app / "e2e").mkdir()
    (app / "e2e/behavioral.spec.ts").write_text(_DIR_SPEC_TS)

    result = run_e2e_suite(tmp_path, app)

    assert result["status"] == "pass"
    assert (result["passed"], result["failed"]) == (3, 0)
    assert "(suites: canonical, task-dir)" in result["detail"]


@requires_playwright_test
def test_e2e_stage_fails_when_task_dir_suite_fails(tmp_path: Path) -> None:
    app = make_e2e_app(tmp_path, spec=_PASSING_SPEC)
    (app / "e2e").mkdir()
    (app / "e2e/edge_cases.spec.ts").write_text(_DIR_SPEC_FAILING_TS)

    result = run_e2e_suite(tmp_path, app)

    assert result["status"] == "fail"
    assert "[task-dir]" in result["message"]
    assert "task-dir spec fails" in result["message"]


@requires_playwright_test
def test_e2e_stage_task_dir_suite_ignores_decoy_config(tmp_path: Path) -> None:
    app = make_e2e_app(
        tmp_path,
        spec=None,
        extra={"playwright.config.js": _DECOY_CONFIG, "decoy.spec.mjs": _DECOY_SPEC},
    )
    (app / "e2e").mkdir()
    (app / "e2e/accessibility.spec.ts").write_text(_DIR_SPEC_TS)

    result = run_e2e_suite(tmp_path, app)

    assert result["status"] == "pass"
    assert (result["passed"], result["failed"]) == (1, 0)


def test_generated_e2e_config_targets_the_served_app() -> None:
    script = f"""
      import {{ generatedConfigSource }} from {json.dumps(_E2E_HELPER.as_uri())};
      const source = generatedConfigSource('/tmp/app');
      const config = (await import(`data:text/javascript,${{encodeURIComponent(source)}}`)).default;
      console.log(JSON.stringify(config));
    """
    completed = subprocess.run(
        ["node", "--input-type=module", "--eval", script],
        check=True,
        capture_output=True,
        text=True,
    )

    config = json.loads(completed.stdout)
    assert config["use"]["baseURL"] == "http://127.0.0.1:3000"


@requires_playwright_test
def test_e2e_stage_prefers_canonical_config_and_still_ignores_decoy(
    tmp_path: Path,
) -> None:
    app = make_e2e_app(
        tmp_path,
        spec=_PASSING_SPEC,
        extra={
            "e2e.playwright.config.mjs": _CANONICAL_CONFIG,
            "playwright.config.js": _DECOY_CONFIG,
            "decoy.spec.mjs": _DECOY_SPEC,
        },
    )

    result = run_e2e_suite(tmp_path, app)

    assert result["status"] == "pass"
    assert (result["passed"], result["failed"]) == (2, 0)
