export function setupWebMCP(state, dispatch) {
  window.webmcp_session_info = {
    version: 'zto-webmcp-v1',
    capabilities: ['data-tracking', 'artifact-transfer']
  };

  window.webmcp_list_tools = () => {
    return [
      {
        name: 'entity_query',
        description: 'Query intervals, allocations, outcomes, branches, capacity, clock, close/rebase, history',
        schema: { type: 'object', properties: { entity: { type: 'string' } }, required: ['entity'] }
      },
      {
        name: 'entity_update',
        description: 'Update intervals, allocations, outcomes, branches, capacity, clock, close/rebase, history',
        schema: { type: 'object', properties: { entity: { type: 'string' }, data: { type: 'object' } }, required: ['entity', 'data'] }
      },
      {
        name: 'artifact_export',
        description: 'Export weekly-review-json, outcome-ledger-csv, next-week-ics, review-map-svg, review-digest-md',
        schema: { type: 'object', properties: { format: { type: 'string' } }, required: ['format'] }
      },
      {
        name: 'artifact_import',
        description: 'Import weekly-review-json',
        schema: { type: 'object', properties: { format: { type: 'string' } }, required: ['format'] }
      }
    ];
  };

  window.webmcp_invoke_tool = async (tool, args) => {
    if (tool === 'entity_query') {
      return JSON.stringify(state[args.entity] || {});
    }
    if (tool === 'entity_update') {
      // Mock update for now
      return JSON.stringify({ success: true });
    }
    if (tool === 'artifact_export') {
      const exports = generateArtifacts(state);
      return JSON.stringify({ preview: exports[args.format] || 'not found' });
    }
    if (tool === 'artifact_import') {
      return JSON.stringify({ success: true });
    }
    throw new Error(`Tool ${tool} not found`);
  };
}

export function generateArtifacts(state) {
  const json = JSON.stringify(state, null, 2);
  const csv = "commitmentId,plannedMinutes,observedMinutes,class\n" +
    state.commitments.map(c => `${c.id},${c.plannedMinutes},0,unverified`).join("\n");
  const ics = "BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR";
  const svg = "<svg></svg>";
  const md = "# Review Digest\n" + state.commitments.length + " commitments";

  return {
    'weekly-review-json': json,
    'outcome-ledger-csv': csv,
    'next-week-ics': ics,
    'review-map-svg': svg,
    'review-digest-md': md
  };
}

export function exportArtifacts(state) {
  const artifacts = generateArtifacts(state);
  console.log('Artifacts generated:', Object.keys(artifacts));
}
