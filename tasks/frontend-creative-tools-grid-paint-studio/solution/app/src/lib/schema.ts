import { z } from 'zod';

export const tagsEnum = z.enum(['pattern', 'portrait', 'abstract', 'logo', 'study', 'signal']);
export const toolsEnum = z.enum(['qr', 'color', 'fill', 'erase']);
export const mirrorEnum = z.enum(['off', 'horizontal', 'vertical', 'both']);
export const visionEnum = z.enum(['off', 'protanopia', 'deuteranopia', 'tritanopia']);
export const swatchEnum = z.enum(['#000000', '#ffffff', '#ff0000', '#ffff00', '#00ff00', '#0000ff', '#ff0098']);

export const savedBoardSchema = z.object({
  name: z.string().min(1, "Name is required").max(40, "Name must be 40 characters or less"),
  tag: tagsEnum,
  favorite: z.boolean().default(false),
});

// A cell is blank (null), a flat solid-color fill ({ kind: 'color', color }),
// or a QR-glyph fill ({ kind: 'qr', color }) — matching the shape the app
// actually paints (see Canvas.svelte / qrGlyph.ts), not a flat hex string.
export const cellValueSchema = z.union([
  z.null(),
  z.object({ kind: z.literal('color'), color: z.string().min(1, "color is required") }),
  z.object({ kind: z.literal('qr'), color: z.string().min(1, "color is required") })
]);

export type CellValueParsed = z.infer<typeof cellValueSchema>;

const cellsGridSchema = z.array(z.array(cellValueSchema));

const gridDim = (cellSize: number) => Math.floor(1024 / cellSize);

const cellsMatchCellSize = (cells: CellValueParsed[][], cellSize: number) => {
  const dim = gridDim(cellSize);
  return dim > 0 && cells.length === dim && cells.every(row => row.length === dim);
};

const cellsSizeIssue = (ctx: z.RefinementCtx, path: (string | number)[], cellSize: number) => {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message: `cells must be a ${gridDim(cellSize)}x${gridDim(cellSize)} grid (floor(1024 / cellSize))`
  });
};

export const projectDocumentSchema = z.object({
  cellSize: z.number().int().min(1),
  tool: toolsEnum,
  swatch: swatchEnum,
  mirror: mirrorEnum,
  vision: visionEnum,
  gridVisible: z.boolean(),
  cells: cellsGridSchema,
  boards: z.array(z.object({
    id: z.string(),
    name: z.string().max(40),
    tag: tagsEnum,
    favorite: z.boolean(),
    cells: cellsGridSchema,
    cellSize: z.number().int().min(1)
  })),
  versions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    timestamp: z.number(),
    cells: cellsGridSchema,
    cellSize: z.number().int().min(1)
  }))
}).superRefine((doc, ctx) => {
  if (!cellsMatchCellSize(doc.cells, doc.cellSize)) {
    cellsSizeIssue(ctx, ['cells'], doc.cellSize);
  }
  doc.boards.forEach((board, i) => {
    if (!cellsMatchCellSize(board.cells, board.cellSize)) {
      cellsSizeIssue(ctx, ['boards', i, 'cells'], board.cellSize);
    }
  });
  doc.versions.forEach((version, i) => {
    if (!cellsMatchCellSize(version.cells, version.cellSize)) {
      cellsSizeIssue(ctx, ['versions', i, 'cells'], version.cellSize);
    }
  });
});
