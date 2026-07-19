import { getDataSourceById } from '../data/mockData';
import { filterRowsByDateRange, applyJitter, type Pane, type DateRange } from './store';

export function renderPaneContent(pane: Pane): string {
  const ds = getDataSourceById(pane.dataSourceId);
  if (!ds) return '<p class="text-[var(--color-text-secondary)] text-sm">Data source not found</p>';
  
  // This function needs access to current date range, which we'll get from the store
  // For simplicity, we'll compute filtered data here
  // Actually, Svelte components can't easily call reactive state from a module function
  // Let me refactor this approach
  
  return renderPaneInner(pane, ds, '30');
}

function renderPaneInner(pane: Pane, ds: any, dateRange: string): string {
  const rows = filterRowsByDate(ds, pane, dateRange);
  
  if (rows.length === 0) {
    return `<div class="flex items-center justify-center h-full text-sm text-[var(--color-text-secondary)]">No data for this range</div>`;
  }
  
  switch (pane.type) {
    case 'line': return renderLineChart(rows, pane, ds);
    case 'bar': return renderBarChart(rows, pane, ds);
    case 'donut': return renderDonutChart(rows, pane, ds);
    case 'table': return renderDataTable(rows, ds);
    case 'counter': return renderCounter(rows, pane, ds);
    default: return '<p>Unknown pane type</p>';
  }
}

function filterRowsByDate(ds: any, pane: Pane, dateRange: string): any[] {
  const days = parseInt(dateRange);
  if (!ds.dateColumn) return ds.rows;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return ds.rows.filter((row: any) => {
    const d = new Date(row[ds.dateColumn]);
    return d >= cutoff;
  });
}

