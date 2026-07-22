export const PALETTE = [
  { id: 'red', value: '#ef4444' },
  { id: 'orange', value: '#f97316' },
  { id: 'yellow', value: '#eab308' },
  { id: 'green', value: '#22c55e' },
  { id: 'teal', value: '#14b8a6' },
  { id: 'blue', value: '#3b82f6' },
  { id: 'indigo', value: '#6366f1' },
  { id: 'purple', value: '#a855f7' },
  { id: 'pink', value: '#ec4899' },
  { id: 'rose', value: '#f43f5e' },
];

export const SEED_MOTIFS = [
  { id: 'm1', name: 'Time', colorId: 'red' },
  { id: 'm2', name: 'Nature', colorId: 'green' },
  { id: 'm3', name: 'Memory', colorId: 'blue' },
  { id: 'm4', name: 'Light', colorId: 'yellow' },
  { id: 'm5', name: 'Silence', colorId: 'purple' },
  { id: 'm6', name: 'Change', colorId: 'orange' },
  { id: 'm7', name: 'Journey', colorId: 'teal' },
  { id: 'm8', name: 'Loss', colorId: 'indigo' },
];

export const COLLECTIONS = [
  { id: 'c1', name: 'Collection 1', texts: ['t1', 't2', 't3'] },
  { id: 'c2', name: 'Collection 2', texts: ['t4', 't5', 't6'] },
  { id: 'c3', name: 'Collection 3', texts: ['t7', 't8', 't9'] },
  { id: 'c4', name: 'Collection 4', texts: ['t10', 't11', 't12'] },
];

export const TEXTS = {
  t1: { id: 't1', content: "The silent clock ticks slowly,\nEchoing through empty rooms.", features: { sentiment: 0.2, complexity: 0.3 } },
  t2: { id: 't2', content: "Golden rays pierce the morning mist,\nA new beginning born of light.", features: { sentiment: 0.8, complexity: 0.4 } },
  t3: { id: 't3', content: "Leaves fall gently to the ground,\nNature's tears for passing time.", features: { sentiment: 0.4, complexity: 0.5 } },
  t4: { id: 't4', content: "Footprints wash away in the tide,\nMemories swallowed by the sea.", features: { sentiment: 0.3, complexity: 0.6 } },
  t5: { id: 't5', content: "Shadows dance on ancient walls,\nWhispering tales of forgotten days.", features: { sentiment: 0.5, complexity: 0.7 } },
  t6: { id: 't6', content: "A single spark ignites the dark,\nHope returning from the void.", features: { sentiment: 0.9, complexity: 0.4 } },
  t7: { id: 't7', content: "The silent clock ticks slowly,\nBut now it brings a sense of peace.", features: { sentiment: 0.7, complexity: 0.3 } }, // Repeated phrase
  t8: { id: 't8', content: "Mountains rise above the clouds,\nA journey reaching for the sky.", features: { sentiment: 0.8, complexity: 0.5 } },
  t9: { id: 't9', content: "Shattered glass reflects the sun,\nBroken beauty in the light.", features: { sentiment: 0.6, complexity: 0.6 } },
  t10: { id: 't10', content: "Winter's breath chills the bone,\nSilence wrapping all in white.", features: { sentiment: 0.2, complexity: 0.5 } },
  t11: { id: 't11', content: "Rivers carve through solid rock,\nChange moving at a steady pace.", features: { sentiment: 0.6, complexity: 0.7 } },
  t12: { id: 't12', content: "Stars fade as morning breaks,\nThe journey ends where it began.", features: { sentiment: 0.7, complexity: 0.4 } },
};

// 18 suggested uncommitted spans
export const SUGGESTED_SPANS = [
  { id: 's1', textId: 't1', startOffset: 4, endOffset: 16, text: "silent clock", suggestedMotif: 'm1' },
  { id: 's2', textId: 't2', startOffset: 0, endOffset: 11, text: "Golden rays", suggestedMotif: 'm4' },
  { id: 's3', textId: 't3', startOffset: 33, endOffset: 45, text: "passing time", suggestedMotif: 'm1' },
  { id: 's4', textId: 't4', startOffset: 34, endOffset: 42, text: "Memories", suggestedMotif: 'm3' },
  { id: 's5', textId: 't5', startOffset: 0, endOffset: 7, text: "Shadows", suggestedMotif: 'm4' },
  { id: 's6', textId: 't6', startOffset: 9, endOffset: 14, text: "spark", suggestedMotif: 'm4' },
  { id: 's7', textId: 't7', startOffset: 4, endOffset: 16, text: "silent clock", suggestedMotif: 'm1' },
  { id: 's8', textId: 't8', startOffset: 31, endOffset: 38, text: "journey", suggestedMotif: 'm7' },
  { id: 's9', textId: 't9', startOffset: 0, endOffset: 14, text: "Shattered glass", suggestedMotif: 'm8' },
  { id: 's10', textId: 't10', startOffset: 0, endOffset: 15, text: "Winter's breath", suggestedMotif: 'm2' },
  { id: 's11', textId: 't11', startOffset: 31, endOffset: 37, text: "Change", suggestedMotif: 'm6' },
  { id: 's12', textId: 't12', startOffset: 24, endOffset: 31, text: "journey", suggestedMotif: 'm7' },
];
