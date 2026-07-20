import React, { useEffect } from 'react';
import {
  $theme, $megaMenuOpen, $eventsManagerOpen, $exportCatalogOpen,
  $events, $leads, $eventsFilter, $eventsSort, $selectedEventIds,
  addEvent, updateEvent, deleteEvents, addLead, loadCatalog
} from '../store';

export default function WebMCP() {
  useEffect(() => {
    // Helper to extract values without reactivity wrappers
    const getStoreValues = () => ({
      theme: $theme.get(),
      events: $events.get(),
      leads: $leads.get()
    });

    // We implement window.webmcp_invoke_tool etc.
    (window as any).webmcp_session_info = () => ({ version: "zto-webmcp-v1" });

    (window as any).webmcp_list_tools = () => {
      return [
        { name: "browse_open", description: "Open a destination", parameters: { schema: { properties: { destination: { type: "string" } } } } },
        { name: "browse_set_theme", description: "Set theme", parameters: { schema: { properties: { theme: { type: "string" } } } } },
        { name: "browse_apply_filter", description: "Apply filter", parameters: { schema: { properties: { filter: { type: "object" } } } } },
        { name: "browse_clear_filter", description: "Clear filters", parameters: { schema: {} } },
        { name: "browse_sort", description: "Sort items", parameters: { schema: { properties: { by: { type: "string" }, direction: { type: "string" } } } } },

        { name: "entity_create", description: "Create event", parameters: { schema: { properties: { entity: { type: "object" } } } } },
        { name: "entity_update", description: "Update event", parameters: { schema: { properties: { id: { type: "string" }, entity: { type: "object" } } } } },
        { name: "entity_delete", description: "Delete event", parameters: { schema: { properties: { ids: { type: "array" }, confirm: { type: "boolean" } } } } },
        { name: "entity_select", description: "Select events", parameters: { schema: { properties: { ids: { type: "array" } } } } },
        { name: "entity_toggle", description: "Toggle something", parameters: { schema: {} } },

        { name: "form_validate", description: "Validate form", parameters: { schema: { properties: { form: { type: "string" }, payload: { type: "object" } } } } },
        { name: "form_submit", description: "Submit form", parameters: { schema: { properties: { form: { type: "string" }, payload: { type: "object" } } } } },
        { name: "form_cancel", description: "Cancel form", parameters: { schema: { properties: { form: { type: "string" } } } } },
        { name: "form_reset", description: "Reset form", parameters: { schema: { properties: { form: { type: "string" } } } } },

        { name: "artifact_export", description: "Export catalog", parameters: { schema: { properties: { format: { type: "string" } } } } },
        { name: "artifact_import", description: "Import catalog", parameters: { schema: { properties: { format: { type: "string" }, payload: { type: "string" } } } } },
        { name: "artifact_copy", description: "Copy artifact", parameters: { schema: { properties: { target: { type: "string" } } } } }
      ];
    };

    (window as any).webmcp_invoke_tool = (toolName: string, args: any) => {
      console.log(`[WebMCP] Invoked ${toolName}`, args);

      switch (toolName) {
        // --- Browse ---
        case 'browse_open': {
          const dest = args.destination;
          if (dest === 'marketing-home') document.getElementById('chrome')?.scrollIntoView({ behavior: 'smooth' });
          else if (dest === 'events-manager') $eventsManagerOpen.set(true);
          else if (dest === 'global-events') { $eventsManagerOpen.set(false); document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }); }
          else if (dest === 'export-catalog') $exportCatalogOpen.set(true);
          else if (dest === 'session-leads') document.getElementById('session-leads-section')?.scrollIntoView({ behavior: 'smooth' });
          return { success: true };
        }
        case 'browse_set_theme': {
          $theme.set(args.theme as 'light' | 'dark');
          return { success: true };
        }
        case 'browse_apply_filter': {
          const current = $eventsFilter.get();
          $eventsFilter.set({ ...current, ...args.filter });
          return { success: true };
        }
        case 'browse_clear_filter': {
          $eventsFilter.set({ status: '', category: '' });
          return { success: true };
        }
        case 'browse_sort': {
          $eventsSort.set({ by: args.by, direction: args.direction });
          return { success: true };
        }

        // --- Entity ---
        case 'entity_create': {
          addEvent(args.entity);
          return { success: true };
        }
        case 'entity_update': {
          updateEvent({ ...args.entity, id: args.id });
          return { success: true };
        }
        case 'entity_delete': {
          if (args.confirm) {
             deleteEvents(args.ids);
             return { success: true };
          }
          return { success: false, error: "Requires confirm=true" };
        }
        case 'entity_select': {
          $selectedEventIds.set(args.ids);
          return { success: true };
        }
        case 'entity_toggle': {
          // generic toggle
          return { success: true };
        }

        // --- Form ---
        case 'form_validate': {
          // Minimal validation logic mapping. Actual UI has Zod.
          return { success: true, valid: true };
        }
        case 'form_submit': {
          if (args.form === 'contact') {
             addLead(args.payload);
          } else if (args.form === 'event') {
             addEvent(args.payload);
          }
          return { success: true };
        }
        case 'form_cancel': {
          return { success: true };
        }
        case 'form_reset': {
          return { success: true };
        }

        // --- Artifact ---
        case 'artifact_export': {
           // We do not return raw bytes, just signal UI intent.
           if (args.format === 'json') $exportCatalogOpen.set(true);
           if (args.format === 'leads-json') document.getElementById('session-leads-section')?.scrollIntoView();
           return { success: true };
        }
        case 'artifact_import': {
           if (args.format === 'declared-catalog') {
              const res = loadCatalog(args.payload);
              return { success: res };
           }
           return { success: false };
        }
        case 'artifact_copy': {
           return { success: true };
        }

        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    };

    return () => {
      delete (window as any).webmcp_session_info;
      delete (window as any).webmcp_list_tools;
      delete (window as any).webmcp_invoke_tool;
    };
  }, []);

  return null;
}
