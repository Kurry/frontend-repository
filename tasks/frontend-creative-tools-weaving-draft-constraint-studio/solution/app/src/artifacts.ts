import { WeavingDraftProject } from './types';

export function exportSessionJSON(state: WeavingDraftProject): string {
  return JSON.stringify({
    ...state,
    exportedAt: new Date().toISOString()
  }, null, 2);
}

export function exportCSV(state: WeavingDraftProject): string {
  let csv = "type,index,color\n";
  state.warpColors.forEach((color, i) => {
    csv += `warp,${i},${color}\n`;
  });
  state.weftColors.forEach((color, i) => {
    csv += `weft,${i},${color}\n`;
  });
  return csv;
}

export function exportSVG(state: WeavingDraftProject): string {
  const cellSize = 10;
  const width = state.dimensions.ends * cellSize;
  const height = state.dimensions.picks * cellSize;

  let rects = "";
  for (let r = 0; r < state.dimensions.picks; r++) {
    const treadle = state.treadling[r];
    for (let c = 0; c < state.dimensions.ends; c++) {
      const shaft = state.threading[c];
      let color = state.weftColors[r];
      if (treadle !== null && shaft !== null && state.tieUp[treadle][shaft]) {
        color = state.warpColors[c];
      }
      rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" />\n`;
    }
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#eee"/>
    ${rects}
  </svg>`;
}

export function generateWIF(state: WeavingDraftProject): string {
  let wif = "[WIF]\nVersion=1.1\n[CONTENTS]\nWEAVING=true\nTIEUP=true\nCOLOR TABLE=true\n[WEAVING]\nShafts=4\nTreadles=4\n";
  wif += `Ends=${state.dimensions.ends}\nPicks=${state.dimensions.picks}\n`;

  wif += "[THREADING]\n";
  state.threading.forEach((s, i) => { if(s !== null) wif += `${i+1}=${s+1}\n`; });

  wif += "[TREADLING]\n";
  state.treadling.forEach((t, i) => { if(t !== null) wif += `${i+1}=${t+1}\n`; });

  wif += "[TIEUP]\n";
  state.tieUp.forEach((row, t) => {
    row.forEach((v, s) => {
      if(v) wif += `${t+1},${s+1}=1\n`;
    });
  });

  return wif;
}
