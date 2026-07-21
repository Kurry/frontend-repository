const now = Date.now()
const isoAgo = (minutes) => new Date(now - minutes * 60_000).toISOString()

const stepNames = [
  'Inspect workspace',
  'Build implementation plan',
  'Apply code changes',
  'Run verification suite',
  'Prepare handoff summary',
]

const event = (agentId, index, minutes, kind, label, extra = {}) => ({
  id: `${agentId}-event-${index}`,
  timestamp: isoAgo(minutes),
  kind,
  label,
  ...extra,
})

const baseHistory = (id, status, minutes = 50) => [
  event(id, 1, minutes + 20, 'status', 'Agent registered as idle', { to: 'idle' }),
  ...(status !== 'idle' ? [event(id, 2, minutes, 'status', `Status changed from idle to ${status}`, { from: 'idle', to: status })] : []),
]

export function createRun(id, serial = 1, failureScenario = false, seeded = false) {
  const startedAt = seeded ? isoAgo(2) : new Date().toISOString()
  const steps = stepNames.map((name, index) => ({
    id: `${id}-run-${serial}-step-${index + 1}`,
    name,
    status: index === 0 && seeded ? 'complete' : index === 1 && seeded ? 'running' : 'pending',
    attempts: index < (seeded ? 2 : 0) ? 1 : 0,
    maxAttempts: 3,
    ticksRemaining: 1 + ((serial + index) % 2),
    plannedFailures: failureScenario && index === 2 ? 3 : 0,
    startedAt: index < (seeded ? 2 : 0) ? isoAgo(2 - index) : undefined,
    completedAt: index === 0 && seeded ? isoAgo(1) : undefined,
    output: index === 0 && seeded ? 'Workspace inventory captured' : undefined,
  }))
  return {
    id: `${id}-run-${serial}`,
    serial,
    status: 'running',
    startedAt,
    currentStep: seeded ? 1 : 0,
    steps,
    progressComplete: seeded ? 1 : 0,
    progressTotal: steps.length,
    failureScenario,
  }
}

const configs = [
  ['agent-aster-finch', 'Aster Finch', 'aster', 'codedeck', 'running', true, true],
  ['agent-boreal-echo', 'Boreal Echo', 'boreal', 'nimbus', 'idle', false, false],
  ['agent-cinder-vale', 'Cinder Vale', 'cinder', 'quill', 'running', true, true],
  ['agent-aster-drift', 'Aster Drift', 'aster', 'vector', 'paused', false, true],
  ['agent-boreal-sable', 'Boreal Sable', 'boreal', 'codedeck', 'error', false, true],
  ['agent-cinder-nova', 'Cinder Nova', 'cinder', 'none', 'offline', false, false],
  ['agent-aster-rune', 'Aster Rune', 'aster', 'nimbus', 'running', false, true],
  ['agent-boreal-kite', 'Boreal Kite', 'boreal', 'quill', 'idle', false, false],
  ['agent-cinder-loom', 'Cinder Loom', 'cinder', 'vector', 'offline', false, false],
]

export function seedAgents() {
  return configs.map(([id, name, agentType, editorIntegration, status, failureScenario, hasRun], index) => {
    let run = hasRun ? createRun(id, 1, failureScenario, true) : null
    if (status === 'paused' && run) {
      run = {
        ...run,
        status: 'paused',
        steps: run.steps.map((step, stepIndex) => stepIndex === 1 ? { ...step, checkpoint: 'Paused after dependency scan' } : step),
      }
    }
    if (status === 'error' && run) {
      run = {
        ...run,
        status: 'failed',
        currentStep: 1,
        steps: run.steps.map((step, stepIndex) => stepIndex === 1 ? { ...step, status: 'failed', attempts: 3, error: 'Verification failed after 3 automatic attempts' } : step),
      }
    }
    if (status === 'running' && run && failureScenario && id === 'agent-cinder-vale') {
      run = {
        ...run,
        status: 'running',
        currentStep: 2,
        progressComplete: 2,
        steps: run.steps.map((step, stepIndex) => {
          if (stepIndex === 2) return { ...step, status: 'retrying', attempts: 1, maxAttempts: 3, backoffRemaining: 5, error: 'Verification command returned exit code 1', ticksRemaining: 0, plannedFailures: 2 }
          if (stepIndex < 2) return { ...step, status: 'complete', attempts: 1, completedAt: isoAgo(1), output: `${step.name} completed successfully` }
          return step
        }),
      }
    }
    return {
      id,
      name,
      agentType,
      editorIntegration,
      accessKey: `fleet_${name.replaceAll(' ', '_').toLowerCase()}_2026`,
      status,
      lastSeen: isoAgo(index * 3 + (status === 'offline' ? 95 : 1)),
      timeline: baseHistory(id, status, 42 + index * 4),
      activity: index % 3 === 0 ? [
        { id: `${id}-activity-1`, timestamp: isoAgo(32), label: 'Refactor the command routing layer' },
        { id: `${id}-activity-2`, timestamp: isoAgo(11), label: 'Verify the release build' },
      ] : [],
      run,
      failureScenario,
      runSerial: hasRun ? 1 : 0,
      isNew: false,
    }
  })
}
