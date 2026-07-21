import { formatISO, subDays } from 'date-fns';

export const MODELS = ['aurora-70b', 'quasar-mini', 'helix-2', 'cobalt-8b', 'meridian-pro'];
export const TEAMS = ['Research', 'Product', 'Support', 'Platform'];
export const FEATURES = ['Chat assist', 'Document summary', 'Code review', 'Semantic search', 'Agent workflow'];

export const ORIGINAL_RATES = {
  'aurora-70b': 0.028,
  'quasar-mini': 0.004,
  'helix-2': 0.016,
  'cobalt-8b': 0.009,
  'meridian-pro': 0.022,
};

// Workload pricing: every event is billed as tokens × model rate × the team's
// infrastructure tier factor × the feature's orchestration overhead. This is
// why recategorizing events between teams or features moves every aggregate —
// spend genuinely shifts when work moves.
export const TEAM_FACTORS = { Research: 1.0, Product: 1.12, Support: 0.92, Platform: 1.22 };
export const FEATURE_FACTORS = {
  'Chat assist': 1.0,
  'Document summary': 1.05,
  'Code review': 1.1,
  'Semantic search': 0.95,
  'Agent workflow': 1.18,
};

export function workloadFactor(team, feature) {
  return (TEAM_FACTORS[team] ?? 1) * (FEATURE_FACTORS[feature] ?? 1);
}

export const INITIAL_CEILINGS = {
  Research: 5,
  Product: 24,
  Support: 18,
  Platform: 20,
};

export const END_DATE = new Date('2026-07-20T12:00:00.000Z');
const DAYS = 96;
const EVENTS_PER_DAY = 16;

function seededValue(index) {
  const x = Math.sin(index * 982.451 + 41.7) * 43758.5453;
  return x - Math.floor(x);
}

export function seedEvents() {
  const events = [];
  for (let dayOffset = DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const date = subDays(END_DATE, dayOffset);
    const anomalyMultiplier = dayOffset === 17 ? 4.8 : dayOffset === 6 ? 5.5 : 1;
    for (let row = 0; row < EVENTS_PER_DAY; row += 1) {
      const n = (DAYS - dayOffset) * 97 + row * 13;
      const model = MODELS[(n + row) % MODELS.length];
      const team = TEAMS[(n * 3 + row) % TEAMS.length];
      const feature = FEATURES[(n * 7 + row * 2) % FEATURES.length];
      const promptTokens = Math.round((720 + seededValue(n) * 3200) * anomalyMultiplier);
      const completionTokens = Math.round((180 + seededValue(n + 33) * 1180) * anomalyMultiplier);
      const hour = 1 + ((row * 5 + dayOffset) % 22);
      const minute = (row * 17 + dayOffset * 3) % 60;
      const timestamp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, minute)).toISOString();
      const cost = Number((((promptTokens + completionTokens) / 1000) * ORIGINAL_RATES[model] * workloadFactor(team, feature)).toFixed(6));
      events.push({
        id: `evt-${String(events.length + 1).padStart(4, '0')}`,
        timestamp,
        model,
        feature,
        team,
        promptTokens,
        completionTokens,
        cost,
        tag: row % 5 === 0 ? 'production' : row % 3 === 0 ? 'batch' : 'interactive',
      });
    }
  }
  return events;
}

export const DEFAULT_RANGE = {
  // Keep the default ledger large enough to exercise virtualization while
  // retaining six additional seeded days for prior-range comparisons.
  from: formatISO(subDays(END_DATE, 89), { representation: 'date' }),
  to: formatISO(END_DATE, { representation: 'date' }),
};

export function quickRange(days) {
  return {
    from: formatISO(subDays(END_DATE, days - 1), { representation: 'date' }),
    to: formatISO(END_DATE, { representation: 'date' }),
  };
}
