import { FX, ledgerSchema } from './schemas.js';
import { convertedNumber, formatBaseAmount } from './format.js';
import { computedThresholds, displayCurrency, filters, totals, filteredTransactions } from './state.js';

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildCsvText(rows = filteredTransactions.value) {
  const header = 'date,label,category,account,amount,status,note';
  const lines = rows.map((t) =>
    [
      csvEscape(t.date),
      csvEscape(t.label),
      csvEscape(t.category),
      csvEscape(t.account),
      formatBaseAmount(t.amount),
      csvEscape(t.status || ''),
      csvEscape(t.note || ''),
    ].join(','),
  );
  return [header, ...lines].join('\n');
}

export function buildLedgerObject(currency = displayCurrency.value) {
  const t = totals.value;
  const thr = computedThresholds.value;
  const rows = filteredTransactions.value;
  return {
    schemaVersion: 1,
    reportTitle: 'Finance Reports',
    generatedAt: new Date().toISOString(),
    displayCurrency: currency,
    filters: {
      category: filters.value.category ?? null,
      type: filters.value.type ?? null,
      dateStart: filters.value.dateStart ?? null,
      dateEnd: filters.value.dateEnd ?? null,
    },
    totals: {
      income: convertedNumber(t.income, currency),
      expenses: convertedNumber(t.expenses, currency),
      net: convertedNumber(t.net, currency),
      savingsRate: t.savingsRate,
      count: t.count,
    },
    thresholds: thr.map((th) => ({
      category: th.category,
      ceiling: convertedNumber(th.ceiling, currency),
      monthToDate: convertedNumber(th.monthToDate, currency),
      status: th.status,
    })),
    transactions: rows.map((r) => ({
      date: r.date,
      label: r.label,
      category: r.category,
      account: r.account,
      amount: Number(formatBaseAmount(r.amount)),
      status: r.status || '',
      note: r.note || '',
    })),
  };
}

export function buildJsonText(currency) {
  return JSON.stringify(buildLedgerObject(currency), null, 2);
}

// Parse + validate an imported ledger-json document. Returns { ok, data } or { ok:false, message, path }.
export function parseLedgerDocument(input) {
  let doc = input;
  if (typeof input === 'string') {
    const text = input.trim();
    if (text.length === 0) return { ok: false, message: 'Ledger document is empty', path: null };
    try {
      doc = JSON.parse(text);
    } catch (e) {
      return { ok: false, message: 'Ledger JSON is not valid JSON', path: null };
    }
  }
  if (!doc || typeof doc !== 'object') {
    return { ok: false, message: 'Ledger document must be a JSON object', path: null };
  }
  if (doc.schemaVersion !== 1) {
    return { ok: false, message: 'schemaVersion must be 1', path: 'schemaVersion' };
  }
  const result = ledgerSchema.safeParse(doc);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path && issue.path.length ? issue.path.join('.') : null;
    return { ok: false, message: `${path ? `${path}: ` : ''}${issue.message}`, path };
  }
  const rate = FX[result.data.displayCurrency];
  const data = {
    ...result.data,
    thresholds: result.data.thresholds.map(({ category, ceiling }) => ({
      category,
      ceiling: Math.round((ceiling / rate) * 100) / 100,
    })),
  };
  return { ok: true, data };
}
