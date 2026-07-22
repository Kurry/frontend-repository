export const exportSession = (state) => {
  return {
    schemaVersion: "outcome-forecast-ledger/v1",
    exportedAt: new Date().toISOString(),
    forecasts: state.forecasts,
    sources: state.sources,
    dependencies: state.dependencies,
    evidenceBindings: state.evidenceBindings,
    reviews: state.reviews
  };
};

export const exportCSV = (state) => {
  let csv = 'id,question,status,probability,resolvedOutcomeId\n';
  state.forecasts.forEach(f => {
    csv += `"${f.id}","${f.question}","${f.status}",${f.probability},"${f.resolvedOutcomeId || ''}"\n`;
  });
  return csv;
};

export const exportSVG = (state) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40">
  <rect width="100" height="40" fill="#f9fafb"/>
  <text x="5" y="10" font-size="5" fill="#374151">Score Report</text>
  <line x1="0" y1="40" x2="100" y2="0" stroke="#ccc" stroke-width="1" stroke-dasharray="2,2"/>
  <circle cx="20" cy="30" r="2" fill="blue"/>
  <circle cx="40" cy="25" r="2" fill="blue"/>
  <circle cx="60" cy="15" r="2" fill="blue"/>
  <circle cx="80" cy="5" r="2" fill="blue"/>
</svg>`;
};
