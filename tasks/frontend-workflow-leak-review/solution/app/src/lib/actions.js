export async function copyExportText(state) {
  const text = state.activeExportText;
  if (!state.exportOpen) state.openExport();
  try {
    await navigator.clipboard.writeText(text);
    state.showToast(`${state.exportFormat === 'review-report-json' ? 'Review report JSON' : 'Summary text'} copied to clipboard.`);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (copied) {
      state.showToast(`${state.exportFormat === 'review-report-json' ? 'Review report JSON' : 'Summary text'} copied to clipboard.`);
      return true;
    }
    state.showToast('Clipboard access was unavailable. Select the preview text to copy it.', 'error');
    return false;
  }
}

export function openImportPicker(state) {
  state.openExport('review-report-json');
  requestAnimationFrame(() => document.getElementById('report-import')?.click());
}

export function decorateAccessibleIcons(root = document) {
  root.querySelectorAll('svg[role="img"]:not([aria-label]):not([aria-hidden="true"])').forEach((svg) => {
    svg.setAttribute('aria-hidden', 'true');
  });
}

export function installIconAccessibilityObserver() {
  decorateAccessibleIcons();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          decorateAccessibleIcons(node);
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

export function trapFocus(event, container) {
  if (!container || event.key !== 'Tab') return;
  const focusable = [...container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
