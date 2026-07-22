export type TokenId = 'X2' | 'Y2' | 'X1' | 'Y1' | 'X0' | 'Y0';
export type SlotRole = 'x2' | 'y2' | 'x1' | 'y1' | 'x0' | 'y0';

export interface Token {
  id: TokenId;
  sourceLane: 'x' | 'y';
  significance: number;
  value: 0 | 1;
}

export const IMMUTABLE_TOKENS: Record<TokenId, Token> = {
  X2: { id: 'X2', sourceLane: 'x', significance: 2, value: 1 },
  Y2: { id: 'Y2', sourceLane: 'y', significance: 2, value: 0 },
  X1: { id: 'X1', sourceLane: 'x', significance: 1, value: 0 },
  Y1: { id: 'Y1', sourceLane: 'y', significance: 1, value: 1 },
  X0: { id: 'X0', sourceLane: 'x', significance: 0, value: 1 },
  Y0: { id: 'Y0', sourceLane: 'y', significance: 0, value: 1 },
};

export const INITIAL_ORDER: TokenId[] = ['X2', 'Y2', 'Y1', 'X1', 'X0', 'Y0'];
export const PROOF_ORDER: TokenId[] = ['X2', 'Y2', 'X1', 'Y1', 'X0', 'Y0'];

export const SLOT_ROLES: SlotRole[] = ['x2', 'y2', 'x1', 'y1', 'x0', 'y0'];

export function decodeCode(order: TokenId[]): number {
  return order.reduce((acc, tokenId, i) => {
    return acc | (IMMUTABLE_TOKENS[tokenId].value << (5 - i));
  }, 0);
}

export function decodeCoordinates(order: TokenId[]): { x: number; y: number } {
  let x = 0;
  let y = 0;
  // slots are 0: x2, 1: y2, 2: x1, 3: y1, 4: x0, 5: y0
  x = (IMMUTABLE_TOKENS[order[0]].value << 2) | (IMMUTABLE_TOKENS[order[2]].value << 1) | IMMUTABLE_TOKENS[order[4]].value;
  y = (IMMUTABLE_TOKENS[order[1]].value << 2) | (IMMUTABLE_TOKENS[order[3]].value << 1) | IMMUTABLE_TOKENS[order[5]].value;
  return { x, y };
}

export function calculatePrefixes(order: TokenId[]) {
  const code = decodeCode(order);
  const prefixes = [];

  // depth 0
  prefixes.push({
    depth: 0,
    prefixBits: "",
    prefixValue: 0,
    minCode: 0,
    maxCode: 63,
    minX: 0, maxX: 7, minY: 0, maxY: 7,
    quadrantId: "root"
  });

  // depth 1, 2, 3
  const bits = code.toString(2).padStart(6, '0');
  for (let d = 1; d <= 3; d++) {
    const prefixBits = bits.substring(0, d * 2);
    const prefixValue = parseInt(prefixBits, 2);
    const minCode = prefixValue * Math.pow(4, 3 - d);
    const maxCode = (prefixValue + 1) * Math.pow(4, 3 - d) - 1;

    // Deinterleave bounds
    let minX = 0, minY = 0;
    for (let i = 0; i < d; i++) {
      minX |= (parseInt(prefixBits[i * 2], 2) << (2 - i));
      minY |= (parseInt(prefixBits[i * 2 + 1], 2) << (2 - i));
    }
    const boundSize = Math.pow(2, 3 - d);
    const maxX = minX + boundSize - 1;
    const maxY = minY + boundSize - 1;

    let quad = "";
    if (d === 1) quad = ["NW", "SW", "NE", "SE"][parseInt(prefixBits, 2)]; // 00=NW, 01=SW, 10=NE, 11=SE -> actually y is down, so 00=NW, 01=SW(y=1,x=0->wait, pair xy), if xy: 00=NW, 10=NE, 01=SW, 11=SE
    else {
        const lastPair = prefixBits.substring(prefixBits.length - 2);
        quad = lastPair === "00" ? "NW" : lastPair === "10" ? "NE" : lastPair === "01" ? "SW" : "SE";
    }

    prefixes.push({
      depth: d,
      prefixBits,
      prefixValue,
      minCode,
      maxCode,
      minX, maxX, minY, maxY,
      quadrantId: quad
    });
  }

  return prefixes;
}

export function getFullCurve(): { code: number, x: number, y: number }[] {
  const curve = [];
  for (let code = 0; code <= 63; code++) {
    const bits = code.toString(2).padStart(6, '0');
    const x = (parseInt(bits[0], 2) << 2) | (parseInt(bits[2], 2) << 1) | parseInt(bits[4], 2);
    const y = (parseInt(bits[1], 2) << 2) | (parseInt(bits[3], 2) << 1) | parseInt(bits[5], 2);
    curve.push({ code, x, y });
  }
  return curve;
}
