import { CURRENCY_SYMBOL, FX } from './schemas.js';

export function convert(amount, currency) {
  const rate = FX[currency] ?? 1;
  return Math.round(amount * rate * 100) / 100;
}

// Format a stored USD base amount into the active display currency with symbol + 2 decimals.
export function formatMoney(usdBase, currency, opts = {}) {
  const value = convert(usdBase, currency);
  const sign = opts.showSign && value > 0 ? '+' : '';
  const negative = value < 0;
  const abs = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sym = CURRENCY_SYMBOL[currency] ?? currency + ' ';
  return `${sign}${negative ? '-' : ''}${sym}${abs}`;
}

// Plain 2-decimal number in the display currency (for JSON totals/thresholds).
export function convertedNumber(usdBase, currency) {
  return convert(usdBase, currency);
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

export function formatBaseAmount(amount) {
  // CSV / stored base: 2-decimal USD number, no symbol.
  const n = Number(amount);
  return (Number.isFinite(n) ? n : 0).toFixed(2);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso) {
  if (!iso || typeof iso !== 'string' || iso.length < 10) return iso || '';
  const [y, m, d] = iso.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
}

export function formatRange(startIso, endIso) {
  if (!startIso || !endIso) return '—';
  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}
