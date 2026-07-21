"""Deterministic, no-LLM CI checks for task solution oracles."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
import tomllib
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Sequence

from .repo import find_repo_root, package_data, schemas_path
from .validate import validate_task


STAGES = (
    "static",
    "build",
    "serve-browser",
    "webmcp",
    "judge-setup",
)
_SOLUTION_PATH = re.compile(r"^tasks/([^/]+)/solution(?:/|$)")
_ENV_REF = re.compile(r"\$\{?([A-Z][A-Z0-9_]*)\}?")
_RUNTIME_ENV = {
    "WEBMCP_CDP_ENDPOINT": "http://127.0.0.1:9222",
    "WEBMCP_CDP_PORT": "9222",
    "WEBMCP_RM_CDP_ENDPOINT": "http://127.0.0.1:9223",
    "WEBMCP_RM_CDP_PORT": "9223",
}


class OracleCIError(RuntimeError):
    """A named oracle-CI stage failed for one task."""

    def __init__(self, slug: str, stage: str, message: str):
        super().__init__(message)
        self.slug = slug
        self.stage = stage
        self.message = message

    def __str__(self) -> str:
        return f"{self.slug} [{self.stage}]: {self.message}"


@dataclass(frozen=True)
class JudgeServer:
    """One unique, locally runnable judge MCP server definition."""

    name: str
    transport: str
    command: str
    args: tuple[str, ...]
    dimensions: tuple[str, ...]

    def as_json(self) -> dict[str, object]:
        return {
            "name": self.name,
            "transport": self.transport,
            "command": self.command,
            "args": list(self.args),
            "dimensions": list(self.dimensions),
        }


Run = Callable[..., subprocess.CompletedProcess[str]]


def changed_oracle_slugs(
    repo_root: Path,
    *,
    base_ref: str = "origin/main",
    run: Run = subprocess.run,
) -> list[str]:
    """Return task slugs whose solution tree changed from ``base_ref``."""
    completed = run(
        ["git", "diff", "--name-only", f"{base_ref}...HEAD"],
        cwd=repo_root,
        text=True,
        capture_output=True,
    )
    if completed.returncode:
        detail = (completed.stderr or completed.stdout).strip()
        raise OracleCIError("--changed", "static", detail or "git diff failed")
    return sorted(
        {
            match.group(1)
            for line in completed.stdout.splitlines()
            if (match := _SOLUTION_PATH.match(line.strip()))
        }
    )


def _task_dir(tasks_root: Path, slug: str) -> Path:
    task = tasks_root / slug
    if not task.is_dir() or task.parent.resolve() != tasks_root.resolve():
        raise OracleCIError(slug, "static", f"task not found under {tasks_root}")
    return task


def _static_stage(task: Path) -> None:
    validation = validate_task(task, strict_oracle=True, strict_dimensions=True)
    failed = [check for check in validation.checks if not check.passed]
    if failed:
        details = "; ".join(
            f"{check.name}: {', '.join(check.messages) or 'failed'}" for check in failed
        )
        raise OracleCIError(task.name, "static", details)


def _run_checked(
    slug: str,
    stage: str,
    command: Sequence[str],
    *,
    cwd: Path,
    run: Run,
) -> None:
    completed = run(
        list(command),
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if completed.returncode:
        output = completed.stdout.strip()
        if len(output) > 6000:
            output = output[-6000:]
        raise OracleCIError(
            slug, stage, output or f"{' '.join(command)} exited {completed.returncode}"
        )


def _build_stage(task: Path, *, run: Run, app_dir: Path | None = None) -> None:
    app_dir = app_dir or task / "solution/app"
    package_path = app_dir / "package.json"
    try:
        package = json.loads(package_path.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        raise OracleCIError(
            task.name, "build", f"cannot read package.json: {exc}"
        ) from exc
    scripts = package.get("scripts")
    missing = [
        name
        for name in ("start", "verify:build")
        if not isinstance(scripts, dict) or not scripts.get(name)
    ]
    if missing:
        raise OracleCIError(
            task.name,
            "build",
            f"package.json is missing required script(s): {', '.join(missing)}",
        )
    if not (app_dir / "package-lock.json").is_file():
        raise OracleCIError(
            task.name, "build", "npm ci requires solution/app/package-lock.json"
        )
    _run_checked(
        task.name,
        "build",
        ["npm", "ci", "--no-audit", "--no-fund"],
        cwd=app_dir,
        run=run,
    )
    _run_checked(
        task.name, "build", ["npm", "run", "verify:build"], cwd=app_dir, run=run
    )


def _resolve_runtime_arg(arg: str, task: Path, runtime_dir: Path) -> str:
    refs = _ENV_REF.findall(arg)
    unknown = sorted(set(refs) - set(_RUNTIME_ENV))
    if unknown:
        raise OracleCIError(
            task.name,
            "judge-setup",
            f"unknown environment variable(s) in MCP args: {', '.join(unknown)}",
        )
    for name in refs:
        arg = arg.replace(f"${{{name}}}", _RUNTIME_ENV[name]).replace(
            f"${name}", _RUNTIME_ENV[name]
        )
    if arg == "/tests" or arg.startswith("/tests/"):
        arg = str(task / "tests" / arg.removeprefix("/tests/")).rstrip("/")
    if arg == "/logs/verifier" or arg.startswith("/logs/verifier/"):
        arg = str(runtime_dir / "logs" / arg.removeprefix("/logs/verifier/")).rstrip(
            "/"
        )
    return arg


def load_judge_servers(task: Path, runtime_dir: Path) -> list[JudgeServer]:
    """Parse every dimension TOML and deduplicate identical server definitions."""
    tomls = sorted((task / "tests").glob("*/*.toml"))
    if not tomls:
        raise OracleCIError(task.name, "judge-setup", "no dimension TOMLs found")

    unique: dict[tuple[str, str, str, tuple[str, ...]], list[str]] = {}
    for path in tomls:
        try:
            document = tomllib.loads(path.read_text())
        except (OSError, UnicodeDecodeError, tomllib.TOMLDecodeError) as exc:
            raise OracleCIError(
                task.name,
                "judge-setup",
                f"invalid {path.relative_to(task)}: {exc}",
            ) from exc
        servers = document.get("judge", {}).get("mcp_servers")
        if not isinstance(servers, list) or not servers:
            raise OracleCIError(
                task.name,
                "judge-setup",
                f"{path.relative_to(task)} has no [[judge.mcp_servers]] blocks",
            )
        for index, raw in enumerate(servers, 1):
            if not isinstance(raw, dict):
                raise OracleCIError(
                    task.name, "judge-setup", f"{path}: server {index} is not a table"
                )
            name = raw.get("name")
            transport = raw.get("transport")
            command = raw.get("command")
            args = raw.get("args")
            if not isinstance(name, str) or not name:
                raise OracleCIError(
                    task.name, "judge-setup", f"{path}: server {index} has no name"
                )
            if transport != "stdio":
                raise OracleCIError(
                    task.name, "judge-setup", f"{path}: {name} transport must be stdio"
                )
            if not isinstance(command, str) or not command:
                raise OracleCIError(
                    task.name, "judge-setup", f"{path}: {name} has no command"
                )
            if not isinstance(args, list) or not all(
                isinstance(arg, str) for arg in args
            ):
                raise OracleCIError(
                    task.name, "judge-setup", f"{path}: {name} args must be strings"
                )
            resolved_command = _resolve_runtime_arg(command, task, runtime_dir)
            resolved_args = tuple(
                _resolve_runtime_arg(arg, task, runtime_dir) for arg in args
            )
            key = (name, transport, resolved_command, resolved_args)
            unique.setdefault(key, []).append(path.parent.name)

    return [
        JudgeServer(name, transport, command, args, tuple(dimensions))
        for (name, transport, command, args), dimensions in unique.items()
    ]


def _runtime_stage(
    task: Path,
    repo_root: Path,
    *,
    run: Run,
    app_dir: Path | None = None,
) -> None:
    node = shutil.which("node")
    if node is None:
        raise OracleCIError(task.name, "serve-browser", "node was not found on PATH")
    with tempfile.TemporaryDirectory(
        prefix=f"oracle-ci-{task.name}-"
    ) as raw_runtime_dir:
        runtime_dir = Path(raw_runtime_dir)
        servers = load_judge_servers(task, runtime_dir)
        config = {
            "slug": task.name,
            "repoRoot": str(repo_root),
            "taskDir": str(task),
            "appDir": str(app_dir or task / "solution/app"),
            "assignmentsPath": str(schemas_path("webmcp-assignments.json")),
            "servers": [server.as_json() for server in servers],
            "runtimeDir": str(runtime_dir),
        }
        config_path = runtime_dir / "config.json"
        config_path.write_text(json.dumps(config))
        completed = run(
            [
                node,
                str(package_data("assets", "oracle_ci_runtime.mjs")),
                str(config_path),
            ],
            cwd=repo_root,
            env={**os.environ, **_RUNTIME_ENV},
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        output = completed.stdout or ""
        for line in output.splitlines():
            if line.startswith("ORACLE_CI_STAGE "):
                print(line.removeprefix("ORACLE_CI_STAGE "))
        if completed.returncode:
            failure = None
            for line in reversed(output.splitlines()):
                if line.startswith("ORACLE_CI_FAILURE "):
                    try:
                        failure = json.loads(line.removeprefix("ORACLE_CI_FAILURE "))
                    except json.JSONDecodeError:
                        pass
                    break
            if isinstance(failure, dict):
                stage = str(failure.get("stage", "serve-browser"))
                message = str(failure.get("message", "runtime check failed"))
            else:
                stage = "serve-browser"
                message = (
                    output.strip()[-6000:] or f"runtime exited {completed.returncode}"
                )
            raise OracleCIError(task.name, stage, message)


def run_oracle_ci(
    slugs: Sequence[str],
    *,
    tasks_root: Path,
    repo_root: Path | None = None,
    run: Run = subprocess.run,
) -> int:
    """Run all five oracle-CI stages serially for each requested task."""
    root = repo_root or find_repo_root(tasks_root)
    for slug in slugs:
        task = _task_dir(tasks_root, slug)
        print(f"{slug} [static]: running")
        _static_stage(task)
        print(f"{slug} [static]: PASS")
        with tempfile.TemporaryDirectory(
            prefix=f"oracle-ci-app-{slug}-"
        ) as raw_app_dir:
            app_dir = Path(raw_app_dir) / "app"
            shutil.copytree(
                task / "solution/app",
                app_dir,
                ignore=shutil.ignore_patterns("node_modules"),
            )
            print(f"{slug} [build]: running npm ci + verify:build")
            _build_stage(task, run=run, app_dir=app_dir)
            print(f"{slug} [build]: PASS")
            _runtime_stage(task, root, run=run, app_dir=app_dir)
    return 0
