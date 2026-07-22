import { YarnColor, ValidationFinding, ThreadingArray, TreadlingArray, TieUpMatrix } from './types';

export function computeFloatValidation(
  drawdown: YarnColor[][],
  warpColors: YarnColor[],
  weftColors: YarnColor[],
  threading: ThreadingArray,
  treadling: TreadlingArray,
  tieUp: TieUpMatrix,
  maxFloat: number = 3
): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const ends = drawdown[0]?.length || 0;
  const picks = drawdown.length;

  if (ends === 0 || picks === 0) return findings;

  // Warp floats (vertical runs of the same warp color)
  for (let c = 0; c < ends; c++) {
    let currentRun = 0;
    let currentColor = warpColors[c];
    let runStart = 0;

    for (let r = 0; r < picks; r++) {
      const cell = drawdown[r][c];
      const isWarp = (cell === currentColor && (treadling[r] !== null && threading[c] !== null && tieUp[treadling[r]!][threading[c]!]));

      if (isWarp) {
        if (currentRun === 0) runStart = r;
        currentRun++;
      } else {
        if (currentRun > maxFloat) {
          findings.push({
            type: "float_warp",
            message: `Warp float of length ${currentRun} at column ${c} (rows ${runStart}-${r-1})`,
            cells: Array.from({length: currentRun}).map((_, i) => ({x: c, y: runStart + i}))
          });
        }
        currentRun = 0;
      }
    }
    if (currentRun > maxFloat) {
      findings.push({
        type: "float_warp",
        message: `Warp float of length ${currentRun} at column ${c} (rows ${runStart}-${picks-1})`,
        cells: Array.from({length: currentRun}).map((_, i) => ({x: c, y: runStart + i}))
      });
    }
  }

  // Weft floats (horizontal runs of the same weft color)
  for (let r = 0; r < picks; r++) {
    let currentRun = 0;
    let currentColor = weftColors[r];
    let runStart = 0;

    for (let c = 0; c < ends; c++) {
      const cell = drawdown[r][c];
      const isWeft = (cell === currentColor && !(treadling[r] !== null && threading[c] !== null && tieUp[treadling[r]!][threading[c]!]));

      if (isWeft) {
        if (currentRun === 0) runStart = c;
        currentRun++;
      } else {
        if (currentRun > maxFloat) {
          findings.push({
            type: "float_weft",
            message: `Weft float of length ${currentRun} at row ${r} (cols ${runStart}-${c-1})`,
            cells: Array.from({length: currentRun}).map((_, i) => ({x: runStart + i, y: r}))
          });
        }
        currentRun = 0;
      }
    }
    if (currentRun > maxFloat) {
      findings.push({
        type: "float_weft",
        message: `Weft float of length ${currentRun} at row ${r} (cols ${runStart}-${ends-1})`,
        cells: Array.from({length: currentRun}).map((_, i) => ({x: runStart + i, y: r}))
      });
    }
  }

  return findings;
}
