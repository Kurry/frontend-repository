const normalize = (value, options) => {
  let next = value;
  if (options.ignoreWhitespace) next = next.trim().replace(/\s+/g, ' ');
  if (options.ignoreCase) next = next.toLocaleLowerCase();
  return next;
};

function lcsPairs(left, right, options) {
  const a = left.map((line) => normalize(line, options));
  const b = right.map((line) => normalize(line, options));
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) matrix[i][j] = a[i] === b[j] ? matrix[i + 1][j + 1] + 1 : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
  }
  const pairs = [];
  let i = 0; let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { pairs.push([i, j]); i += 1; j += 1; }
    else if (matrix[i + 1][j] >= matrix[i][j + 1]) i += 1;
    else j += 1;
  }
  return pairs;
}

function wordSegments(left, right, options) {
  const tokenize = (line) => line.match(/\s+|[^\s]+/g) || [];
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  const comparable = (token) => options.ignoreWhitespace && /^\s+$/.test(token) ? ' ' : normalize(token, options);
  const a = leftTokens.map(comparable);
  const b = rightTokens.map(comparable);
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) for (let j = b.length - 1; j >= 0; j -= 1) matrix[i][j] = a[i] === b[j] ? matrix[i + 1][j + 1] + 1 : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
  const leftSame = new Set(); const rightSame = new Set();
  let i = 0; let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { leftSame.add(i); rightSame.add(j); i += 1; j += 1; }
    else if (matrix[i + 1][j] >= matrix[i][j + 1]) i += 1;
    else j += 1;
  }
  return {
    left: leftTokens.map((text, index) => ({ text, changed: !leftSame.has(index) && !(/^\s+$/.test(text) && options.ignoreWhitespace) })),
    right: rightTokens.map((text, index) => ({ text, changed: !rightSame.has(index) && !(/^\s+$/.test(text) && options.ignoreWhitespace) })),
  };
}

export function computeDiff(leftText = '', rightText = '', options = {}) {
  const left = leftText.split('\n'); const right = rightText.split('\n');
  if (leftText === '' && rightText === '') return { rows: [], unifiedRows: [], counters: { linesAdded: 0, linesRemoved: 0, netTokenDelta: 0 }, identical: true };
  const pairs = lcsPairs(left, right, options);
  const anchors = [[-1, -1], ...pairs, [left.length, right.length]];
  const rows = [];
  for (let anchor = 0; anchor < anchors.length - 1; anchor += 1) {
    const [prevLeft, prevRight] = anchors[anchor];
    const [nextLeft, nextRight] = anchors[anchor + 1];
    const leftGap = left.slice(prevLeft + 1, nextLeft);
    const rightGap = right.slice(prevRight + 1, nextRight);
    const count = Math.max(leftGap.length, rightGap.length);
    for (let gapIndex = 0; gapIndex < count; gapIndex += 1) {
      const leftLine = leftGap[gapIndex]; const rightLine = rightGap[gapIndex];
      const words = wordSegments(leftLine || '', rightLine || '', options);
      rows.push({
        key: `change-${prevLeft}-${prevRight}-${gapIndex}`,
        changed: true,
        left: leftLine == null ? null : { number: prevLeft + 2 + gapIndex, text: leftLine, type: 'removed', words: words.left },
        right: rightLine == null ? null : { number: prevRight + 2 + gapIndex, text: rightLine, type: 'added', words: words.right },
      });
    }
    if (nextLeft < left.length && nextRight < right.length) rows.push({
      key: `same-${nextLeft}-${nextRight}`, changed: false,
      left: { number: nextLeft + 1, text: left[nextLeft], type: 'same', words: [{ text: left[nextLeft], changed: false }] },
      right: { number: nextRight + 1, text: right[nextRight], type: 'same', words: [{ text: right[nextRight], changed: false }] },
    });
  }
  const linesRemoved = rows.filter((row) => row.left?.type === 'removed').length;
  const linesAdded = rows.filter((row) => row.right?.type === 'added').length;
  const tokenCount = (text) => (text.trim().match(/\S+/g) || []).length;
  const normalizedLeft = options.ignoreWhitespace || options.ignoreCase ? normalize(leftText, options) : leftText;
  const normalizedRight = options.ignoreWhitespace || options.ignoreCase ? normalize(rightText, options) : rightText;
  const netTokenDelta = tokenCount(normalizedRight) - tokenCount(normalizedLeft);
  const contextIndexes = new Set();
  rows.forEach((row, index) => { if (row.changed) for (let offset = -3; offset <= 3; offset += 1) if (rows[index + offset]) contextIndexes.add(index + offset); });
  const unifiedRows = [];
  let previous = -2;
  [...contextIndexes].sort((a, b) => a - b).forEach((index) => {
    if (index > previous + 1) unifiedRows.push({ separator: true, key: `sep-${index}` });
    const row = rows[index];
    if (row.changed) {
      if (row.left) unifiedRows.push({ key: `${row.key}-left`, side: 'left', line: row.left, changed: true });
      if (row.right) unifiedRows.push({ key: `${row.key}-right`, side: 'right', line: row.right, changed: true });
    } else unifiedRows.push({ key: `${row.key}-same`, side: 'both', line: row.right, oldNumber: row.left.number, changed: false });
    previous = index;
  });
  return { rows, unifiedRows, counters: { linesAdded, linesRemoved, netTokenDelta }, identical: linesAdded === 0 && linesRemoved === 0 };
}

export function relativeTime(timestamp) {
  const delta = Date.now() - new Date(timestamp).getTime();
  const days = Math.max(0, Math.floor(delta / 86400000));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

