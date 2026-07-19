"""Persistent SQLite state for corpus certification runs."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


STAGES = (
    "registered",
    "static_valid",
    "oracle_serving",
    "oracle_certified",
    "nop_certified",
    "trial_ready",
)
DEFAULT_DB = Path(__file__).resolve().parents[2] / ".corpuscheck.db"

DDL = """
CREATE TABLE IF NOT EXISTS runs(
    id INTEGER PRIMARY KEY,
    started_at TEXT NOT NULL,
    git_sha TEXT NOT NULL,
    command TEXT NOT NULL,
    args_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS results(
    run_id INTEGER NOT NULL,
    slug TEXT NOT NULL,
    tier TEXT NOT NULL,
    check_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pass','fail','warn','skip')),
    message TEXT NOT NULL,
    FOREIGN KEY(run_id) REFERENCES runs(id)
);
CREATE TABLE IF NOT EXISTS fingerprints(
    slug TEXT PRIMARY KEY,
    content_hash TEXT NOT NULL,
    computed_at TEXT NOT NULL,
    last_run_id INTEGER NOT NULL,
    FOREIGN KEY(last_run_id) REFERENCES runs(id)
);
CREATE TABLE IF NOT EXISTS baselines(
    slug TEXT NOT NULL,
    check_key TEXT NOT NULL,
    status TEXT NOT NULL,
    reason TEXT NOT NULL,
    accepted_at TEXT NOT NULL,
    PRIMARY KEY(slug, check_key)
);
CREATE TABLE IF NOT EXISTS readiness(
    slug TEXT PRIMARY KEY,
    stage TEXT NOT NULL CHECK(stage IN ('registered','static_valid','oracle_serving','oracle_certified','nop_certified','trial_ready')),
    updated_at TEXT NOT NULL,
    evidence_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS verdicts(
    slug TEXT NOT NULL,
    label TEXT NOT NULL,
    dimension TEXT NOT NULL,
    criterion_id TEXT NOT NULL,
    value REAL NOT NULL,
    blocked INTEGER NOT NULL DEFAULT 0,
    ingested_at TEXT NOT NULL,
    PRIMARY KEY(slug, label, dimension, criterion_id)
);
CREATE TABLE IF NOT EXISTS judge_accuracy(
    slug TEXT NOT NULL,
    dimension TEXT NOT NULL,
    run_kind TEXT NOT NULL CHECK(run_kind IN ('oracle','nop')),
    fail_count INTEGER NOT NULL,
    total INTEGER NOT NULL,
    computed_at TEXT NOT NULL,
    PRIMARY KEY(slug, dimension, run_kind)
);
CREATE INDEX IF NOT EXISTS results_run_slug_idx ON results(run_id, slug);
CREATE INDEX IF NOT EXISTS verdicts_dim_crit_idx ON verdicts(dimension, criterion_id);
CREATE INDEX IF NOT EXISTS runs_command_idx ON runs(command, id);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def connect(path: str | Path = DEFAULT_DB) -> sqlite3.Connection:
    db_path = Path(path).expanduser().resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript(DDL)
    return connection


def git_sha() -> str:
    try:
        return subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=Path(__file__).resolve().parents[3],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def create_run(connection: sqlite3.Connection, command: str, args: dict) -> int:
    cursor = connection.execute(
        "INSERT INTO runs(started_at, git_sha, command, args_json) VALUES (?, ?, ?, ?)",
        (now(), git_sha(), command, json.dumps(args, sort_keys=True, default=str)),
    )
    connection.commit()
    return int(cursor.lastrowid)


def task_fingerprint(task_dir: str | Path) -> str:
    """Hash a task as sorted (relative path, file SHA-256) pairs."""
    root = Path(task_dir)
    digest = hashlib.sha256()
    for path in sorted((item for item in root.rglob("*") if item.is_file()), key=lambda p: p.as_posix()):
        relative = path.relative_to(root).as_posix()
        file_digest = hashlib.sha256()
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                file_digest.update(chunk)
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(file_digest.hexdigest().encode())
        digest.update(b"\n")
    return digest.hexdigest()


def last_fingerprint(connection: sqlite3.Connection, slug: str) -> sqlite3.Row | None:
    return connection.execute(
        "SELECT content_hash, computed_at, last_run_id FROM fingerprints WHERE slug = ?",
        (slug,),
    ).fetchone()


def run_all_pass(connection: sqlite3.Connection, run_id: int, slug: str) -> bool:
    row = connection.execute(
        """SELECT COUNT(*) AS total,
                  SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) AS failures
           FROM results WHERE run_id = ? AND slug = ?""",
        (run_id, slug),
    ).fetchone()
    return bool(row and row["total"] and not row["failures"])


def save_fingerprint(
    connection: sqlite3.Connection, slug: str, content_hash: str, run_id: int
) -> None:
    connection.execute(
        """INSERT INTO fingerprints(slug, content_hash, computed_at, last_run_id)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(slug) DO UPDATE SET content_hash=excluded.content_hash,
             computed_at=excluded.computed_at, last_run_id=excluded.last_run_id""",
        (slug, content_hash, now(), run_id),
    )


def baselines_for(connection: sqlite3.Connection, slug: str) -> dict[str, sqlite3.Row]:
    return {
        row["check_key"]: row
        for row in connection.execute(
            "SELECT * FROM baselines WHERE slug = ? AND status = 'accepted'", (slug,)
        )
    }


def previous_failures(
    connection: sqlite3.Connection, command: str, before_run_id: int
) -> set[tuple[str, str]]:
    row = connection.execute(
        "SELECT id FROM runs WHERE command = ? AND id < ? ORDER BY id DESC LIMIT 1",
        (command, before_run_id),
    ).fetchone()
    if row is None:
        return set()
    return {
        (item["slug"], item["check_name"])
        for item in connection.execute(
            "SELECT slug, check_name FROM results WHERE run_id = ? AND status = 'fail'",
            (row["id"],),
        )
    }


def readiness(connection: sqlite3.Connection, slug: str) -> sqlite3.Row | None:
    return connection.execute("SELECT * FROM readiness WHERE slug = ?", (slug,)).fetchone()


def set_readiness(
    connection: sqlite3.Connection,
    slug: str,
    stage: str,
    evidence: dict | None = None,
) -> None:
    if stage not in STAGES:
        raise ValueError(f"invalid readiness stage: {stage}")
    connection.execute(
        """INSERT INTO readiness(slug, stage, updated_at, evidence_json)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(slug) DO UPDATE SET stage=excluded.stage,
             updated_at=excluded.updated_at, evidence_json=excluded.evidence_json""",
        (slug, stage, now(), json.dumps(evidence or {}, sort_keys=True)),
    )
    connection.commit()


def stage_at_least(stage: str, required: str) -> bool:
    return STAGES.index(stage) >= STAGES.index(required)


def record_results(
    connection: sqlite3.Connection,
    run_id: int,
    rows: Iterable[tuple[str, str, str, str, str]],
) -> None:
    connection.executemany(
        "INSERT INTO results(run_id, slug, tier, check_name, status, message) VALUES (?, ?, ?, ?, ?, ?)",
        ((run_id, *row) for row in rows),
    )
    connection.commit()
