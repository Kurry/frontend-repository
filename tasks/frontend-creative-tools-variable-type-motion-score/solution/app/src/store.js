import { createStore } from 'solid-js/store';

const initialBlocks = [
  { id: 'b1', content: 'VARIABLE', role: 'primary', align: 'center', baseWght: 900, baseWdth: 125, baseSlnt: 0, baseOpsz: 72, x: 500000, y: 300000, maxLines: 1 },
  { id: 'b2', content: 'TYPE', role: 'supporting', align: 'center', baseWght: 700, baseWdth: 100, baseSlnt: 0, baseOpsz: 72, x: 500000, y: 500000, maxLines: 1 },
  { id: 'b3', content: 'MOTION', role: 'supporting', align: 'center', baseWght: 400, baseWdth: 100, baseSlnt: 0, baseOpsz: 72, x: 500000, y: 700000, maxLines: 1 },
  { id: 'b4', content: 'SCORE', role: 'supporting', align: 'center', baseWght: 200, baseWdth: 75, baseSlnt: 0, baseOpsz: 10, x: 500000, y: 900000, maxLines: 1 }
];

export const [store, setStore] = createStore({
  blocks: initialBlocks,
  keyframes: [],
  viewports: { active: 1440, options: [1440, 768, 375] },
  playback: { frame: 0, playing: false, fps: 24, duration: 288 },
  beats: [],
  branches: [{ id: 'main', name: 'main', head: true }],
  activeMode: 'full-motion',
  ui: { selectedBlock: null, selectedKeyframe: null }
});

export const updateBlock = (id, props) => {
  setStore('blocks', (b) => b.id === id, props);
};

export const addKeyframe = (kf) => {
  setStore('keyframes', (kfs) => [...kfs, kf]);
};
