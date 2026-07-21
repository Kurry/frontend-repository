import React, { useEffect } from 'react';
import {
  $theme, $eventsManagerOpen, $exportCatalogOpen, $events, $leads,
  $eventsFilter, $eventsSort, $selectedEventIds,
  EVENT_CATEGORIES, EVENT_STATUSES,
  addEvent, updateEvent, deleteEvents, addLead, announce,
  type RidgeEvent, type EventCategory, type EventStatus,
} from '../store';
import { contactSchema, type ContactFormValues } from './ContactForm';

type ToolHandler = (args: Record<string, unknown>) => unknown;
type Tool = { name: string; module: string; description: string; handler: ToolHandler };

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['browse-query-v1', 'form-workflow-v1', 'entity-collection-v1', 'artifact-transfer-v1'];
const DESTINATIONS = ['marketing-home', 'events-manager', 'global-events', 'export-catalog', 'session-leads'] as const;
const ENTITY_FIELDS = ['title', 'date', 'city', 'category', 'status', 'featured'] as const;
const previousNonFeaturedStatuses = new Map<string, Exclude<EventStatus, 'featured'>>();

function stringArg(value: unknown, label: string, max = 200): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > max) {
    throw new Error(`${label} must be a non-empty string of at most ${max} characters`);
  }
  return value;
}

function fieldsArg(value: unknown): Record<string, string> {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('fields must be an object');
  const fields: Record<string, string> = {};
  for (const [key, fieldValue] of Object.entries(value as Record<string, unknown>)) {
    if (typeof fieldValue !== 'string' || fieldValue.length > 200) throw new Error(`${key} must be a string of at most 200 characters`);
    fields[key] = fieldValue;
  }
  return fields;
}

function afterRender(action: () => boolean): Promise<{ success: boolean; error?: string }> {
  return new Promise(resolve => window.requestAnimationFrame(() => {
    const success = action();
    resolve(success ? { success: true } : { success: false, error: 'The visible control is not available' });
  }));
}

function parseFeatured(value: string | undefined): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('featured must be "true" or "false"');
}

function parseEvent(fields: Record<string, string>, base?: RidgeEvent): Omit<RidgeEvent, 'id'> {
  for (const field of Object.keys(fields)) {
    if (!ENTITY_FIELDS.includes(field as (typeof ENTITY_FIELDS)[number])) throw new Error(`Unknown event field: ${field}`);
  }
  const title = fields.title ?? base?.title ?? '';
  const date = fields.date ?? base?.date ?? '';
  const city = fields.city ?? base?.city ?? '';
  const category = (fields.category ?? base?.category ?? '') as EventCategory;
  const status = (fields.status ?? base?.status ?? '') as EventStatus;
  const featured = fields.featured === undefined ? (base?.featured ?? false) : parseFeatured(fields.featured);
  if (title.length < 2) throw new Error('title must contain at least 2 characters');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must use YYYY-MM-DD');
  if (city.length < 2) throw new Error('city must contain at least 2 characters');
  if (!EVENT_CATEGORIES.includes(category)) throw new Error(`category must be one of ${EVENT_CATEGORIES.join(', ')}`);
  if (!EVENT_STATUSES.includes(status)) throw new Error(`status must be one of ${EVENT_STATUSES.join(', ')}`);
  if ((featured && status !== 'featured') || (!featured && status === 'featured')) throw new Error('featured and status must agree');
  return { title, date, city, category, status, featured };
}

