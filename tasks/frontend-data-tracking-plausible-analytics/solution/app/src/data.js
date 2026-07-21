// Seeded analytics dataset + deterministic aggregation engine for the
// Plausible Analytics oracle. Every displayed number is computed here from the
// seed; nothing is hardcoded at the view layer. Filtering by a breakdown row
// recomputes the KPI tiles, the visitors trend, and the other breakdown panels
// from the same seed, so different segments yield different (real) numbers.

// --- deterministic hash helpers (stable across reloads) --------------------
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295; // 0..1
}

// Per-entry derived stats (pageviews-per-visitor, bounce rate, avg duration)
// vary deterministically by name so each segment reads distinctly.
function entryStats(name, visitors, basePpv, baseBounce, baseDur) {
  const j1 = hash(name + '|ppv');
  const j2 = hash(name + '|bounce');
  const j3 = hash(name + '|dur');
  const ppv = basePpv * (0.7 + j1 * 0.9); // 0.7x .. 1.6x base
  const pageviews = Math.max(visitors, Math.round(visitors * ppv));
  const bounceRate = Math.min(78, Math.max(21, Math.round(baseBounce + (j2 - 0.5) * 34)));
  const avgDuration = Math.max(28, Math.round(baseDur + (j3 - 0.5) * 90));
  const bounces = Math.round(visitors * (bounceRate / 100));
  const durationSum = visitors * avgDuration;
  return { name, visitors, pageviews, bounces, durationSum, bounceRate, avgDuration };
}

function buildSite(cfg) {
  const basePpv = cfg.pageviews / cfg.visitors;
  const decorate = (list) =>
    list.map((e) => entryStats(e.name, e.visitors, basePpv, cfg.bounceRate, cfg.avgDuration));
  return {
    id: cfg.id,
    label: cfg.label,
    timezone: cfg.timezone || 'UTC',
    visitors: cfg.visitors,
    pageviews: cfg.pageviews,
    bounceRate: cfg.bounceRate,
    avgDuration: cfg.avgDuration,
    sources: decorate(cfg.sources),
    pages: decorate(cfg.pages),
    countries: decorate(cfg.countries),
  };
}

// example.com totals + top-4 rows match preview.png exactly for Last 30 days.
export const SITES = {
  'example.com': buildSite({
    id: 'example.com',
    label: 'example.com',
    timezone: 'America/New_York',
    visitors: 16840,
    pageviews: 47220,
    bounceRate: 44,
    avgDuration: 98,
    sources: [
      { name: 'Google', visitors: 7200 },
      { name: 'Direct', visitors: 4800 },
      { name: 'Twitter', visitors: 1600 },
      { name: 'Newsletter', visitors: 980 },
      { name: 'Bing', visitors: 900 },
      { name: 'Reddit', visitors: 760 },
      { name: 'Facebook', visitors: 600 },
    ],
    pages: [
      { name: '/', visitors: 12800 },
      { name: '/pricing', visitors: 5600 },
      { name: '/blog', visitors: 3900 },
      { name: '/docs', visitors: 2800 },
      { name: '/about', visitors: 2100 },
      { name: '/features', visitors: 1600 },
    ],
    countries: [
      { name: 'United States', visitors: 6400 },
      { name: 'United Kingdom', visitors: 2400 },
      { name: 'Germany', visitors: 1900 },
      { name: 'Canada', visitors: 1200 },
      { name: 'France', visitors: 1150 },
      { name: 'India', visitors: 1050 },
      { name: 'Netherlands', visitors: 990 },
      { name: 'Australia', visitors: 900 },
      { name: 'Spain', visitors: 850 },
    ],
  }),
  'blog.example.com': buildSite({
    id: 'blog.example.com',
    label: 'blog.example.com',
    timezone: 'Europe/London',
    visitors: 9240,
    pageviews: 21980,
    bounceRate: 51,
    avgDuration: 76,
    sources: [
      { name: 'Direct', visitors: 3600 },
      { name: 'Google', visitors: 2900 },
      { name: 'Hacker News', visitors: 1300 },
      { name: 'Twitter', visitors: 840 },
      { name: 'Reddit', visitors: 600 },
    ],
    pages: [
      { name: '/blog', visitors: 5200 },
      { name: '/blog/react-19', visitors: 3100 },
      { name: '/blog/privacy', visitors: 2400 },
      { name: '/blog/changelog', visitors: 1500 },
      { name: '/', visitors: 900 },
    ],
    countries: [
      { name: 'United States', visitors: 3400 },
      { name: 'Germany', visitors: 1600 },
      { name: 'United Kingdom', visitors: 1200 },
      { name: 'Netherlands', visitors: 940 },
      { name: 'Canada', visitors: 900 },
      { name: 'France', visitors: 1200 },
    ],
  }),
  'shop.example.com': buildSite({
    id: 'shop.example.com',
    label: 'shop.example.com',
    timezone: 'Asia/Tokyo',
    visitors: 23110,
    pageviews: 82640,
    bounceRate: 38,
    avgDuration: 142,
    sources: [
      { name: 'Google', visitors: 9800 },
      { name: 'Direct', visitors: 5200 },
      { name: 'Instagram', visitors: 3100 },
      { name: 'Facebook', visitors: 2400 },
      { name: 'Newsletter', visitors: 1610 },
      { name: 'Twitter', visitors: 1000 },
    ],
    pages: [
      { name: '/', visitors: 18400 },
      { name: '/shop', visitors: 11200 },
      { name: '/product/tee', visitors: 6400 },
      { name: '/cart', visitors: 4100 },
      { name: '/checkout', visitors: 2600 },
    ],
    countries: [
      { name: 'United States', visitors: 10200 },
      { name: 'Canada', visitors: 3400 },
      { name: 'United Kingdom', visitors: 2900 },
      { name: 'Australia', visitors: 2600 },
      { name: 'Germany', visitors: 2010 },
      { name: 'France', visitors: 2000 },
    ],
  }),
};

