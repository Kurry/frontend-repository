const moneyFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Absolute currency magnitude: 1234.5 -> "$1,234.50". One formatter everywhere. */
export function money(n: number): string {
  return `$${moneyFmt.format(Math.abs(n))}`;
}

/** Signed currency: +$4,200.00 for income, -$86.40 for expenses. */
export function signedMoney(n: number): string {
  if (n > 0) return `+$${moneyFmt.format(n)}`;
  if (n < 0) return `-$${moneyFmt.format(Math.abs(n))}`;
  return '$0.00';
}

/** Percent with one decimal: 0.284 -> "28.4%". */
export function pct(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

/** ISO date -> "Jul 5, 2026". Used by the table, strip, diagnostics, and Markdown export. */
export function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function todayIso(): string {
  return isoDate(new Date());
}

/** Short month label for the burn-rate panel, e.g. "July 2026". */
export function monthLabel(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
