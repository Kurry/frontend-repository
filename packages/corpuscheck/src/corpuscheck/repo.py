"""Repository-root and package-data resolution for corpuscheck.

The corpuscheck package lives at packages/corpuscheck/ inside the
frontend-repository checkout, but the CLI may run from any working
directory. Repository lookup walks up from the current working directory
(then from this file, which works for in-repo checkouts) to the first
directory that contains both ``tasks/`` and ``packages/``.

Canonical templates and schemas are package data shipped inside
``corpuscheck`` itself (``corpuscheck/canonical/`` and ``corpuscheck/schemas/``)
and are resolved package-relative, never repo-relative.
"""

from __future__ import annotations

from importlib import resources
from pathlib import Path

_PACKAGE_DIR = Path(__file__).resolve().parent


def _is_repo_root(candidate: Path) -> bool:
    return (candidate / "tasks").is_dir() and (candidate / "packages").is_dir()


def find_repo_root(start: Path | None = None) -> Path:
    """Locate the frontend-repository root.

    Walks up from ``start`` (default: cwd), then from the installed package
    location as a fallback for editable in-repo installs.
    """
    origins = [start] if start is not None else [Path.cwd(), _PACKAGE_DIR]
    for origin in origins:
        origin = origin.resolve()
        for candidate in (origin, *origin.parents):
            if _is_repo_root(candidate):
                return candidate
    raise FileNotFoundError(
        "cannot locate the repository root (no ancestor of the working "
        "directory contains both tasks/ and packages/); run from inside the "
        "repository or pass --root"
    )


def package_data(*parts: str) -> Path:
    """Path to a data file shipped inside the corpuscheck package."""
    path = Path(str(resources.files("corpuscheck"))).joinpath(*parts)
    if not path.exists():
        raise FileNotFoundError(f"missing corpuscheck package data: {'/'.join(parts)}")
    return path


def canonical_dir() -> Path:
    return package_data("canonical")


def schemas_dir() -> Path:
    return package_data("schemas")


def canonical_path(*parts: str) -> Path:
    return package_data("canonical", *parts)


def schemas_path(*parts: str) -> Path:
    return package_data("schemas", *parts)
