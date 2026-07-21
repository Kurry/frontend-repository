// Syntax highlighting for the live Release pack JSON preview. The source is
// HTML-escaped first, then a single token pass wraps keys, strings, numbers,
// and booleans in spans. The copy/download paths use the raw store text, so
// the clipboard payload is never affected by the markup.
export function highlightJson(source) {
  const escaped = String(source)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(
    /("(?:[^"\\]|\\.)*")(\s*:)?|\b(?:true|false)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, str, colon) => {
      if (str) return colon ? `<span class="tok-key">${str}</span>${colon}` : `<span class="tok-str">${str}</span>`
      if (match === 'true' || match === 'false') return `<span class="tok-bool">${match}</span>`
      return `<span class="tok-num">${match}</span>`
    },
  )
}
