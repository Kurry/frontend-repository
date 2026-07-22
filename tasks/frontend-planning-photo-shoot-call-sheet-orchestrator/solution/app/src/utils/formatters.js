export function generateICS(state) {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MarketAtFirstLight//CallSheetOrchestrator//EN\n";
  state.shots.filter(s => s.scheduledTime !== null).forEach(shot => {
    ics += "BEGIN:VEVENT\n";
    ics += `SUMMARY:${shot.title}\n`;
    ics += `DESCRIPTION:Duration: ${shot.duration}m\n`;
    ics += "END:VEVENT\n";
  });
  ics += "END:VCALENDAR";
  return ics;
}

export function generateCSV(state) {
  let csv = "Shot ID,Title,Location ID,Scheduled Time,Duration,Status\n";
  state.shots.forEach(s => {
    csv += `${s.id},${s.title},${s.locationId},${s.scheduledTime !== null ? s.scheduledTime : ''},${s.duration},${s.status}\n`;
  });
  return csv;
}

export function generateMarkdown(state) {
  let md = "# Call Sheet: Market at First Light\n\n";
  md += "## Scheduled Shots\n";
  state.shots.filter(s => s.scheduledTime !== null).sort((a,b) => a.scheduledTime - b.scheduledTime).forEach(s => {
    md += `- **${s.title}** (${s.duration}m) at Zone ${s.locationId}\n`;
  });
  md += "\n## Document Gates\n";
  state.releases.forEach(r => {
    md += `- Release ${r.id}: ${r.status}\n`;
  });
  return md;
}

export function generateSVG(state) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><text x="50" y="50">Exported SVG Map</text></svg>`;
}
