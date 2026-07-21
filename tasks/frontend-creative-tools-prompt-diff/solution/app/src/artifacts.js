import { computeDiff, counterLabel, stampLabel } from './diff.js';

export function selectedVersions(state, prompt) {
  const selectedIds = state.historySelection[prompt.id] || [];
  if (selectedIds.length >= 2) return prompt.versions.filter((version) => selectedIds.includes(version.versionId));
  return [...prompt.versions];
}

export function buildVersionPackage(state) {
  const prompt = state.prompts.find((item) => item.id === state.selectedPromptId);
  if (!prompt) return null;
  const subset = selectedVersions(state, prompt);
  const ids = new Set(subset.map((version) => version.versionId));
  const versions = subset.map((version) => ({
    versionId: version.versionId,
    versionNumber: version.versionNumber,
    author: version.author,
    timestamp: version.timestamp,
    changeNote: version.changeNote,
    text: version.text,
    kind: version.kind,
    parentIds: version.parentIds.filter((parentId) => ids.has(parentId)),
  }));
  const fallbackBase = versions[0]?.versionId;
  const fallbackCompare = versions[1]?.versionId || fallbackBase;
  const baseVersionId = ids.has(state.baseVersionId) ? state.baseVersionId : fallbackBase;
  const compareVersionId = ids.has(state.compareVersionId) ? state.compareVersionId : fallbackCompare;
  const base = prompt.versions.find((version) => version.versionId === state.baseVersionId);
  const compare = prompt.versions.find((version) => version.versionId === state.compareVersionId);
  const counters = computeDiff(base?.text || '', compare?.text || '', { ignoreWhitespace: state.ignoreWhitespace, ignoreCase: state.ignoreCase }).counters;
  const annotations = (state.annotations[prompt.id] || []).map((annotation) => ({
    annotationId: annotation.annotationId,
    bodyMarkdown: annotation.bodyMarkdown,
    lineStart: annotation.lineStart,
    lineEnd: annotation.lineEnd,
    author: annotation.author,
    resolved: annotation.resolved,
    replies: annotation.replies.map((reply) => ({ bodyMarkdown: reply.bodyMarkdown, author: reply.author })),
  }));
  const activeMerge = state.mergedHeads[prompt.id];
  const merge = activeMerge && ids.has(activeMerge.mergeVersionId) && ids.has(activeMerge.leftBranchVersionId) && ids.has(activeMerge.rightBranchVersionId) ? activeMerge : null;
  return { schemaVersion: 'prompt-diff-package-v1', promptId: prompt.id, promptTitle: prompt.title, versions, baseVersionId, compareVersionId, counters, annotations, merge };
}

export function buildHistoryReport(state) {
  const prompt = state.prompts.find((item) => item.id === state.selectedPromptId);
  if (!prompt) return '';
  const pack = buildVersionPackage(state);
  const stampMode = state.prefs?.stampMode || 'relative';
  const lines = [`# ${prompt.title}`, '', `Version history · ${prompt.versions.length} records`, ''];
  [...prompt.versions].sort((a, b) => b.versionNumber - a.versionNumber).forEach((version, index) => {
    lines.push(`## v${version.versionNumber} · ${version.author}${index === 0 ? ' · Head' : ''}`, '', `- Timestamp: ${stampLabel(version.timestamp, stampMode)}`, `- Kind: ${version.kind}`, `- Change note: ${version.changeNote}`, '');
  });
  lines.push('## Current comparison', '', `- Base: v${prompt.versions.find((version) => version.versionId === pack.baseVersionId)?.versionNumber ?? '—'} · Compare: v${prompt.versions.find((version) => version.versionId === pack.compareVersionId)?.versionNumber ?? '—'}`, `- Lines added: ${counterLabel(pack.counters.linesAdded)}`, `- Lines removed: ${counterLabel(-pack.counters.linesRemoved)}`, `- Net token delta: ${counterLabel(pack.counters.netTokenDelta)}`, '');
  const sessionMerge = state.mergedHeads[prompt.id];
  if (sessionMerge) {
    const mergeVersion = prompt.versions.find((version) => version.versionId === sessionMerge.mergeVersionId);
    lines.push('## Merge resolutions', '', `- Merge head: v${mergeVersion?.versionNumber ?? '—'}${mergeVersion ? ` · ${stampLabel(mergeVersion.timestamp, stampMode)}` : ''}`, '');
    sessionMerge.resolutions.forEach((resolution) => lines.push(`- ${resolution.regionId}: ${resolution.resolution}${resolution.resolution === 'edit-manually' ? ` — ${resolution.manualText}` : ''}`));
    lines.push('');
  }
  return lines.join('\n');
}

export function getMergedText(state) {
  const prompt = state.prompts.find((item) => item.id === state.selectedPromptId);
  const merge = state.mergedHeads[state.selectedPromptId];
  return prompt?.versions.find((version) => version.versionId === merge?.mergeVersionId)?.text || '';
}

export function artifactForTab(state, tab) {
  if (tab === 'package') return JSON.stringify(buildVersionPackage(state), null, 2);
  if (tab === 'merged') return getMergedText(state);
  return buildHistoryReport(state);
}