export const SITE_IDS = Object.keys(SITES);

export const PERIODS = [
  { id: 'last-7-days', label: 'Last 7 days', factor: 0.28, buckets: 7 },
  { id: 'last-30-days', label: 'Last 30 days', factor: 1, buckets: 10 },
  { id: 'last-6-months', label: 'Last 6 months', factor: 5.6, buckets: 12 },
  { id: 'last-12-months', label: 'Last 12 months', factor: 11.3, buckets: 12 },
];

export const SORTS = [
  { id: 'most-visitors', label: 'Most visitors' },
  { id: 'fewest-visitors', label: 'Fewest visitors' },
  { id: 'name-az', label: 'Name A-Z' },
];

export const DIMENSIONS = ['source', 'page', 'country'];
const DIM_KEY = { source: 'sources', page: 'pages', country: 'countries' };
export const DIM_LABEL = { source: 'Source', page: 'Page', country: 'Country' };

function periodById(id, customRange) {
  if (id === 'custom' && customRange?.from && customRange?.to) {
    const from = new Date(`${customRange.from}T00:00:00Z`);
    const to = new Date(`${customRange.to}T00:00:00Z`);
    const days = Math.max(1, Math.round((to - from) / 86400000) + 1);
    return { id: 'custom', label: `${customRange.from} to ${customRange.to}`, factor: days / 30, buckets: Math.min(days, 14) };
  }
  return PERIODS.find((p) => p.id === id) || PERIODS[1];
}

// Scale a raw seed count by the active period factor (deterministic rounding).
function scale(n, factor) {
  return Math.round(n * factor);
}

// Build the visitors trend buckets for a given total and period. Gentle upward
// wave (matches preview's ascending bars) with a per-bucket deterministic
// jitter; buckets always sum to the given total.
function buildTrend(total, period, seedKey) {
  const n = period.buckets;
  const weights = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const base = 0.6 + (i / (n - 1)) * 0.8; // rising 0.6 -> 1.4
    const j = hash(seedKey + '|bucket|' + i);
    const w = base * (0.82 + j * 0.36);
    weights.push(w);
    sum += w;
  }
  const buckets = weights.map((w) => Math.max(1, Math.round((w / sum) * total)));
  // Fix rounding drift so the buckets sum exactly to total.
  let drift = total - buckets.reduce((a, b) => a + b, 0);
  let idx = buckets.length - 1;
  while (drift !== 0 && idx >= 0) {
    const step = drift > 0 ? 1 : -1;
    if (buckets[idx] + step >= 1) {
      buckets[idx] += step;
      drift -= step;
    }
    idx = idx === 0 ? buckets.length - 1 : idx - 1;
    if (buckets.every((b) => b <= 1) && drift < 0) break;
  }
  return buckets;
}

// Sort a decorated list by the active sort mode. Returns a new array.
export function sortEntries(list, sortId) {
  const copy = list.slice();
  if (sortId === 'name-az') copy.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortId === 'fewest-visitors') copy.sort((a, b) => a.visitors - b.visitors);
  else copy.sort((a, b) => b.visitors - a.visitors);
  return copy;
}

