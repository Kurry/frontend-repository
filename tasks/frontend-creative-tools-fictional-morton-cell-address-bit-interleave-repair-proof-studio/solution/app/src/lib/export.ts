import JSZip from 'jszip';
import { AppState } from '../store/useStore';
import { decodeCode, decodeCoordinates, calculatePrefixes, getFullCurve, IMMUTABLE_TOKENS, SLOT_ROLES } from './domain';

function generateCsv(data: string[][]): string {
  return data.map(row => row.map(v => `"${v}"`).join(',')).join('\n') + '\n';
}

export async function exportProof(state: AppState): Promise<Blob> {
  const zip = new JSZip();

  const code = decodeCode(state.order);
  const cell = decodeCoordinates(state.order);
  const prefixes = calculatePrefixes(state.order);
  const curve = getFullCurve();

  // 1. manifest.json
  const manifest = {
    schemaVersion: "fictional-morton-proof-manifest/1.0",
    generatedAt: new Date().toISOString(),
    approvalId: state.currentEventId
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2) + '\n');

  // 2. morton-project.json
  const project = {
    version: "1.0",
    order: state.order,
    code,
    cell,
    history: state.history,
    reviews: state.reviews,
    notes: state.notes,
    isApproved: state.isApproved
  };
  zip.file("morton-project.json", JSON.stringify(project, null, 2) + '\n');

  // 3. tokens.csv
  const tokenRows = [
    ["revisionId", "slotIndex", "slotRole", "tokenId", "sourceLane", "significance", "value", "locked", "selected"]
  ];
  state.order.forEach((tId, idx) => {
    const t = IMMUTABLE_TOKENS[tId];
    tokenRows.push([
      state.currentEventId || "draft",
      idx.toString(),
      SLOT_ROLES[idx],
      tId,
      t.sourceLane,
      t.significance.toString(),
      t.value.toString(),
      "false",
      "false"
    ]);
  });
  zip.file("tokens.csv", generateCsv(tokenRows));

  // 4. prefixes.csv
  const prefixRows = [
    ["revisionId", "depth", "prefixBits", "prefixValue", "minCode", "maxCode", "minX", "maxX", "minY", "maxY", "quadrantId", "selected"]
  ];
  prefixes.forEach(p => {
    prefixRows.push([
      state.currentEventId || "draft",
      p.depth.toString(),
      p.prefixBits,
      p.prefixValue.toString(),
      p.minCode.toString(),
      p.maxCode.toString(),
      p.minX.toString(),
      p.maxX.toString(),
      p.minY.toString(),
      p.maxY.toString(),
      p.quadrantId,
      "false"
    ]);
  });
  zip.file("prefixes.csv", generateCsv(prefixRows));

  // 5. cells.csv
  const cellRows = [
    ["revisionId", "code", "codeBits", "x", "y", "isDecoded", "isAnchor", "isPredecessor", "isSuccessor", "path", "selected"]
  ];
  curve.forEach(c => {
    cellRows.push([
      state.currentEventId || "draft",
      c.code.toString(),
      c.code.toString(2).padStart(6, '0'),
      c.x.toString(),
      c.y.toString(),
      c.code === code ? "true" : "false",
      c.x === state.anchor.x && c.y === state.anchor.y ? "true" : "false",
      c.code === code - 1 ? "true" : "false",
      c.code === code + 1 ? "true" : "false",
      "", // simplified path
      "false"
    ]);
  });
  zip.file("cells.csv", generateCsv(cellRows));

  // 6. history.ndjson
  const historyNdjson = state.history.map(e => JSON.stringify(e)).join('\n') + '\n';
  zip.file("history.ndjson", historyNdjson);

  // 7. morton-proof.svg
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><text x="10" y="20">Fictional Morton Cell-Address Bit-Interleave Repair Proof</text></svg>\n`;
  zip.file("morton-proof.svg", svg);

  // 8. address-report.md
  const md = `# Fictional Data Notice\nAddress report for code ${code}.\n`;
  zip.file("address-report.md", md);

  // 9. morton-project.schema.json
  const schema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object"
  };
  zip.file("morton-project.schema.json", JSON.stringify(schema, null, 2) + '\n');

  return zip.generateAsync({ type: "blob" });
}
