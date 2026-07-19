"""Command-line interface for corpus dataset certification."""

from __future__ import annotations

import json
import sqlite3
import tomllib
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from .discovery import default_tasks_root, discover, find_task
from .drift import DriftKind, detect_corpus_drift, detect_drift
from .reports import write_json_report
from .state import (
    DEFAULT_DB,
    STAGES,
    baselines_for,
    connect,
    create_run,
    git_sha,
    last_fingerprint,
    previous_failures,
    readiness,
    record_results,
    run_all_pass,
    save_fingerprint,
    set_readiness,
    stage_at_least,
    task_fingerprint,
)
from .validate import TaskValidation, validate_task


app = typer.Typer(help="Check-only certification for the frontend task corpus.", no_args_is_help=True, add_completion=False)
record_app = typer.Typer(help="Record external certification evidence.", no_args_is_help=True)
baseline_app = typer.Typer(help="Manage accepted static-check waivers.", no_args_is_help=True)
app.add_typer(record_app, name="record")
app.add_typer(baseline_app, name="baseline")
console = Console()
err = Console(stderr=True)
DEFAULT_ROOT = str(default_tasks_root())
DEFAULT_DB_PATH = str(DEFAULT_DB)


def _connection(db: str) -> sqlite3.Connection:
    return connect(db)


def _resolve_tasks(root: str, identifiers: list[str], all_tasks: bool) -> list[Path]:
    if all_tasks:
        return [task.task_dir for task in discover(root)]
    if not identifiers:
        err.print("[red]provide task names or --all[/red]")
        raise typer.Exit(2)
    resolved: list[Path] = []
    for identifier in identifiers:
        task_dir = find_task(root, identifier)
        if task_dir is None:
            err.print(f"[red]task not found:[/red] {identifier}")
            raise typer.Exit(2)
        resolved.append(task_dir)
    return resolved


def _resolve_one(root: str, slug: str) -> Path:
    task_dir = find_task(root, slug)
    if task_dir is None:
        err.print(f"[red]task not found:[/red] {slug}")
        raise typer.Exit(2)
    return task_dir


def _effective_rows(
    connection: sqlite3.Connection, slug: str, validation: TaskValidation
) -> tuple[list[tuple[str, str, str, str, str]], set[tuple[str, str]]]:
    accepted = baselines_for(connection, slug)
    validation.waived_checks = set(accepted)
    rows: list[tuple[str, str, str, str, str]] = []
    failures: set[tuple[str, str]] = set()
    for check in validation.checks:
        message = "; ".join(check.messages) if check.messages else "check passed"
        if check.passed:
            status = "pass"
        elif check.name in accepted:
            status = "skip"
            message = f"WAIVED ({accepted[check.name]['reason']}): {message}"
        else:
            status = "fail"
            failures.add((slug, check.name))
        rows.append((slug, check.name, check.name, status, message))
        for index, warning in enumerate(check.warnings, 1):
            rows.append((slug, check.name, f"{check.name}.warning.{index}", "warn", warning))
    return rows, failures


def _print_validation(validation: TaskValidation, waived: set[str] | None = None) -> None:
    waived = waived or set()
    effective_pass = all(check.passed or check.name in waived for check in validation.checks)
    console.print(f"[{'green' if effective_pass else 'red'}]{'PASS' if effective_pass else 'FAIL'}[/] {Path(validation.task_dir).name}")
    for check in validation.checks:
        for warning in check.warnings:
            console.print(f"    [yellow]WARN[/yellow] {check.name}: {warning}")
        if not check.passed and check.name in waived:
            console.print(f"    [cyan]WAIVED[/cyan] {check.name}: {'; '.join(check.messages)}")
        elif not check.passed:
            for message in check.messages:
                console.print(f"    [red]-[/red] {check.name}: {message}")


def _registered(validation: TaskValidation) -> bool:
    contract = next((check for check in validation.checks if check.name == "contract"), None)
    return bool(contract and contract.passed and Path(validation.task_dir).is_dir())


