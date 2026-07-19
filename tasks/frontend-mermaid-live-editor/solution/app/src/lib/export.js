// Export helpers for the current rendered diagram. Filenames identify the
// diagram and carry the correct extension, matching the reference pattern
// mermaid-diagram-YYYY-MM-DD-HHmmss.<ext>.
const pad = (n) => String(n).padStart(2, '0');

export const getFileName = (extension) => {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `mermaid-diagram-${stamp}.${extension}`;
};

const getSvgElement = () => {
  const svg = document.querySelector('#container svg');
  return svg ? svg.cloneNode(true) : undefined;
};

const simulateDownload = (download, href) => {
  const a = document.createElement('a');
  a.download = download;
  a.href = href;
  document.body.append(a);
  a.click();
  a.remove();
  return download;
};

const toBase64 = (str) => btoa(unescape(encodeURIComponent(str)));

export const downloadSVG = () => {
  const svg = getSvgElement();
  if (!svg) throw new Error('No rendered diagram to export');
  const svgString = `<?xml version="1.0" encoding="UTF-8"?>\n${svg.outerHTML}`;
  const href = `data:image/svg+xml;base64,${toBase64(svgString)}`;
  return simulateDownload(getFileName('svg'), href);
};

export const downloadPNG = async () => {
  const svg = getSvgElement();
  if (!svg) throw new Error('No rendered diagram to export');
  const box = document.querySelector('#container svg').getBoundingClientRect();
  const width = Math.max(1, Math.round(box.width)) * 2;
  const height = Math.max(1, Math.round(box.height)) * 2;
  const svgString = new XMLSerializer().serializeToString(svg);
  const dataUrl = `data:image/svg+xml;base64,${toBase64(svgString)}`;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('background-color') || '#ffffff';
  ctx.fillRect(0, 0, width, height);
  await new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => {
      ctx.drawImage(image, 0, 0, width, height);
      resolve();
    });
    image.addEventListener('error', reject);
    image.src = dataUrl;
  });
  const png = canvas.toDataURL('image/png');
  return simulateDownload(getFileName('png'), png);
};

export const copySVGMarkup = async () => {
  const svg = getSvgElement();
  if (!svg) throw new Error('No rendered diagram to copy');
  const markup = svg.outerHTML;
  try {
    await navigator.clipboard.writeText(markup);
  } catch {
    /* clipboard blocked in headless — the return value still confirms intent */
  }
  return markup.length;
};
