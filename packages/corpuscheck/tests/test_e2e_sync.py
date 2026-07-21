"""Tests for the canonical e2e oracle surfaces."""
import json
from pathlib import Path

import pytest

from corpuscheck.propagate import (
    CANONICAL_E2E_SCRIPT,
    E2E_MARKER,
    desired_e2e_prefix,
    sync_e2e_file,
    sync_e2e_package,
)


def _mk_task(tmp_path: Path) -> Path:
    task = tmp_path / "frontend-test-task"
    (task / "solution/app").mkdir(parents=True)
    return task


def test_creates_file_when_missing(tmp_path):
    task = _mk_task(tmp_path)
    changed = sync_e2e_file(task, check=False)
    target = task / "solution/app/e2e.spec.mjs"
    assert changed == target
    content = target.read_bytes()
    assert content == desired_e2e_prefix()
    assert E2E_MARKER.encode() in content


def test_canonical_config_sets_served_app_base_url():
    config = (
        Path(__file__).parents[1]
        / "src/corpuscheck/canonical/e2e/e2e.playwright.config.mjs"
    ).read_text()
    assert "baseURL: 'http://127.0.0.1:3000'" in config


def test_idempotent_when_prefix_matches(tmp_path):
    task = _mk_task(tmp_path)
    sync_e2e_file(task, check=False)
    assert sync_e2e_file(task, check=False) is None
    assert sync_e2e_file(task, check=True) is None


def test_preserves_task_tail_on_canonical_update(tmp_path):
    task = _mk_task(tmp_path)
    target = task / "solution/app/e2e.spec.mjs"
    stale_canonical = b"// old canonical stuff\n" + E2E_MARKER.encode() + b" ====\n"
    tail = b"\ntest('1.7 my_criterion', async ({ page }) => {});\n"
    target.write_bytes(stale_canonical + tail)
    changed = sync_e2e_file(task, check=False)
    assert changed == target
    content = target.read_bytes()
    assert content.startswith(desired_e2e_prefix())
    assert content.endswith(tail)


def test_check_mode_reports_without_writing(tmp_path):
    task = _mk_task(tmp_path)
    target = task / "solution/app/e2e.spec.mjs"
    target.write_bytes(b"not canonical at all\n")
    changed = sync_e2e_file(task, check=True)
    assert changed == target
    assert target.read_bytes() == b"not canonical at all\n"


def test_write_mode_refuses_to_overwrite_unmarked_suite(tmp_path):
    task = _mk_task(tmp_path)
    target = task / "solution/app/e2e.spec.mjs"
    original = b"test('task-owned suite', async ({ page }) => {});\n"
    target.write_bytes(original)

    with pytest.raises(ValueError, match="refusing to overwrite unmarked"):
        sync_e2e_file(task, check=False)

    assert target.read_bytes() == original


def test_skips_tasks_without_app(tmp_path):
    task = tmp_path / "frontend-no-app"
    (task / "tests").mkdir(parents=True)
    assert sync_e2e_file(task, check=False) is None


def _write_package(task: Path, package: dict) -> Path:
    target = task / "solution/app/package.json"
    target.write_text(json.dumps(package, indent=2) + "\n")
    return target


def test_package_adds_default_dependency_and_command(tmp_path):
    task = _mk_task(tmp_path)
    target = _write_package(task, {"name": "app", "scripts": {"start": "vite"}})
    assert sync_e2e_package(task, check=False) == target
    package = json.loads(target.read_text())
    assert package["scripts"]["test:e2e"] == CANONICAL_E2E_SCRIPT
    assert package["devDependencies"]["@playwright/test"] == "^1.61.0"


def test_package_preserves_task_suite_and_existing_test_version(tmp_path):
    task = _mk_task(tmp_path)
    target = _write_package(
        task,
        {
            "name": "app",
            "scripts": {"test:e2e": "playwright test e2e/oracle.spec.js"},
            "devDependencies": {"@playwright/test": "^1.55.1"},
        },
    )
    assert sync_e2e_package(task, check=False) == target
    package = json.loads(target.read_text())
    assert package["scripts"]["test:e2e"] == "playwright test e2e/oracle.spec.js"
    assert package["scripts"]["test:e2e:canonical"] == CANONICAL_E2E_SCRIPT
    assert package["devDependencies"]["@playwright/test"] == "^1.55.1"


def test_package_matches_existing_full_playwright_version(tmp_path):
    task = _mk_task(tmp_path)
    target = _write_package(
        task,
        {"name": "app", "devDependencies": {"playwright": "^1.60.0"}},
    )
    sync_e2e_package(task, check=False)
    package = json.loads(target.read_text())
    assert package["devDependencies"]["@playwright/test"] == "^1.60.0"


def test_package_check_mode_reports_without_writing(tmp_path):
    task = _mk_task(tmp_path)
    target = _write_package(task, {"name": "app"})
    original = target.read_text()
    assert sync_e2e_package(task, check=True) == target
    assert target.read_text() == original
