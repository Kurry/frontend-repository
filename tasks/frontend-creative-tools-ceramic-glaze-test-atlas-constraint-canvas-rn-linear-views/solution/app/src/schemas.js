import { z } from "zod";

export const COLORS = ["white", "black", "red", "yellow", "green", "blue", "pink"];
export const BRUSH_MODES = ["qr", "color", "erase"];
export const MIRROR_MODES = ["off", "horizontal", "vertical"];
export const SCHEMA_VERSION = "shapeshift-session-v1";
export const BOARD_PIXELS = 640;

export function gridDimensions(cellSize) {
  const side = Math.max(1, Math.floor(BOARD_PIXELS / cellSize));
  return { rows: side, cols: side };
}

export const CellSchema = z.object({
  row: z.number().int().nonnegative(),
  col: z.number().int().nonnegative(),
  kind: z.enum(["blank", "qr", "color"]),
  color: z.enum(COLORS).nullable(),
}).strict().superRefine((cell, ctx) => {
  if (cell.kind === "blank" && cell.color !== null) {
    ctx.addIssue({ code: "custom", path: ["color"], message: "color must be null when kind is blank" });
  }
  if (cell.kind !== "blank" && cell.color === null) {
    ctx.addIssue({ code: "custom", path: ["color"], message: `color is required when kind is ${cell.kind}` });
  }
});

export const BoardSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(40, "name must be 40 characters or fewer"),
  tag: z.string().trim().min(1, "tag is required").max(24, "tag must be 24 characters or fewer"),
  favorite: z.boolean(),
  cells: z.array(CellSchema),
}).strict();

export const FillStatsSchema = z.object({
  painted: z.number().int().nonnegative(),
  qr: z.number().int().nonnegative(),
  colorFilled: z.number().int().nonnegative(),
  blank: z.number().int().nonnegative(),
}).strict();

export const SessionBaseSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION, { error: `schemaVersion must be exactly ${SCHEMA_VERSION}` }),
  cellSize: z.number().int().min(16, "cellSize must be at least 16").max(64, "cellSize must be at most 64"),
  brushMode: z.enum(BRUSH_MODES, { error: "brushMode must be qr, color, or erase" }),
  paletteColor: z.enum(COLORS, { error: "paletteColor is outside the seven-color palette" }),
  gridOverlay: z.boolean(),
  mirrorMode: z.enum(MIRROR_MODES, { error: "mirrorMode must be off, horizontal, or vertical" }),
  fillStats: FillStatsSchema,
  cells: z.array(CellSchema),
  boards: z.array(BoardSchema),
}).strict();

function addCellCollectionIssues(cells, rows, cols, ctx, path, requireFullGrid) {
  if (requireFullGrid && cells.length !== rows * cols) {
    ctx.addIssue({
      code: "custom",
      path,
      message: `cells length must equal ${rows * cols} for this cellSize`,
    });
  }
  const seen = new Set();
  cells.forEach((cell, index) => {
    if (cell.row >= rows || cell.col >= cols) {
      ctx.addIssue({
        code: "custom",
        path: [...path, index, cell.row >= rows ? "row" : "col"],
        message: `cell coordinate must be inside the ${rows} by ${cols} grid`,
      });
    }
    const key = `${cell.row}:${cell.col}`;
    if (seen.has(key)) {
      ctx.addIssue({ code: "custom", path: [...path, index], message: "cell coordinates must be unique" });
    }
    seen.add(key);
  });
}

export const SessionSchema = SessionBaseSchema.superRefine((session, ctx) => {
  const { rows, cols } = gridDimensions(session.cellSize);
  addCellCollectionIssues(session.cells, rows, cols, ctx, ["cells"], true);

  const names = new Set();
  session.boards.forEach((board, index) => {
    if (names.has(board.name)) {
      ctx.addIssue({ code: "custom", path: ["boards", index, "name"], message: "board name must be unique" });
    }
    names.add(board.name);
    addCellCollectionIssues(board.cells, rows, cols, ctx, ["boards", index, "cells"], true);
  });

  const actual = session.cells.reduce((stats, cell) => {
    if (cell.kind === "blank") stats.blank += 1;
    if (cell.kind === "qr") { stats.qr += 1; stats.painted += 1; }
    if (cell.kind === "color") { stats.colorFilled += 1; stats.painted += 1; }
    return stats;
  }, { painted: 0, qr: 0, colorFilled: 0, blank: 0 });

  if (session.fillStats.painted !== session.fillStats.qr + session.fillStats.colorFilled) {
    ctx.addIssue({ code: "custom", path: ["fillStats", "painted"], message: "painted must equal qr plus colorFilled" });
  }
  if (session.fillStats.painted + session.fillStats.blank !== session.cells.length) {
    ctx.addIssue({ code: "custom", path: ["fillStats", "blank"], message: "painted plus blank must equal cells length" });
  }
  for (const key of ["painted", "qr", "colorFilled", "blank"]) {
    if (session.fillStats[key] !== actual[key]) {
      ctx.addIssue({ code: "custom", path: ["fillStats", key], message: `${key} must match the cells array` });
    }
  }
});

export function formatZodError(error) {
  const issue = error?.issues?.[0];
  if (!issue) return "import: the session could not be validated";
  const field = issue.path?.length ? issue.path.join(".") : "import";
  return `${field}: ${issue.message}`;
}

export function boardNameError(value, boards, currentName = null) {
  const name = String(value ?? "").trim();
  if (!name) return "name: enter a board name";
  if (name.length > 40) return "name: use 40 characters or fewer";
  if (boards.some((board) => board.name === name && board.name !== currentName)) {
    return "name: choose a unique board name";
  }
  return "";
}

export function boardTagError(value) {
  const tag = String(value ?? "").trim();
  if (!tag) return "tag: enter a board tag";
  if (tag.length > 24) return "tag: use 24 characters or fewer";
  return "";
}
