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

export const projectDocumentSchema = z.object({
  cellSize: z.number(),
  tool: toolsEnum,
  swatch: swatchEnum,
  mirror: mirrorEnum,
  vision: visionEnum,
  gridVisible: z.boolean(),
  cells: z.array(z.array(z.string().nullable())),
  boards: z.array(z.object({
    id: z.string(),
    name: z.string().max(40),
    tag: tagsEnum,
    favorite: z.boolean(),
    cells: z.array(z.array(z.string().nullable())),
    cellSize: z.number()
  })),
  versions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    timestamp: z.number(),
    cells: z.array(z.array(z.string().nullable())),
    cellSize: z.number()
  }))
});
