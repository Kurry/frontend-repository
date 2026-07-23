import JSZip from 'jszip';
import type { Plan } from '../store/schema';

export function jsonToCsv(items: any[], columns: string[]): string {
  if (items.length === 0) return columns.join(',') + '\n';
  const rows = items.map(item => {
    return columns.map(col => {
      const val = item[col];
      if (val === null || val === undefined) return '';
      if (Array.isArray(val)) {
        if (col === 'routePoints') return val.map((p: any) => `${p.x}:${p.y}`).join('|');
        return val.join('|');
      }
      return String(val);
    }).join(',');
  });
  return [columns.join(','), ...rows].join('\n');
}

export function generateDeskSvg(plan: Plan): string {
  const width = 1200;
  const height = 720;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  svg += `<defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#e2e8f0"/></pattern></defs>\n`;
  svg += `<rect width="100%" height="100%" fill="url(#grid)" />\n`;

  plan.clips.filter(c => c.status === 'committed').forEach(c => {
    if (c.routePoints && c.routePoints.length > 0) {
      const pts = c.routePoints.map(p => `${p.x},${p.y}`).join(' ');
      const stroke = plan.selection.ids.includes(c.id) ? '#3b82f6' : '#94a3b8';
      const strokeW = plan.selection.ids.includes(c.id) ? 4 : 2;
      svg += `<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round" />\n`;
    }
  });

  plan.tasks.forEach(t => {
    const isCritical = plan.schedule.criticalTaskIds.includes(t.id);
    const stroke = isCritical ? '#f87171' : '#cbd5e1';
    svg += `<g transform="translate(${t.x}, ${t.y})">\n`;
    svg += `  <rect width="180" height="104" fill="#fffbeb" stroke="${stroke}" stroke-width="${isCritical ? 2 : 1}" />\n`;
    svg += `  <text x="8" y="20" font-family="sans-serif" font-size="14" font-weight="bold">${t.label}</text>\n`;
    svg += `  <text x="8" y="40" font-family="sans-serif" font-size="12" fill="#64748b">${t.id}</text>\n`;
    svg += `  <circle cx="-12" cy="52" r="12" fill="white" stroke="#cbd5e1" />\n`;
    svg += `  <circle cx="192" cy="52" r="12" fill="white" stroke="#cbd5e1" />\n`;
    svg += `</g>\n`;
  });

  svg += `</svg>`;
  return svg;
}

export function generateScheduleSvg(plan: Plan): string {
  const width = 400;
  const height = Math.max(300, plan.tasks.length * 40 + 40);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  svg += `<rect width="100%" height="100%" fill="#ffffff" />\n`;

  plan.schedule.intervals.forEach((interval, idx) => {
    const y = 40 + idx * 40;
    const isCritical = interval.critical;
    const fill = isCritical ? '#fef2f2' : '#eff6ff';
    const stroke = isCritical ? '#fecaca' : '#bfdbfe';
    const textFill = isCritical ? '#7f1d1d' : '#1e3a8a';

    svg += `<g transform="translate(10, ${y})">\n`;
    svg += `  <rect width="380" height="30" rx="4" fill="${fill}" stroke="${stroke}" />\n`;
    svg += `  <text x="10" y="20" font-family="sans-serif" font-size="12" fill="${textFill}">${interval.taskId}</text>\n`;
    svg += `  <text x="370" y="20" text-anchor="end" font-family="monospace" font-size="10" fill="#64748b">Slack: ${interval.slackMinutes}</text>\n`;
    svg += `</g>\n`;
  });

  svg += `</svg>`;
  return svg;
}

export function generateProofHtml(_plan: Plan, deskSvg: string, scheduleSvg: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Proof</title>
</head>
<body>
<h1>Proof</h1>
${deskSvg}
${scheduleSvg}
</body>
</html>`;
}

export async function createExportZip(plan: Plan) {
  const zip = new JSZip();
  const generatedAt = new Date().toISOString();
  const exportedPlan = { ...plan, generatedAt, exportedAt: generatedAt };

  const planJsonStr = JSON.stringify(exportedPlan, null, 2);
  zip.file('plan.json', planJsonStr);

  const schemaStr = JSON.stringify({}, null, 2);
  zip.file('plan.schema.json', schemaStr);

  const tasksCsvData = plan.tasks.map(t => ({ taskId: t.id, x: t.x }));
  zip.file('tasks.csv', jsonToCsv(tasksCsvData, ['taskId', 'x']));

  const clipsCsvData = plan.clips.map(c => ({ clipId: c.id }));
  zip.file('clips.csv', jsonToCsv(clipsCsvData, ['clipId']));

  const scheduleCsvData = plan.schedule.intervals.map(i => ({ taskId: i.taskId }));
  zip.file('schedule.csv', jsonToCsv(scheduleCsvData, ['taskId']));

  const deskSvg = generateDeskSvg(plan);
  zip.file('desk-proof.svg', deskSvg);

  const schedSvg = generateScheduleSvg(plan);
  zip.file('schedule-proof.svg', schedSvg);

  zip.file('proof.html', generateProofHtml(plan, deskSvg, schedSvg));
  zip.file('transcript.md', '# Transcript');

  const sha = await (await import('./sha256')).sha256(planJsonStr);
  const manifestObj = { planHash: sha };
  zip.file('manifest.json', JSON.stringify(manifestObj, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'amber-desk-paperclip-plan.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
