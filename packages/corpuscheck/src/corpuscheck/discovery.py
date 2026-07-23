"""Discover canonical ``frontend-*`` task directories."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .validate import assignments_by_slug, resolve_repo_root


@dataclass
class DiscoveredTask:
    task_dir: Path
    slug: str
    has_oracle: bool
    has_screenshots: bool
    has_assignment: bool

    @property
    def name(self) -> str:
        return self.slug


def default_tasks_root() -> Path:
    return resolve_repo_root() / "tasks"


def discover(root: str | Path | None = None) -> list[DiscoveredTask]:
    root = Path(root) if root is not None else default_tasks_root()
    assignments = assignments_by_slug()
    return [
        DiscoveredTask(
            task_dir=task_dir,
            slug=task_dir.name,
            has_oracle=(task_dir / "solution/app").is_dir(),
            has_screenshots=(task_dir / "environment/reference-screenshots").is_dir(),
            has_assignment=task_dir.name in assignments,
        )
        for task_dir in sorted(root.glob("frontend-*"))
        if task_dir.is_dir()
    ]


def find_task(root: str | Path, identifier: str) -> Path | None:
    candidate = Path(identifier)
    if candidate.is_dir():
        return candidate.resolve()
    direct = Path(root) / identifier
    if direct.is_dir() and direct.name.startswith("frontend-"):
        return direct.resolve()
    return None
