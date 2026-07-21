"""Propagate every canonical shared surface to all task directories.

The single consistency tool: run after ANY edit to a canonical source.
Idempotent; creates missing plumbing files for registered tasks.

Surfaces:
  tests/test.sh                 <- corpuscheck canonical/test.sh (0755)
  tests/system_prompt.md        <- corpuscheck canonical/system_prompt.md
  tests/webmcp_stdio_server.mjs <- corpuscheck canonical/mcp/webmcp_stdio_server.mjs
  tests/reward.toml             <- corpuscheck canonical/reward.toml
  environment/webmcp_stdio_server.mjs <- corpuscheck canonical/mcp/webmcp_stdio_server.mjs
  environment/entrypoint.sh     <- corpuscheck canonical/entrypoint.sh (0755)
  environment/Dockerfile        <- package_frontend_tasks.DOCKERFILE
                                   (+ reference-screenshots COPY line when the
                                    directory exists)
  task.toml                     <- render_task_toml(slug, description) using
                                   corpuscheck schemas/webmcp-task-sources.json
                                   descriptions
  README.md                     <- render_task_readme(slug, description) using
                                   the same webmcp-task-sources.json descriptions
  solution/app/README.md        <- render_oracle_readme(slug, modules) using
                                   corpuscheck schemas/webmcp-assignments.json
                                   module lists
  solution/app/e2e.playwright.config.mjs
                                <- corpuscheck canonical/e2e/e2e.playwright.config.mjs
  solution/app/e2e.spec.mjs     <- canonical prefix from corpuscheck
                                   canonical/e2e/oracle.e2e.mjs (prefix-synced;
                                   task-specific tests after the END CANONICAL
                                   REGION marker are preserved verbatim)
  solution/app/package.json     <- ensures the canonical e2e command and a
                                   single compatible @playwright/test dependency
  [judge] cwd                   <- enforced to "/logs/verifier" in every
                                   tests/<dim>/<dim>.toml
  [[judge.mcp_servers]] block   <- corpuscheck canonical/mcp/reward_mcp_servers.toml
                                   (the inlined region between the first
                                   [[judge.mcp_servers]] and [scoring] in every
                                   tests/<dim>/<dim>.toml)

CLI: `corpuscheck propagate [--check] [slug ...]`
--check reports files that would change and exits 1 if any (no writes).
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from .repo import canonical_dir, find_repo_root, schemas_dir

SCREENSHOT_COPY = "COPY reference-screenshots/ /reference-screenshots/\n"
JUDGE_CWD = 'cwd = "/logs/verifier"'


def desired_files(task: Path, sources: dict, modules: dict) -> dict[Path, bytes]:
    from . import package_frontend_tasks as pkg

    out: dict[Path, bytes] = {}
    canon = canonical_dir()
    out[task / "tests/test.sh"] = (canon / "test.sh").read_bytes()
    out[task / "tests/system_prompt.md"] = (canon / "system_prompt.md").read_bytes()
    out[task / "tests/webmcp_stdio_server.mjs"] = (
        canon / "mcp/webmcp_stdio_server.mjs"
    ).read_bytes()
    out[task / "tests/reward.toml"] = (canon / "reward.toml").read_bytes()
    # Judge-side reduced-motion emulation: chromium's --force-prefers-reduced-motion
    # is a no-op on current builds, so the playwright_reduced_motion MCP server
    # loads this config (contextOptions.reducedMotion) instead.
    out[task / "tests/playwright_rm_config.json"] = (
        canon / "mcp/playwright_rm_config.json"
    ).read_bytes()
    # Same canonical bridge, twice: judge runs the tests/ copy; the environment/
    # copy is the docker build-context file the Dockerfile bakes to /opt/webmcp.
    out[task / "environment/webmcp_stdio_server.mjs"] = (
        canon / "mcp/webmcp_stdio_server.mjs"
    ).read_bytes()
    # Baked as /opt/verifier/entrypoint.sh (shared CDP Chrome + HEALTHCHECK pair).
    out[task / "environment/entrypoint.sh"] = (canon / "entrypoint.sh").read_bytes()

    dockerfile = pkg.DOCKERFILE
    if (task / "environment/reference-screenshots").is_dir():
        dockerfile += SCREENSHOT_COPY
    out[task / "environment/Dockerfile"] = dockerfile.encode()

    meta = sources.get(task.name)
    if meta and meta.get("description"):
        out[task / "task.toml"] = pkg.render_task_toml(
            task.name, meta["description"]
        ).encode()
        out[task / "README.md"] = pkg.render_task_readme(
            task.name, meta["description"]
        ).encode()
    if task.name in modules:
        out[task / "solution/app/README.md"] = pkg.render_oracle_readme(
            task.name, modules[task.name]
        ).encode()
    if (task / "solution/app").is_dir():
        out[task / "solution/app/e2e.playwright.config.mjs"] = (
            canon / "e2e/e2e.playwright.config.mjs"
        ).read_bytes()
    return out


E2E_MARKER = "// ==== END CANONICAL REGION"
CANONICAL_E2E_SCRIPT = "playwright test -c e2e.playwright.config.mjs"
DEFAULT_PLAYWRIGHT_TEST_VERSION = "^1.61.0"


def desired_e2e_prefix() -> bytes:
    """Canonical region of solution/app/e2e.spec.mjs (everything through the
    marker line). The file is PREFIX-checked, not byte-identical: task-specific
    criterion tests are appended after the marker and are never propagated."""
    src = (canonical_dir() / "e2e/oracle.e2e.mjs").read_bytes()
    return src


def sync_e2e_file(task: Path, check: bool) -> Path | None:
    """Ensure solution/app/e2e.spec.mjs starts with the canonical region.
    Preserves any content after the marker. Returns the path if it would
    change (check) or was changed (write)."""
    target = task / "solution/app/e2e.spec.mjs"
    if not (task / "solution/app").is_dir():
        return None
    prefix = desired_e2e_prefix()
    existing = target.read_bytes() if target.exists() else b""
    if existing.startswith(prefix):
        return None
    # keep the task-added tail if a previous canonical region exists
    marker = E2E_MARKER.encode()
    idx = existing.find(marker)
    if idx != -1:
        nl = existing.find(b"\n", idx)
        tail = existing[nl + 1 :] if nl != -1 else b""
    else:
        if existing and not check:
            raise ValueError(
                f"refusing to overwrite unmarked task-owned e2e suite: {target}"
            )
        tail = b""
    if not check:
        target.write_bytes(prefix + tail)
    return target


def sync_e2e_package(task: Path, check: bool) -> Path | None:
    """Ensure each oracle can execute the canonical e2e suite.

    Preserve task-owned test:e2e commands under their existing name and add a
    test:e2e:canonical sibling. Apps without a task-owned command use test:e2e
    directly. Existing @playwright/test versions are never replaced; when an
    app already carries the full playwright package, use that same version spec
    to avoid loading two incompatible Playwright minors.
    """
    target = task / "solution/app/package.json"
    if not target.is_file():
        return None

    original = target.read_text()
    package = json.loads(original)
    scripts = package.setdefault("scripts", {})
    existing_e2e = scripts.get("test:e2e")
    if existing_e2e is None:
        scripts["test:e2e"] = CANONICAL_E2E_SCRIPT
    elif existing_e2e != CANONICAL_E2E_SCRIPT:
        scripts["test:e2e:canonical"] = CANONICAL_E2E_SCRIPT

    dev_dependencies = package.setdefault("devDependencies", {})
    if "@playwright/test" not in dev_dependencies:
        dependencies = package.get("dependencies", {})
        playwright_version = (
            dev_dependencies.get("playwright")
            or dependencies.get("playwright")
            or DEFAULT_PLAYWRIGHT_TEST_VERSION
        )
        dev_dependencies["@playwright/test"] = playwright_version

    desired = json.dumps(package, indent=2, ensure_ascii=False) + "\n"
    if desired == original:
        return None
    if not check:
        target.write_text(desired)
    return target


def fix_mcp_servers_block(task: Path, check: bool) -> list[Path]:
    """Re-inline the canonical judge MCP servers fragment into dimension tomls.

    Dimension tomls carry the fragment inlined (rubric_to_tomls emits it at
    generation time); this keeps the region between the first
    [[judge.mcp_servers]] and [scoring] in sync with the canonical source.
    """
    from . import package_frontend_tasks as pkg

    desired = pkg.judge_mcp_servers_block().rstrip() + "\n\n"
    changed = []
    for toml in task.glob("tests/*/*.toml"):
        text = toml.read_text()
        start = text.find("[[judge.mcp_servers]]")
        end = text.find("[scoring]")
        if start < 0 or end < 0 or end < start:
            continue
        fixed = text[:start] + desired + text[end:]
        if fixed != text:
            changed.append(toml)
            if not check:
                toml.write_text(fixed)
    return changed


def fix_judge_cwd(task: Path, check: bool) -> list[Path]:
    changed = []
    for toml in task.glob("tests/*/*.toml"):
        text = toml.read_text()
        fixed = re.sub(r'(?m)^cwd = ".*"$', JUDGE_CWD, text)
        if fixed != text:
            changed.append(toml)
            if not check:
                toml.write_text(fixed)
    return changed


def propagate(slugs: list[str], check: bool = False, root: Path | None = None) -> int:
    """Propagate canonical surfaces; returns a process exit code."""
    repo_root = root if root is not None else find_repo_root()
    sources = json.loads((schemas_dir() / "webmcp-task-sources.json").read_text())
    assignments = json.loads((schemas_dir() / "webmcp-assignments.json").read_text())
    modules = {a["task"]: a["modules"] for a in assignments["assignments"]}
    tasks = (
        [repo_root / "tasks" / s for s in slugs]
        if slugs
        else sorted(
            p for p in (repo_root / "tasks").iterdir()
            if p.is_dir() and p.name.startswith("frontend-")
        )
    )
    drift: list[str] = []
    for task in tasks:
        if not (task / "tests").is_dir():
            continue
        for path, want in desired_files(task, sources, modules).items():
            if not path.exists() or path.read_bytes() != want:
                drift.append(str(path.relative_to(repo_root)))
                if not check:
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_bytes(want)
                    if path.name in ("test.sh", "entrypoint.sh"):
                        path.chmod(0o755)
        for toml in fix_mcp_servers_block(task, check):
            drift.append(str(toml.relative_to(repo_root)))
        for toml in fix_judge_cwd(task, check):
            drift.append(str(toml.relative_to(repo_root)))
        e2e_changed = sync_e2e_file(task, check)
        if e2e_changed is not None:
            drift.append(str(e2e_changed.relative_to(repo_root)))
        package_changed = sync_e2e_package(task, check)
        if package_changed is not None:
            drift.append(str(package_changed.relative_to(repo_root)))

    verb = "would change" if check else "updated"
    print(f"{verb}: {len(drift)} files across {len(tasks)} tasks")
    for d in drift[:10]:
        print(" ", d)
    if len(drift) > 10:
        print(f"  ... and {len(drift) - 10} more")
    return 1 if (check and drift) else 0
