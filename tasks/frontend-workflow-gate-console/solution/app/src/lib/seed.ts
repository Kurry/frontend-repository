import type { AggregationMode, GateDefinition, GateRecord, GateState, RunRecord, StageName, StageRecord, StageStatus, TimelineEntry } from './contracts';
import { STAGE_NAMES, suitePasses } from './contracts';

const definitions: Omit<GateDefinition, 'stages'>[] = [
  { id: 'SRC-101', name: 'Provenance attestation', severity: 'S1', description: 'Verifies that every source input carries an attributable, signed provenance record.' },
  { id: 'SRC-112', name: 'License policy', severity: 'S1', description: 'Rejects source trees containing licenses outside the approved benchmark policy.' },
  { id: 'SRC-124', name: 'Manifest integrity', severity: 'S2', description: 'Compares the submitted manifest against the materialized source tree.' },
  { id: 'SEC-201', name: 'Secret scan', severity: 'S1', description: 'Scans inputs and produced artifacts for credentials, tokens, and private keys.' },
  { id: 'SRC-142', name: 'Dependency freshness', severity: 'S3', description: 'Reports stale direct dependencies and abandoned source references.' },
  { id: 'OPS-110', name: 'Metadata completeness', severity: 'S2', description: 'Checks owner, revision, environment, and trace metadata for completeness.' },
  { id: 'BLD-201', name: 'Reproducible build', severity: 'S1', description: 'Builds twice in isolated workers and compares the resulting artifact digests.' },
  { id: 'BLD-214', name: 'Compiler integrity', severity: 'S1', description: 'Pins and verifies the compiler and linker toolchain used for the build.' },
  { id: 'BLD-230', name: 'Artifact size budget', severity: 'S3', description: 'Checks the final bundle against its declared storage and transfer budget.' },
  { id: 'BLD-244', name: 'SBOM coverage', severity: 'S2', description: 'Requires a software bill of materials entry for every linked component.' },
  { id: 'TST-301', name: 'Specification coverage', severity: 'S1', description: 'Ensures generated tests cover every required benchmark behavior.' },
  { id: 'TST-316', name: 'Mutation efficacy', severity: 'S2', description: 'Measures whether generated tests detect representative behavioral mutations.' },
  { id: 'TST-328', name: 'Fixture isolation', severity: 'S1', description: 'Confirms generated fixtures are deterministic and isolated from host state.' },
  { id: 'TST-339', name: 'Assertion density', severity: 'S3', description: 'Flags suites with too few meaningful assertions for their execution paths.' },
  { id: 'SEC-310', name: 'Fuzz safety', severity: 'S2', description: 'Validates fuzz harness limits and safe handling of malformed generated inputs.' },
  { id: 'HRD-401', name: 'Sandbox escape', severity: 'S1', description: 'Exercises the artifact against known container and syscall escape patterns.' },
  { id: 'HRD-415', name: 'Dependency CVEs', severity: 'S1', description: 'Rejects artifacts with exploitable vulnerabilities above the policy threshold.' },
  { id: 'HRD-428', name: 'Resource ceilings', severity: 'S2', description: 'Measures CPU, memory, descriptor, and process use under hostile workloads.' },
  { id: 'HRD-442', name: 'Network isolation', severity: 'S1', description: 'Confirms the benchmark cannot reach undeclared network destinations.' },
  { id: 'HRD-455', name: 'Policy lint', severity: 'S3', description: 'Lints hardening declarations for deprecated or ineffective directives.' },
  { id: 'PUB-501', name: 'Signature chain', severity: 'S1', description: 'Verifies an unbroken signature chain from source evidence to publication.' },
  { id: 'PUB-514', name: 'Registry policy', severity: 'S1', description: 'Checks the destination registry, namespace, immutability, and access policy.' },
  { id: 'PUB-526', name: 'Provenance bundle', severity: 'S2', description: 'Ensures the published object carries its complete acceptance evidence bundle.' },
  { id: 'PUB-538', name: 'Release notes', severity: 'S3', description: 'Checks that human-readable release notes identify material benchmark changes.' },
  { id: 'PUB-550', name: 'Retention policy', severity: 'S2', description: 'Validates retention, recovery, and revocation metadata for the release.' }
];

export const STAGE_GATE_IDS: Record<StageName, string[]> = {
  Source: ['SRC-101', 'SRC-112', 'SRC-124', 'SEC-201', 'SRC-142', 'OPS-110'],
  Build: ['BLD-201', 'BLD-214', 'SEC-201', 'BLD-230', 'BLD-244', 'OPS-110'],
  'Test Generation': ['TST-301', 'TST-316', 'TST-328', 'TST-339', 'SEC-310', 'OPS-110'],
  Hardening: ['HRD-401', 'HRD-415', 'HRD-428', 'SEC-201', 'HRD-442', 'HRD-455'],
  Publish: ['PUB-501', 'PUB-514', 'PUB-526', 'PUB-538', 'OPS-110', 'PUB-550']
};

export const GATE_REGISTRY: GateDefinition[] = definitions.map((definition) => ({
  ...definition,
  stages: STAGE_NAMES.filter((stage) => STAGE_GATE_IDS[stage].includes(definition.id))
}));

const modes: Record<StageName, AggregationMode> = {
  Source: 'required-pass', Build: 'all-pass', 'Test Generation': 'weighted-mean', Hardening: 'required-pass', Publish: 'all-pass'
};

