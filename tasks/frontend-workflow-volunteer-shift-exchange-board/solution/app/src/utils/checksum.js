export function computeRosterChecksum(rosterState) {
  const data = JSON.stringify({
    shifts: rosterState.shifts,
    ownership: rosterState.ownership
  });

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