// Core selector: given site, period, and an optional segment filter
// array of filters [{dimension,value}], compute the full dashboard model (KPIs + trend + three
// breakdown panels), all derived from the seed.
export function computeDashboard(siteId, periodId, filters, sortId, compare, addedGoals, customRange) {
  const site = SITES[siteId] || SITES['example.com'];
  if (!site) return null;
  const period = periodById(periodId, customRange);
  const f = period.factor;
  const activeFilters = Array.isArray(filters)
    ? filters.filter((filter) => DIMENSIONS.includes(filter?.dimension) && typeof filter.value === 'string')
    : [];

  let fraction = 1;
  const matchedSegments = [];
  for (const filter of activeFilters) {
    const list = site[DIM_KEY[filter.dimension]];
    const seg = list.find((e) => e.name === filter.value);
    if (seg) {
      fraction *= site.visitors > 0 ? seg.visitors / site.visitors : 0;
      matchedSegments.push(seg);
    } else {
      fraction = 0;
    }
  }
  const visitors = scale(Math.round(site.visitors * fraction), f);
  const pageviews = scale(Math.round(site.pageviews * fraction), f);
  // With multiple stacked filters, visitors already accounts for every active
  // segment (product of fractions). Bounce rate / avg duration must likewise
  // reflect ALL matched segments, not just the last one in the loop — combine
  // them as a visitor-weighted average so the KPIs stay internally consistent
  // with the filtered visitor count.
  let bounceRate = site.bounceRate;
  let avgDuration = site.avgDuration;
  if (matchedSegments.length > 0) {
    const totalWeight = matchedSegments.reduce((sum, s) => sum + s.visitors, 0);
    if (totalWeight > 0) {
      bounceRate = Math.round(
        matchedSegments.reduce((sum, s) => sum + s.bounceRate * s.visitors, 0) / totalWeight
      );
      avgDuration = Math.round(
        matchedSegments.reduce((sum, s) => sum + s.avgDuration * s.visitors, 0) / totalWeight
      );
    } else {
      bounceRate = Math.round(
        matchedSegments.reduce((sum, s) => sum + s.bounceRate, 0) / matchedSegments.length
      );
      avgDuration = Math.round(
        matchedSegments.reduce((sum, s) => sum + s.avgDuration, 0) / matchedSegments.length
      );
    }
  }
  const kpi = {
    visitors,
    pageviews,
    bounceRate,
    avgDuration,
  };

  const filterKey = activeFilters.length
    ? activeFilters.map((filter) => `${filter.dimension}:${filter.value}`).join('|')
    : 'all';
  const trendSeed = `${siteId}|${periodId}|${filterKey}`;
  const trend = buildTrend(kpi.visitors, period, trendSeed);

  // Breakdown panels: when a segment filter is active, the OTHER panels recompute
  // to the filtered segment via the segment fraction plus a per-entry jitter so
  // the shape (not just scale) shifts; the filtered dimension's own panel shows
  // only the selected row.
  function panel(dim) {
    const list = site[DIM_KEY[dim]];
    const dimensionFilter = activeFilters.find((filter) => filter.dimension === dim);
    if (dimensionFilter) {
      const seg = list.find((e) => e.name === dimensionFilter.value);
      return seg ? [{ ...seg, visitors: kpi.visitors }] : [];
    }
    return list.map((e) => {
      if (!activeFilters.length) return { ...e, visitors: scale(e.visitors, f) };
      const j = 0.7 + hash(e.name + '|' + filterKey) * 0.7; // 0.7..1.4
      const v = Math.max(1, scale(Math.round(e.visitors * fraction * j), f));
      return { ...e, visitors: v };
    });
  }

  const seededGoals = [
    { name: 'Signup', goal_type: 'event', match_key: 'signup' },
    { name: 'Pricing viewed', goal_type: 'page', match_key: '/pricing' },
    { name: 'Docs read', goal_type: 'page', match_key: '/docs' },
  ];
  const goalRecords = [...seededGoals, ...(Array.isArray(addedGoals) ? addedGoals : [])];
  const goals = goalRecords.map((goal) => {
    const rate = 0.04 + hash(`${siteId}|${goal.name}|${filterKey}`) * 0.18;
    const completions = Math.min(kpi.visitors, Math.round(kpi.visitors * rate));
    const conversionRate = kpi.visitors > 0 ? Math.round((completions / kpi.visitors) * 1000) / 10 : 0;
    return { ...goal, completions, conversion_rate: conversionRate };
  });
  const pricingCount = goals.find((goal) => goal.name === 'Pricing viewed')?.completions ?? 0;
  const signupCount = Math.min(pricingCount, goals.find((goal) => goal.name === 'Signup')?.completions ?? 0);
  const funnelCounts = [kpi.visitors, Math.min(kpi.visitors, pricingCount), signupCount];
  const funnel = ['Visited', 'Pricing viewed', 'Signup'].map((name, index) => ({
    name,
    count: funnelCounts[index],
    step_conversion: index === 0
      ? 100
      : funnelCounts[index - 1] > 0
        ? Math.round((funnelCounts[index] / funnelCounts[index - 1]) * 1000) / 10
        : 0,
  }));

  // Each panel shows the top 4 rows; the active sort reorders those same four
  // rows (so most->fewest is a true visual reversal of the same rows, and
  // most->name-az->most round-trips exactly), rather than swapping in a
  // different set of rows from the long tail.
  const displayed = (list) => {
    if (list.length <= 4) return sortEntries(list, sortId);
    const top4 = list.slice().sort((a, b) => b.visitors - a.visitors).slice(0, 4);
    return sortEntries(top4, sortId);
  };
  const sources = displayed(panel('source'));
  const pages = displayed(panel('page'));
  const countries = displayed(panel('country'));

  // Compare mode: deterministic previous-period baselines (the immediately
  // previous period of equal length) derived from the same seed with a
  // "previous" key, so chip values change whenever the site, date range, or
  // segment filter stack changes.
  let previousKpi = null;
  let previousTrend = null;
  let previousPanels = null;
  if (compare) {
    const prevSeed = `${trendSeed}|previous`;
    const pj = (key, lo, hi) => lo + hash(`${prevSeed}|${key}`) * (hi - lo);
    previousKpi = {
      visitors: Math.max(1, Math.round(kpi.visitors * pj('visitors', 0.72, 1.18))),
      pageviews: Math.max(1, Math.round(kpi.pageviews * pj('pageviews', 0.72, 1.18))),
      bounceRate: Math.min(95, Math.max(5, Math.round(kpi.bounceRate * pj('bounce', 0.85, 1.2)))),
      avgDuration: Math.max(10, Math.round(kpi.avgDuration * pj('duration', 0.8, 1.25))),
    };
    previousTrend = buildTrend(previousKpi.visitors, period, prevSeed);
    previousPanels = { source: {}, page: {}, country: {} };
    const prevPanel = (dim, list) => {
      for (const e of list) {
        const j = hash(`${prevSeed}|${dim}|${e.name}`);
        // A small deterministic slice of rows is new this period (absent from
        // the previous one) so the "New" indicator is exercised.
        previousPanels[dim][e.name] = j < 0.08 ? 0 : Math.max(1, Math.round(e.visitors * (0.72 + j * 0.5)));
      }
    };
    prevPanel('source', sources);
    prevPanel('page', pages);
    prevPanel('country', countries);
  }

  return {
    site,
    period,
    filters: activeFilters,
    kpi,
    trend,
    sources,
    pages,
    countries,
    goals,
    funnel,
    previousKpi,
    previousTrend,
    previousPanels,
  };
}

