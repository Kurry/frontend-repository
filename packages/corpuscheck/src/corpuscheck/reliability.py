"""Judge-reliability analysis over ingested verifier reward-details artifacts.

Ground truth is machine-derived: verdicts come from existing trial artifacts
(``<trial>/verifier/reward-details.json``); no human labeling and no new judged
runs are launched here. Criterion values are treated as already normalized —
``value < 1`` means the criterion FAILED regardless of polarity, so negate
criteria need no special casing.
"""

from __future__ import annotations

import json
import sqlite3
from itertools import combinations
from pathlib import Path

from .state import now


PASS_THRESHOLD = 1.0
ORACLE_LABEL = "oracle-anchor"
NOP_LABEL = "nop-anchor"
BLOCKED_PREFIX = "BLOCKED:"


class RewardDetailsError(ValueError):
    """A trial's reward-details.json is absent or malformed."""


def parse_reward_details(trial_dir: str | Path) -> list[dict]:
    """Parse ``<trial>/verifier/reward-details.json`` into flat verdict records.

    Supports both the raw top-level ``{dimension: {criteria: [...]}}`` layout
    and a ``{"dimensions": {...}}`` wrapper. Each record carries dimension,
    criterion_id, numeric value, and blocked (reasoning starts with BLOCKED:).
    """
    path = Path(trial_dir).expanduser().resolve() / "verifier" / "reward-details.json"
    try:
        payload = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        raise RewardDetailsError(f"cannot parse {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise RewardDetailsError(f"{path} must contain a JSON object")
    dimensions = payload.get("dimensions", payload)
    if not isinstance(dimensions, dict):
        raise RewardDetailsError(f"{path} has no dimensions object")
    records: list[dict] = []
    for dimension, body in dimensions.items():
        criteria = body.get("criteria") if isinstance(body, dict) else None
        if not isinstance(criteria, list):
            continue
        for criterion in criteria:
            if not isinstance(criterion, dict) or "id" not in criterion:
                continue
            value = criterion.get("value", 0)
            reasoning = criterion.get("reasoning")
            records.append(
                {
                    "dimension": str(dimension),
                    "criterion_id": str(criterion["id"]),
                    "value": float(value) if isinstance(value, (int, float)) else 0.0,
                    "blocked": 1
                    if isinstance(reasoning, str) and reasoning.startswith(BLOCKED_PREFIX)
                    else 0,
                }
            )
    if not records:
        raise RewardDetailsError(f"{path} contains no criteria")
    return records


def ingest_trial(
    connection: sqlite3.Connection, slug: str, label: str, trial_dir: str | Path
) -> int:
    """Ingest a trial's verdicts under (slug, label); replaces on re-ingest."""
    records = parse_reward_details(trial_dir)
    stamp = now()
    connection.executemany(
        """INSERT INTO verdicts(slug, label, dimension, criterion_id, value, blocked, ingested_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(slug, label, dimension, criterion_id) DO UPDATE SET
             value=excluded.value, blocked=excluded.blocked, ingested_at=excluded.ingested_at""",
        [
            (slug, label, r["dimension"], r["criterion_id"], r["value"], r["blocked"], stamp)
            for r in records
        ],
    )
    connection.commit()
    return len(records)


def _passes(value: float) -> bool:
    return value >= PASS_THRESHOLD


def flip_rates(
    connection: sqlite3.Connection, slug: str, min_labels: int = 2
) -> list[dict]:
    """Per-criterion pairwise disagreement across a slug's ingested labels.

    flip_rate = disagreeing label pairs / all label pairs, on the pass/fail
    verdict at value >= 1. Criteria seen under fewer than min_labels labels
    are excluded.
    """
    grouped: dict[tuple[str, str], dict[str, float]] = {}
    for row in connection.execute(
        "SELECT label, dimension, criterion_id, value FROM verdicts WHERE slug = ?",
        (slug,),
    ):
        grouped.setdefault((row["dimension"], row["criterion_id"]), {})[row["label"]] = row[
            "value"
        ]
    out: list[dict] = []
    for (dimension, criterion_id), by_label in grouped.items():
        if len(by_label) < min_labels:
            continue
        verdicts = [_passes(value) for value in by_label.values()]
        pairs = len(verdicts) * (len(verdicts) - 1) // 2
        disagreements = sum(1 for a, b in combinations(verdicts, 2) if a != b)
        out.append(
            {
                "dimension": dimension,
                "criterion_id": criterion_id,
                "labels": len(by_label),
                "pairs": pairs,
                "disagreements": disagreements,
                "flip_rate": disagreements / pairs if pairs else 0.0,
            }
        )
    out.sort(key=lambda item: (-item["flip_rate"], item["dimension"], item["criterion_id"]))
    return out


def mean_flip_rate(rates: list[dict]) -> float:
    return sum(item["flip_rate"] for item in rates) / len(rates) if rates else 0.0


def corpus_flip_rates(connection: sqlite3.Connection, min_labels: int = 2) -> list[dict]:
    """Corpus rollup: aggregate flips per (dimension, criterion_id) across slugs."""
    aggregated: dict[tuple[str, str], dict] = {}
    slugs = [row["slug"] for row in connection.execute("SELECT DISTINCT slug FROM verdicts")]
    for slug in slugs:
        for item in flip_rates(connection, slug, min_labels):
            key = (item["dimension"], item["criterion_id"])
            entry = aggregated.setdefault(
                key,
                {
                    "dimension": key[0],
                    "criterion_id": key[1],
                    "slugs": 0,
                    "pairs": 0,
                    "disagreements": 0,
                },
            )
            entry["slugs"] += 1
            entry["pairs"] += item["pairs"]
            entry["disagreements"] += item["disagreements"]
    out = []
    for entry in aggregated.values():
        entry["flip_rate"] = entry["disagreements"] / entry["pairs"] if entry["pairs"] else 0.0
        out.append(entry)
    out.sort(key=lambda item: (-item["flip_rate"], item["dimension"], item["criterion_id"]))
    return out


def anchor_trials(connection: sqlite3.Connection) -> list[tuple[str, str, str]]:
    """Yield (slug, run_kind, trial_path) pairs derivable from readiness evidence.

    An oracle-certified slug's stored trial path is oracle evidence; a
    nop_certified/trial_ready slug's stored trial path is NOP evidence.
    Gate-failed evidence is skipped.
    """
    found: list[tuple[str, str, str]] = []
    for row in connection.execute("SELECT slug, stage, evidence_json FROM readiness"):
        try:
            evidence = json.loads(row["evidence_json"])
        except json.JSONDecodeError:
            continue
        if not isinstance(evidence, dict) or evidence.get("gate") == "failed":
            continue
        trial_path = evidence.get("trial_path")
        if not isinstance(trial_path, str) or not trial_path:
            continue
        if row["stage"] == "oracle_certified":
            found.append((row["slug"], "oracle", trial_path))
        elif row["stage"] in ("nop_certified", "trial_ready"):
            found.append((row["slug"], "nop", trial_path))
    return found


def _has_label(connection: sqlite3.Connection, slug: str, label: str) -> bool:
    return (
        connection.execute(
            "SELECT 1 FROM verdicts WHERE slug = ? AND label = ? LIMIT 1", (slug, label)
        ).fetchone()
        is not None
    )


def compute_judge_accuracy(connection: sqlite3.Connection) -> dict:
    """Ingest readiness-anchored trials and persist per-dimension accuracy rows.

    Oracle run_kind counts false negatives (value < 1 on the certified oracle);
    NOP run_kind counts vacuous criteria (value >= 1 on the empty NOP app).
    Returns {"oracle": {slug: {dimension: {...}}}, "nop": {...}, "errors": [...]}.
    """
    results: dict = {"oracle": {}, "nop": {}, "errors": []}
    stamp = now()
    for slug, kind, trial_path in anchor_trials(connection):
        label = ORACLE_LABEL if kind == "oracle" else NOP_LABEL
        if not _has_label(connection, slug, label):
            try:
                ingest_trial(connection, slug, label, trial_path)
            except RewardDetailsError as exc:
                results["errors"].append(f"{slug}: {exc}")
                continue
        per_dimension: dict[str, dict] = {}
        for row in connection.execute(
            """SELECT dimension, criterion_id, value FROM verdicts
               WHERE slug = ? AND label = ? ORDER BY dimension, criterion_id""",
            (slug, label),
        ):
            entry = per_dimension.setdefault(row["dimension"], {"total": 0, "criteria": []})
            entry["total"] += 1
            flagged = (
                not _passes(row["value"]) if kind == "oracle" else _passes(row["value"])
            )
            if flagged:
                entry["criteria"].append(row["criterion_id"])
        for dimension, entry in per_dimension.items():
            connection.execute(
                """INSERT INTO judge_accuracy(slug, dimension, run_kind, fail_count, total, computed_at)
                   VALUES (?, ?, ?, ?, ?, ?)
                   ON CONFLICT(slug, dimension, run_kind) DO UPDATE SET
                     fail_count=excluded.fail_count, total=excluded.total,
                     computed_at=excluded.computed_at""",
                (slug, dimension, kind, len(entry["criteria"]), entry["total"], stamp),
            )
        results[kind][slug] = per_dimension
    connection.commit()
    return results


def blocked_counts(connection: sqlite3.Connection) -> list[dict]:
    """BLOCKED verdict counts by task (the Blocked-vs-Fail taxonomy)."""
    return [
        dict(row)
        for row in connection.execute(
            """SELECT slug, SUM(blocked) AS blocked, COUNT(*) AS total
               FROM verdicts GROUP BY slug HAVING SUM(blocked) > 0
               ORDER BY blocked DESC, slug"""
        )
    ]


def vacuous_criteria(connection: sqlite3.Connection) -> list[dict]:
    """Criteria that pass on an ingested NOP anchor, by slug."""
    return [
        dict(row)
        for row in connection.execute(
            """SELECT slug, dimension, criterion_id, value FROM verdicts
               WHERE label = ? AND value >= ? ORDER BY slug, dimension, criterion_id""",
            (NOP_LABEL, PASS_THRESHOLD),
        )
    ]


def oracle_fn_rows(connection: sqlite3.Connection) -> list[dict]:
    """Stored per-dimension oracle false-negative rows from judge_accuracy."""
    return [
        dict(row)
        for row in connection.execute(
            """SELECT slug, dimension, fail_count, total, computed_at FROM judge_accuracy
               WHERE run_kind = 'oracle' ORDER BY slug, dimension"""
        )
    ]


def oracle_failing_ids(connection: sqlite3.Connection, slug: str) -> list[str]:
    return [
        f"{row['dimension']}/{row['criterion_id']}"
        for row in connection.execute(
            """SELECT dimension, criterion_id FROM verdicts
               WHERE slug = ? AND label = ? AND value < ?
               ORDER BY dimension, criterion_id""",
            (slug, ORACLE_LABEL, PASS_THRESHOLD),
        )
    ]
