export type DiffPart = { type: 'same' | 'add' | 'del'; text: string };

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

/**
 * Word-level LCS diff. Tokens present only in `current` become removals;
 * tokens present only in `candidate` become additions. Deterministic for a
 * given input pair — no constant rendering.
 */
export function diffWords(current: string, candidate: string): DiffPart[] {
  if (current === candidate) return [];
  const a = tokenize(current); // source of removals
  const b = tokenize(candidate); // source of additions

  const n = a.length;
  const m = b.length;
  // Cap LCS table size for pathological bodies.
  if (n * m > 2_000_000) {
    return [
      { type: 'del', text: current },
      { type: 'add', text: candidate },
    ];
  }

  const dp: Int32Array[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) dp[i] = new Int32Array(m + 1);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  const push = (type: DiffPart['type'], text: string) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += text;
    else parts.push({ type, text });
  };

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('del', a[i]);
      i++;
    } else {
      push('add', b[j]);
      j++;
    }
  }
  while (i < n) {
    push('del', a[i]);
    i++;
  }
  while (j < m) {
    push('add', b[j]);
    j++;
  }
  return parts;
}

/** Group diff parts into display lines, each keeping its +/- semantics. */
export function diffLines(current: string, candidate: string): DiffPart[] {
  if (current === candidate) return [];
  const a = current.split('\n');
  const b = candidate.split('\n');
  const parts: DiffPart[] = [];
  const max = Math.max(a.length, b.length);
  // Line-aligned comparison is stable and reads clearly for scene bodies.
  for (let k = 0; k < max; k++) {
    const la = a[k];
    const lb = b[k];
    if (la === lb) {
      if (la !== undefined) parts.push({ type: 'same', text: la });
    } else if (la !== undefined && lb !== undefined) {
      parts.push({ type: 'del', text: la });
      parts.push({ type: 'add', text: lb });
    } else if (la !== undefined) {
      parts.push({ type: 'del', text: la });
    } else if (lb !== undefined) {
      parts.push({ type: 'add', text: lb });
    }
  }
  // Collapse trivially equal tails/heads are left as-is; callers render marks.
  return parts.filter((p) => !(p.type === 'same' && p.text.trim() === ''));
}

export function formatVersionTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