function parseContact(fields: Record<string, string>): ContactFormValues {
  const parsed = contactSchema.safeParse({
    name: fields.name ?? '',
    email: fields.email ?? '',
    company: fields.company || undefined,
    interest: fields.interest ?? '',
    privacy_consent: fields.privacy_consent === 'true',
    message: fields.message || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(' '));
  return parsed.data;
}

export default function WebMCP() {
  useEffect(() => {
    const browseOpen = (args: Record<string, unknown>) => {
      const destination = stringArg(args.destination, 'destination', 64) as (typeof DESTINATIONS)[number];
      if (!DESTINATIONS.includes(destination)) return { success: false, error: `Unknown destination: ${destination}` };
      if (destination === 'marketing-home') document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
      if (destination === 'events-manager') $eventsManagerOpen.set(true);
      if (destination === 'global-events') { $eventsManagerOpen.set(false); document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }); }
      if (destination === 'export-catalog') $exportCatalogOpen.set(true);
      if (destination === 'session-leads') document.getElementById('session-leads-section')?.scrollIntoView({ behavior: 'smooth' });
      return { success: true, destination };
    };

    const tools: Tool[] = [
      { name: 'browse.open', module: 'browse-query-v1', description: 'Open a declared marketing destination.', handler: browseOpen },
      { name: 'browse.search', module: 'browse-query-v1', description: 'No visible free-text search surface is present.', handler: args => ({ success: false, query: stringArg(args.query, 'query'), error: 'This application has no visible search surface' }) },
      { name: 'browse.apply_filter', module: 'browse-query-v1', description: 'Apply a declared event filter.', handler: args => {
        const filter = stringArg(args.filter, 'filter', 64);
        if (args.value !== undefined && typeof args.value !== 'string') throw new Error('value must be a string');
        const value = (args.value as string | undefined) ?? '';
        if (value.length > 128) throw new Error('value must be at most 128 characters');
        if (filter === 'status' && value !== '' && !EVENT_STATUSES.includes(value as EventStatus)) return { success: false, error: `Invalid status: ${value}` };
        if (filter === 'category' && value !== '' && !EVENT_CATEGORIES.includes(value as EventCategory)) return { success: false, error: `Invalid category: ${value}` };
        if (filter !== 'status' && filter !== 'category') return { success: false, error: 'filter must be status or category' };
        $eventsFilter.set({ ...$eventsFilter.get(), [filter]: value });
        $eventsManagerOpen.set(true);
        return { success: true, filter, value };
      } },
      { name: 'browse.clear_filter', module: 'browse-query-v1', description: 'Clear one or all event filters.', handler: args => {
        if (args.filter === undefined) $eventsFilter.set({ status: '', category: '' });
        else {
          const filter = stringArg(args.filter, 'filter', 64);
          if (filter !== 'status' && filter !== 'category') return { success: false, error: 'filter must be status or category' };
          $eventsFilter.set({ ...$eventsFilter.get(), [filter]: '' });
        }
        return { success: true };
      } },
      { name: 'browse.sort', module: 'browse-query-v1', description: 'Sort events by date or title.', handler: args => {
        const sort = stringArg(args.sort, 'sort', 64);
        if (sort !== 'date' && sort !== 'title') return { success: false, error: 'sort must be date or title' };
        $eventsSort.set({ by: sort, direction: $eventsSort.get().direction });
        $eventsManagerOpen.set(true);
        return { success: true, sort };
      } },
      { name: 'browse.set_theme', module: 'browse-query-v1', description: 'Set the light or dark theme.', handler: args => {
        if (args.theme !== 'light' && args.theme !== 'dark') return { success: false, error: 'theme must be light or dark' };
        $theme.set(args.theme);
        return { success: true, theme: args.theme };
      } },

      { name: 'entity.create', module: 'entity-collection-v1', description: 'Create a validated event.', handler: args => {
        const event = parseEvent(fieldsArg(args.fields));
        addEvent(event); $eventsManagerOpen.set(true); announce(`Event created: ${event.title}.`);
        return { success: true, count: $events.get().length };
      } },
      { name: 'entity.select', module: 'entity-collection-v1', description: 'Select one event by public id.', handler: args => {
        const id = stringArg(args.id, 'id', 128);
        if (!$events.get().some(event => event.id === id)) return { success: false, error: `Event not found: ${id}` };
        $selectedEventIds.set([id]); $eventsManagerOpen.set(true);
        return { success: true, id };
      } },
      { name: 'entity.update', module: 'entity-collection-v1', description: 'Update declared fields on an event.', handler: args => {
        const id = stringArg(args.id, 'id', 128);
        const current = $events.get().find(event => event.id === id);
        if (!current) return { success: false, error: `Event not found: ${id}` };
        updateEvent({ ...parseEvent(fieldsArg(args.fields), current), id }); $eventsManagerOpen.set(true);
        return { success: true, id };
      } },
      { name: 'entity.delete', module: 'entity-collection-v1', description: 'Delete one explicitly confirmed event.', handler: args => {
        const id = stringArg(args.id, 'id', 128);
        if (args.confirm !== true) return { success: false, error: 'Delete requires confirm=true' };
        if (!$events.get().some(event => event.id === id)) return { success: false, error: `Event not found: ${id}` };
        deleteEvents([id]); $eventsManagerOpen.set(true);
        return { success: true, id, count: $events.get().length };
      } },
      { name: 'entity.toggle', module: 'entity-collection-v1', description: 'Toggle the featured field on an event.', handler: args => {
        const id = stringArg(args.id, 'id', 128);
        if (args.field !== undefined && args.field !== 'featured') return { success: false, error: 'Only featured is toggleable' };
        const current = $events.get().find(event => event.id === id);
        if (!current) return { success: false, error: `Event not found: ${id}` };
        const featured = !current.featured;
        if (featured && current.status !== 'featured') previousNonFeaturedStatuses.set(id, current.status);
        const status = featured ? 'featured' : (previousNonFeaturedStatuses.get(id) ?? 'upcoming');
        if (!featured) previousNonFeaturedStatuses.delete(id);
        updateEvent({ ...current, featured, status }); $eventsManagerOpen.set(true);
        return { success: true, id, field: 'featured', featured };
      } },

      { name: 'form.validate', module: 'form-workflow-v1', description: 'Validate declared contact fields with the visible form schema.', handler: args => {
        parseContact(fieldsArg(args.fields));
        return { success: true, valid: true };
      } },
      { name: 'form.submit', module: 'form-workflow-v1', description: 'Validate and submit a contact lead through the shared store action.', handler: args => {
        const contact = parseContact(fieldsArg(args.fields));
        addLead(contact); announce(`Contact lead captured from ${contact.name}. Session leads total updated.`);
        document.getElementById('session-leads-section')?.scrollIntoView({ behavior: 'smooth' });
        return { success: true, total: $leads.get().length };
      } },
      { name: 'form.cancel', module: 'form-workflow-v1', description: 'Cancel and reset the active contact form.', handler: () => {
        window.dispatchEvent(new Event('ridge:contact-reset'));
        return { success: true };
      } },
      { name: 'form.reset', module: 'form-workflow-v1', description: 'Reset the contact form to its initial state.', handler: () => {
        window.dispatchEvent(new Event('ridge:contact-reset'));
        return { success: true };
      } },

      { name: 'artifact.export', module: 'artifact-transfer-v1', description: 'Trigger a declared visible download without returning artifact contents.', handler: args => {
        const format = stringArg(args.format, 'format', 64);
        if (!['json', 'ics', 'leads-json'].includes(format)) return { success: false, error: 'format must be json, ics, or leads-json' };
        if (format === 'leads-json') document.getElementById('session-leads-section')?.scrollIntoView({ behavior: 'smooth' });
        else $exportCatalogOpen.set(true);
        const label = format === 'json' ? 'Download catalog JSON' : format === 'ics' ? 'Download catalog ICS' : 'Download leads JSON';
        return afterRender(() => { const button = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`); button?.click(); return Boolean(button); })
          .then(result => ({ ...result, operation: 'export', format }));
      } },
      { name: 'artifact.import', module: 'artifact-transfer-v1', description: 'Open the declared catalog import surface without accepting file contents.', handler: args => {
        if (args.mode !== 'declared-catalog') return { success: false, error: 'mode must be declared-catalog' };
        $exportCatalogOpen.set(true);
        return afterRender(() => {
          const button = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(candidate => candidate.textContent?.includes('Load catalog'));
          button?.focus(); return Boolean(button);
        }).then(result => ({ ...result, operation: 'import', mode: 'declared-catalog', completed: false }));
      } },
      { name: 'artifact.copy', module: 'artifact-transfer-v1', description: 'Trigger the visible catalog JSON copy control without returning clipboard contents.', handler: () => {
        $exportCatalogOpen.set(true);
        return afterRender(() => { const button = document.querySelector<HTMLButtonElement>('button[aria-label="Copy catalog JSON"]'); button?.click(); return Boolean(button); })
          .then(result => ({ ...result, operation: 'copy' }));
      } },
    ];

    const invoke = (name: string, args: Record<string, unknown> = {}) => {
      const tool = tools.find(candidate => candidate.name === name);
      if (!tool) return { success: false, error: `Unknown tool: ${name}` };
      try { return tool.handler(args ?? {}); }
      catch (error) { return { success: false, error: error instanceof Error ? error.message : String(error) }; }
    };

    const w = window as any;
    w.webmcp_session_info = () => ({ contract_version: CONTRACT_VERSION, modules: MODULES, tools: tools.map(tool => tool.name) });
    w.webmcp_list_tools = () => tools.map(({ name, module, description }) => ({ name, module, description }));
    w.webmcp_invoke_tool = (name: string, args: Record<string, unknown> = {}) => invoke(name, args);

    try {
      for (const tool of tools) w.navigator?.modelContext?.registerTool?.({ name: tool.name, description: tool.description, invoke: (args: Record<string, unknown>) => invoke(tool.name, args) });
    } catch { /* optional browser API */ }

    return () => {
      delete w.webmcp_session_info;
      delete w.webmcp_list_tools;
      delete w.webmcp_invoke_tool;
    };
  }, []);

  return null;
}
