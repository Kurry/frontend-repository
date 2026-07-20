import React, { useEffect } from 'react';
import {
  $theme, $megaMenuOpen, $eventsManagerOpen, $exportCatalogOpen,
  $events, $leads, $eventsFilter, $eventsSort, $selectedEventIds,
  addEvent, updateEvent, deleteEvents
} from '../store';
import { eventSchema } from '../schemas';
import { buildCatalogJson, buildEventsIcs, buildLeadsJson, copyArtifactText } from '../artifacts';

export default function WebMCP() {
  useEffect(() => {
    // Helper to extract values without reactivity wrappers
    const getStoreValues = () => ({
      theme: $theme.get(),
      events: $events.get(),
      leads: $leads.get()
    });

    const invokeContactForm = (action: string, payload?: unknown) => {
      const detail: any = { action, form: 'contact', payload, result: null };
      document.dispatchEvent(new CustomEvent('webmcp:form', { detail }));
      return detail.result ?? { success: false, error: 'Contact form is unavailable' };
    };

    // We implement window.webmcp_invoke_tool etc.
    (window as any).webmcp_session_info = () => ({ version: "zto-webmcp-v1" });

    (window as any).webmcp_list_tools = () => {
      return [
        { name: "browse_open", description: "Open a destination", parameters: { schema: { properties: { destination: { type: "string" } } } } },
        { name: "browse_set_theme", description: "Set theme", parameters: { schema: { properties: { theme: { type: "string", enum: ["light", "dark"] } } } } },
        {
          name: "browse_apply_filter",
          description: "Apply filter",
          parameters: {
            schema: {
              properties: {
                filter: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["", "upcoming", "featured", "past"] },
                    category: { type: "string", enum: ["", "Summit", "Meetup", "Workshop", "Hackathon", "Webinar"] },
                  },
                },
              },
            },
          },
        },
        { name: "browse_clear_filter", description: "Clear filters", parameters: { schema: {} } },
        { name: "browse_sort", description: "Sort items", parameters: { schema: { properties: { by: { type: "string" }, direction: { type: "string" } } } } },

        { name: "entity_create", description: "Create event", parameters: { schema: { properties: { entity: { type: "object" } } } } },
        { name: "entity_update", description: "Update event", parameters: { schema: { properties: { id: { type: "string" }, entity: { type: "object" } } } } },
        { name: "entity_delete", description: "Delete event", parameters: { schema: { properties: { ids: { type: "array" }, confirm: { type: "boolean" } } } } },
        { name: "entity_select", description: "Select events", parameters: { schema: { properties: { ids: { type: "array" } } } } },
        { name: "entity_toggle", description: "Toggle an event's featured state", parameters: { schema: { properties: { id: { type: "string" } } } } },

        { name: "form_validate", description: "Validate form", parameters: { schema: { properties: { form: { type: "string" }, payload: { type: "object" } } } } },
        { name: "form_submit", description: "Submit form", parameters: { schema: { properties: { form: { type: "string" }, payload: { type: "object" } } } } },
        { name: "form_cancel", description: "Cancel form", parameters: { schema: { properties: { form: { type: "string" } } } } },
        { name: "form_reset", description: "Reset form", parameters: { schema: { properties: { form: { type: "string" } } } } },

        { name: "artifact_export", description: "Export catalog", parameters: { schema: { properties: { format: { type: "string" } } } } },
        { name: "artifact_import", description: "Import catalog", parameters: { schema: { properties: { format: { type: "string" }, payload: { type: "string" } } } } },
        { name: "artifact_copy", description: "Copy artifact", parameters: { schema: { properties: { target: { type: "string" } } } } }
      ];
    };

    (window as any).webmcp_invoke_tool = (toolName: string, args: any = {}) => {
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
          if (args.theme !== 'light' && args.theme !== 'dark') {
            return { success: false, error: "theme must be light or dark" };
          }
          $theme.set(args.theme);
          return { success: true };
        }
        case 'browse_apply_filter': {
          const filter = args.filter;
          if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
            return { success: false, error: "filter must be an object" };
          }
          const statuses = ['', 'upcoming', 'featured', 'past'];
          const categories = ['', 'Summit', 'Meetup', 'Workshop', 'Hackathon', 'Webinar'];
          if (filter.status !== undefined && !statuses.includes(filter.status)) {
            return { success: false, error: "status must be upcoming, featured, past, or empty" };
          }
          if (filter.category !== undefined && !categories.includes(filter.category)) {
            return { success: false, error: "category must be Summit, Meetup, Workshop, Hackathon, Webinar, or empty" };
          }
          const current = $eventsFilter.get();
          $eventsFilter.set({
            status: filter.status ?? current.status,
            category: filter.category ?? current.category,
          });
          return { success: true };
        }
        case 'browse_clear_filter': {
          $eventsFilter.set({ status: '', category: '' });
          return { success: true };
        }
        case 'browse_sort': {
          if (!['date', 'title'].includes(args.by) || !['asc', 'desc'].includes(args.direction)) {
            return { success: false, error: "by must be date or title and direction must be asc or desc" };
          }
          $eventsSort.set({ by: args.by, direction: args.direction });
          return { success: true };
        }

        // --- Entity ---
        case 'entity_create': {
          const parsed = eventSchema.safeParse(args.entity);
          if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors };
          addEvent(parsed.data);
          return { success: true };
        }
        case 'entity_update': {
          const current = $events.get().find(event => event.id === args.id);
          if (!current) return { success: false, error: "Event not found" };
          const parsed = eventSchema.safeParse({ ...current, ...args.entity });
          if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors };
          updateEvent({ ...parsed.data, id: current.id });
          return { success: true };
        }
        case 'entity_delete': {
          if (args.confirm && Array.isArray(args.ids) && args.ids.every((id: unknown) => typeof id === 'string')) {
             deleteEvents(args.ids);
             return { success: true };
          }
          return {
            success: false,
            error: args.confirm ? "ids must be an array of strings" : "Requires confirm=true",
          };
        }
        case 'entity_select': {
          if (!Array.isArray(args.ids) || !args.ids.every((id: unknown) => typeof id === 'string')) {
            return { success: false, error: "ids must be an array of strings" };
          }
          $selectedEventIds.set(args.ids);
          return { success: true };
        }
        case 'entity_toggle': {
          const current = $events.get().find(event => event.id === args.id);
          if (!current) return { success: false, error: "Event not found" };
          const featured = !current.featured;
          updateEvent({
            ...current,
            featured,
            status: featured ? 'featured' : (current.status === 'featured' ? 'upcoming' : current.status),
          });
          return { success: true, featured };
        }

        // --- Form ---
        case 'form_validate': {
          if (args.form !== 'contact') return { success: false, valid: false, error: "Unknown form" };
          return invokeContactForm('validate', args.payload);
        }
        case 'form_submit': {
          if (args.form !== 'contact') return { success: false, error: "Unknown form" };
          return invokeContactForm('submit', args.payload);
        }
        case 'form_cancel': {
          if (args.form !== 'contact') return { success: false, error: "Unknown form" };
          return invokeContactForm('cancel');
        }
        case 'form_reset': {
          if (args.form !== 'contact') return { success: false, error: "Unknown form" };
          return invokeContactForm('reset');
        }

        // --- Artifact ---
        case 'artifact_export': {
           // We do not return raw bytes, just signal UI intent.
           if (args.format === 'json' || args.format === 'ics') {
             $exportCatalogOpen.set(true);
             return { success: true, format: args.format };
           }
           if (args.format === 'leads-json') {
             document.getElementById('session-leads-section')?.scrollIntoView();
             return { success: true, format: args.format };
           }
           return { success: false, error: "Unknown export format" };
        }
        case 'artifact_import': {
           if (args.format === 'declared-catalog') {
              const detail: any = { format: args.format, payload: args.payload, result: null };
              document.dispatchEvent(new CustomEvent('webmcp:catalog-import', { detail }));
              return detail.result ?? { success: false, error: "Catalog import is unavailable" };
           }
           return { success: false };
        }
        case 'artifact_copy': {
           const values = getStoreValues();
           let text: string;
           if (args.target === 'json') {
             $exportCatalogOpen.set(true);
             text = buildCatalogJson(values.events, values.leads, values.theme);
           } else if (args.target === 'ics') {
             $exportCatalogOpen.set(true);
             text = buildEventsIcs(values.events);
           } else if (args.target === 'leads-json') {
             document.getElementById('session-leads-section')?.scrollIntoView();
             text = buildLeadsJson(values.leads, values.theme);
           } else {
             return { success: false, error: "Unknown copy target" };
           }
           return copyArtifactText(text)
             .then(() => ({ success: true, target: args.target }))
             .catch(() => ({ success: false, error: "Clipboard write failed" }));
        }

        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
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
