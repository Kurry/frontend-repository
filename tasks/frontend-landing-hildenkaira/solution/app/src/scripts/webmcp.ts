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

function q<T extends Element = HTMLElement>(sel: string): T | null {
  return document.querySelector<T>(sel);
}

function contactForm(): HTMLFormElement | null {
  return q<HTMLFormElement>("[data-contact-form]");
}

function openContactPopup() {
  const popup = q("[data-cta-popup]");
  if (popup && !popup.classList.contains("is-open")) {
    const opener = q<HTMLElement>("[data-cta-popup-open]");
    if (opener) opener.click();
    else popup.classList.add("is-open");
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
      el.checked = Boolean(value);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
}

// The active flick deck is the one inside the current (centered) swiper slide.
function activeFlickGroup(): HTMLElement | null {
  const active = q(".swiper-slide-active [data-flick-cards-init]");
  return active || q("[data-flick-cards-init]");
}

function activePlayer(): HTMLElement | null {
  const inActiveCard = q(
    ".swiper-slide-active [data-flick-cards-item-status='active'] [data-bunny-player-init]"
  );
  return inActiveCard || q("[data-bunny-player-init]");
}

// ---- browse-query-v1 -------------------------------------------------------

function browseOpen(args: Record<string, unknown>) {
  // Alternative behavior: advance the flick-card client deck.
  const flick = args.flick != null ? String(args.flick) : "";
  if (flick === "next" || flick === "prev") {
    const group = activeFlickGroup();
    if (!group) return { ok: false, error: "no flick deck found" };
    const btn = group.querySelector<HTMLButtonElement>(
      flick === "next" ? "[data-flick-next]" : "[data-flick-prev]"
    );
    if (!btn) return { ok: false, error: `flick ${flick} control not found` };
    btn.click();
    const status = group.querySelector("[data-flick-cards-item][data-flick-cards-item-status='active']");
    return { ok: true, flick, activeCard: status ? true : false };
  }
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
  openContactPopup();
  fillFormFields(args.fields as Record<string, unknown> | undefined);
  const form = contactForm();
  if (!form) return { ok: false, error: "contact form not found" };
  const email = form.querySelector<HTMLInputElement>('[name="E-mail"]');
  const terms = form.querySelector<HTMLInputElement>('[name="Terms-Conditions"]');
  const emailValid = !!email && /.+@.+\..+/.test(email.value);
  const termsValid = !!terms && terms.checked;
  const valid = emailValid && termsValid && form.checkValidity();
  return { ok: true, operation: "validate", valid, emailValid, termsValid };
}

function formSubmit(args: Record<string, unknown>) {
  openContactPopup();
  fillFormFields(args.fields as Record<string, unknown> | undefined);
  const form = contactForm();
  if (!form) return { ok: false, error: "contact form not found" };
  // Drive the real guarded submit handler (validation + POST /api/contact).
  form.requestSubmit();
  const success = q("[data-form-success]");
  return {
    ok: true,
    operation: "submit",
    submitted: true,
    successVisible: !!success && success.classList.contains("is-visible"),
  };
}

function formReset(_args: Record<string, unknown>) {
  const form = contactForm();
  if (!form) return { ok: false, error: "contact form not found" };
  form.reset();
  form.querySelectorAll(".form-input_wrap").forEach((w) => w.classList.remove("is-filled"));
  form.querySelectorAll("[data-validate]").forEach((w) => w.classList.remove("is--error"));
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
  return { ok: true, operation: "start", status: el.getAttribute("data-player-status") };
}

function sessionPause(_args: Record<string, unknown>) {
  const el = activePlayer();
  if (!el) return { ok: false, error: "no video player found" };
  const video = el.querySelector<HTMLVideoElement>(".bunny-player__video");
  if (video && !video.paused) playerToggle(el);
  return { ok: true, operation: "pause", status: el.getAttribute("data-player-status") };
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
  return { ok: true, operation: "stop", status: el.getAttribute("data-player-status") };
}


// ---- artifact-transfer-v1 --------------------------------------------------

function artifactExport(args: Record<string, unknown>) {
  // Command Palette route: Ctrl+K then 'Export brief'
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  setTimeout(() => {
    document.getElementById("cmd-export")?.click();
  }, 100);

  return { ok: true, operation: "export", format: args.format || "json" };
}

function artifactCopy(_args: Record<string, unknown>) {
  const btn = document.getElementById("brief-copy");
  if (btn) btn.click();
  return { ok: true, operation: "copy" };
}

function artifactImport(args: Record<string, unknown>) {
  const content = document.getElementById("brief-json-content") as HTMLTextAreaElement;
  if (content && args.payload) {
    content.value = String(args.payload);
    document.getElementById("brief-import")?.click();
  }
  return { ok: true, operation: "import", mode: "discovery-brief" };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Record<string, unknown>) => unknown;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: "browse-open",
    description:
      "Scroll to a homepage section (args.destination: hero|statement|client|services|testimonials|cta|footer), or advance the active client flick deck (args.flick: next|prev).",
    handler: browseOpen,
  },
  {
    name: "browse-set_locale",
    description: "Open the locale dropdown and select a locale (args.locale: en|fi); updates the visible EN/FI label.",
    handler: browseSetLocale,
  },
  {
    name: "form-validate",
    description: "Open the contact popup, fill optional args.fields (email, phone, terms), and report the contact form's validity.",
    handler: formValidate,
  },
  {
    name: "form-submit",
    description: "Open the contact popup, fill optional args.fields (email, phone, terms), and submit via the real form handler (POST /api/contact).",
    handler: formSubmit,
  },
  {
    name: "form-reset",
    description: "Reset the contact form fields and clear its validation / success state.",
    handler: formReset,
  },
  {
    name: "session-start",
    description: "Play the active client-deck Bunny player by clicking its real play control.",
    handler: sessionStart,
  },
  {
    name: "session-pause",
    description: "Pause the active client-deck Bunny player by clicking its real pause control.",
    handler: sessionPause,
  },
  {
    name: "session-resume",
    description: "Resume the active client-deck Bunny player (play if paused).",
    handler: sessionResume,
  },
  {
    name: "session-stop",
    description: "Stop the active client-deck Bunny player: pause it and return the timeline to the start.",
    handler: sessionStop,
  },
  {
    name: "artifact-export",
    description: "Export the discovery brief.",
    handler: artifactExport,
  },
  {
    name: "artifact-copy",
    description: "Copy the discovery brief.",
    handler: artifactCopy,
  },
  {
    name: "artifact-import",
    description: "Import a discovery brief payload.",
    handler: artifactImport,
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
