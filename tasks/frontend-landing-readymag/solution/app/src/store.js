import { map } from 'nanostores';

export const defaultBriefState = {
    product: "Canvasly",
    name: "",
    email: "",
    plan: undefined,
    team_size: undefined,
    interests: [],
    generated_at: new Date().toISOString()
};

export const appStore = map({
  menuOpen: false,
  solutionsOpen: false,
  slideshowIndex: 0,
  revealed: false,
  artboardScale: 1,
  paletteOpen: false,
  paletteQuery: '',
  trialBrief: defaultBriefState,
  trialBriefUndoStore: [],
  trialBriefRedoStore: [],
});
