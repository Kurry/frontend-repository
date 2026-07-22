import { sha256 } from 'js-sha256';

export function normalizeText(text: string): string {
  // Normalize to NFC and LF endings. Do not trim internal whitespace.
  return text.normalize('NFC').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function tokenize(text: string): string[] {
  // Retain punctuation as separate tokens. Break at spaces or explicit soft hyphens,
  // but keep the spaces/punctuation so we can reassemble exactly.
  // The PRD says: "retain punctuation as separate tokens; never trim internal whitespace."
  // "Break only at spaces or explicit soft hyphens" (for measurement, but tokenization can be slightly finer as long as we can map them).
  // A simple tokenization that separates words from punctuation and spaces:
  // Using a regex to split on word boundaries or spaces, keeping separators.

  // Here is a regex that matches sequences of non-whitespace non-punctuation,
  // or individual punctuation marks, or sequences of whitespace.
  // We'll define punctuation broadly.

  const tokens = [];
  let currentToken = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Check if whitespace
    if (/\s/.test(char)) {
      if (currentToken) { tokens.push(currentToken); currentToken = ''; }
      tokens.push(char);
    }
    // Check if punctuation (basic set, could be expanded)
    else if (/[.,!?;:"'()\[\]{}—\-_]/.test(char)) {
      if (currentToken) { tokens.push(currentToken); currentToken = ''; }
      tokens.push(char);
    }
    else if (char === '\u00AD') {
      if (currentToken) { tokens.push(currentToken); currentToken = ''; }
      tokens.push(char);
    }
    else {
      currentToken += char;
    }
  }
  if (currentToken) {
    tokens.push(currentToken);
  }

  return tokens;
}

export function generateHash(content: string): string {
  return sha256(content).substring(0, 6); // PRD uses short hashes like 'b95f17'
}

// Token ID generation logic: stable ID from revision + ordinal
export function generateTokenIds(revisionId: string, tokens: string[]): string[] {
  return tokens.map((_, index) => `${revisionId}-t${index}`);
}
