const now = Date.now()
let serial = 0
export const makeId = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${(++serial).toString(36)}`

const step = (id, type, label, params, disabled = false) => ({ id, type, label, params, disabled })

const seedSteps = {
  checkout: [
    step('checkout-nav', 'navigate', 'Open storefront', { url: 'https://shop.ternwave.dev/products' }),
    step('checkout-click', 'click', 'Choose featured item', { selector: '[data-product="featured"]' }),
    step('checkout-type', 'type', 'Enter buyer email', { selector: '#email', text: 'qa@ternwave.dev' }),
    step('checkout-extract', 'extract', 'Capture order total', { selector: '.order-total', variable: 'order_total' }),
    step('checkout-assert', 'assert_text', 'Verify checkout ready', { selector: '[role="status"]', expected_text: 'Ready' }),
    step('checkout-shot', 'screenshot', 'Capture checkout', {}),
  ],
  health: [
    step('health-nav', 'navigate', 'Open status page', { url: 'https://status.ternwave.dev' }),
    step('health-wait', 'wait', 'Wait for metrics', { ms: 800 }),
    step('health-assert', 'assert_text', 'Verify systems online', { selector: '.system-status', expected_text: 'Operational' }),
    step('health-extract', 'extract', 'Capture latency', { selector: '[data-metric="latency"]', variable: 'latency_ms' }),
    step('health-shot', 'screenshot', 'Capture status board', {}),
  ],
  leads: [
    step('leads-nav', 'navigate', 'Open lead directory', { url: 'https://crm.ternwave.dev/leads' }),
    step('leads-type', 'type', 'Search Northeast', { selector: '[aria-label="Search leads"]', text: 'Northeast' }),
    step('leads-click', 'click', 'Open first lead', { selector: '.lead-row:first-child' }),
    step('leads-extract', 'extract', 'Capture company', { selector: '.company-name', variable: 'company_name' }),
    step('leads-extract-2', 'extract', 'Capture contact', { selector: '.contact-email', variable: 'contact_email' }),
    step('leads-shot', 'screenshot', 'Capture lead profile', {}),
  ],
}

const makeRun = (scriptKey, runNo, steps, failedIndex = -1) => {
  const start = new Date(now - ((12 - runNo) * 3_600_000 + (scriptKey.length * 80000))).toISOString()
  const results = steps.map((s, i) => ({
    stepId: s.id, order: i + 1, type: s.type, label: s.label,
    status: s.disabled ? 'skipped' : i === failedIndex ? 'fail' : 'pass', attempts: i === failedIndex ? 3 : 1,
    timestamp: new Date(Date.parse(start) + i * 420).toISOString(),
    ...(i === failedIndex ? { error_reason: `Expected element ${s.params.selector || 'target'} was not available` } : {}),
    ...(s.type === 'extract' ? { extracted_name: s.params.variable, extracted_value: `${s.params.variable}-${runNo}-${scriptKey}` } : {}),
  }))
  const totals = { passed: results.filter(r => r.status === 'pass').length, failed: results.filter(r => r.status === 'fail').length, skipped: results.filter(r => r.status === 'skipped').length, retries: failedIndex >= 0 ? 2 : 0 }
  return {
    id: `${scriptKey}-run-${runNo}`, number: runNo, trigger: 'manual', start_time: start, duration: 1800 + runNo * 137,
    status: totals.failed ? 'fail' : 'pass', totals, steps: results,
    extractedValues: results.filter(r => r.extracted_name).map(r => ({ variable: r.extracted_name, value: r.extracted_value, step: r.order })),
    timeline: results.map(r => ({ id: `${scriptKey}-event-${runNo}-${r.order}`, stepId: r.stepId, step: r.order, status: r.status, timestamp: r.timestamp, label: `${r.label}: ${r.status}` })),
  }
}

function makeScript(id, name, target_url, description, steps, currentVersion) {
  const ordered = steps.map((s, i) => ({ ...s, order: i + 1 }))
  const runs = [makeRun(id, 1, ordered), makeRun(id, 2, ordered, id === 'health' ? 2 : -1), makeRun(id, 3, ordered)]
  return {
    id, name, target_url, description, steps: ordered, version: currentVersion, unsaved: false,
    versions: Array.from({ length: currentVersion }, (_, i) => ({
      number: currentVersion - i,
      timestamp: new Date(now - i * 86_400_000).toISOString(),
      steps: structuredClone(ordered),
    })),
    runs, schedule: { enabled: false, time: '09:00', interval: 'daily' },
    lastRunStatus: runs.at(-1).status, lastRunAt: runs.at(-1).start_time,
  }
}

export const seededScripts = [
  makeScript('checkout', 'Checkout confidence', 'https://shop.ternwave.dev', 'Validates the purchase path before every release.', seedSteps.checkout, 4),
  makeScript('health', 'Production health sweep', 'https://status.ternwave.dev', 'Checks public signals and captures latency.', seedSteps.health, 7),
  makeScript('leads', 'Lead enrichment', 'https://crm.ternwave.dev', 'Collects fresh CRM context for the sales team.', seedSteps.leads, 3),
]

export const seededHtml = `<main class="directory">
  <h1>Regional partners</h1>
  <article class="partner featured" data-region="north"><h2>Northwind Labs</h2><p>Active</p></article>
  <article class="partner" data-region="south"><h2>Solace Systems</h2><p>Active</p></article>
  <button id="invite">Invite partner</button>
</main>`
