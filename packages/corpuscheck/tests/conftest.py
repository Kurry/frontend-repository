from __future__ import annotations

import shutil
from pathlib import Path

import pytest
from typer.testing import CliRunner


@pytest.fixture(scope="session")
def REPO_ROOT() -> Path:
    return Path(__file__).resolve().parents[3]


@pytest.fixture(scope="session")
def TASKS_ROOT(REPO_ROOT: Path) -> Path:
    return REPO_ROOT / "tasks"


@pytest.fixture
def copy_task(TASKS_ROOT: Path):
    def _copy(slug: str, tmp_path: Path) -> tuple[Path, Path]:
        tasks_root = tmp_path / "tasks"
        task_dir = tasks_root / slug
        shutil.copytree(TASKS_ROOT / slug, task_dir)
        return tasks_root, task_dir

    return _copy


@pytest.fixture
def db_path(tmp_path: Path) -> Path:
    return tmp_path / "corpuscheck.sqlite"


@pytest.fixture
def runner() -> CliRunner:
    return CliRunner()
