import { compileCsv, compileExportDocument, useEvalStore } from './store';

export function getArtifactText(format) {
  return format === 'csv' ? compileCsv() : JSON.stringify(compileExportDocument(), null, 2);
}

export async function copyActiveArtifact() {
  const state = useEvalStore.getState();
  const text = getArtifactText(state.exportTab);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand('copy');
    textArea.remove();
    if (!copied) throw new Error('Clipboard copy was unavailable');
  }
  state.setCopied(true);
  window.setTimeout(() => useEvalStore.getState().setCopied(false), 4200);
  return true;
}

export function downloadArtifact(format) {
  const text = getArtifactText(format);
  const type = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8';
  const filename = format === 'csv' ? 'eval-run-results.csv' : 'eval-run-results.json';
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
