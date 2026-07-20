#!/usr/bin/env python3
# SPDX-License-Identifier: NONE
"""Summarize Jules fleet session JSON for sequencing decisions."""

from __future__ import annotations

import argparse
import collections
import json
import re
import sys
from pathlib import Path
from typing import Any


ISSUE_RE = re.compile(r"(?:issue\s*)?#(\d+)", re.IGNORECASE)
PATH_RE = re.compile(r"[\w.-]+/[\w./-]+\.(?:py|ts|tsx|js|json|ya?ml|md|toml|sh)")


def load_sessions(path: str | None) -> list[dict[str, Any]]:
    raw = sys.stdin.read() if path in (None, "-") else Path(path).read_text()
    data = json.loads(raw)
    if not isinstance(data, list):
        raise SystemExit("expected a JSON array of Jules sessions")
    return [x for x in data if isinstance(x, dict)]


def repo_name(session: dict[str, Any]) -> str:
    source = session.get("sourceContext", {}).get("source", "")
    return source.replace("sources/github/", "") or "unknown"


def session_text(session: dict[str, Any]) -> str:
    return "\n".join(str(session.get(k, "")) for k in ("title", "description", "prompt"))


def first_issue(session: dict[str, Any]) -> str:
    match = ISSUE_RE.search(session_text(session))
    return f"#{match.group(1)}" if match else "(none)"


def likely_files(session: dict[str, Any]) -> list[str]:
    return sorted(set(PATH_RE.findall(session_text(session))))[:12]


def cluster_key(session: dict[str, Any]) -> tuple[str, str]:
    return (repo_name(session), first_issue(session))


def print_counter(title: str, counter: collections.Counter[str], limit: int = 12) -> None:
    print(f"\n## {title}")
    if not counter:
        print("(none)")
        return
    for key, count in counter.most_common(limit):
        print(f"{count:>4}  {key}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sessions_json", nargs="?", help="Path to Jules session JSON, or stdin if omitted")
    parser.add_argument("--limit", type=int, default=12, help="Rows per section")
    args = parser.parse_args()

    sessions = load_sessions(args.sessions_json)
    by_state = collections.Counter(str(s.get("state") or "(blank)") for s in sessions)
    by_repo_failed = collections.Counter(repo_name(s) for s in sessions if s.get("state") == "FAILED")
    by_repo_waiting = collections.Counter(repo_name(s) for s in sessions if str(s.get("state", "")).startswith("AWAITING"))

    duplicate_clusters: collections.Counter[str] = collections.Counter()
    cluster_examples: dict[str, dict[str, Any]] = {}
    for session in sessions:
        repo, issue = cluster_key(session)
        if issue == "(none)":
            continue
        key = f"{repo} {issue}"
        duplicate_clusters[key] += 1
        cluster_examples.setdefault(key, session)

    print(f"# Jules Fleet Audit\n\nSessions: {len(sessions)}")
    print_counter("States", by_state, args.limit)
    print_counter("Failed sessions by repo", by_repo_failed, args.limit)
    print_counter("Awaiting-human sessions by repo", by_repo_waiting, args.limit)

    print("\n## Duplicate issue/session clusters")
    duplicates = [(k, c) for k, c in duplicate_clusters.most_common() if c > 1]
    if not duplicates:
        print("(none)")
    for key, count in duplicates[: args.limit]:
        example = cluster_examples[key]
        print(f"{count:>4}  {key}  example={example.get('id') or example.get('name', '')}")

    print("\n## Human-needed sessions")
    waiting = [s for s in sessions if str(s.get("state", "")).startswith("AWAITING")]
    if not waiting:
        print("(none)")
    for session in waiting[: args.limit]:
        print(f"- {session.get('id') or session.get('name')} {session.get('state')} {repo_name(session)}")
        print(f"  title: {str(session.get('title', ''))[:160]}")

    print("\n## Failed session file clues")
    failed = [s for s in sessions if s.get("state") == "FAILED"]
    if not failed:
        print("(none)")
    for session in failed[: args.limit]:
        files = ", ".join(likely_files(session)) or "(no obvious files in prompt)"
        print(f"- {session.get('id') or session.get('name')} {repo_name(session)} issue={first_issue(session)} files={files}")

    print("\n## Sequencing reminders")
    print("- Driver-owned serial: critical-path interfaces, shared files, CI/settings, merge/rebase, ticket rewrites.")
    print("- Jules parallel: disjoint files, depends only on main, full prompt contract, merge-order-free.")
    print("- Blocked: imports from an unmerged PR, lacks product decision, or conflicts in ownership matrix.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