function renderLineChart(rows: any[], pane: Pane, ds: any): string {
  const metric = pane.metric;
  const dimension = pane.dimension || ds.dateColumn;
  
  // Group by dimension
  const groups = new Map<string, number>();
  for (const row of rows) {
    const key = String(row[dimension] || 'N/A');
    groups.set(key, (groups.get(key) || 0) + Number(row[metric] || 0));
  }
  
  // Sort by key
  const sorted = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  if (sorted.length === 0) {
    return `<div class="flex items-center justify-center h-full text-sm text-[var(--color-text-secondary)]">No data for this range</div>`;
  }
  
  const width = 300;
  const height = 140;
  const padding = 30;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  
  const values = sorted.map(e => applyJitter(e[1], pane.refreshTick));
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;
  
  const points = sorted.map((entry, i) => {
    const x = padding + (i / Math.max(sorted.length - 1, 1)) * chartW;
    const y = padding + chartH - ((applyJitter(entry[1], pane.refreshTick) - minVal) / range) * chartH;
    return `${x},${y}`;
  });
  
  const pathD = points.length > 1 
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p}`).join(' ')
    : points.length === 1 ? `M ${points[0]} L ${points[0]}` : '';
  
  const areaD = points.length > 1
    ? `M ${points[0]} ${points.map(p => `L ${p}`).join(' ')} L ${padding + chartW},${padding + chartH} L ${padding},${padding + chartH} Z`
    : '';
  
  return `
    <svg viewBox="0 0 ${width} ${height}" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg-${pane.id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E8536B" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#E8536B" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      ${areaD ? `<path d="${areaD}" fill="url(#lg-${pane.id})"/>` : ''}
      ${pathD ? `<path d="${pathD}" fill="none" stroke="#E8536B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      ${points.map((p, i) => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3" fill="#E8536B"/>`).join('')}
      <!-- Axis lines -->
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${padding + chartH}" stroke="#E3E6F0" stroke-width="1"/>
      <line x1="${padding}" y1="${padding + chartH}" x2="${padding + chartW}" y2="${padding + chartH}" stroke="#E3E6F0" stroke-width="1"/>
      <!-- Y-axis labels -->
      <text x="${padding - 5}" y="${padding + 4}" text-anchor="end" font-size="10" fill="#677294">${Math.round(maxVal)}</text>
      <text x="${padding - 5}" y="${padding + chartH + 4}" text-anchor="end" font-size="10" fill="#677294">${Math.round(minVal)}</text>
    </svg>`;
}

function renderBarChart(rows: any[], pane: Pane, ds: any): string {
  const metric = pane.metric;
  const dimension = pane.dimension || ds.categoryColumn || 'category';
  
  const groups = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = String(row[dimension] || 'N/A');
    groups.set(key, (groups.get(key) || 0) + Number(row[metric] || 0));
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  
  const sorted = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  
  if (sorted.length === 0) {
    return `<div class="flex items-center justify-center h-full text-sm text-[var(--color-text-secondary)]">No data for this range</div>`;
  }
  
  const width = 300;
  const height = 140;
  const padding = 35;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  
  const maxVal = Math.max(...sorted.map(e => applyJitter(e[1], pane.refreshTick)), 1);
  const barWidth = Math.min(chartW / sorted.length * 0.7, 40);
  const barGap = chartW / sorted.length;
  
  const colors = ['#E8536B', '#051441', '#1ABF68', '#F59E0B', '#8B5CF6', '#06B6D4'];
  
  return `
    <svg viewBox="0 0 ${width} ${height}" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${padding + chartH}" stroke="#E3E6F0" stroke-width="1"/>
      <line x1="${padding}" y1="${padding + chartH}" x2="${padding + chartW}" y2="${padding + chartH}" stroke="#E3E6F0" stroke-width="1"/>
      ${sorted.map((entry, i) => {
        const val = applyJitter(entry[1], pane.refreshTick);
        const barH = (val / maxVal) * chartH;
        const x = padding + i * barGap + (barGap - barWidth) / 2;
        const y = padding + chartH - barH;
        const color = colors[i % colors.length];
        return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="2" fill="${color}"/>
        <text x="${x + barWidth / 2}" y="${padding + chartH + 14}" text-anchor="middle" font-size="9" fill="#677294">${entry[0].substring(0, 6)}</text>`;
      }).join('')}
      <text x="${padding - 5}" y="${padding + 4}" text-anchor="end" font-size="10" fill="#677294">${Math.round(maxVal)}</text>
    </svg>`;
}

function renderDonutChart(rows: any[], pane: Pane, ds: any): string {
  const metric = pane.metric;
  const dimension = pane.dimension || ds.categoryColumn || 'category';
  
  const groups = new Map<string, number>();
  for (const row of rows) {
    const key = String(row[dimension] || 'N/A');
    groups.set(key, (groups.get(key) || 0) + Number(row[metric] || 1));
  }
  
  const entries = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, e) => s + applyJitter(e[1], pane.refreshTick), 0);
  
  if (entries.length === 0) {
    return `<div class="flex items-center justify-center h-full text-sm text-[var(--color-text-secondary)]">No data for this range</div>`;
  }
  
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 55;
  const innerR = 30;
  
  const colors = ['#E8536B', '#051441', '#1ABF68', '#F59E0B', '#8B5CF6', '#06B6D4'];
  
  let paths = '';
  let cumulativeAngle = -Math.PI / 2;
  
  for (let i = 0; i < entries.length; i++) {
    const val = applyJitter(entries[i][1], pane.refreshTick);
    const fraction = total > 0 ? val / total : 1 / entries.length;
    const angle = fraction * 2 * Math.PI;
    
    const largeArc = angle > Math.PI ? 1 : 0;
    
    const x1 = cx + outerR * Math.cos(cumulativeAngle);
    const y1 = cy + outerR * Math.sin(cumulativeAngle);
    const x2 = cx + outerR * Math.cos(cumulativeAngle + angle);
    const y2 = cy + outerR * Math.sin(cumulativeAngle + angle);
    
    const ix1 = cx + innerR * Math.cos(cumulativeAngle);
    const iy1 = cy + innerR * Math.sin(cumulativeAngle);
    const ix2 = cx + innerR * Math.cos(cumulativeAngle + angle);
    const iy2 = cy + innerR * Math.sin(cumulativeAngle + angle);
    
    paths += `<path d="M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z" fill="${colors[i % colors.length]}"/>`;
    
    cumulativeAngle += angle;
  }
  
  // Center text
  const centerText = total > 999999 ? `${(total / 1000000).toFixed(1)}M` : total > 999 ? `${(total / 1000).toFixed(1)}K` : `${Math.round(total)}`;
  
  return `
    <div class="flex items-center gap-3">
      <svg viewBox="0 0 ${size} ${size}" class="w-28 h-28 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
        ${paths}
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="700" fill="var(--color-text-primary)">${centerText}</text>
      </svg>
      <div class="flex flex-col gap-1 text-xs">
        ${entries.slice(0, 5).map((e, i) => `
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${colors[i % colors.length]}"></div>
            <span class="text-[var(--color-text-secondary)] truncate">${e[0]}</span>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function renderDataTable(rows: any[], ds: any): string {
  const columns = ds.columns;
  const displayRows = rows.slice(0, 20);
  
  let headerCells = columns.map((col: string) => 
    `<th class="px-2 py-1.5 text-left text-[11px] font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] whitespace-nowrap">${col}</th>`
  ).join('');
  
  let bodyRows = displayRows.map((row: any) => {
    let cells = columns.map((col: string) => {
      let val = row[col];
      // Status badge formatting
      if (col === 'status' && typeof val === 'string') {
        const colors: Record<string, string> = {
          'Resolved': 'bg-[#1ABF68] text-white',
          'Open': 'bg-[#E8536B] text-white',
          'In Progress': 'bg-[#F59E0B] text-white',
        };
        const cls = colors[val] || 'bg-gray-200 text-gray-700';
        return `<td class="px-2 py-1.5 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap"><span class="px-1.5 py-0.5 rounded-full ${cls}">${val}</span></td>`;
      }
      return `<td class="px-2 py-1.5 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">${val ?? ''}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  
  const showMore = rows.length > 20 ? `<div class="text-xs text-[var(--color-text-secondary)] px-2 py-1">Showing 20 of ${rows.length} rows</div>` : '';
  
  return `
    <div class="overflow-auto max-h-full">
      <table class="w-full border-collapse">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
      ${showMore}
    </div>`;
}

function renderCounter(rows: any[], pane: Pane, ds: any): string {
  const metric = pane.metric;
  
  let total = 0;
  let count = 0;
  for (const row of rows) {
    const val = Number(row[metric]);
    if (!isNaN(val)) {
      total += val;
      count++;
    }
  }
  
  const result = applyJitter(total, pane.refreshTick);
  const formatted = result > 999999 ? `${(result / 1000000).toFixed(1)}M` : result > 999 ? `${(result / 1000).toFixed(1)}K` : result.toLocaleString();
  
  const avg = count > 0 ? applyJitter(total / count, pane.refreshTick) : 0;
  const avgFormatted = avg > 999999 ? `${(avg / 1000000).toFixed(1)}M` : avg > 999 ? `${(avg / 1000).toFixed(1)}K` : Math.round(avg).toLocaleString();
  
  return `
    <div class="flex flex-col items-center justify-center h-full">
      <div class="text-[30px] font-bold text-[var(--color-text-primary)] leading-tight">${formatted}</div>
      <div class="text-xs text-[var(--color-text-secondary)] mt-1">Total ${metric}</div>
      <div class="text-sm text-[var(--color-text-secondary)] mt-1">Avg: ${avgFormatted}</div>
      <div class="text-xs text-[var(--color-text-secondary)] mt-0.5">from ${rows.length} rows</div>
    </div>`;
}