def _reconcile_readiness(
    connection: sqlite3.Connection,
    slug: str,
    validation: TaskValidation,
    content_hash: str,
    changed: bool,
    effective_pass: bool,
) -> None:
    current = readiness(connection, slug)
    provable = "static_valid" if _registered(validation) and effective_pass else "registered" if _registered(validation) else None
    if provable is None:
        if current is not None:
            connection.execute("DELETE FROM readiness WHERE slug = ?", (slug,))
            connection.commit()
        return
    if current is None or changed or not effective_pass:
        set_readiness(
            connection,
            slug,
            provable,
            {"fingerprint": content_hash, "static_valid": effective_pass},
        )


def _run_validation(
    connection: sqlite3.Connection,
    task_dirs: list[Path],
    *,
    command: str,
    args: dict,
    strict_oracle: bool,
    incremental: bool,
    force: bool,
    show_regression: bool = True,
) -> tuple[list[TaskValidation], int, set[tuple[str, str]]]:
    run_id = create_run(connection, command, args)
    previous = previous_failures(connection, command, run_id)
    current: set[tuple[str, str]] = set()
    validations: list[TaskValidation] = []
    for task_dir in task_dirs:
        slug = task_dir.name
        fingerprint = task_fingerprint(task_dir)
        old = last_fingerprint(connection, slug)
        unchanged = bool(old and old["content_hash"] == fingerprint)
        if incremental and not force and unchanged and run_all_pass(connection, old["last_run_id"], slug):
            record_results(connection, run_id, [(slug, "incremental", "incremental", "skip", "unchanged since last all-pass run")])
            save_fingerprint(connection, slug, fingerprint, run_id)
            connection.commit()
            console.print(f"[blue]SKIP[/blue] {slug} (unchanged since last all-pass run)")
            continue
        validation = validate_task(task_dir, strict_oracle=strict_oracle)
        validations.append(validation)
        rows, failures = _effective_rows(connection, slug, validation)
        current.update(failures)
        record_results(connection, run_id, rows)
        save_fingerprint(connection, slug, fingerprint, run_id)
        connection.commit()
        waived = set(baselines_for(connection, slug))
        _print_validation(validation, waived)
        _reconcile_readiness(connection, slug, validation, fingerprint, not unchanged, not failures)

    if show_regression:
        newly = sorted(current - previous)
        known = sorted(current & previous)
        fixed = sorted(previous - current)
        def summary(items: list[tuple[str, str]]) -> str:
            shown = ", ".join(f"{slug}/{check}" for slug, check in items[:8])
            return f" ({shown}{f', +{len(items) - 8} more' if len(items) > 8 else ''})" if items else ""
        console.print("\n[bold]Regression summary[/bold]")
        console.print(f"  newly-failing: {len(newly)}{summary(newly)}")
        console.print(f"  known-failing: {len(known)}{summary(known)}")
        console.print(f"  fixed: {len(fixed)}{summary(fixed)}")
    return validations, run_id, current


