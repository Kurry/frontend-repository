from __future__ import annotations

import json

from corpuscheck.cli import app


SLUG = "frontend-data-tracking-eval-dashboard"


def test_nop_scaffold_writes_stubs_outside_repo_and_refuses_inside_repo(
    TASKS_ROOT, REPO_ROOT, tmp_path, db_path, runner
):
    output = tmp_path / "nop-app"
    generated = runner.invoke(
        app,
        [
            "nop-scaffold", SLUG,
            "--out", str(output),
            "--root", str(TASKS_ROOT),
            "--db", str(db_path),
        ],
    )
    assert generated.exit_code == 0, generated.output
    index = (output / "index.html").read_text()
    package = json.loads((output / "package.json").read_text())
    assert "window.webmcp_session_info" in index
    assert "window.webmcp_list_tools" in index
    assert "window.webmcp_invoke_tool" in index
    assert {"start", "verify:build"}.issubset(package["scripts"])

    forbidden = REPO_ROOT / "packages/corpuscheck/test-nop-output"
    refused = runner.invoke(
        app,
        [
            "nop-scaffold", SLUG,
            "--out", str(forbidden),
            "--root", str(TASKS_ROOT),
            "--db", str(db_path),
        ],
    )
    assert refused.exit_code == 2
    assert "outside the repository" in refused.output
    assert not forbidden.exists()
