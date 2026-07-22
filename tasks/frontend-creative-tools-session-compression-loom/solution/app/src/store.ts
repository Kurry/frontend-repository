import { createStore } from "solid-js/store";

export type Event = {
  id: string;
  phase: number;
  text: string;
  tokens: number;
  protected: boolean;
};

export type Capsule = {
  id: string;
  title: string;
  startId: string;
  endId: string;
  variant: "concise" | "diagnostic";
  includedFacts: string[];
  omittedFacts: string[];
};

export type GlobalState = {
  events: Event[];
  capsules: Capsule[];
  cap: number;
  selectedRange: { start: string; end: string } | null;
  selectedCapsuleId: string | null;
};

export const [state, setState] = createStore<GlobalState>({
  events: [],
  capsules: [],
  cap: 4200,
  selectedRange: null,
  selectedCapsuleId: null,
});
