from __future__ import annotations

import json
import subprocess
from pathlib import Path


REPO_ROOT = Path(__file__).parents[3]
LINT_SCRIPT = (
    REPO_ROOT
    / "packages/corpuscheck/src/corpuscheck/assets/lint_changed_playwright.mjs"
)


def run(*args: str, cwd: Path, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=cwd,
        check=check,
        capture_output=True,
        text=True,
    )


def commit(cwd: Path, message: str) -> str:
    run("git", "add", ".", cwd=cwd)
    run("git", "commit", "-m", message, cwd=cwd)
    return run("git", "rev-parse", "HEAD", cwd=cwd).stdout.strip()


def test_playwright_lint_workflow_runs_on_every_pull_request() -> None:
    workflow = (REPO_ROOT / ".github/workflows/playwright-lint.yml").read_text()

    assert "pull_request:" in workflow
    assert "paths:" not in workflow
    assert "fetch-depth: 0" in workflow
    assert "npm ci" in workflow
    assert "npm run lint:playwright:changed" in workflow
    assert 'BASE_SHA: ${{ github.event.pull_request.base.sha }}' in workflow
    assert 'HEAD_SHA: ${{ github.event.pull_request.head.sha }}' in workflow


def test_first_party_actions_use_node24_backed_majors() -> None:
    workflows = "\n".join(
        path.read_text()
        for path in sorted((REPO_ROOT / ".github/workflows").glob("*.yml"))
    )

    for stale in (
        "actions/checkout@v4",
        "actions/setup-node@v4",
        "actions/cache@v4",
        "actions/upload-artifact@v4",
        "actions/download-artifact@v4",
        "actions/download-artifact@v5",
        "actions/setup-python@v5",
        "astral-sh/setup-uv@v6",
        "astral-sh/setup-uv@v9",
    ):
        assert stale not in workflows
    for current in (
        "actions/checkout@v7",
        "actions/setup-node@v7",
        "actions/cache@v6",
        "actions/upload-artifact@v7",
        "actions/download-artifact@v8",
        "actions/setup-python@v7",
        "astral-sh/setup-uv@v8.3.2",
    ):
        assert current in workflows


def test_root_scaffold_carries_playwright_lint_tooling() -> None:
    package = json.loads((REPO_ROOT / "package.json").read_text())

    assert package["scripts"]["lint:playwright:changed"].endswith(
        "lint_changed_playwright.mjs"
    )
    assert package["devDependencies"]["eslint"] == "10.6.0"
    assert package["devDependencies"]["eslint-plugin-playwright"] == "2.10.5"
    assert package["devDependencies"]["@typescript-eslint/parser"] == "8.63.0"
    assert package["overrides"]["@eslint-community/eslint-utils"] == "4.9.0"
    assert package["overrides"]["@typescript-eslint/types"] == "8.63.0"
    assert package["overrides"]["flatted"] == "3.4.2"


def test_changed_line_lint_ignores_old_debt_and_rejects_new_bad_test(
    tmp_path: Path,
) -> None:
    run("git", "init", "-b", "main", cwd=tmp_path)
    run("git", "config", "user.email", "playwright-lint@example.com", cwd=tmp_path)
    run("git", "config", "user.name", "Playwright Lint Test", cwd=tmp_path)
    spec = tmp_path / "tasks/frontend-fixture/solution/app/e2e/core_features.spec.ts"
    spec.parent.mkdir(parents=True)
    spec.write_text(
        "import { test, expect } from '@playwright/test';\n"
        "test.only('existing focused debt', async ({ page }) => {\n"
        "  await page.goto('/');\n"
        "  await expect(page.locator('body')).toBeVisible();\n"
        "});\n"
    )
    base = commit(tmp_path, "base")

    with spec.open("a") as handle:
        handle.write(
            "\ntest('new clean test', async ({ page }) => {\n"
            "  await page.goto('/');\n"
            "  await expect(page.locator('body')).toBeVisible();\n"
            "});\n"
        )
    clean_head = commit(tmp_path, "clean addition")
    clean = run(
        "node",
        str(LINT_SCRIPT),
        "--base",
        base,
        "--head",
        clean_head,
        cwd=tmp_path,
    )
    assert "Playwright lint passed for 1 changed test file" in clean.stdout

    with spec.open("a") as handle:
        handle.write(
            "\ntest.only('new bad test', async ({ page }) => {\n"
            "  page.goto('/');\n"
            "  await page.waitForTimeout(25);\n"
            "});\n"
        )
    bad_head = commit(tmp_path, "bad addition")
    bad = run(
        "node",
        str(LINT_SCRIPT),
        "--base",
        clean_head,
        "--head",
        bad_head,
        cwd=tmp_path,
        check=False,
    )

    assert bad.returncode == 1
    assert "playwright/no-focused-test" in bad.stderr
    assert "playwright/missing-playwright-await" in bad.stderr
    assert "playwright/no-wait-for-timeout" in bad.stderr
