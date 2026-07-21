// WebMCP surface for the Hildén & Kaira homepage oracle.
//
// Every tool drives the SAME DOM controls a human uses: it scrolls to the real
// section, clicks the real flick prev/next buttons, opens the real locale
// dropdown option, fills + submits the real contact form, and plays/pauses the
// real Bunny player. It never fabricates a success state the UI would not
// otherwise reach. Exposed on window as webmcp_session_info /
// webmcp_list_tools / webmcp_invoke_tool.

const CONTRACT_VERSION = "zto-webmcp-v1";

// Declared destinations -> the real homepage section selector.
const DESTINATIONS: Record<string, string> = {
  hero: ".section_hero",
  statement: ".section_statement",
  client: ".section_client-deck",
  services: ".section_services",
  testimonials: ".section_testimonials",
  about: ".section_about-us",
  cta: ".section_cta",
  footer: "footer, .footer",
};

const LOCALES = ["en", "fi"];

// Contact-form field name -> the real input's name attribute.
const FORM_FIELDS: Record<string, string> = {
  email: "E-mail",
  phone: "Telefoonnummer",
  terms: "Terms-Conditions",
};

const CONTACT_FIELDS = new Set(["email", "phone", "terms"]);
const COOKIE_FIELDS = new Set(["essential", "marketing", "analytics", "personalization"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9 +\-()]{0,40}$/;

function q<T extends Element = HTMLElement>(sel: string): T | null {
  return document.querySelector<T>(sel);
}

function contactForm(): HTMLFormElement | null {
  return q<HTMLFormElement>("[data-contact-form]");
}

function openContactPopup() {
  const popup = q<HTMLDialogElement>("[data-cta-popup]");
  if (popup && !popup.open) {
    const opener = q<HTMLElement>("[data-cta-popup-open]");
    if (opener) opener.click();
    else popup.showModal();
  }
}

function fillFormFields(fields: Record<string, unknown> | undefined) {
  const form = contactForm();
  if (!form || !fields) return;
  for (const [key, value] of Object.entries(fields)) {
    const name = FORM_FIELDS[key] || key;
    const el = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
    if (!el) continue;
    if (el.type === "checkbox") {
      el.checked = value === true || String(value).toLowerCase() === "true";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
}

function openCookiePreferences(): HTMLElement | null {
  const prefs = q<HTMLElement>("[data-cookie-prefs]");
  if (!prefs) return null;
  if (!prefs.classList.contains("is-visible")) {
    q<HTMLElement>("[data-cookie-prefs-open]")?.click();
  }
  return prefs;
}

function fillCookieFields(fields: Record<string, unknown> | undefined): boolean {
  if (!fields || !Object.keys(fields).some((key) => COOKIE_FIELDS.has(key))) return true;
  const essential = fields.essential;
  if (essential != null && !(essential === true || String(essential).toLowerCase() === "true")) return false;
  const prefs = openCookiePreferences();
  if (!prefs) return false;
  for (const key of ["marketing", "analytics", "personalization"]) {
    if (!(key in fields)) continue;
    const input = prefs.querySelector<HTMLInputElement>(`input[name="${key}"]`);
    if (!input) return false;
    input.checked = fields[key] === true || String(fields[key]).toLowerCase() === "true";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
  return true;
}

function waitUntil(predicate: () => boolean, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const started = performance.now();
    const check = () => {
      if (predicate()) resolve(true);
      else if (performance.now() - started >= timeoutMs) resolve(predicate());
      else requestAnimationFrame(check);
    };
    check();
  });
}

// The active flick deck is the one inside the current (centered) swiper slide.
function activePlayer(): HTMLElement | null {
  const inActiveCard = q(
    ".swiper-slide-active [data-flick-cards-item-status='active'] [data-bunny-player-init]"
  );
  return inActiveCard || q("[data-bunny-player-init]");
}

// ---- browse-query-v1 -------------------------------------------------------

function browseOpen(args: Record<string, unknown>) {
  const destination = String(args.destination ?? args.section ?? "");
  const sel = DESTINATIONS[destination];
  if (!sel) return { ok: false, error: `unknown destination: ${destination}` };
  const target = q(sel);
  if (!target) return { ok: false, error: `section not found: ${destination}` };
  // Same path an in-page nav anchor takes.
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return { ok: true, destination, scrolledTo: destination };
}

function browseSetLocale(args: Record<string, unknown>) {
  const locale = String(args.locale ?? "").toLowerCase();
  if (!LOCALES.includes(locale)) return { ok: false, error: `unknown locale: ${locale}` };
  const root = q("[data-locale-root]");
  if (!root) return { ok: false, error: "locale dropdown not found" };
  // Open the dropdown via its real toggle, then click the real option.
  const toggle = root.querySelector<HTMLElement>(".locale-dropdown_toggle");
  if (toggle && !root.classList.contains("is-open")) toggle.click();
  const label = locale.toUpperCase();
  const opt = root.querySelector<HTMLElement>(`[data-locale-option="${label}"]`);
  if (!opt) return { ok: false, error: `locale option not found: ${label}` };
  opt.click();
  const current = root.querySelector("[data-locale-current]")?.textContent ?? "";
  return { ok: true, locale, label: current };
}

// ---- form-workflow-v1 ------------------------------------------------------

function formValidate(args: Record<string, unknown>) {
  const fields = args.fields as Record<string, unknown> | undefined;
  const keys = Object.keys(fields || {});
  const contactRequested = keys.length === 0 || keys.some((key) => CONTACT_FIELDS.has(key));
  const cookiesValid = fillCookieFields(fields);
  if (!contactRequested) return { ok: true, operation: "validate", valid: cookiesValid };
  openContactPopup();
  fillFormFields(fields);
  const form = contactForm();
  if (!form) return { ok: false, error: "contact form not found" };
  const email = form.querySelector<HTMLInputElement>('[name="E-mail"]');
  const phone = form.querySelector<HTMLInputElement>('[name="Telefoonnummer"]');
  const terms = form.querySelector<HTMLInputElement>('[name="Terms-Conditions"]');
  const emailValue = email?.value.trim() ?? "";
  const phoneValue = phone?.value ?? "";
  const emailValid = emailValue.length <= 254 && EMAIL_RE.test(emailValue);
  const phoneValid = phoneValue.length <= 40 && PHONE_RE.test(phoneValue);
  const termsValid = !!terms && terms.checked;
  const valid = cookiesValid && emailValid && phoneValid && termsValid;
  return { ok: true, operation: "validate", valid, emailValid, phoneValid, termsValid, cookiesValid };
}

async function formSubmit(args: Record<string, unknown>) {
  const fields = args.fields as Record<string, unknown> | undefined;
  const keys = Object.keys(fields || {});
  const cookieRequested = keys.some((key) => COOKIE_FIELDS.has(key));
  const contactRequested = keys.length === 0 || keys.some((key) => CONTACT_FIELDS.has(key));
  if (cookieRequested) {
    if (!fillCookieFields(fields)) return { ok: false, error: "invalid cookie preference fields" };
    const acceptSelected = q<HTMLElement>("[data-cookie-accept-selected]");
    if (!acceptSelected) return { ok: false, error: "cookie preference submit control not found" };
    acceptSelected.click();
  }
  if (!contactRequested) return { ok: true, operation: "submit", submitted: true };
  openContactPopup();
  fillFormFields(fields);
  const form = contactForm();
  if (!form) return { ok: false, error: "contact form not found" };
  form.requestSubmit();
  const settled = await waitUntil(() =>
    q("[data-form-success]")?.classList.contains("is-visible") === true
    || q("[data-form-error]")?.classList.contains("is-visible") === true
    || Array.from(form.querySelectorAll("[data-error]")).some((el) => Boolean(el.textContent?.trim()))
  );
  const successVisible = q("[data-form-success]")?.classList.contains("is-visible") === true;
  return successVisible
    ? { ok: true, operation: "submit", submitted: true, successVisible: true }
    : { ok: false, operation: "submit", submitted: false, error: settled ? "form validation or submission failed" : "submission was not accepted" };
}

function formCancel(_args: Record<string, unknown>) {
  const popup = q<HTMLDialogElement>("[data-cta-popup]");
  if (popup?.open) {
    popup.querySelector<HTMLElement>("[data-cta-popup-close]")?.click();
    return { ok: true, operation: "cancel", workflow: "contact" };
  }
  const prefs = q<HTMLElement>("[data-cookie-prefs]");
  if (prefs?.classList.contains("is-visible")) {
    prefs.querySelector<HTMLElement>("[data-cookie-prefs-close]")?.click();
    return { ok: true, operation: "cancel", workflow: "cookie-preferences" };
  }
  return { ok: false, error: "no active form workflow to cancel" };
}

function formReset(_args: Record<string, unknown>) {
  const form = contactForm();
  if (!form) return { ok: false, error: "contact form not found" };
  form.reset();
  form.querySelectorAll(".form-input_wrap").forEach((w) => w.classList.remove("is-filled"));
  form.querySelectorAll("[data-validate]").forEach((w) => w.classList.remove("is--error"));
  form.querySelectorAll("[data-error]").forEach((w) => { w.textContent = ""; });
  q("[data-form-success]")?.classList.remove("is-visible");
  q("[data-form-error]")?.classList.remove("is-visible");
  return { ok: true, operation: "reset" };
}

// ---- command-session-v1 (Bunny player) -------------------------------------

function playerToggle(el: HTMLElement) {
  const btn = el.querySelector<HTMLButtonElement>(
    '[data-player-control="playpause"], [data-player-control="big-playpause"]'
  );
  if (btn) btn.click();
}

function sessionStart(_args: Record<string, unknown>) {
  const el = activePlayer();
  if (!el) return { ok: false, error: "no video player found" };
  const video = el.querySelector<HTMLVideoElement>(".bunny-player__video");
  if (video && video.paused) playerToggle(el);
  return { ok: true, operation: "start", acknowledged: true };
}

function sessionPause(_args: Record<string, unknown>) {
  const el = activePlayer();
  if (!el) return { ok: false, error: "no video player found" };
  const video = el.querySelector<HTMLVideoElement>(".bunny-player__video");
  if (video && !video.paused) playerToggle(el);
  return { ok: true, operation: "pause", acknowledged: true };
}

function sessionResume(args: Record<string, unknown>) {
  const res = sessionStart(args) as Record<string, unknown>;
  return { ...res, operation: "resume" };
}

function sessionStop(_args: Record<string, unknown>) {
  const el = activePlayer();
  if (!el) return { ok: false, error: "no video player found" };
  const video = el.querySelector<HTMLVideoElement>(".bunny-player__video");
  if (video && !video.paused) playerToggle(el);
  if (video) video.currentTime = 0;
  return { ok: true, operation: "stop", acknowledged: true };
}


// ---- artifact-transfer-v1 --------------------------------------------------

function openBriefPanel(): HTMLDialogElement | null {
  const briefPanel = q<HTMLDialogElement>("#discovery-brief-panel");
  if (!briefPanel) return null;
  if (!briefPanel.open) {
    q<HTMLElement>("#nav-shortlist-trigger")?.click();
    q<HTMLElement>("#btn-export-brief")?.click();
  }
  return briefPanel.open ? briefPanel : null;
}

function selectBriefFormat(panel: HTMLDialogElement, format: string): boolean {
  if (format !== "json" && format !== "markdown") return false;
  const tab = panel.querySelector<HTMLButtonElement>(`[data-brief-tab="${format}"]`);
  if (!tab) return false;
  tab.click();
  return tab.getAttribute("aria-selected") === "true";
}

function artifactExport(args: Record<string, unknown>) {
  const format = String(args.format ?? "");
  if (format !== "json" && format !== "markdown") return { ok: false, error: "format must be json or markdown" };
  const panel = openBriefPanel();
  if (!panel) return { ok: false, error: "discovery brief panel could not be opened" };
  if (!selectBriefFormat(panel, format)) return { ok: false, error: `format tab not found: ${format}` };
  return { ok: true, operation: "export", format, previewVisible: true };
}

function artifactCopy(_args: Record<string, unknown>) {
  const panel = openBriefPanel();
  if (!panel) return { ok: false, error: "discovery brief panel could not be opened" };
  const button = panel.querySelector<HTMLButtonElement>("#btn-copy-brief");
  if (!button) return { ok: false, error: "copy control not found" };
  button.click();
  return { ok: true, operation: "copy", acknowledged: true };
}

function artifactImport(args: Record<string, unknown>) {
  if (args.mode !== "discovery-brief") return { ok: false, error: "mode must be discovery-brief" };
  const panel = openBriefPanel();
  if (!panel) return { ok: false, error: "discovery brief panel could not be opened" };
  const trigger = panel.querySelector<HTMLButtonElement>("#btn-import-brief-trigger");
  const input = panel.querySelector<HTMLTextAreaElement>("#import-json-input");
  if (!trigger || !input) return { ok: false, error: "import surface not found" };
  trigger.click();
  input.focus();
  return { ok: true, operation: "import", mode: "discovery-brief", importSurfaceVisible: true };
}

// ---- registry --------------------------------------------------------------


type Handler = (args: Record<string, unknown>) => unknown;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: "artifact.export",
    description: "Open the visible discovery-brief preview for args.format json or markdown; artifact bytes remain Playwright-only.",
    handler: artifactExport,
  },
  {
    name: "artifact.import",
    description: "Reveal and focus the visible discovery-brief import surface for args.mode discovery-brief; raw contents remain Playwright-only.",
    handler: artifactImport,
  },
  {
    name: "artifact.copy",
    description: "Trigger the visible discovery-brief Copy control without returning clipboard contents.",
    handler: artifactCopy,
  },

  {
    name: "browse.open",
    description:
      "Scroll to a declared homepage section (args.destination: hero|statement|client|services|testimonials|about|cta|footer).",
    handler: browseOpen,
  },
  {
    name: "browse.set_locale",
    description: "Open the locale dropdown and select a locale (args.locale: en|fi); updates the visible EN/FI label.",
    handler: browseSetLocale,
  },
  {
    name: "form.validate",
    description: "Open the contact popup, fill optional args.fields (email, phone, terms), and report the contact form's validity.",
    handler: formValidate,
  },
  {
    name: "form.submit",
    description: "Open the contact popup, fill optional args.fields (email, phone, terms), and submit via the real form handler (POST /api/contact).",
    handler: formSubmit,
  },
  {
    name: "form.cancel",
    description: "Close the active contact or cookie-preferences workflow through its visible Close control.",
    handler: formCancel,
  },
  {
    name: "form.reset",
    description: "Reset the contact form fields and clear its validation / success state.",
    handler: formReset,
  },
  {
    name: "session.start",
    description: "Play the active client-deck Bunny player by clicking its real play control.",
    handler: sessionStart,
  },
  {
    name: "session.pause",
    description: "Pause the active client-deck Bunny player by clicking its real pause control.",
    handler: sessionPause,
  },
  {
    name: "session.resume",
    description: "Resume the active client-deck Bunny player (play if paused).",
    handler: sessionResume,
  },
  {
    name: "session.stop",
    description: "Stop the active client-deck Bunny player: pause it and return the timeline to the start.",
    handler: sessionStop,
  },
];

export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: ["browse-query-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"],
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description }));
  w.webmcp_invoke_tool = async (name: string, args: Record<string, unknown> = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return await tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}

initWebMcp();
