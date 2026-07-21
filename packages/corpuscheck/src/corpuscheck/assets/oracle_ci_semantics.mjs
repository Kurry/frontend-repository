export function changedPaths(before, after, prefix = '$') {
  if (Object.is(before, after)) return [];

  const beforeObject = before !== null && typeof before === 'object';
  const afterObject = after !== null && typeof after === 'object';
  if (!beforeObject || !afterObject || Array.isArray(before) !== Array.isArray(after)) {
    return [prefix];
  }

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const paths = [];
  for (const key of keys) {
    const child = Array.isArray(before) ? `${prefix}[${key}]` : `${prefix}.${key}`;
    if (!(key in before) || !(key in after)) paths.push(child);
    else paths.push(...changedPaths(before[key], after[key], child));
  }
  return paths;
}

export function analyzeAutonomousSnapshots(snapshots) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    throw new TypeError('at least one semantic snapshot is required');
  }
  const autonomousPaths = new Set();
  for (let index = 1; index < snapshots.length; index += 1) {
    for (const path of changedPaths(snapshots[index - 1], snapshots[index])) {
      autonomousPaths.add(path);
    }
  }
  return {
    autonomousPaths,
    before: snapshots[snapshots.length - 1],
  };
}

export function causalMutationPaths(before, after, autonomousPaths) {
  return changedPaths(before, after).filter((path) => !autonomousPaths.has(path));
}
