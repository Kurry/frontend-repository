export type Word = {
  id: string;
  takeId: string;
  text: string;
  startSample: number;
  endSample: number;
  confidence: 'clear' | 'masked';
};

export type Take = {
  id: string;
  durationSamples: number;
  words: Word[];
};

function generateDeterministicPCM(seed: number, length: number): Int16Array {
  const result = new Int16Array(length);
  let current = seed;
  for (let i = 0; i < length; i++) {
    current = (current * 1103515245 + 12345) & 0x7fffffff;
    result[i] = (current % 65536) - 32768;
  }
  return result;
}

export const TAKE_A_SAMPLES = generateDeterministicPCM(1, 960000);
export const TAKE_B_SAMPLES = generateDeterministicPCM(2, 960000);
export const TAKE_C_SAMPLES = generateDeterministicPCM(3, 960000);

const takeBWords: Word[] = [];
const takeBText = ['we', 'will', 'meet', 'beside', 'the', 'paper', 'lantern', 'table'];
let currentSample = 160000;
for (let i = 19; i <= 25; i++) {
  const wordText = takeBText[i - 19];
  takeBWords.push({
    id: `WORD-B-${i}`,
    takeId: 'TAKE-B',
    text: wordText,
    startSample: currentSample,
    endSample: currentSample + 6400,
    confidence: 'clear'
  });
  currentSample += 6400;
}

export const FIXTURES = {
  takes: {
    'TAKE-A': { id: 'TAKE-A', durationSamples: 960000, words: [] } as Take,
    'TAKE-B': { id: 'TAKE-B', durationSamples: 960000, words: takeBWords } as Take,
    'TAKE-C': { id: 'TAKE-C', durationSamples: 960000, words: [] } as Take,
  },
  arrays: { 'TAKE-A': TAKE_A_SAMPLES, 'TAKE-B': TAKE_B_SAMPLES, 'TAKE-C': TAKE_C_SAMPLES },
  ROOM_B_02: { start: 704000, end: 720000, length: 16000 }
};
