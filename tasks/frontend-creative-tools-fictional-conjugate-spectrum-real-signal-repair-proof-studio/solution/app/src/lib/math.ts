// Gaussian rational arithmetic for exactly 4-bin DFT operations

export type Gaussian = { r: number; i: number }; // In quarters (1/4 steps) for Canonical or direct raw values

export function add(a: Gaussian, b: Gaussian): Gaussian {
  return { r: a.r + b.r, i: a.i + b.i };
}

export function sub(a: Gaussian, b: Gaussian): Gaussian {
  return { r: a.r - b.r, i: a.i - b.i };
}

export function mul(a: Gaussian, b: Gaussian): Gaussian {
  return { r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r };
}

export function conj(a: Gaussian): Gaussian {
  return { r: a.r, i: -a.i };
}

export function magSq(a: Gaussian): number {
  return a.r * a.r + a.i * a.i;
}

// Exp(-i 2pi k n / 4) roots for forward: 1, -i, -1, i
export function forwardRoot(k: number, n: number): Gaussian {
  const p = (k * n) % 4;
  if (p === 0) return { r: 1, i: 0 };
  if (p === 1) return { r: 0, i: -1 };
  if (p === 2) return { r: -1, i: 0 };
  if (p === 3) return { r: 0, i: 1 };
  return { r: 0, i: 0 };
}

// Exp(+i 2pi k n / 4) roots for inverse: 1, i, -1, -i
export function inverseRoot(k: number, n: number): Gaussian {
  const p = (k * n) % 4;
  if (p === 0) return { r: 1, i: 0 };
  if (p === 1) return { r: 0, i: 1 };
  if (p === 2) return { r: -1, i: 0 };
  if (p === 3) return { r: 0, i: -1 };
  return { r: 0, i: 0 };
}

// scale by 1/4 (since 4-point inverse requires 1/N)
export function scaleInverseContribution(g: Gaussian): Gaussian {
  return { r: g.r / 4, i: g.i / 4 };
}

export function inverseContribution(X_k: Gaussian, k: number, n: number): Gaussian {
  return scaleInverseContribution(mul(X_k, inverseRoot(k, n)));
}

// For reducing fractions, output string "numerator/denominator" or integer
export function formatFraction(num: number, denom: number): string {
  if (num === 0) return "0";
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const div = Math.abs(gcd(num, denom));
  let n = num / div;
  let d = denom / div;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  if (d === 1) return `${n}`;
  return `${n}/${d}`;
}

export function formatGaussian(g: Gaussian, isQuarter: boolean = false): string {
  // If `isQuarter` is true, `g` contains values that should be divided by 4.
  const rNum = isQuarter ? g.r : Math.round(g.r * 4);
  const iNum = isQuarter ? g.i : Math.round(g.i * 4);
  const rStr = formatFraction(rNum, 4);
  const iStr = formatFraction(Math.abs(iNum), 4);

  if (rNum === 0 && iNum === 0) return "0";
  if (rNum === 0) return iNum < 0 ? `-${iStr}i` : `${iStr}i`;
  if (iNum === 0) return `${rStr}`;
  return `${rStr}${iNum < 0 ? '-' : '+'}${iStr}i`;
}

// Formats phase symbolically
export function formatPhase(r: number, i: number): string {
  if (r === 0 && i === 0) return "undefined-zero";
  if (r === 4 && i === 0) return "0";
  if (r === 2 && i === 2) return "+π/4";
  if (r === 1 && i === -2) return "-atan(2)";
  if (r === 2 && i === -2) return "-π/4";
  // Fallbacks if ever needed (not expected for this exact task)
  return Math.atan2(i, r).toFixed(3);
}
