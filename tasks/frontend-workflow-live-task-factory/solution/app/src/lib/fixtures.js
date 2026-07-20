import { pullRequestSchema, taskPackageSchema } from './schemas'

export const isTestFile = (filename) => {
  const lower = filename.toLowerCase()
  const segments = lower.split('/')
  const base = segments.at(-1) || ''
  return segments.slice(0, -1).some((part) => ['test', 'tests', '__tests__'].includes(part))
    || /\.(test|spec)\.[^.]+$/.test(base)
    || /^test_/.test(base)
}

export const sourceFiles = (pr) => pr.files.filter((file) => !isTestFile(file.filename) && !/\.(md|mdx|txt|rst)$/i.test(file.filename))
export const sourceCount = (pr) => sourceFiles(pr).length
export const difficultyFor = (count) => count <= 4 ? 'easy' : count <= 7 ? 'medium' : 'hard'

const sha = (repoIndex, prNumber) => `${repoIndex}${String(prNumber).padStart(3, '0')}`.padEnd(40, String((repoIndex + prNumber) % 10)).slice(0, 40)
const date = (month, day) => `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T14:30:00.000Z`

const extMap = { TypeScript: 'ts', Rust: 'rs', Python: 'py' }
const roots = { TypeScript: 'src', Rust: 'src', Python: 'petrel' }

function makeFiles(language, count, number, options = {}) {
  const ext = extMap[language]
  const root = roots[language]
  if (options.docsOnly) return [
    { filename: 'README.md', status: 'modified', additions: 18, deletions: 4 },
    { filename: 'docs/migration-guide.md', status: 'added', additions: 42, deletions: 0 },
  ]
  const files = Array.from({ length: count }, (_, i) => ({
    filename: `${root}/${['core', 'runtime', 'parser', 'config', 'client', 'store', 'query', 'errors', 'types', 'codec', 'schema', 'worker'][i] || `module-${i}`}.${ext}`,
    status: i === count - 1 ? 'added' : 'modified',
    additions: 8 + ((number + i * 7) % 36),
    deletions: (number + i * 3) % 14,
  }))
  files.push({
    filename: language === 'Python' ? `tests/test_change_${number}.py` : language === 'Rust' ? `tests/change_${number}.rs` : `src/__tests__/change-${number}.test.ts`,
    status: 'modified', additions: 21, deletions: 6,
  })
  return files
}

function pr(repoIndex, language, number, title, count, opts = {}) {
  const linkedIssue = opts.noIssue ? null : {
    number: opts.issueNumber || number + 100,
    title: opts.issueTitle || title.replace(/^(Add|Fix|Improve|Refine|Support) /, ''),
  }
  return pullRequestSchema.parse({
    number,
    title,
    body: opts.body || `This change ${title.charAt(0).toLowerCase()}${title.slice(1)}. It updates the implementation, adds focused coverage, and documents the behavioral boundary for maintainers.`,
    merged_at: date(repoIndex + 3, opts.day || ((number % 20) + 1)),
    base: { sha: sha(repoIndex, number) },
    files: makeFiles(language, count, number, opts),
    linkedIssue,
  })
}

const driftlinePrs = [
  pr(1, 'TypeScript', 58, 'Preserve retry context across stream reconnects', 6, { issueTitle: 'Streaming retries lose request context', day: 18 }),
  pr(1, 'TypeScript', 57, 'Add bounded jitter to reconnect scheduling', 4, { day: 15 }),
  pr(1, 'TypeScript', 54, 'Improve event cursor validation', 5, { day: 12 }),
  pr(1, 'TypeScript', 52, 'Document the transport migration', 0, { docsOnly: true, day: 9 }),
  pr(1, 'TypeScript', 49, 'Fix duplicate terminal events', 3, { day: 6 }),
  pr(1, 'TypeScript', 46, 'Refine request cancellation semantics', 7, { noIssue: true, day: 3 }),
  pr(1, 'TypeScript', 43, 'Add stream health snapshots', 2, { day: 2 }),
  pr(1, 'TypeScript', 41, 'Support typed disconnect reasons', 8, { day: 1 }),
  pr(1, 'TypeScript', 39, 'Fix channel cleanup ordering', 4, { day: 19 }),
]

const loomPrs = [
  pr(2, 'Rust', 88, 'Add snapshot isolation to range reads', 7, { day: 19 }),
  pr(2, 'Rust', 84, 'Fix compaction boundaries for sparse pages', 5, { day: 17 }),
  pr(2, 'Rust', 81, 'Support deterministic query planning', 9, { day: 14 }),
  pr(2, 'Rust', 79, 'Refine WAL recovery diagnostics', 4, { noIssue: true, day: 11 }),
  pr(2, 'Rust', 76, 'Document storage engine invariants', 0, { docsOnly: true, day: 8 }),
  pr(2, 'Rust', 73, 'Fix cursor lifetime accounting', 3, { day: 5 }),
  pr(2, 'Rust', 71, 'Add prefix compression for index keys', 12, { day: 3 }),
  pr(2, 'Rust', 69, 'Improve transaction conflict traces', 6, { day: 1 }),
  pr(2, 'Rust', 64, 'Support checksummed manifest frames', 8, { day: 20 }),
]

