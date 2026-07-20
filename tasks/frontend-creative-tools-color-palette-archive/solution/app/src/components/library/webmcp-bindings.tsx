import { component$, useTask$, useContext } from '@builder.io/qwik';
import { GlobalStoreContext } from '../../store';
import { isBrowser } from '@builder.io/qwik/build';
import { generateId } from '../../utils/colors';
import { validatePalette, PERIODS } from '../../utils/validation';
import { buildExportText } from '../../utils/export';
import { saveState } from '../../utils/undo-redo';
import type { ExportFormat, Palette } from '../../store/types';

const VALID_BROWSE_DESTINATIONS = ['archive-grid', 'palette-detail', 'filters', 'export-drawer'];
const VALID_EXPORT_FORMATS: ExportFormat[] = ['css', 'utility-theme', 'scss', 'json'];

export const WebMCPBindings = component$(() => {
  const store = useContext(GlobalStoreContext);

  // We only want to attach these in the browser
  useTask$(({ track }) => {
    track(() => store.palettes.length); // Track something to keep it alive or just run once in browser

    if (!isBrowser) return;

    const w = window as any;

    w.webmcp_session_info = () => {
      return {
        contract_version: "zto-webmcp-v1",
        modules: ["browse-query-v1", "entity-collection-v1", "artifact-transfer-v1"],
        tools: w.webmcp_list_tools().map((t: any) => t.name)
      };
    };

    w.webmcp_list_tools = () => {
      return [
        {
          name: "browse_open",
          description: "Open a destination",
          inputSchema: {
             type: "object",
             properties: {
               destination: { type: "string", enum: ["archive-grid", "palette-detail", "filters", "export-drawer"] },
               entity_id: { type: "string" }
             },
             required: ["destination"]
          }
        },
        {
          name: "browse_apply_filter",
          description: "Apply a filter",
          inputSchema: {
             type: "object",
             properties: {
                filter: { type: "string", enum: ["period"] },
                value: { type: "string" }
             },
             required: ["filter", "value"]
          }
        },
        {
          name: "browse_clear_filter",
          description: "Clear a filter",
          inputSchema: {
             type: "object",
             properties: {
                filter: { type: "string", enum: ["period"] }
             },
             required: ["filter"]
          }
        },
        {
           name: "browse_sort",
           description: "Sort items",
           inputSchema: {
              type: "object",
              properties: {
                 sort: { type: "string", enum: ["name-asc", "name-desc"] }
              },
              required: ["sort"]
           }
        },
        {
           name: "entity_create",
           description: "Create a palette",
           inputSchema: {
              type: "object",
              properties: {
                 entity: { type: "string", enum: ["palette"] },
                 fields: { type: "object" }
              },
              required: ["entity", "fields"]
           }
        },
        {
           name: "entity_select",
           description: "Select a palette",
           inputSchema: {
              type: "object",
              properties: {
                 entity: { type: "string", enum: ["palette"] },
                 entity_id: { type: "string" }
              },
              required: ["entity", "entity_id"]
           }
        },
        {
           name: "entity_update",
           description: "Update a palette",
           inputSchema: {
              type: "object",
              properties: {
                 entity: { type: "string", enum: ["palette"] },
                 entity_id: { type: "string" },
                 fields: { type: "object" }
              },
              required: ["entity", "entity_id", "fields"]
           }
        },
        {
           name: "entity_delete",
           description: "Delete a palette",
           inputSchema: {
              type: "object",
              properties: {
                 entity: { type: "string", enum: ["palette"] },
                 entity_id: { type: "string" },
                 confirm: { type: "boolean" }
              },
              required: ["entity", "entity_id", "confirm"]
           }
        },
        {
           name: "entity_toggle",
           description: "Toggle a field (e.g. favorite)",
           inputSchema: {
              type: "object",
              properties: {
                 entity: { type: "string", enum: ["palette"] },
                 entity_id: { type: "string" },
                 field: { type: "string", enum: ["favorite"] }
              },
              required: ["entity", "entity_id", "field"]
           }
        },
        {
           name: "artifact_export",
           description: "Open the export drawer to the requested format tab",
           inputSchema: {
              type: "object",
              properties: {
                 format: { type: "string", enum: ["css", "utility-theme", "scss", "json"] }
              },
              required: ["format"]
           }
        },
        {
           name: "artifact_copy",
           description: "Copy the export drawer's current (or requested) format preview to the clipboard",
           inputSchema: {
              type: "object",
              properties: {
                 format: { type: "string", enum: ["css", "utility-theme", "scss", "json"] }
              },
              required: []
           }
        },
        {
           name: "artifact_import",
           description: "Import library",
           inputSchema: {
              type: "object",
              properties: {
                 mode: { type: "string", enum: ["archive-json"] },
                 data: { type: "object" }
              },
              required: ["mode", "data"]
           }
        }
      ];
    };

    w.webmcp_invoke_tool = (name: string, args: any) => {
       // Just a simple switch handling exactly what the contract asks
       // using the Qwik store.
       switch (name) {
         case 'browse_open': {
            if (!args || !VALID_BROWSE_DESTINATIONS.includes(args.destination)) {
               return { success: false, error: 'Unknown or invalid destination' };
            }
            if (args.destination === 'palette-detail') {
               if (!args.entity_id || !store.palettes.some(p => p.id === args.entity_id)) {
                  return { success: false, error: 'entity_id is required and must reference an existing palette' };
               }
               store.exportDrawerOpen = false;
               store.selectionId = args.entity_id;
               return { success: true };
            }
            if (args.destination === 'export-drawer') {
               store.selectionId = null;
               store.exportDrawerOpen = true;
               return { success: true };
            }
            if (args.destination === 'archive-grid') {
               store.selectionId = null;
               store.exportDrawerOpen = false;
               store.activeView = 'palette';
               return { success: true };
            }
            // filters
            store.selectionId = null;
            store.exportDrawerOpen = false;
            return { success: true };
         }
         case 'browse_apply_filter': {
            if (args.filter !== 'period') break;
            // The UI select can only choose from the closed period list; mirror
            // that constraint here so MCP can't leave periodFilter set to a
            // value with no matching option, which would hide every item.
            if (!PERIODS.includes(args.value)) {
               return { success: false, error: 'value must be one of the closed period list' };
            }
            store.periodFilter = args.value;
            return { success: true };
         }
         case 'browse_clear_filter':
            if (args.filter === 'period') store.periodFilter = '';
            return { success: true };
         case 'browse_sort': {
            // Mirror the UI select, which can only ever be name-asc/name-desc.
            if (!args || (args.sort !== 'name-asc' && args.sort !== 'name-desc')) {
               return { success: false, error: 'sort must be one of: name-asc, name-desc' };
            }
            store.nameSort = args.sort;
            return { success: true };
         }
         case 'entity_create': {
            if (args.entity !== 'palette' || !args.fields) break;
            const err = validatePalette(args.fields);
            if (err) return { success: false, error: err };
            saveState(store);
            const newP: Palette = {
               id: generateId(),
               name: args.fields.name,
               artist: args.fields.artist,
               period: args.fields.period,
               swatches: [...args.fields.swatches],
               favorite: !!args.fields.favorite,
               tags: args.fields.tags || [],
               notes: args.fields.notes || '',
               archived: !!args.fields.archived
            };
            store.palettes = [...store.palettes, newP];
            return { success: true, entity_id: newP.id };
         }
         case 'entity_select': {
            if (args.entity !== 'palette') break;
            if (!args.entity_id || !store.palettes.some(p => p.id === args.entity_id)) {
               return { success: false, error: 'entity_id is required and must reference an existing palette' };
            }
            store.selectionId = args.entity_id;
            return { success: true };
         }
         case 'entity_update': {
            if (args.entity !== 'palette' || !args.fields || !args.entity_id) break;
            const existing = store.palettes.find(p => p.id === args.entity_id);
            if (!existing) return { success: false, error: 'Palette not found' };
            // Never let an update change which record it is: drop any `id` a
            // caller sneaks into fields so it can't collide this record's id
            // with another palette's.
            const { id: _ignoredId, ...fieldsWithoutId } = args.fields;
            const merged = { ...existing, ...fieldsWithoutId, id: existing.id };
            const err = validatePalette(merged);
            if (err) return { success: false, error: err };
            saveState(store);
            store.palettes = store.palettes.map(p => p.id === args.entity_id ? merged : p);
            return { success: true };
         }
         case 'entity_delete': {
            if (args.entity !== 'palette' || !args.entity_id || !args.confirm) break;
            const exists = store.palettes.some(p => p.id === args.entity_id);
            if (!exists) return { success: false, error: 'Palette not found' };
            saveState(store);
            store.palettes = store.palettes.filter(p => p.id !== args.entity_id);
            // Match the UI delete handler: don't leave selectionId pointing at
            // a record that no longer exists.
            if (store.selectionId === args.entity_id) {
               store.selectionId = null;
            }
            return { success: true };
         }
         case 'entity_toggle': {
            if (args.entity !== 'palette' || !args.entity_id || args.field !== 'favorite') break;
            const exists = store.palettes.some(p => p.id === args.entity_id);
            if (!exists) return { success: false, error: 'Palette not found' };
            saveState(store);
            store.palettes = store.palettes.map(p => {
               if (p.id === args.entity_id) {
                  return { ...p, favorite: !p.favorite };
               }
               return p;
            });
            return { success: true };
         }
         case 'artifact_export': {
            // Mirrors clicking Export then a format tab: opens the drawer,
            // no content is returned inline (content is user-facing only,
            // same as the UI's own export drawer).
            if (!VALID_EXPORT_FORMATS.includes(args?.format)) {
               return { success: false, error: 'Invalid format' };
            }
            store.exportFormat = args.format;
            store.exportDrawerOpen = true;
            return { success: true };
         }
         case 'artifact_copy': {
            // Mirrors the export drawer's Copy button exactly: same text
            // build, same clipboard write, same copy-feedback state.
            if (args && args.format !== undefined) {
               if (!VALID_EXPORT_FORMATS.includes(args.format)) {
                  return { success: false, error: 'Invalid format' };
               }
               store.exportFormat = args.format;
            }
            const text = buildExportText(store.exportFormat, store.palettes);
            navigator.clipboard.writeText(text);
            store.copyFeedback = 'export';
            setTimeout(() => { store.copyFeedback = null; }, 1500);
            return { success: true };
         }
         case 'artifact_import': {
            if (!(args.mode === 'archive-json' && args.data && args.data.version === 'palette-archive.v1' && Array.isArray(args.data.palettes))) {
               break;
            }
            // Validate every incoming palette with the same rules the UI form
            // and entity_create/entity_update enforce, so a malformed import
            // can't silently corrupt the library. Reject the whole import if
            // any palette is invalid.
            for (let i = 0; i < args.data.palettes.length; i++) {
               const err = validatePalette(args.data.palettes[i], { requireId: true });
               if (err) {
                  return { success: false, error: `Invalid palette at index ${i}: ${err}` };
               }
            }
            saveState(store);
            store.palettes = args.data.palettes;
            return { success: true };
         }
       }
       return { success: false, error: 'Invalid tool invocation or arguments' };
    };
  });

  return null;
});
