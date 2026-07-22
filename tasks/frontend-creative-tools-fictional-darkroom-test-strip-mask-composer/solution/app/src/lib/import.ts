import type { AppState } from './store';

export const importZip = async (file: File, store: AppState) => {
  console.log("Importing", file.name);
  store.initFixture(); // Mock reset on import
};
