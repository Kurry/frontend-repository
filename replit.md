# frontend-repository

## Overview
Imported from GitHub as-is per user request — no setup, no run workflow configured.

This is a collection of 65 active frontend-only Harbor eval tasks (`tasks/frontend-*`), plus 38 quarantined tasks under `tasks-quarantine/`. Each task asks a builder agent to recreate a reference web application from a PRD (`instruction.md`), graded by an LLM judge across thirteen dimensions. Tasks are run via the `harbor` CLI (not included here).

## Structure
- `tasks/` — active eval tasks
- `tasks-quarantine/` — quarantined tasks (dist-absent oracles)
- `packages/`, `configs/`, `docs/` — supporting code and docs
- `package.json`, `pyproject.toml`, `uv.lock` — JS + Python tooling

## User preferences
- Keep the project as imported; do not start it up or restructure it.
