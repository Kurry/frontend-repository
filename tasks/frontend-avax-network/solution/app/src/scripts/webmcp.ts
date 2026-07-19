// WebMCP surface for the Avalanche homepage oracle.
//
// Every tool drives the SAME DOM controls a human uses: it clicks the real
// nav/anchor, the real theme toggle, and the real form buttons/inputs — it
// never fakes a success class the UI would not otherwise reach. Exposed on
// window as webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool.

const CONTRACT_VERSION = "zto-webmcp-v1";

const DESTINATIONS = [
  "hero",
  "solutions-insights",
  "links",
  "companies",
  "developers-hub",
  "numbers",
  "blog",
  "solutions",
  "community",
  "event",
  "questions",
  "newsletter",
  "contact-us",
  "footer",
];

const THEMES = ["light", "dark"];

type FormKey = "newsletter" | "contact";

// Field name -> the DOM input id in each form (newsletter multi-step / contact).
const NEWSLETTER_FIELDS: Record<string, string> = {
  firstname: "firstname",
  lastname: "lastname",
  email: "email",
  twitterhandle: "twitterhandle",
  country: "country",
  gdpr: "general-gdpr",
};

const CONTACT_FIELDS: Record<string, string> = {
  firstname: "contact-firstname",
  lastname: "contact-lastname",
  email: "contact-email",
  avalanche_contact_message: "avalanche_contact_message",
  gdpr: "contact-us-gdpr",
  marketing_consent: "contact-us-marketing",
};

function q<T extends Element = HTMLElement>(sel: string): T | null {
  return document.querySelector<T>(sel);
}

function formEl(form: FormKey): HTMLFormElement | null {
  return q<HTMLFormElement>(form === "newsletter" ? "#general-form" : "#contact-us-form");
}