@app.command("discover")
def discover_cmd(
    root: str = typer.Option(DEFAULT_ROOT, "--root"),
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """List frontend task directories and oracle/assignment state."""
    with _connection(db):
        pass
    tasks = discover(root)
    table = Table(title=f"Discovered tasks ({len(tasks)})")
    for heading in ("slug", "has-oracle", "has-screenshots", "assignment"):
        table.add_column(heading)
    for task in tasks:
        table.add_row(task.slug, "yes" if task.has_oracle else "no", "yes" if task.has_screenshots else "no", "yes" if task.has_assignment else "no")
    console.print(table)


@app.command("validate")
def validate_cmd(
    tasks: list[str] = typer.Argument(None, help="frontend-* task names"),
    root: str = typer.Option(DEFAULT_ROOT, "--root"),
    all_tasks: bool = typer.Option(False, "--all"),
    json_out: str | None = typer.Option(None, "--json", help="write JSON report under tools/corpuscheck"),
    strict_oracle: bool = typer.Option(False, "--strict-oracle"),
    incremental: bool = typer.Option(False, "--incremental"),
    force: bool = typer.Option(False, "--force"),
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """Run all validation tiers and persist results."""
    task_dirs = _resolve_tasks(root, tasks or [], all_tasks)
    command = "validate --all" if all_tasks else "validate " + " ".join(path.name for path in task_dirs)
    with _connection(db) as connection:
        results, _, failures = _run_validation(
            connection,
            task_dirs,
            command=command,
            args={"tasks": [path.name for path in task_dirs], "root": root, "strict_oracle": strict_oracle, "incremental": incremental, "force": force},
            strict_oracle=strict_oracle,
            incremental=incremental,
            force=force,
        )
    if json_out:
        try:
            write_json_report(results, json_out)
        except ValueError as exc:
            err.print(f"[red]report not written:[/red] {exc}")
            raise typer.Exit(2) from exc
    checked = len(results)
    skipped = len(task_dirs) - checked
    console.print(
        f"\n{checked - len({slug for slug, _ in failures})}/{checked} checked tasks passed"
        + (f"; {skipped} skipped" if skipped else "")
    )
    if failures:
        raise typer.Exit(1)


@app.command("drift")
def drift_cmd(
    tasks: list[str] = typer.Argument(None, help="frontend-* task names"),
    root: str = typer.Option(DEFAULT_ROOT, "--root"),
    all_tasks: bool = typer.Option(False, "--all"),
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """Compare shared files to templates and report corpus assignment drift."""
    with _connection(db):
        pass
    bad_kinds = {DriftKind.MANUAL_EDIT, DriftKind.MISSING_TASK_DIR, DriftKind.ORPHAN_DIR}
    failed = False
    corpus = detect_corpus_drift(root)
    if corpus.items:
        console.print("[red]corpus drift[/red]")
        for item in corpus.items:
            console.print(f"    - {item}", markup=False)
            failed |= item.kind in bad_kinds
    else:
        console.print("[green]corpus assignments match task directories[/green]")
    for task_dir in _resolve_tasks(root, tasks or [], all_tasks):
        report = detect_drift(task_dir)
        console.print(f"[{'green' if report.clean else 'red'}]{'clean' if report.clean else 'drift'}[/] {task_dir.name}")
        for item in report.items:
            console.print(f"    - {item}", markup=False)
            failed |= item.kind in bad_kinds
    if failed:
        raise typer.Exit(1)


@app.command("status")
def status_cmd(
    all_tasks: bool = typer.Option(False, "--all"),
    root: str = typer.Option(DEFAULT_ROOT, "--root"),
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """Show readiness stages and cumulative funnel counts."""
    tasks = discover(root)
    with _connection(db) as connection:
        stored = {row["slug"]: row for row in connection.execute("SELECT * FROM readiness")}
    visible = tasks if all_tasks else [task for task in tasks if task.slug in stored]
    table = Table(title=f"Readiness ({len(visible)} tasks)")
    table.add_column("slug")
    table.add_column("stage")
    table.add_column("updated")
    for task in visible:
        row = stored.get(task.slug)
        table.add_row(task.slug, row["stage"] if row else "unregistered", row["updated_at"] if row else "—")
    console.print(table)
    funnel = Table(title="Readiness funnel")
    funnel.add_column("stage")
    funnel.add_column("at or beyond", justify="right")
    for stage in STAGES:
        count = sum(1 for task in tasks if (row := stored.get(task.slug)) and stage_at_least(row["stage"], stage))
        funnel.add_row(stage, str(count))
    funnel.add_row("unregistered", str(sum(task.slug not in stored for task in tasks)))
    console.print(funnel)


@app.command("advance")
def advance_cmd(
    slug: str,
    root: str = typer.Option(DEFAULT_ROOT, "--root"),
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """Recompute and persist the registered/static_valid readiness stages."""
    task_dir = _resolve_one(root, slug)
    with _connection(db) as connection:
        _, _, failures = _run_validation(
            connection,
            [task_dir],
            command=f"advance {task_dir.name}",
            args={"slug": task_dir.name, "root": root},
            strict_oracle=False,
            incremental=False,
            force=True,
            show_regression=False,
        )
        row = readiness(connection, task_dir.name)
    if row:
        console.print(f"{task_dir.name}: [bold]{row['stage']}[/bold]")
    else:
        console.print(f"[red]{task_dir.name}: registration could not be proven[/red]")
    if failures:
        raise typer.Exit(1)


def _load_json(path: Path, label: str) -> dict:
    try:
        value = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        err.print(f"[red]cannot parse {label}:[/red] {exc}")
        raise typer.Exit(2) from exc
    if not isinstance(value, dict):
        err.print(f"[red]{label} must contain a JSON object[/red]")
        raise typer.Exit(2)
    return value


def _dimension_scores(reward: dict) -> list[tuple[str, object]]:
    ignored = {"reward", "pass"}
    scores: list[tuple[str, object]] = []
    for key, value in reward.items():
        if key in ignored:
            continue
        if isinstance(value, (int, float)):
            scores.append((key, value))
        elif isinstance(value, dict):
            score = value.get("score", value.get("reward", value.get("value")))
            if isinstance(score, (int, float)):
                scores.append((key, score))
    return scores


def _require_stage(connection: sqlite3.Connection, slug: str, stage: str) -> sqlite3.Row:
    row = readiness(connection, slug)
    if row is None or not stage_at_least(row["stage"], stage):
        current = row["stage"] if row else "unregistered"
        err.print(f"[red]{slug} must be at least {stage} (currently {current})[/red]")
        raise typer.Exit(1)
    return row


@record_app.command("serving")
def record_serving(
    slug: str,
    validation: str | None = typer.Option(None, "--validation"),
    root: str = typer.Option(DEFAULT_ROOT, "--root"),
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """Record that the oracle package and optional smoke validation serve cleanly."""
    task_dir = _resolve_one(root, slug)
    app_dir = task_dir / "solution/app"
    failures: list[str] = []
    package = _load_json(app_dir / "package.json", "solution/app/package.json") if app_dir.is_dir() else None
    if not app_dir.is_dir():
        failures.append("solution/app is absent")
    if package is not None:
        scripts = package.get("scripts")
        required_scripts = {"start", "verify:build"}
        if not isinstance(scripts, dict) or not required_scripts.issubset(scripts):
            failures.append("package.json scripts do not include start+verify:build")
    evidence: dict = {"git_sha": git_sha()}
    if validation:
        validation_path = Path(validation).expanduser().resolve()
        smoke = _load_json(validation_path, "validation.json")
        console_errors = smoke.get("consoleErrors", [])
        page_errors = smoke.get("pageErrors", [])
        if smoke.get("served") is not True or console_errors or page_errors:
            failures.append(f"validation is not clean (served={smoke.get('served')!r}, consoleErrors={len(console_errors)}, pageErrors={len(page_errors)})")
        evidence["validation_path"] = str(validation_path)
    if failures:
        for failure in failures:
            err.print(f"[red]- {failure}[/red]")
        raise typer.Exit(1)
    with _connection(db) as connection:
        _require_stage(connection, task_dir.name, "static_valid")
        set_readiness(connection, task_dir.name, "oracle_serving", evidence)
    console.print(f"[green]{task_dir.name}: oracle_serving[/green]")


@record_app.command("oracle")
def record_oracle(
    slug: str,
    trial: str = typer.Option(..., "--trial"),
    reward_min: float = typer.Option(0.9, "--reward-min"),
    root: str = typer.Option(DEFAULT_ROOT, "--root"),
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """Record an oracle trial and gate oracle certification on its reward."""
    task_dir = _resolve_one(root, slug)
    trial_path = Path(trial).expanduser().resolve()
    reward_data = _load_json(trial_path / "verifier/reward.json", "verifier/reward.json")
    try:
        reward = float(reward_data["reward"])
    except (KeyError, TypeError, ValueError) as exc:
        err.print("[red]reward.json has no numeric reward[/red]")
        raise typer.Exit(2) from exc
    evidence = {"trial_path": str(trial_path), "reward": reward, "git_sha": git_sha()}
    with _connection(db) as connection:
        current = readiness(connection, task_dir.name)
        if (current is None or not stage_at_least(current["stage"], "oracle_serving")) and (task_dir / "solution/app").is_dir() and (task_dir / "environment/reference-screenshots").is_dir():
            if current is None or not stage_at_least(current["stage"], "static_valid"):
                err.print(f"[red]{task_dir.name} must be static_valid before oracle serving[/red]")
                raise typer.Exit(1)
            set_readiness(connection, task_dir.name, "oracle_serving", {"auto_filled": True, "git_sha": git_sha()})
        _require_stage(connection, task_dir.name, "oracle_serving")
        if reward >= reward_min:
            set_readiness(connection, task_dir.name, "oracle_certified", evidence)
            console.print(f"[green]{task_dir.name}: oracle_certified (reward={reward:.3f})[/green]")
            return
        current = readiness(connection, task_dir.name)
        set_readiness(connection, task_dir.name, current["stage"], {**evidence, "gate": "failed", "reward_min": reward_min})
    err.print(f"[red]oracle reward {reward:.3f} is below {reward_min:.3f}[/red]")
    for dimension, score in _dimension_scores(reward_data):
        err.print(f"  {dimension}: {score}")
    raise typer.Exit(1)


def _passing_criteria(details: dict) -> list[str]:
    passing: list[str] = []
    dimensions = details.get("dimensions", details)
    if not isinstance(dimensions, dict):
        return passing
    for dimension, payload in dimensions.items():
        criteria = payload.get("criteria", []) if isinstance(payload, dict) else []
        for criterion in criteria if isinstance(criteria, list) else []:
            if not isinstance(criterion, dict):
                continue
            value = criterion.get("value", 0)
            if isinstance(value, (int, float)) and value >= 1:
                passing.append(f"{dimension}/{criterion.get('id', '<unknown>')}")
    return passing


@record_app.command("nop")
def record_nop(
    slug: str,
    trial: str = typer.Option(..., "--trial"),
    reward_max: float = typer.Option(0.15, "--reward-max"),
    root: str = typer.Option(DEFAULT_ROOT, "--root"),
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """Record a NOP trial and require its reward to remain near zero."""
    task_dir = _resolve_one(root, slug)
    trial_path = Path(trial).expanduser().resolve()
    reward_data = _load_json(trial_path / "verifier/reward.json", "verifier/reward.json")
    try:
        reward = float(reward_data["reward"])
    except (KeyError, TypeError, ValueError) as exc:
        err.print("[red]reward.json has no numeric reward[/red]")
        raise typer.Exit(2) from exc
    evidence = {"trial_path": str(trial_path), "reward": reward, "git_sha": git_sha()}
    with _connection(db) as connection:
        _require_stage(connection, task_dir.name, "oracle_certified")
        if reward <= reward_max:
            set_readiness(connection, task_dir.name, "nop_certified", evidence)
            set_readiness(connection, task_dir.name, "trial_ready", evidence)
            console.print(f"[green]{task_dir.name}: trial_ready (NOP reward={reward:.3f})[/green]")
            return
        current = readiness(connection, task_dir.name)
        set_readiness(connection, task_dir.name, current["stage"], {**evidence, "gate": "failed", "reward_max": reward_max})
    err.print(f"[red]NOP reward {reward:.3f} exceeds {reward_max:.3f}[/red]")
    details = _load_json(trial_path / "verifier/reward-details.json", "verifier/reward-details.json")
    passing = _passing_criteria(details)
    err.print("criteria passing on the NOP app:")
    for criterion in passing:
        err.print(f"  {criterion}")
    raise typer.Exit(1)


@baseline_app.command("accept")
def baseline_accept(
    slug: str,
    check_key: str,
    reason: str = typer.Option(..., "--reason"),
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """Accept a named validation-tier failure as a documented waiver."""
    from .state import now
    with _connection(db) as connection:
        connection.execute(
            """INSERT INTO baselines(slug, check_key, status, reason, accepted_at)
               VALUES (?, ?, 'accepted', ?, ?)
               ON CONFLICT(slug, check_key) DO UPDATE SET status='accepted', reason=excluded.reason, accepted_at=excluded.accepted_at""",
            (slug, check_key, reason, now()),
        )
        connection.commit()
    console.print(f"[green]accepted[/green] {slug}/{check_key}: {reason}")


@baseline_app.command("list")
def baseline_list(db: str = typer.Option(DEFAULT_DB_PATH, "--db")) -> None:
    """List accepted validation waivers."""
    with _connection(db) as connection:
        rows = connection.execute("SELECT * FROM baselines ORDER BY slug, check_key").fetchall()
    table = Table(title=f"Baselines ({len(rows)})")
    for heading in ("slug", "check_key", "status", "reason", "accepted_at"):
        table.add_column(heading)
    for row in rows:
        table.add_row(*(str(row[column]) for column in ("slug", "check_key", "status", "reason", "accepted_at")))
    console.print(table)


@baseline_app.command("remove")
def baseline_remove(
    slug: str,
    check_key: str,
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """Remove an accepted validation waiver."""
    with _connection(db) as connection:
        cursor = connection.execute("DELETE FROM baselines WHERE slug = ? AND check_key = ?", (slug, check_key))
        connection.commit()
    if cursor.rowcount == 0:
        err.print(f"[red]baseline not found:[/red] {slug}/{check_key}")
        raise typer.Exit(1)
    console.print(f"[green]removed[/green] {slug}/{check_key}")


@app.command("history")
def history_cmd(
    slug: str,
    limit: int = typer.Option(10, "--limit", min=1),
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """Show a task's per-tier outcomes from recent runs."""
    with _connection(db) as connection:
        runs = connection.execute(
            """SELECT DISTINCT r.id, r.started_at, r.command FROM runs r
               JOIN results x ON x.run_id = r.id WHERE x.slug = ?
               ORDER BY r.id DESC LIMIT ?""",
            (slug, limit),
        ).fetchall()
        table = Table(title=f"History: {slug}")
        for heading in ("run", "started", "command", "tier outcomes"):
            table.add_column(heading)
        for run in runs:
            outcomes = connection.execute(
                """SELECT tier, GROUP_CONCAT(DISTINCT status) AS statuses
                   FROM results WHERE run_id = ? AND slug = ? GROUP BY tier ORDER BY tier""",
                (run["id"], slug),
            ).fetchall()
            summary = ", ".join(f"{row['tier']}={row['statuses']}" for row in outcomes)
            table.add_row(str(run["id"]), run["started_at"], run["command"], summary)
    console.print(table)


@app.command("nop-scaffold")
def nop_scaffold(
    slug: str,
    out: str = typer.Option(..., "--out"),
    root: str = typer.Option(DEFAULT_ROOT, "--root"),
    db: str = typer.Option(DEFAULT_DB_PATH, "--db"),
) -> None:
    """Write the standard empty WebMCP-compatible NOP app outside the repository."""
    _resolve_one(root, slug)
    with _connection(db):
        pass
    output = Path(out).expanduser().resolve()
    repo = Path(__file__).resolve().parents[3]
    try:
        output.relative_to(repo)
    except ValueError:
        pass
    else:
        err.print("[red]--out must be outside the repository[/red]")
        raise typer.Exit(2)
    output.mkdir(parents=True, exist_ok=True)
    index = """<!doctype html>
<html><head><meta charset=\"utf-8\"><title>NOP</title><script>
window.webmcp_session_info = () => ({contract: 'zto-webmcp-v1', tools: []});
window.webmcp_list_tools = () => [];
window.webmcp_invoke_tool = () => ({ok: false, error: 'nop'});
</script></head><body></body></html>
"""
    package = {
        "private": True,
        "scripts": {
            "start": "npx -y serve -l 3000 -n .",
            "verify:build": 'node -e "process.exit(0)"',
        },
    }
    (output / "index.html").write_text(index)
    (output / "package.json").write_text(json.dumps(package, indent=2) + "\n")
    console.print(f"[green]NOP scaffold written:[/green] {output}")


if __name__ == "__main__":
    app()