const petrelPrs = [
  pr(3, 'Python', 31, 'Normalize nested config overrides', 5, { issueTitle: 'Nested environment overrides resolve inconsistently', day: 19 }),
  pr(3, 'Python', 29, 'Add async pagination helpers', 4, { day: 16 }),
  pr(3, 'Python', 27, 'Fix timezone coercion in serializers', 3, { day: 13 }),
  pr(3, 'Python', 24, 'Improve schema error locations', 6, { day: 10 }),
  pr(3, 'Python', 22, 'Document plugin discovery', 0, { docsOnly: true, day: 7 }),
  pr(3, 'Python', 19, 'Support typed response envelopes', 8, { day: 5 }),
  pr(3, 'Python', 17, 'Fix CLI output when no profile exists', 2, { noIssue: true, day: 3 }),
  pr(3, 'Python', 14, 'Refine cache invalidation hooks', 7, { day: 1 }),
  pr(3, 'Python', 11, 'Add strict URL normalization', 4, { day: 20 }),
]

export const fixtureRepositories = [
  { name: 'nimbusworks/driftline', language: 'TypeScript', description: 'Resilient event-stream transport for edge applications.', prs: driftlinePrs },
  { name: 'cobalt-labs/loomdb', language: 'Rust', description: 'An embedded transactional store built for predictable latency.', prs: loomPrs },
  { name: 'fernfield/petrel', language: 'Python', description: 'A typed client toolkit for service integrations.', prs: petrelPrs },
]

export const allFixturePrs = fixtureRepositories.flatMap((repo) => repo.prs.map((pull) => ({ repo: repo.name, language: repo.language, pr: pull })))

export function instructionFor(repo, pr) {
  const issue = pr.linkedIssue
  const files = sourceFiles(pr).map((file) => file.filename)
  return `# Task: ${pr.title}\n\nResolve ${issue ? `issue #${issue.number}: ${issue.title}` : 'the behavior described by this merged change'} in \`${repo}\`.\n\nReproduce the pre-fix behavior, implement the smallest maintainable correction, and preserve the surrounding public API. Use the merged pull request only as behavioral context; write your own solution.\n\nFocus the change around ${files.slice(0, 3).map((file) => `\`${file}\``).join(', ')}${files.length > 3 ? ` and ${files.length - 3} related source files` : ''}. Add or update focused tests that fail before the fix and pass afterward.\n\n## Acceptance criteria\n\n- The reported behavior is reproducible and corrected.\n- Existing compatible behavior remains intact.\n- The test suite documents the important boundary cases.\n- The implementation is scoped to the issue and contains no unrelated refactors.`
}

export function configFor(repo, pr, language) {
  const count = sourceCount(pr)
  return `[task]\nschema = "live-task-package-v1"\nrepository = "${repo}"\npull_request = ${pr.number}\nbase_sha = "${pr.base.sha}"\nlanguage = "${language}"\ndifficulty = "${difficultyFor(count)}"\nsource_files = ${count}\n\n[evaluation]\nrequire_tests = true\ntimeout_seconds = 900`
}

export function packageFor(repo, pr, language, createdAt = new Date().toISOString()) {
  const files = sourceFiles(pr).map((file) => file.filename)
  const count = files.length
  return taskPackageSchema.parse({
    schemaVersion: 'live-task-package-v1',
    repo,
    pr_number: pr.number,
    base_sha: pr.base.sha,
    language,
    difficulty: difficultyFor(count),
    source_file_count: count,
    created_at: createdAt,
    instruction: instructionFor(repo, pr),
    task_config: configFor(repo, pr, language),
    patch_note: `Bug-patch placeholder: the packaging step would revert the merged changes in ${files.join(', ')} so the task begins from the reproducible pre-fix state.`,
  })
}

export const seededPackages = [
  packageFor('nimbusworks/driftline', driftlinePrs[2], 'TypeScript', '2026-05-08T10:20:00.000Z'),
  packageFor('cobalt-labs/loomdb', loomPrs[1], 'Rust', '2026-05-12T15:45:00.000Z'),
]

export const findFixture = (repoName, prNumber) => {
  const repo = fixtureRepositories.find((item) => item.name === repoName)
  const pr = repo?.prs.find((item) => item.number === Number(prNumber))
  return repo && pr ? { repo, pr } : null
}