const evidence: Record<GateState, string[]> = {
  pass: [
    'Recorded evidence satisfied the signed policy snapshot and was independently verified.',
    'Worker output matched the expected digest with no material exceptions.',
    'The evaluator completed within policy bounds and attached a reproducible trace.'
  ],
  fail: [
    'Recorded evidence did not meet the active policy threshold; operator review is required.',
    'The evaluator found a material mismatch in the signed execution trace.'
  ]
};

function fingerprint(runIndex: number, stageIndex: number): string {
  const blocks = ['7ad3', '9f41', 'c82e', '14b6', 'e033', '5ca9', 'b17f', 'd260'];
  return `sha256:${blocks.map((block, i) => `${block}${(runIndex + 3) * (stageIndex + i + 5)}`).join('')}`;
}

function makeGate(id: string, failIds: string[], variant: number): GateRecord {
  const definition = GATE_REGISTRY.find((gate) => gate.id === id)!;
  const state: GateState = failIds.includes(id) ? 'fail' : 'pass';
  return {
    id: definition.id,
    name: definition.name,
    severity: definition.severity,
    description: definition.description,
    state,
    evidence: evidence[state][variant % evidence[state].length],
    notes: []
  };
}

function makeStage(runIndex: number, stageIndex: number, name: StageName, status: StageStatus, failIds: string[]): StageRecord {
  const gates = STAGE_GATE_IDS[name].map((id, gateIndex) => makeGate(id, failIds, runIndex + gateIndex));
  const terminalStatus = suitePasses(modes[name], gates) ? 'passed' : 'rejected';
  const finalStatus = status === 'passed' || status === 'rejected' ? terminalStatus : status;
  return {
    name,
    aggregationMode: modes[name],
    status: finalStatus,
    gates,
    certificate: finalStatus === 'passed' ? {
      fingerprint: fingerprint(runIndex, stageIndex),
      issuedAt: new Date(Date.UTC(2026, 6, 18 - runIndex, 10 + stageIndex, 14 + runIndex, 0)).toISOString()
    } : null
  };
}

const runProfiles: Array<{
  id: string; submittedAt: string; branch: string; commit: string;
  statuses: StageStatus[]; failures: Partial<Record<StageName, string[]>>;
}> = [
  {
    id: 'RUN-2407-A91', submittedAt: '2026-07-18T10:12:00.000Z', branch: 'benchmark/atlas-17', commit: '7c9e41a',
    statuses: ['passed', 'passed', 'rejected', 'pending', 'pending'], failures: { 'Test Generation': ['TST-328'] }
  },
  {
    id: 'RUN-2407-B04', submittedAt: '2026-07-18T08:42:00.000Z', branch: 'release/orchid', commit: 'c10da72',
    statuses: ['passed', 'passed', 'passed', 'passed', 'passed'], failures: {}
  },
  {
    id: 'RUN-2407-C77', submittedAt: '2026-07-17T22:26:00.000Z', branch: 'benchmark/kestrel', commit: '09fe2bb',
    statuses: ['passed', 'passed', 'running', 'pending', 'pending'], failures: {}
  },
  {
    id: 'RUN-2407-D12', submittedAt: '2026-07-17T18:03:00.000Z', branch: 'candidate/meridian', commit: 'ed5a6c8',
    statuses: ['passed', 'passed', 'passed', 'rejected', 'pending'], failures: { Hardening: ['HRD-442'] }
  },
  {
    id: 'RUN-2407-E38', submittedAt: '2026-07-17T11:55:00.000Z', branch: 'benchmark/helios', commit: '480ba17',
    statuses: ['passed', 'passed', 'passed', 'passed', 'passed'], failures: { 'Test Generation': ['TST-339'] }
  },
  {
    id: 'RUN-2407-F63', submittedAt: '2026-07-16T20:19:00.000Z', branch: 'candidate/nova', commit: '2f893de',
    statuses: ['rejected', 'pending', 'pending', 'pending', 'pending'], failures: { Source: ['SRC-101'] }
  }
];

function timelineFor(runIndex: number, stages: StageRecord[], submittedAt: string): TimelineEntry[] {
  const base = new Date(submittedAt).getTime();
  const entries: TimelineEntry[] = [];
  stages.forEach((stage, stageIndex) => {
    if (stage.status === 'passed') {
      entries.push({
        id: `seed-${runIndex}-${stageIndex}-cert`, type: 'certificate',
        timestamp: new Date(base + (stageIndex + 1) * 540_000).toISOString(),
        summary: `${stage.name} certificate issued`
      });
    }
    if (stage.status === 'rejected') {
      entries.push({
        id: `seed-${runIndex}-${stageIndex}-reject`, type: 'rejection',
        timestamp: new Date(base + (stageIndex + 1) * 540_000).toISOString(),
        summary: `${stage.name} rejected by ${stage.gates.filter((gate) => gate.state === 'fail').map((gate) => gate.id).join(', ')}`
      });
    }
  });
  return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function seedRuns(): RunRecord[] {
  return runProfiles.map((profile, runIndex) => {
    const stages = STAGE_NAMES.map((name, stageIndex) => makeStage(
      runIndex, stageIndex, name, profile.statuses[stageIndex], profile.failures[name] ?? []
    ));
    return {
      id: profile.id,
      submittedAt: profile.submittedAt,
      branch: profile.branch,
      commit: profile.commit,
      stages,
      timeline: runIndex === 5 ? [] : timelineFor(runIndex, stages, profile.submittedAt)
    };
  });
}
