import { z } from 'zod';

export const mermaidConfigSchema = z.object({
  theme: z.enum(['default', 'base', 'dark', 'forest', 'neutral'], {
    errorMap: () => ({ message: 'theme must be default, base, dark, forest, or neutral' })
  })
}).passthrough();

export const mermaidSessionSchema = z.object({
  schemaVersion: z.literal('mermaid-session-v1', {
    errorMap: () => ({ message: 'schemaVersion must be mermaid-session-v1' })
  }),
  code: z.string(),
  config: mermaidConfigSchema,
  appTheme: z.enum(['light', 'dark'], {
    errorMap: () => ({ message: 'appTheme must be light or dark' })
  }),
  activeTab: z.enum(['code', 'config'], {
    errorMap: () => ({ message: 'activeTab must be code or config' })
  }),
  diagramType: z.enum([
    'flowchart', 'class', 'sequence', 'entity-relationship',
    'state', 'mindmap', 'pie', 'gantt'
  ], {
    errorMap: () => ({ message: 'diagramType must be a valid diagram type' })
  })
});
