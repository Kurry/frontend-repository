import { ThemeOptions } from '../store/themeSlice';
import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a #RRGGBB color');
const paletteColorSchema = z.object({
  main: hexColor,
  light: hexColor,
  dark: hexColor,
  contrastText: hexColor,
});
const themeOptionsSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(64, 'name must be 64 characters or fewer'),
  palette: z.object({
    type: z.enum(['light', 'dark'], { message: 'palette.type must be light or dark' }),
    primary: paletteColorSchema,
    secondary: paletteColorSchema,
    error: paletteColorSchema,
    warning: paletteColorSchema,
    info: paletteColorSchema,
    success: paletteColorSchema,
    background: z.object({ default: hexColor, paper: hexColor }).optional(),
    text: z.object({
      primary: hexColor,
      secondary: hexColor,
      disabled: hexColor.optional(),
      hint: hexColor.optional(),
    }).optional(),
    divider: hexColor.optional(),
  }),
  typography: z.object({
    fontFamily: z.string().trim().min(1, 'typography.fontFamily is required'),
    fontSize: z.number().min(8, 'typography.fontSize must be between 8 and 24').max(24, 'typography.fontSize must be between 8 and 24'),
    button: z.object({ textTransform: z.string() }).optional(),
  }),
  shape: z.object({
    borderRadius: z.number().min(0, 'shape.borderRadius must be between 0 and 24').max(24, 'shape.borderRadius must be between 0 and 24'),
  }),
  spacing: z.number().optional(),
});

export function parseImportedTheme(input: unknown): ThemeOptions {
  const parsed = typeof input === 'string' ? JSON.parse(input) : input;
  if (!parsed || typeof parsed !== 'object') throw new Error('payload must be an object');

  const result = themeOptionsSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.join('.');
    throw new Error(path ? `${path}: ${issue.message}` : issue.message);
  }

  const value = result.data;

  return {
    name: value.name,
    palette: value.palette,
    typography: value.typography,
    shape: value.shape,
    spacing: value.spacing,
  } as unknown as ThemeOptions & { name?: string };
}
