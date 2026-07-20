import { generateId } from "./colors";
import type { Palette } from "../store/types";

export const seedPalettes: Palette[] = [
  {
    id: generateId(),
    name: "Mona Lisa",
    artist: "Leonardo da Vinci",
    period: "Old Masters",
    swatches: ["#2d3229", "#565c49", "#8e7c65", "#b49870", "#dbcca1"],
    favorite: false,
  },
  {
    id: generateId(),
    name: "Starry Night",
    artist: "Vincent van Gogh",
    period: "Post-Impressionism",
    swatches: ["#1e325c", "#3b5889", "#6b87b5", "#d6d299", "#e8a93a"],
    favorite: true,
  },
  {
    id: generateId(),
    name: "The Scream",
    artist: "Edvard Munch",
    period: "Expressionism",
    swatches: ["#42291c", "#8c4424", "#d66f2c", "#7e909a", "#1a3648"],
    favorite: false,
  },
  {
    id: generateId(),
    name: "Girl with a Pearl Earring",
    artist: "Johannes Vermeer",
    period: "Baroque to Neoclassical",
    swatches: ["#16181b", "#3d4b68", "#9a9776", "#e4cba0", "#fffaf0"],
    favorite: false,
  },
  {
    id: generateId(),
    name: "The Kiss",
    artist: "Gustav Klimt",
    period: "Symbolism",
    swatches: ["#4b3e24", "#867243", "#c5aa68", "#d2a02e", "#e8d9a0"],
    favorite: true,
  },
  {
    id: generateId(),
    name: "Composition with Red, Blue and Yellow",
    artist: "Piet Mondrian",
    period: "Abstract + Geometric",
    swatches: ["#df2a29", "#114c8e", "#e7bd1e", "#eaeaea", "#131313"],
    favorite: false,
  }
];