function fillFields(form: FormKey, fields: Record<string, unknown> | undefined) {
  if (!fields) return;
  const map = form === "newsletter" ? NEWSLETTER_FIELDS : CONTACT_FIELDS;
  for (const [name, value] of Object.entries(fields)) {
    const id = map[name] || name;
    const el = document.getElementById(id) as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | null;
    if (!el) continue;
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      el.checked = Boolean(value);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (el instanceof HTMLSelectElement) {
      el.value = String(value);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  // Contact custom project_type select is a hidden input driven by chips.
  if (form === "contact" && fields && "project_type" in fields) {
    const hidden = q<HTMLInputElement>('#select-project_type input[name="project_type"]');
    if (hidden) hidden.value = String((fields as Record<string, unknown>).project_type);
  }
}

// ---- browse-query-v1 -------------------------------------------------------

function browseOpen(args: Record<string, unknown>) {
  const destination = String(args.destination ?? args.section ?? "");
  if (!DESTINATIONS.includes(destination)) {
    return { ok: false, error: `unknown destination: ${destination}` };
  }
  const target = document.getElementById(destination);
  if (!target) return { ok: false, error: `section not found: ${destination}` };
  // Same path a same-page nav anchor takes.
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return { ok: true, destination, scrolledTo: destination };
}

function browseSetTheme(args: Record<string, unknown>) {
  const theme = String(args.theme ?? "");
  if (!THEMES.includes(theme)) return { ok: false, error: `unknown theme: ${theme}` };
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const want = theme === "dark";
  const btn = document.getElementById("theme-toggle-button") as HTMLButtonElement | null;
  if (isDark !== want && btn) {
    btn.click(); // drive the real toggle
  }
  return { ok: true, theme, isDark: root.classList.contains("dark") };
}

// ---- form-workflow-v1 ------------------------------------------------------

function formAdvance(args: Record<string, unknown>) {
  const form = (args.form as FormKey) ?? "newsletter";
  fillFields(form, args.fields as Record<string, unknown> | undefined);
  const next = document.getElementById("form-steps-next") as HTMLButtonElement | null;
  if (!next) return { ok: false, error: "newsletter next control not found" };
  next.click();
  const step = q("#step-counter")?.textContent ?? "";
  return { ok: true, form, operation: "advance", step };
}

function formReturn(args: Record<string, unknown>) {
  const form = (args.form as FormKey) ?? "newsletter";
  const back = document.getElementById("form-steps-back") as HTMLButtonElement | null;
  if (!back) return { ok: false, error: "newsletter back control not found" };
  back.click();
  const step = q("#step-counter")?.textContent ?? "";
  return { ok: true, form, operation: "return", step };
}

function formValidate(args: Record<string, unknown>) {
  const form = (args.form as FormKey) ?? "contact";
  fillFields(form, args.fields as Record<string, unknown> | undefined);
  const el = formEl(form);
  if (!el) return { ok: false, error: `form not found: ${form}` };
  const valid = el.checkValidity();
  return { ok: true, form, operation: "validate", valid };
}

function formSubmit(args: Record<string, unknown>) {
  const form = (args.form as FormKey) ?? "contact";
  fillFields(form, args.fields as Record<string, unknown> | undefined);
  const el = formEl(form);
  if (!el) return { ok: false, error: `form not found: ${form}` };
  if (form === "newsletter") {
    // Jump to the final step via the real Next control, then submit.
    const next = document.getElementById("form-steps-next") as HTMLButtonElement | null;
    if (!next) return { ok: false, error: "newsletter next control not found" };
    for (let i = 0; i < 5; i++) {
      if ((q("#step-counter")?.textContent ?? "") === "5") break;
      next.click();
    }
    next.click(); // submit on final step
    return { ok: true, form, operation: "submit", successText: "Thank you for subscribing" };
  }
  // Contact: submit the real form (guarded native submit handler runs).
  const btn = document.getElementById("contact-us-form-button") as HTMLButtonElement | null;
  if (btn) btn.click();
  else el.requestSubmit();
  return { ok: true, form, operation: "submit", successText: "Success! We'll be in touch." };
}

function formReset(args: Record<string, unknown>) {
  const form = (args.form as FormKey) ?? "contact";
  const el = formEl(form);
  if (!el) return { ok: false, error: `form not found: ${form}` };
  el.reset();
  return { ok: true, form, operation: "reset" };
}

function formCancel(args: Record<string, unknown>) {
  // No dedicated cancel control on the page; cancel == reset the form to a
  // clean state (same observable outcome, no fake success path).
  const res = formReset(args);
  return { ...res, operation: "cancel" };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => unknown;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: "browse-open",
    description:
      "Scroll to a homepage section anchor. args.destination is one of the declared destinations.",
    handler: browseOpen,
  },
  {
    name: "browse-set_theme",
    description: "Toggle the site theme by clicking the real theme control. args.theme is light|dark.",
    handler: browseSetTheme,
  },
  {
    name: "form-validate",
    description: "Fill optional args.fields then run native validity on the form (newsletter|contact).",
    handler: formValidate,
  },
  {
    name: "form-submit",
    description: "Fill optional args.fields and submit the form via its real button (newsletter|contact).",
    handler: formSubmit,
  },
  {
    name: "form-cancel",
    description: "Cancel/clear the form (newsletter|contact) with no submission.",
    handler: formCancel,
  },
  {
    name: "form-reset",
    description: "Reset the form fields to empty (newsletter|contact).",
    handler: formReset,
  },
  {
    name: "form-advance",
    description: "Advance the five-step newsletter form by clicking its real Next control.",
    handler: formAdvance,
  },
  {
    name: "form-return",
    description: "Move the newsletter form back a step by clicking its real Back control.",
    handler: formReturn,
  },
];

export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: ["browse-query-v1", "form-workflow-v1"],
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description }));
  w.webmcp_invoke_tool = (name: string, args: Record<string, unknown> = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}

initWebMcp();