export function formatNumber(n) {
  return n.toLocaleString('en-US');
}

export function formatDuration(seconds) {
  return `${seconds}s`;
}

// -- Export CSV helpers
export function generateBreakdownCSV(model) {
  const lines = ['dimension,name,visitors'];
  if (!model) return lines.join('\n');
  const addRows = (dim, list) => {
    for (const r of list) lines.push(`${dim},${r.name},${r.visitors}`);
  };
  addRows('source', model.sources);
  addRows('page', model.pages);
  addRows('country', model.countries);
  return lines.join('\n');
}

export function generatePanelCSV(type, model) {
  if (type === 'source' || type === 'page' || type === 'country') {
    const lines = ['dimension,name,visitors'];
    if (model) {
      const list = type === 'source' ? model.sources : type === 'page' ? model.pages : model.countries;
      for (const r of list) lines.push(`${type},${r.name},${r.visitors}`);
    }
    return lines.join('\n');
  } else if (type === 'goals') {
    const lines = ['goal,completions,conversion_rate'];
    if (model && model.goals) {
      for (const r of model.goals) lines.push(`${r.name},${r.completions},${r.conversion_rate}%`);
    }
    return lines.join('\n');
  } else if (type === 'funnel') {
    const lines = ['step,count,step_conversion'];
    if (model && model.funnel) {
      for (const r of model.funnel) lines.push(`${r.name},${r.count},${r.step_conversion}%`);
    }
    return lines.join('\n');
  }
  return '';
}
