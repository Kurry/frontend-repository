import { Token, FORMATS } from '../store/data';

const getCharAdvance = (char: string, fontSize: number): number => {
  if (/\s/.test(char)) return fontSize * 0.25;
  if (/[.,!|iIl1]/.test(char)) return fontSize * 0.3;
  if (/[MWmw]/.test(char)) return fontSize * 0.8;
  return fontSize * 0.5;
};

export const measureToken = (tokenValue: string, fontSize: number): number => {
  let width = 0;
  for (let i = 0; i < tokenValue.length; i++) {
    width += getCharAdvance(tokenValue[i], fontSize);
  }
  return width;
};

export interface LineLayout {
  lineNumber: number;
  tokens: Token[];
  measuredWidth: number;
  availableWidth: number;
  breakReason: 'wrap' | 'hard' | 'eof' | 'overflow';
  status: 'fitting' | 'exact' | 'one-pixel-over' | 'widow';
  widowWordCount?: number;
  offendingToken?: Token;
}

export function computeLayout(tokens: Token[], formatId: string): LineLayout[] {
  const format = FORMATS[formatId];
  if (!format) return [];

  const availableWidth = format.box.width - (format.padding * 2);
  const lines: LineLayout[] = [];

  let currentLineTokens: Token[] = [];
  let currentLineWidth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tokenWidth = measureToken(token.value, format.font.size);

    if (token.value === '\n') {
      lines.push({
        lineNumber: lines.length + 1,
        tokens: currentLineTokens,
        measuredWidth: currentLineWidth,
        availableWidth,
        breakReason: 'hard',
        status: 'fitting'
      });
      currentLineTokens = [];
      currentLineWidth = 0;
      continue;
    }

    if (currentLineWidth + tokenWidth > availableWidth) {
      let breakIndex = -1;
      for (let j = currentLineTokens.length - 1; j >= 0; j--) {
        if (/\s/.test(currentLineTokens[j].value) || currentLineTokens[j].value === '\u00AD') {
          breakIndex = j;
          break;
        }
      }

      if (breakIndex !== -1) {
        const lineTokens = currentLineTokens.slice(0, breakIndex + 1);
        const nextTokens = currentLineTokens.slice(breakIndex + 1);

        let measured = 0;
        lineTokens.forEach(t => measured += measureToken(t.value, format.font.size));

        let status: 'fitting' | 'exact' | 'one-pixel-over' | 'widow' = 'fitting';
        if (measured === availableWidth) status = 'exact';
        else if (measured === availableWidth + 1) status = 'one-pixel-over';

        lines.push({
          lineNumber: lines.length + 1,
          tokens: lineTokens,
          measuredWidth: measured,
          availableWidth,
          breakReason: 'wrap',
          status: status
        });

        currentLineTokens = [...nextTokens, token];
        currentLineWidth = 0;
        currentLineTokens.forEach(t => currentLineWidth += measureToken(t.value, format.font.size));
      } else {
        const diff = (currentLineWidth + tokenWidth) - availableWidth;
        const status = diff === 1 ? 'one-pixel-over' : 'fitting';

        currentLineTokens.push(token);
        currentLineWidth += tokenWidth;

        lines.push({
          lineNumber: lines.length + 1,
          tokens: currentLineTokens,
          measuredWidth: currentLineWidth,
          availableWidth,
          breakReason: 'overflow',
          status: status,
          offendingToken: token
        });
        currentLineTokens = [];
        currentLineWidth = 0;
      }
    } else {
      currentLineTokens.push(token);
      currentLineWidth += tokenWidth;
    }
  }

  if (currentLineTokens.length > 0) {
    let measured = 0;
    currentLineTokens.forEach(t => measured += measureToken(t.value, format.font.size));
    lines.push({
      lineNumber: lines.length + 1,
      tokens: currentLineTokens,
      measuredWidth: measured,
      availableWidth,
      breakReason: 'eof',
      status: measured === availableWidth ? 'exact' : (measured === availableWidth + 1 ? 'one-pixel-over' : 'fitting')
    });
  }

  if (lines.length > 0) {
    const lastLine = lines[lines.length - 1];
    const words = lastLine.tokens.filter(t => /[A-Za-z0-9]/.test(t.value)).length;
    if (words < format.widowMinWords && words > 0) {
      lastLine.status = 'widow';
      lastLine.widowWordCount = words;
    }
  }

  return lines;
}
