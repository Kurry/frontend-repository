const fs = require('fs');
let content = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

const fallbackFunc = `
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error('fallback');
    }
  } catch (err) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    textArea.remove();
  }
}
`;

content = content.replace(/const palette = \['#6558d3'/g, fallbackFunc + '\nconst palette = [\'#6558d3\'');

content = content.replace(
  'try { await navigator.clipboard.writeText(text); } catch(e) {}',
  'await copyToClipboard(text);'
);

content = content.replace(
  'try { await navigator.clipboard.writeText(json); } catch(e) {}',
  'await copyToClipboard(json);'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', content);
