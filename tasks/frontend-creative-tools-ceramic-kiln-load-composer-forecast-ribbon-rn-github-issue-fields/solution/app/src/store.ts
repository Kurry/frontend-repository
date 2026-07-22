import { createStore } from "solid-js/store";
import type { Piece, Query, HistoryEntry, Artifact } from "./types";
import { ArtifactSchema } from "./types";

export interface AppState {
  pieces: Piece[];
  queries: Query[];
  history: HistoryEntry[];
  activeQueryId: string | null;
  selectedPieceId: string | null;
  forecastRibbonStartCone: number;
  forecastRibbonEndCone: number;
}

const INITIAL_PIECES: Piece[] = [
  { id: "p1", title: "Mug Set A", maker: "Alice", dimensions: "4x4x4", clayBody: "stoneware", glaze: "Celadon", cone: 6, status: "ready" },
  { id: "p2", title: "Vase B", maker: "Bob", dimensions: "8x8x12", clayBody: "porcelain", glaze: "Clear", cone: 10, status: "draft" },
  { id: "p3", title: "Bowl C", maker: "Alice", dimensions: "6x6x3", clayBody: "earthenware", glaze: "Red", cone: 0, status: "conflict" },
  { id: "p4", title: "Plate D", maker: "Charlie", dimensions: "10x10x1", clayBody: "terracotta", glaze: "None", cone: 0, status: "changed" },
  { id: "p5", title: "Sculpture E", maker: "Bob", dimensions: "12x12x20", clayBody: "stoneware", glaze: "Tenmoku", cone: 10, status: "ready" },
];

const INITIAL_QUERIES: Query[] = [
  { id: "q1", name: "All Ready", filter: { status: ["ready"] } },
  { id: "q2", name: "High Fire (Porcelain/Stoneware)", filter: { clayBody: ["porcelain", "stoneware"] } },
];

const getInitialState = (): AppState => ({
  pieces: [...INITIAL_PIECES],
  queries: [...INITIAL_QUERIES],
  history: [
    { timestamp: new Date().toISOString(), action: "Load initialized", details: "Initial seed data loaded" },
  ],
  activeQueryId: null,
  selectedPieceId: null,
  forecastRibbonStartCone: 5,
  forecastRibbonEndCone: 10,
});

export const [state, setState] = createStore<AppState>(getInitialState());

export const addHistory = (action: string, details: string) => {
  setState("history", (h) => [...h, { timestamp: new Date().toISOString(), action, details }]);
};

export const createPiece = (piece: Omit<Piece, "id">) => {
  const id = `p${Date.now()}`;
  setState("pieces", (p) => [...p, { ...piece, id }]);
  addHistory("Created piece", `Piece ${piece.title} created`);
};

export const updatePiece = (id: string, updates: Partial<Piece>) => {
  setState("pieces", (p) => p.id === id, updates);
  addHistory("Updated piece", `Piece ${id} updated`);
};

export const archivePiece = (id: string) => {
  updatePiece(id, { status: "archived" });
  addHistory("Archived piece", `Piece ${id} archived`);
};

export const mergePieces = (primaryId: string, duplicateId: string) => {
  const duplicate = state.pieces.find(p => p.id === duplicateId);
  if (duplicate) {
    archivePiece(duplicateId);
    addHistory("Merged duplicate", `Piece ${duplicate.title} merged into ${primaryId}`);
  }
};

export const addQuery = (name: string, filter: any) => {
  const id = `q${Date.now()}`;
  setState("queries", (q) => [...q, { id, name, filter }]);
  addHistory("Saved query", `Query ${name} saved`);
};

export const selectPiece = (id: string | null) => {
  setState("selectedPieceId", id);
};

export const exportArtifact = (): Artifact => {
  return {
    schemaVersion: "kiln-load-v1",
    exportedAt: new Date().toISOString(),
    pieces: state.pieces,
    queries: state.queries,
    history: state.history,
  };
};

export const importArtifact = (data: unknown) => {
  try {
    const parsed = ArtifactSchema.parse(data);
    setState({
      pieces: parsed.pieces,
      queries: parsed.queries,
      history: parsed.history,
      activeQueryId: null,
      selectedPieceId: null,
    });
    addHistory("Imported artifact", `Loaded from export at ${parsed.exportedAt}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
};
