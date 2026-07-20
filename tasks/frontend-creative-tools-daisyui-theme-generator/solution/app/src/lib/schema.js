import { z } from 'zod';

export const radiusValues = ['0rem', '0.25rem', '0.5rem', '1rem', '2rem'];
export const sizeValues = ['xs', 'sm', 'md', 'lg', 'xl'];
export const borderValues = ['0.5px', '1px', '1.5px', '2px'];
export const fontFamilies = ['Outfit', 'system-ui', 'monospace', 'serif'];

export const colorKeys = [
  'base-100', 'base-200', 'base-300', 'base-content',
  'primary', 'primary-content', 'secondary', 'secondary-content',
  'accent', 'accent-content', 'neutral', 'neutral-content',
  'info', 'info-content', 'success', 'success-content',
  'warning', 'warning-content', 'error', 'error-content',
];

export const cssVar = (key) => `--color-${key}`;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be #RRGGBB');
const colorsShape = Object.fromEntries(colorKeys.map((key) => [key, hexColor]));

/** Display names used in My themes (criteria use Title Case with spaces). */
export const nameSchema = z.string()
  .trim()
  .min(2, 'must contain at least 2 characters')
  .max(32, 'must contain no more than 32 characters')
  .regex(/^[A-Za-z][A-Za-z0-9 _-]*$/, 'must start with a letter and use letters, numbers, spaces, _ or -');

export const themeSchema = z.object({
  name: nameSchema,
  colors: z.object(colorsShape),
  radius: z.object({
    box: z.enum(radiusValues),
    field: z.enum(radiusValues),
    selector: z.enum(radiusValues),
  }),
  size: z.object({
    field: z.enum(sizeValues),
    selector: z.enum(sizeValues),
  }),
  border: z.enum(borderValues),
  depth: z.union([z.literal(0), z.literal(1)]),
  noise: z.union([z.literal(0), z.literal(1)]),
  fontFamily: z.enum(fontFamilies),
  options: z.object({
    defaultTheme: z.boolean(),
    defaultDarkTheme: z.boolean(),
    darkColorScheme: z.boolean(),
  }),
  generatedAt: z.string().datetime({ offset: false }),
});

export const importSchema = z.object({
  payload: z.string().min(1, 'Import theme JSON is required'),
});
