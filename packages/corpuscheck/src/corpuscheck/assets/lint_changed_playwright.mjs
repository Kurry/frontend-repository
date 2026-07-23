#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_CONFIG = path.resolve(SCRIPT_DIR, '../../../../../eslint.config.mjs');
const PLAYWRIGHT_TEST = /^(?:packages\/corpuscheck\/src\/corpuscheck\/canonical\/e2e\/.*\.(?:js|mjs|cjs|ts|tsx|jsx)|tasks\/frontend-[a-z0-9-]+\/solution\/app\/(?:e2e\.spec\.mjs|e2e\/.*\.(?:js|mjs|cjs|ts|tsx|jsx)))$/;

function argument(name, fallback) {
  const equals = process.argv.find((value) => value.startsWith(`${name}=`));
  if (equals) return equals.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
}

function changedPlaywrightFiles(cwd, range) {
  return git(cwd, ['diff', '--name-only', '-z', '--diff-filter=ACMR', range])
    .split('\0')
    .filter((file) => file && PLAYWRIGHT_TEST.test(file));
}

export function addedLineRanges(diff) {
  const ranges = [];
  for (const line of diff.split('\n')) {
    const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (!match) continue;
    const start = Number(match[1]);
    const count = match[2] === undefined ? 1 : Number(match[2]);
    if (count > 0) ranges.push([start, start + count - 1]);
  }
  return ranges;
}

function addedRangesForFile(cwd, range, file) {
  return addedLineRanges(git(cwd, [
    'diff', '--unified=0', '--no-color', range, '--', file,
  ]));
}

function fallsOnAddedLine(message, ranges) {
  if (message.fatal || !message.line) return true;
  return ranges.some(([start, end]) => message.line >= start && message.line <= end);
}

function filteredResult(result, ranges) {
  const messages = result.messages.filter((message) => fallsOnAddedLine(message, ranges));
  return {
    ...result,
    messages,
    errorCount: messages.filter((message) => message.severity === 2).length,
    warningCount: messages.filter((message) => message.severity === 1).length,
    fatalErrorCount: messages.filter((message) => message.fatal).length,
    fixableErrorCount: messages.filter(
      (message) => message.severity === 2 && message.fix,
    ).length,
    fixableWarningCount: messages.filter(
      (message) => message.severity === 1 && message.fix,
    ).length,
  };
}

async function main() {
  const cwd = process.cwd();
  const base = argument('--base', process.env.GITHUB_BASE_SHA || 'origin/main');
  const head = argument('--head', process.env.GITHUB_HEAD_SHA || 'HEAD');
  const range = `${base}...${head}`;
  git(cwd, ['rev-parse', '--verify', `${base}^{commit}`]);
  git(cwd, ['rev-parse', '--verify', `${head}^{commit}`]);

  const files = changedPlaywrightFiles(cwd, range);
  if (files.length === 0) {
    console.log('No added or modified Playwright test files to lint.');
    return;
  }

  const ranges = new Map(
    files.map((file) => [path.resolve(cwd, file), addedRangesForFile(cwd, range, file)]),
  );
  const eslint = new ESLint({ cwd, overrideConfigFile: REPO_CONFIG });
  const results = (await eslint.lintFiles(files))
    .map((result) => filteredResult(result, ranges.get(result.filePath) || []))
    .filter((result) => result.messages.length > 0);

  if (results.length > 0) {
    const formatter = await eslint.loadFormatter('stylish');
    console.error(await formatter.format(results));
    process.exitCode = 1;
    return;
  }
  console.log(`Playwright lint passed for ${files.length} changed test file(s).`);
}

await main();
