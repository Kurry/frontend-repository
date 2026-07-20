// In-memory Session-Leads store. This is the SINGLE source of truth shared by
// the visible Session leads panel, the newsletter/contact forms, and the WebMCP
// artifact-transfer tools. No localStorage/sessionStorage — behavioral state is
// in-memory only per the PRD, so a reload resets the log to empty.

export type LeadKind = "newsletter" | "contact";

export interface Lead {
  id: string;
  kind: LeadKind;
  submittedAt: string; // ISO-8601, ends in Z
  payload: Record<string, unknown>;
}

type Listener = (leads: Lead[]) => void;

interface LeadsApi {
  leads: Lead[];
  add(kind: LeadKind, payload: Record<string, unknown>): Lead;
  undo(): Lead | null;
  importDoc(doc: unknown): { ok: boolean; error?: string };
  buildExport(): Record<string, unknown>;
  exportText(): string;
  counts(): { total: number; newsletter: number; contact: number };
  subscribe(fn: Listener): () => void;
}

const PRODUCT = "Astra Network";

function currentTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function makeId(): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `lead_${Date.now().toString(36)}_${rnd}`;
}

function createStore(): LeadsApi {
  // Newest-first: index 0 is the most recent lead.
  const leads: Lead[] = [];
  const listeners = new Set<Listener>();

  const emit = () => listeners.forEach((fn) => fn(leads));

  const counts = () => ({
    total: leads.length,
    newsletter: leads.filter((l) => l.kind === "newsletter").length,
    contact: leads.filter((l) => l.kind === "contact").length,
  });

  const buildExport = () => {
    const c = counts();
    return {
      schemaVersion: 1,
      version: 1,
      product: PRODUCT,
      theme: currentTheme(),
      counts: c,
      // Each lead entry carries the structured { id, kind, submittedAt, payload }
      // shape AND the flat request-body fields, so both contracts are honored.
      leads: leads.map((l) => ({
        id: l.id,
        kind: l.kind,
        submittedAt: l.submittedAt,
        ...l.payload,
        payload: { ...l.payload },
      })),
      generatedAt: new Date().toISOString(),
    };
  };

  const api: LeadsApi = {
    leads,
    add(kind, payload) {
      const lead: Lead = {
        id: makeId(),
        kind,
        submittedAt: new Date().toISOString(),
        payload: { ...payload },
      };
      leads.unshift(lead);
      emit();
      return lead;
    },
    undo() {
      if (leads.length === 0) return null;
      const removed = leads.shift() || null;
      emit();
      return removed;
    },
    importDoc(doc) {
      try {
        const obj = typeof doc === "string" ? JSON.parse(doc) : doc;
        if (!obj || typeof obj !== "object") return { ok: false, error: "not an object" };
        const arr = (obj as Record<string, unknown>).leads;
        if (!Array.isArray(arr)) return { ok: false, error: "leads must be an array" };
        const next: Lead[] = [];
        for (const raw of arr) {
          if (!raw || typeof raw !== "object") return { ok: false, error: "invalid lead entry" };
          const r = raw as Record<string, unknown>;
          const kind = r.kind;
          if (kind !== "newsletter" && kind !== "contact") {
            return { ok: false, error: "lead kind must be newsletter or contact" };
          }
          const payload =
            r.payload && typeof r.payload === "object"
              ? (r.payload as Record<string, unknown>)
              : Object.fromEntries(
                  Object.entries(r).filter(([k]) => !["id", "kind", "submittedAt", "payload"].includes(k)),
                );
          next.push({
            id: typeof r.id === "string" && r.id ? r.id : makeId(),
            kind,
            submittedAt: typeof r.submittedAt === "string" ? r.submittedAt : new Date().toISOString(),
            payload,
          });
        }
        leads.length = 0;
        leads.push(...next);
        emit();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    },
    buildExport,
    exportText() {
      return JSON.stringify(buildExport(), null, 2);
    },
    counts,
    subscribe(fn) {
      listeners.add(fn);
      fn(leads);
      return () => listeners.delete(fn);
    },
  };
  return api;
}

export function initSessionLeads(): LeadsApi {
  const w = window as unknown as Record<string, unknown>;
  if (!w.astraLeads) {
    w.astraLeads = createStore();
  }
  return w.astraLeads as LeadsApi;
}

const store = initSessionLeads();
export default store;
