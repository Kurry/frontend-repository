"""Read-only drift detection against current repository templates."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

from .repo import canonical_dir
from .validate import assignments_by_slug, repository_sources, source_metadata


class DriftKind(str, Enum):
    TEMPLATE_MATCH = "template_match"
    MANUAL_EDIT = "manual_edit"
    MISSING_TASK_DIR = "missing_task_dir"
    ORPHAN_DIR = "orphan_dir"
    QUARANTINED = "quarantined"


@dataclass
class DriftItem:
    kind: DriftKind
    path: str
    detail: str = ""

    def __str__(self) -> str:
        return f"[{self.kind.value}] {self.path}: {self.detail}".rstrip(": ")


@dataclass
class DriftReport:
    task_dir: str
    items: list[DriftItem] = field(default_factory=list)

    @property
    def clean(self) -> bool:
        return all(item.kind is DriftKind.TEMPLATE_MATCH for item in self.items)

    def by_kind(self, kind: DriftKind) -> list[DriftItem]:
        return [item for item in self.items if item.kind is kind]

    def needs_regen_only(self) -> bool:
        """Retained API: corpuscheck never regenerates, so this is always false."""
        return False


SCREENSHOT_COPY = "COPY reference-screenshots/ /reference-screenshots/\n"


def _expected_files(slug: str, task_dir: Path | None = None) -> dict[str, bytes]:
    _, package, _, _ = repository_sources()
    canon = canonical_dir()
    dockerfile = package.DOCKERFILE
    # `corpuscheck propagate` appends the reference-screenshots COPY line for
    # tasks that ship them; the drift expectation must match.
    if task_dir is not None and (task_dir / "environment/reference-screenshots").is_dir():
        dockerfile += SCREENSHOT_COPY
    expected = {
        "tests/test.sh": (canon / "test.sh").read_bytes(),
        "tests/system_prompt.md": (canon / "system_prompt.md").read_bytes(),
        "tests/webmcp_stdio_server.mjs": (
            canon / "mcp/webmcp_stdio_server.mjs"
        ).read_bytes(),
        "tests/playwright_rm_config.json": (
            canon / "mcp/playwright_rm_config.json"
        ).read_bytes(),
        "environment/Dockerfile": dockerfile.encode(),
    }
    description = (source_metadata().get(slug) or {}).get("description")
    if description is not None:
        expected["task.toml"] = package.render_task_toml(slug, description).encode()
        expected["README.md"] = package.render_task_readme(slug, description).encode()
    assignment = assignments_by_slug().get(slug)
    if assignment is not None:
        expected["solution/app/README.md"] = package.render_oracle_readme(
            slug, assignment["modules"]
        ).encode()
    return expected


def detect_drift(task_dir: str | Path) -> DriftReport:
    task_dir = Path(task_dir)
    report = DriftReport(task_dir=str(task_dir))
    for rel, expected in _expected_files(task_dir.name, task_dir).items():
        path = task_dir / rel
        matches = path.is_file() and path.read_bytes() == expected
        report.items.append(
            DriftItem(
                DriftKind.TEMPLATE_MATCH if matches else DriftKind.MANUAL_EDIT,
                rel,
                "byte-identical to current template"
                if matches
                else "missing or differs from current template",
            )
        )
    return report


def detect_corpus_drift(root: str | Path) -> DriftReport:
    root = Path(root)
    assignments = set(assignments_by_slug())
    directories = {path.name for path in root.glob("frontend-*") if path.is_dir()}
    quarantine_root = root.resolve().parent / "tasks-quarantine"
    quarantined = {path.name for path in quarantine_root.glob("frontend-*") if path.is_dir()}
    report = DriftReport(task_dir=str(root))
    for slug in sorted(assignments - directories):
        if slug in quarantined:
            report.items.append(
                DriftItem(DriftKind.QUARANTINED, slug, "assignment quarantined under tasks-quarantine/")
            )
        else:
            report.items.append(DriftItem(DriftKind.MISSING_TASK_DIR, slug, "assignment has no task directory"))
    for slug in sorted(directories - assignments):
        report.items.append(DriftItem(DriftKind.ORPHAN_DIR, slug, "task directory has no assignment"))
    return report
