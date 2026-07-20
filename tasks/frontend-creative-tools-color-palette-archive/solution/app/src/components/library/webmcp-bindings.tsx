import { component$, useTask$, useContext, noSerialize, $ } from '@builder.io/qwik';
import { GlobalStoreContext } from '../../store';
import { isBrowser } from '@builder.io/qwik/build';
import { generateId } from '../../utils/colors';
import type { Palette } from '../../store/types';

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
           description: "Export library",
           inputSchema: {
              type: "object",
              properties: {
                 format: { type: "string", enum: ["css", "utility-theme", "scss", "json"] }
              },
              required: ["format"]
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
         case 'browse_open':
            if (args.destination === 'palette-detail' && args.entity_id) {
               store.selectionId = args.entity_id;
            }
            return { success: true };
         case 'browse_apply_filter':
            if (args.filter === 'period') store.periodFilter = args.value;
            return { success: true };
         case 'browse_clear_filter':
            if (args.filter === 'period') store.periodFilter = '';
            return { success: true };
         case 'browse_sort':
            store.nameSort = args.sort;
            return { success: true };
         case 'entity_create':
            if (args.entity === 'palette' && args.fields) {
               const newP: Palette = {
                  id: generateId(),
                  name: args.fields.name || '',
                  artist: args.fields.artist || '',
                  period: args.fields.period || '',
                  swatches: args.fields.swatches || [],
                  favorite: !!args.fields.favorite,
                  tags: args.fields.tags || [],
                  notes: args.fields.notes || '',
                  archived: !!args.fields.archived
               };
               store.palettes = [...store.palettes, newP];
               return { success: true, entity_id: newP.id };
            }
            break;
         case 'entity_select':
            if (args.entity === 'palette') store.selectionId = args.entity_id;
            return { success: true };
         case 'entity_update':
            if (args.entity === 'palette' && args.fields && args.entity_id) {
               store.palettes = store.palettes.map(p => {
                  if (p.id === args.entity_id) {
                     return { ...p, ...args.fields };
                  }
                  return p;
               });
               return { success: true };
            }
            break;
         case 'entity_delete':
            if (args.entity === 'palette' && args.entity_id && args.confirm) {
               store.palettes = store.palettes.filter(p => p.id !== args.entity_id);
               return { success: true };
            }
            break;
         case 'entity_toggle':
            if (args.entity === 'palette' && args.entity_id && args.field === 'favorite') {
               store.palettes = store.palettes.map(p => {
                  if (p.id === args.entity_id) {
                     return { ...p, favorite: !p.favorite };
                  }
                  return p;
               });
               return { success: true };
            }
            break;
         case 'artifact_export':
            // just return the string format
            if (args.format === 'json') {
               return { content: JSON.stringify({ version: "palette-archive.v1", palettes: store.palettes }, null, 2) };
            }
            break;
         case 'artifact_import':
            if (args.mode === 'archive-json' && args.data && args.data.version === 'palette-archive.v1' && Array.isArray(args.data.palettes)) {
               store.palettes = args.data.palettes;
               return { success: true };
            }
            break;
       }
       return { success: false, error: 'Invalid tool invocation or arguments' };
    };
  });

  return null;
});
