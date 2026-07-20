import { z } from 'zod';

// Closed enums from the instruction's field contracts.
export const MERMAID_THEMES = ['default', 'base', 'dark', 'forest', 'neutral'];
export const APP_THEMES = ['light', 'dark'];
export const EDITOR_TABS = ['code', 'config'];
export const DIAGRAM_TYPES = [
  'flowchart',
  'class',
  'sequence',
  'entity-relationship',
  'state',
  'mindmap',
  'pie',
  'gantt'
];

// Mermaid Config field contract — the shape of a Mermaid initialize payload.
// A single JSON object root with a required `theme` from the closed enum.
// Extra Mermaid initialize options are allowed through (passthrough).
export const mermaidConfigSchema = z
  .object(
    {
      theme: z.enum(MERMAID_THEMES, {
        error: () => 'theme must be one of default, base, dark, forest, or neutral'
      })
    },
    {
      error: () => 'config document must be a single JSON object (not an array or primitive)'
    }
  )
  .passthrough();

// MermaidSession field contract — the session sync / export package shape.
export const mermaidSessionSchema = z.object(
  {
    schemaVersion: z.literal('mermaid-session-v1', {
      error: () => 'schemaVersion must be exactly the string mermaid-session-v1'
    }),
    code: z.string({
      error: () => 'code must be a string holding the Mermaid source document'
    }),
    config: mermaidConfigSchema,
    appTheme: z.enum(APP_THEMES, {
      error: () => 'appTheme must be light or dark'
    }),
    activeTab: z.enum(EDITOR_TABS, {
      error: () => 'activeTab must be code or config'
    }),
    diagramType: z.enum(DIAGRAM_TYPES, {
      error: () =>
        'diagramType must be one of flowchart, class, sequence, entity-relationship, state, mindmap, pie, or gantt'
    })
  },
  {
    error: () => 'session document must be a single JSON object (not an array or primitive)'
  }
);

// Turn a ZodError (zod v4: issues array) into a field-named validation result.
export const formatZodError = (e) => {
  const issue = e?.issues?.[0];
  if (!issue) {
    return { field: 'document', message: e instanceof Error ? e.message : String(e) };
  }
  const field = issue.path && issue.path.length ? issue.path.join('.') : 'document';
  return { field, message: issue.message };
};
