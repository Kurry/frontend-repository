/* Docuseal — PDF form builder / document signing workspace .
 * Self-contained, in-memory state mirrored to localStorage so a reload restores.
 * The WebMCP handlers call the SAME action functions the visible UI controls call.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "docuseal.workspace.v1";

  // Field types offered in the palette (Docuseal-style set).
  var FIELD_TYPES = [
    { type: "text", label: "Text", glyph: "T" },
    { type: "signature", label: "Signature", glyph: "✍" },
    { type: "initials", label: "Initials", glyph: "In" },
    { type: "date", label: "Date", glyph: "▦" },
    { type: "number", label: "Number", glyph: "#" },
    { type: "checkbox", label: "Checkbox", glyph: "☑" },
    { type: "radio", label: "Radio", glyph: "◉" },
    { type: "select", label: "Select", glyph: "▾" },
    { type: "image", label: "Image", glyph: "▤" },
    { type: "file", label: "File", glyph: "📎" },
    { type: "phone", label: "Phone", glyph: "☏" },
    { type: "cells", label: "Cells", glyph: "▥" },
    { type: "stamp", label: "Stamp", glyph: "◍" }
  ];
  var TYPE_LABEL = {};
  FIELD_TYPES.forEach(function (t) { TYPE_LABEL[t.type] = t.label; });
  var TYPE_GLYPH = {};
  FIELD_TYPES.forEach(function (t) { TYPE_GLYPH[t.type] = t.glyph; });
  var VALID_TYPES = FIELD_TYPES.map(function (t) { return t.type; });

  // Ordered submitter colour palette. Party N gets SUBMITTER_COLORS[N-1].
  var SUBMITTER_COLORS = ["#4f46e5", "#e11d48", "#0891b2", "#d97706", "#7c3aed"];
  var PARTY_NAMES = ["First Party", "Second Party", "Third Party", "Fourth Party", "Fifth Party"];

  var DEFAULT_FIELD_NAMES = {
    text: "Text field", signature: "Signature", initials: "Initials",
    date: "Date", number: "Number", checkbox: "Checkbox", radio: "Radio",
    select: "Select", image: "Image", file: "File", phone: "Phone",
    cells: "Cells", stamp: "Stamp"
  };

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 9);
  }

  // ---------------------------------------------------------------- seed state
  function seedState() {
    var s1 = "sub_first", s2 = "sub_second";
    var tA = "tpl_sales", tB = "tpl_nda", tC = "tpl_onboarding";
    return {
      templates: [
        { id: tA, name: "Sales Agreement", pages: 2, docTitle: "Sales Agreement", docSub: "Master services contract", status: "draft", currentStep: 0 },
        { id: tB, name: "NDA — Mutual", pages: 1, docTitle: "Mutual NDA", docSub: "Confidentiality terms", status: "draft", currentStep: 0 },
        { id: tC, name: "Onboarding Packet", pages: 1, docTitle: "Onboarding Packet", docSub: "New hire paperwork", status: "draft", currentStep: 0 }
      ],
      activeTemplateId: tA,
      submitters: [
        { id: s1, name: "First Party", color: SUBMITTER_COLORS[0] },
        { id: s2, name: "Second Party", color: SUBMITTER_COLORS[1] }
      ],
      activeSubmitterId: s1,
      fields: [
        { id: uid("fld"), templateId: tA, type: "text", name: "Full name", page: 0, x: 60, y: 150, w: 200, h: 34, submitterId: s1, required: true },
        { id: uid("fld"), templateId: tA, type: "signature", name: "Signature", page: 0, x: 60, y: 300, w: 200, h: 44, submitterId: s1, required: true },
        { id: uid("fld"), templateId: tA, type: "date", name: "Date signed", page: 0, x: 320, y: 300, w: 150, h: 34, submitterId: s2, required: false },
        { id: uid("fld"), templateId: tB, type: "signature", name: "Signature", page: 0, x: 70, y: 260, w: 200, h: 44, submitterId: s1, required: true }
      ],
      selectedFieldId: null,
      mode: "build"
    };
  }

  var state = load() || seedState();

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.templates) || !Array.isArray(parsed.fields)) return null;
      return parsed;
    } catch (e) { return null; }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // Cross-tab coherence: the WebMCP bridge attaches to the LAST open tab at the
  // app origin, while the observing (Playwright-driven) tab may be an earlier
  // one. Without this, a tool invocation can succeed in one tab while the
  // observed tab keeps rendering stale state — and later clobber the invoked
  // tab's fields when it persists. Adopting the persisted state whenever
  // another same-origin tab writes it keeps every tab rendering the same app
  // instance.
  window.addEventListener("storage", function (ev) {
    if (ev.key !== STORAGE_KEY || !ev.newValue) return;
    if (drag) return; // never yank the DOM out from under an in-flight drag gesture
    try {
      var incoming = JSON.parse(ev.newValue);
      if (!incoming || !Array.isArray(incoming.templates) || !Array.isArray(incoming.fields)) return;
      state = incoming;
      if (els.canvas) render();
    } catch (e) { /* ignore malformed writes */ }
  });

  // ---------------------------------------------------------------- selectors
  function activeTemplate() {
    return state.templates.filter(function (t) { return t.id === state.activeTemplateId; })[0] || state.templates[0];
  }
  function templateFields(tid) {
    return state.fields.filter(function (f) { return f.templateId === tid; });
  }
  function submitterById(id) {
    return state.submitters.filter(function (s) { return s.id === id; })[0] || null;
  }
  function fieldById(id) {
    return state.fields.filter(function (f) { return f.id === id; })[0] || null;
  }
  function selectedField() {
    return state.selectedFieldId ? fieldById(state.selectedFieldId) : null;
  }
  function activeSubmitter() {
    return submitterById(state.activeSubmitterId) || state.submitters[0];
  }

  // ---------------------------------------------------------------- actions
  // Every mutation goes through render() -> persist() so state stays coherent.

  function openTemplate(tid) {
    var t = state.templates.filter(function (x) { return x.id === tid; })[0];
    if (!t) return { ok: false, error: "Unknown template" };
    state.activeTemplateId = tid;
    state.selectedFieldId = null;
    render();
    announce("Opened " + t.name);
    return { ok: true, template: t.name };
  }

  function placeField(type, opts) {
    opts = opts || {};
    // Accept type labels case-insensitively ("Text" -> "text") so the WebMCP
    // path and the palette path resolve to the same declared type enum.
    type = String(type || "").toLowerCase();
    if (VALID_TYPES.indexOf(type) === -1) {
      return { ok: false, error: "Unknown field type" + (type ? " '" + type + "'" : "") + ". Valid types: " + VALID_TYPES.join(", ") };
    }
    var t = activeTemplate();
    // Resolve submitter by id or by visible name; unknown values fall back to the active submitter.
    var subRef = opts.submitterId;
    var subMatch = subRef ? (submitterById(subRef) || state.submitters.filter(function (s) { return s.name === subRef; })[0]) : null;
    var subId = subMatch ? subMatch.id : state.activeSubmitterId;
    // Coerce page defensively: accept numeric strings, clamp NaN/negatives/out-of-range
    // to a page that actually renders on the current template.
    var pageNum = Number(opts.page);
    var page = isFinite(pageNum) ? Math.max(0, Math.min(Math.round(pageNum), t.pages - 1)) : 0;
    var n = templateFields(t.id).length;
    var field = {
      id: uid("fld"),
      templateId: t.id,
      type: type,
      name: opts.name || DEFAULT_FIELD_NAMES[type] || TYPE_LABEL[type],
      page: page,
      x: typeof opts.x === "number" ? opts.x : (58 + (n % 4) * 26),
      y: typeof opts.y === "number" ? opts.y : (130 + (n % 6) * 62),
      w: 190,
      h: type === "signature" || type === "stamp" ? 44 : 34,
      submitterId: subId,
      required: type === "signature" || type === "initials"
    };
    state.fields.push(field);
    state.selectedFieldId = field.id;
    render();
    // Postcondition: ok:true must mean the field is visibly rendered on the
    // current template's canvas. If it is not, roll back and report failure.
    var rendered = els.canvas && els.canvas.querySelector('.field[data-field-id="' + field.id + '"]');
    if (!rendered) {
      state.fields = state.fields.filter(function (x) { return x.id !== field.id; });
      if (state.selectedFieldId === field.id) state.selectedFieldId = null;
      render();
      return { ok: false, error: "Field could not be rendered on the active template" };
    }
    announce(TYPE_LABEL[type] + " field added");
    return { ok: true, fieldId: field.id, type: type, submitter: (submitterById(subId) || {}).name };
  }

  function selectField(id) {
    if (id && !fieldById(id)) return { ok: false, error: "Unknown field" };
    state.selectedFieldId = id || null;
    render();
    return { ok: true, fieldId: id || null };
  }

  function updateFieldProperty(id, prop, value) {
    var f = fieldById(id);
    if (!f) return { ok: false, error: "Unknown field" };
    if (prop === "name") {
      f.name = String(value);
    } else if (prop === "required") {
      f.required = !!value;
    } else if (prop === "submitter") {
      var sub = submitterById(value) || state.submitters.filter(function (s) { return s.name === value; })[0];
      if (!sub) return { ok: false, error: "Unknown submitter" };
      f.submitterId = sub.id;
      announce("Assigned " + f.name + " to " + sub.name);
    } else {
      return { ok: false, error: "Unknown property" };
    }
    render();
    return { ok: true, fieldId: id, property: prop, value: value };
  }

  function deleteField(id, confirm) {
    var f = fieldById(id);
    if (!f) return { ok: false, error: "Unknown field" };
    if (confirm !== true) return { ok: false, error: "delete requires confirm=true" };
    var name = f.name;
    state.fields = state.fields.filter(function (x) { return x.id !== id; });
    if (state.selectedFieldId === id) state.selectedFieldId = null;
    render();
    announce("Deleted field " + name);
    return { ok: true, fieldId: id };
  }

  function addSubmitter(name) {
    var idx = state.submitters.length;
    var color = SUBMITTER_COLORS[idx % SUBMITTER_COLORS.length];
    var sub = { id: uid("sub"), name: name || PARTY_NAMES[idx] || ("Party " + (idx + 1)), color: color };
    state.submitters.push(sub);
    state.activeSubmitterId = sub.id;
    render();
    announce("Added submitter " + sub.name);
    return { ok: true, submitterId: sub.id, name: sub.name, color: color };
  }

  function selectSubmitter(id) {
    var sub = submitterById(id) || state.submitters.filter(function (s) { return s.name === id; })[0];
    if (!sub) return { ok: false, error: "Unknown submitter" };
    state.activeSubmitterId = sub.id;
    render();
    return { ok: true, submitterId: sub.id, name: sub.name };
  }

  function updateSubmitter(id, prop, value) {
    var sub = submitterById(id);
    if (!sub) return { ok: false, error: "Unknown submitter" };
    if (prop === "name") { sub.name = String(value); }
    else return { ok: false, error: "Unknown property" };
    render();
    return { ok: true, submitterId: id };
  }

  function deleteSubmitter(id, confirm) {
    var sub = submitterById(id);
    if (!sub) return { ok: false, error: "Unknown submitter" };
    if (confirm !== true) return { ok: false, error: "delete requires confirm=true" };
    if (state.submitters.length <= 1) return { ok: false, error: "At least one submitter is required" };
    state.submitters = state.submitters.filter(function (s) { return s.id !== id; });
    // reassign orphaned fields to the first remaining submitter
    var fallback = state.submitters[0].id;
    state.fields.forEach(function (f) { if (f.submitterId === id) f.submitterId = fallback; });
    if (state.activeSubmitterId === id) state.activeSubmitterId = fallback;
    render();
    announce("Deleted submitter " + sub.name);
    return { ok: true, submitterId: id };
  }

  function setMode(mode) {
    if (mode !== "build" && mode !== "preview") return { ok: false, error: "Unknown mode" };
    state.mode = mode;
    render();
    return { ok: true, mode: mode };
  }

  // signing workflow -------------------------------------------------
  function validateTemplate() {
    var t = activeTemplate();
    var fs = templateFields(t.id);
    var errors = [];
    if (fs.length === 0) errors.push("Add at least one field before sending.");
    var unassigned = fs.filter(function (f) { return !submitterById(f.submitterId); });
    if (unassigned.length) errors.push(unassigned.length + " field(s) are missing a submitter.");
    return { ok: errors.length === 0, errors: errors, fields: fs.length };
  }

  function sendForSigning() {
    var v = validateTemplate();
    if (!v.ok) { announce(v.errors[0]); return { ok: false, errors: v.errors }; }
    var t = activeTemplate();
    t.status = "sent";
    t.currentStep = 0;
    render();
    announce("Sent for signing — awaiting " + state.submitters[0].name);
    return { ok: true, status: statusLabel(t) };
  }

  function advanceSigning() {
    var t = activeTemplate();
    if (t.status !== "sent") return { ok: false, error: "Template is not out for signing" };
    t.currentStep = (t.currentStep || 0) + 1;
    if (t.currentStep >= state.submitters.length) { t.status = "completed"; }
    render();
    announce(statusLabel(t));
    return { ok: true, status: statusLabel(t) };
  }

  function statusLabel(t) {
    if (t.status === "completed") return "Completed";
    if (t.status === "sent") {
      var sub = state.submitters[t.currentStep || 0];
      return "Awaiting " + (sub ? sub.name : "signer");
    }
    return "Draft";
  }

  // ---------------------------------------------------------------- rendering
  var els = {};
  function grab() {
    els.tplName = document.getElementById("tpl-name");
    els.tplList = document.getElementById("tpl-list");
    els.submitterList = document.getElementById("submitter-list");
    els.palette = document.getElementById("palette");
    els.canvas = document.getElementById("canvas");
    els.propsBody = document.getElementById("props-body");
    els.statusPill = document.getElementById("status-pill");
    els.sendBtn = document.getElementById("send-btn");
    els.advanceBtn = document.getElementById("advance-btn");
    els.modeBuild = document.getElementById("mode-build");
    els.modePreview = document.getElementById("mode-preview");
    els.addSubmitter = document.getElementById("add-submitter");
    els.toast = document.getElementById("toast");
  }

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function renderTopbar() {
    var t = activeTemplate();
    if (document.activeElement !== els.tplName) els.tplName.value = t.name;
    var lbl = statusLabel(t);
    els.statusPill.textContent = lbl;
    els.statusPill.className = "status-pill" + (t.status === "sent" ? " is-sent" : t.status === "completed" ? " is-done" : "");
    els.advanceBtn.hidden = t.status !== "sent";
    els.sendBtn.textContent = t.status === "draft" ? "Send for signing" : "Re-send";
    els.modeBuild.classList.toggle("is-active", state.mode === "build");
    els.modePreview.classList.toggle("is-active", state.mode === "preview");
    els.modeBuild.setAttribute("aria-pressed", String(state.mode === "build"));
    els.modePreview.setAttribute("aria-pressed", String(state.mode === "preview"));
  }

  function renderTemplates() {
    els.tplList.innerHTML = "";
    state.templates.forEach(function (t) {
      var li = el("li");
      var b = el("button", "tpl-item" + (t.id === state.activeTemplateId ? " is-active" : ""));
      b.type = "button";
      b.setAttribute("aria-pressed", String(t.id === state.activeTemplateId));
      var left = el("span", "tpl-title", t.name);
      var count = templateFields(t.id).length;
      var right = el("span", "tpl-count", count + (count === 1 ? " field" : " fields"));
      b.appendChild(left); b.appendChild(right);
      b.addEventListener("click", function () { openTemplate(t.id); });
      li.appendChild(b);
      els.tplList.appendChild(li);
    });
  }

  function renderSubmitters() {
    els.submitterList.innerHTML = "";
    state.submitters.forEach(function (s) {
      var isActive = s.id === state.activeSubmitterId;
      var b = el("button", "submitter-row" + (isActive ? " is-active" : ""));
      b.type = "button";
      b.style.color = s.color;
      var sw = el("span", "swatch"); sw.style.background = s.color;
      var name = el("span", "submitter-name", s.name); name.style.color = "var(--ink)";
      var fc = templateFields(state.activeTemplateId).filter(function (f) { return f.submitterId === s.id; }).length;
      var cnt = el("span", "submitter-fieldcount", fc + " on page");
      b.appendChild(sw); b.appendChild(name);
      if (isActive) { var tag = el("span", "submitter-active-tag", "Active"); tag.style.color = s.color; b.appendChild(tag); }
      else { b.appendChild(cnt); }
      b.setAttribute("aria-label", "Submitter " + s.name + (isActive ? " (active)" : ""));
      b.addEventListener("click", function () { selectSubmitter(s.id); });
      var li = el("li"); li.appendChild(b); els.submitterList.appendChild(li);
    });
  }

  function renderPalette() {
    els.palette.innerHTML = "";
    FIELD_TYPES.forEach(function (ft) {
      var b = el("button", "palette-btn");
      b.type = "button";
      b.dataset.type = ft.type;
      b.setAttribute("aria-label", "Add " + ft.label + " field");
      var g = el("span", "pal-glyph", ft.glyph); g.setAttribute("aria-hidden", "true");
      var lab = el("span", null, ft.label);
      b.appendChild(g); b.appendChild(lab);
      b.addEventListener("click", function () { placeField(ft.type); });
      els.palette.appendChild(b);
    });
  }

  function renderCanvas() {
    var t = activeTemplate();
    els.canvas.className = "canvas" + (state.mode === "preview" ? " is-preview" : "");
    els.canvas.innerHTML = "";
    var fields = templateFields(t.id);
    for (var p = 0; p < t.pages; p++) {
      (function (pageIdx) {
        var page = el("div", "page");
        page.style.minHeight = "560px";
        page.dataset.page = String(pageIdx);
        var lbl = el("div", "page-label", "Page " + (pageIdx + 1) + " / " + t.pages);
        page.appendChild(lbl);
        var doc = el("div", "page-doc");
        if (pageIdx === 0) {
          doc.appendChild(el("h3", "doc-title", t.docTitle));
          doc.appendChild(el("p", "doc-sub", t.docSub));
        }
        for (var i = 0; i < 7; i++) {
          doc.appendChild(el("div", "doc-line" + (i % 3 === 0 ? " mid" : i % 3 === 1 ? "" : " short")));
        }
        page.appendChild(doc);
        // fields on this page
        fields.filter(function (f) { return f.page === pageIdx; }).forEach(function (f) {
          page.appendChild(renderFieldEl(f));
        });
        // click empty page to deselect
        page.addEventListener("mousedown", function (ev) {
          if (ev.target === page || ev.target.classList.contains("page-doc") || ev.target.classList.contains("doc-line")) {
            if (state.mode === "build" && state.selectedFieldId) selectField(null);
          }
        });
        els.canvas.appendChild(page);
      })(p);
    }
    if (fields.length === 0) {
      var empty = el("div", "canvas-empty", "No fields yet. Choose a field type on the left to place one on the document.");
      els.canvas.appendChild(empty);
    }
  }

  function renderFieldEl(f) {
    var sub = submitterById(f.submitterId) || state.submitters[0];
    var box = el("div", "field" + (f.id === state.selectedFieldId ? " is-selected" : ""));
    box.style.setProperty("--fc", sub.color);
    box.style.left = f.x + "px";
    box.style.top = f.y + "px";
    box.style.width = f.w + "px";
    box.style.minHeight = f.h + "px";
    box.tabIndex = 0;
    box.dataset.fieldId = f.id;
    box.setAttribute("role", "button");
    box.setAttribute("aria-label", TYPE_LABEL[f.type] + " field " + f.name + ", assigned to " + sub.name + (f.required ? ", required" : ""));
    var g = el("span", "field-type-glyph", TYPE_GLYPH[f.type]); g.setAttribute("aria-hidden", "true");
    var lab = el("span", "field-label", f.name);
    box.appendChild(g); box.appendChild(lab);
    if (f.required) { var st = el("span", "req-star", "*"); st.setAttribute("aria-hidden", "true"); box.appendChild(st); }
    box.appendChild(el("span", "field-handle"));
    if (state.mode === "build") {
      box.addEventListener("mousedown", function (ev) { beginDrag(ev, f); });
      box.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); selectField(f.id); }
        else if ((ev.key === "Delete" || ev.key === "Backspace") && f.id === state.selectedFieldId) { ev.preventDefault(); deleteField(f.id, true); }
      });
    }
    return box;
  }

  // drag to reposition an existing field (Playwright-driven gesture)
  var drag = null;
  function beginDrag(ev, f) {
    selectField(f.id);
    var box = ev.currentTarget;
    var rect = box.getBoundingClientRect();
    drag = { id: f.id, offX: ev.clientX - rect.left, offY: ev.clientY - rect.top, moved: false };
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
  }
  function onDragMove(ev) {
    if (!drag) return;
    var box = document.querySelector('.field[data-field-id="' + drag.id + '"]');
    if (!box) return;
    var page = box.closest(".page");
    if (!page) return;
    var pr = page.getBoundingClientRect();
    var nx = Math.max(0, Math.min(ev.clientX - pr.left - drag.offX, pr.width - box.offsetWidth));
    var ny = Math.max(0, Math.min(ev.clientY - pr.top - drag.offY, pr.height - box.offsetHeight));
    box.style.left = nx + "px";
    box.style.top = ny + "px";
    drag.nx = nx; drag.ny = ny; drag.moved = true;
  }
  function onDragEnd() {
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    if (drag && drag.moved) {
      var f = fieldById(drag.id);
      if (f) { f.x = Math.round(drag.nx); f.y = Math.round(drag.ny); persist(); }
    }
    drag = null;
  }

  function renderProps() {
    els.propsBody.innerHTML = "";
    var f = selectedField();
    if (!f) { renderSummary(); return; }
    var sub = submitterById(f.submitterId) || state.submitters[0];
    els.propsBody.appendChild(el("h2", "props-title", "Field properties"));

    var typeRow = el("div", "prop-field");
    typeRow.appendChild(labeled("Type"));
    var badge = el("span", "prop-type-badge");
    var bg = el("span", null, TYPE_GLYPH[f.type]); bg.setAttribute("aria-hidden", "true");
    badge.appendChild(bg); badge.appendChild(el("span", null, TYPE_LABEL[f.type]));
    typeRow.appendChild(badge);
    els.propsBody.appendChild(typeRow);

    // name
    var nameRow = el("div", "prop-field");
    var nameLab = el("label", null, "Field name"); nameLab.setAttribute("for", "prop-name");
    var nameInput = el("input", "prop-input"); nameInput.id = "prop-name"; nameInput.type = "text"; nameInput.value = f.name;
    nameInput.addEventListener("input", function () { updateFieldPropertyLive(f.id, "name", nameInput.value); });
    if (!f.name.trim()) { nameInput.classList.add("is-invalid"); }
    nameRow.appendChild(nameLab); nameRow.appendChild(nameInput);
    if (!f.name.trim()) nameRow.appendChild(el("div", "prop-error", "Field name is required. Enter a label so signers know what to complete."));
    els.propsBody.appendChild(nameRow);

    // submitter assignment
    var subRow = el("div", "prop-field");
    var subLab = el("label", null, "Assigned submitter"); subLab.setAttribute("for", "prop-submitter");
    var sel = el("select", "prop-select"); sel.id = "prop-submitter";
    state.submitters.forEach(function (s) {
      var o = el("option", null, s.name); o.value = s.id; if (s.id === f.submitterId) o.selected = true; sel.appendChild(o);
    });
    sel.addEventListener("change", function () { updateFieldProperty(f.id, "submitter", sel.value); });
    subRow.appendChild(subLab);
    var dot = el("span", "prop-sub-dot"); dot.style.background = sub.color; subLab.insertBefore(dot, subLab.firstChild);
    subRow.appendChild(sel);
    els.propsBody.appendChild(subRow);

    // required toggle
    var reqRow = el("div", "prop-field");
    var reqWrap = el("div", "prop-toggle-row");
    var reqInput = el("input"); reqInput.type = "checkbox"; reqInput.id = "prop-required"; reqInput.checked = !!f.required;
    reqInput.addEventListener("change", function () { updateFieldProperty(f.id, "required", reqInput.checked); });
    var reqLab = el("label", null, "Required field"); reqLab.setAttribute("for", "prop-required"); reqLab.style.margin = "0";
    reqWrap.appendChild(reqInput); reqWrap.appendChild(reqLab);
    reqRow.appendChild(reqWrap);
    els.propsBody.appendChild(reqRow);

    // delete
    var del = el("button", "btn btn-danger", "Delete field");
    del.type = "button";
    del.style.width = "100%";
    del.addEventListener("click", function () { deleteField(f.id, true); });
    els.propsBody.appendChild(del);
  }

  function updateFieldPropertyLive(id, prop, value) {
    var f = fieldById(id);
    if (!f) return;
    f.name = String(value);
    // live-update just the label + summary without a full re-render (keeps input focus)
    var lab = document.querySelector('.field[data-field-id="' + id + '"] .field-label');
    if (lab) lab.textContent = value;
    var input = document.getElementById("prop-name");
    if (input) {
      var invalid = !value.trim();
      input.classList.toggle("is-invalid", invalid);
      // keep the inline validation message in sync while typing: an empty name
      // shows the error at the panel (the field itself is retained)
      var row = input.closest(".prop-field");
      if (row) {
        var err = row.querySelector(".prop-error");
        if (invalid && !err) row.appendChild(el("div", "prop-error", "Field name is required. Enter a label so signers know what to complete."));
        else if (!invalid && err) row.removeChild(err);
      }
    }
    persist();
  }

  function renderSummary() {
    var t = activeTemplate();
    var fs = templateFields(t.id);
    els.propsBody.appendChild(el("h2", "props-title", "Template"));
    var wrap = el("div", "props-summary");
    wrap.appendChild(sumRow("Document", t.docTitle));
    wrap.appendChild(sumRow("Fields", String(fs.length)));
    wrap.appendChild(sumRow("Pages", String(t.pages)));
    wrap.appendChild(sumRow("Status", statusLabel(t)));
    els.propsBody.appendChild(wrap);
    els.propsBody.appendChild(el("h2", "props-title", "Fields by submitter"));
    var byWrap = el("div", "props-summary");
    state.submitters.forEach(function (s) {
      var c = fs.filter(function (f) { return f.submitterId === s.id; }).length;
      var row = el("div", "sum-row");
      var k = el("span", "sum-k");
      var dot = el("span", "prop-sub-dot"); dot.style.background = s.color;
      k.appendChild(dot); k.appendChild(document.createTextNode(s.name));
      row.appendChild(k); row.appendChild(el("span", "sum-v", String(c)));
      byWrap.appendChild(row);
    });
    els.propsBody.appendChild(byWrap);
    els.propsBody.appendChild(el("p", "rail-hint", "Select a field on the document to edit its name, submitter and required state."));
  }

  function sumRow(k, v) {
    var row = el("div", "sum-row");
    row.appendChild(el("span", "sum-k", k));
    row.appendChild(el("span", "sum-v", v));
    return row;
  }
  function labeled(txt) { return el("label", null, txt); }

  var toastTimer = null;
  function announce(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.hidden = false;
    // force reflow for transition
    void els.toast.offsetWidth;
    els.toast.classList.add("is-show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      els.toast.classList.remove("is-show");
      setTimeout(function () { els.toast.hidden = true; }, 220);
    }, 1900);
  }

  function render() {
    renderTopbar();
    renderTemplates();
    renderSubmitters();
    renderCanvas();
    renderProps();
    persist();
  }

  // ---------------------------------------------------------------- wire chrome
  function wire() {
    els.tplName.addEventListener("input", function () {
      var t = activeTemplate(); t.name = els.tplName.value; renderTemplates(); persist();
    });
    els.modeBuild.addEventListener("click", function () { setMode("build"); });
    els.modePreview.addEventListener("click", function () { setMode("preview"); });
    els.addSubmitter.addEventListener("click", function () { addSubmitter(); });
    els.sendBtn.addEventListener("click", function () { sendForSigning(); });
    els.advanceBtn.addEventListener("click", function () { advanceSigning(); });
    document.addEventListener("keydown", function (ev) {
      if ((ev.key === "Delete") && state.selectedFieldId && document.activeElement === document.body) {
        deleteField(state.selectedFieldId, true);
      }
    });
  }

  // ---------------------------------------------------------------- WebMCP
  var TOOLS = [
    { name: "editor_add", module: "structured-editor-v1", op: "add",
      description: "Place a new form field of a declared type on the active template, assigned to the active or a named submitter.",
      run: function (a) { return placeField(a.type || a.object_type || a.field_type || a.fieldType, { submitterId: a.submitter || a.submitterId, page: a.page, name: a.name || a.field_name || a.label }); } },
    { name: "editor_select", module: "structured-editor-v1", op: "select",
      description: "Select a placed field by id (or null to clear selection).",
      run: function (a) { return selectField(a.fieldId || null); } },
    { name: "editor_delete", module: "structured-editor-v1", op: "delete",
      description: "Delete a placed field by id. Requires confirm=true.",
      run: function (a) { return deleteField(a.fieldId, a.confirm === true); } },
    { name: "editor_update_property", module: "structured-editor-v1", op: "update_property",
      description: "Update a declared property (name, required, submitter) of a placed field. Assigning submitter recolours the field.",
      run: function (a) { return updateFieldProperty(a.fieldId, a.property, a.value); } },
    { name: "editor_preview", module: "structured-editor-v1", op: "preview",
      description: "Switch the canvas into the signing preview mode.",
      run: function () { return setMode("preview"); } },
    { name: "editor_switch_mode", module: "structured-editor-v1", op: "switch_mode",
      description: "Switch the editor mode between 'build' and 'preview'.",
      run: function (a) { return setMode(a.mode); } },

    { name: "entity_create", module: "entity-collection-v1", op: "create",
      description: "Create a new submitter (signing party). Gets the next colour in the palette.",
      run: function (a) { return addSubmitter(a.name); } },
    { name: "entity_select", module: "entity-collection-v1", op: "select",
      description: "Make a submitter the active one so new fields are assigned to it.",
      run: function (a) { return selectSubmitter(a.submitterId || a.name); } },
    { name: "entity_update", module: "entity-collection-v1", op: "update",
      description: "Update a submitter's declared field (name).",
      run: function (a) { return updateSubmitter(a.submitterId, a.field || "name", a.value); } },
    { name: "entity_delete", module: "entity-collection-v1", op: "delete",
      description: "Delete a submitter by id. Requires confirm=true. Its fields fall back to the first submitter.",
      run: function (a) { return deleteSubmitter(a.submitterId, a.confirm === true); } },

    { name: "form_validate", module: "form-workflow-v1", op: "validate",
      description: "Validate that the active template is ready to send (fields present and each assigned to a submitter).",
      run: function () { return validateTemplate(); } },
    { name: "form_submit", module: "form-workflow-v1", op: "submit",
      description: "Send the active template for signing after validation passes.",
      run: function () { return sendForSigning(); } },
    { name: "form_advance", module: "form-workflow-v1", op: "advance",
      description: "Advance the signing workflow to the next submitter (or completed).",
      run: function () { return advanceSigning(); } }
  ];

  function toolSchema(t) {
    return { name: t.name, module: t.module, operation: t.op, description: t.description };
  }

  window.webmcp_session_info = function () {
    return {
      contract_version: "zto-webmcp-v1",
      app: "docuseal",
      modules: ["structured-editor-v1", "entity-collection-v1", "form-workflow-v1"],
      bindings: {
        editor_object_types: VALID_TYPES,
        submitters: state.submitters.map(function (s) { return s.name; }),
        active_template: activeTemplate().name,
        mode: state.mode
      },
      tool_count: TOOLS.length
    };
  };
  window.webmcp_list_tools = function () { return TOOLS.map(toolSchema); };

  // Normalise the argument shapes MCP clients actually send: a JSON string,
  // or the payload nested one level under "arguments"/"args"/"input"/"params"
  // (e.g. { arguments: { type: "text" } }). Nested keys win over outer ones.
  function normalizeArgs(args) {
    var a = args;
    if (typeof a === "string") {
      try { a = JSON.parse(a); } catch (e) { return null; }
    }
    if (!a || typeof a !== "object" || Array.isArray(a)) return a ? null : {};
    var WRAPPERS = ["arguments", "args", "input", "params"];
    for (var depth = 0; depth < 3; depth++) {
      var unwrapped = false;
      for (var i = 0; i < WRAPPERS.length; i++) {
        var w = a[WRAPPERS[i]];
        if (w && typeof w === "object" && !Array.isArray(w)) {
          var merged = {};
          Object.keys(a).forEach(function (k) { if (k !== WRAPPERS[i]) merged[k] = a[k]; });
          Object.keys(w).forEach(function (k) { merged[k] = w[k]; });
          a = merged;
          unwrapped = true;
          break;
        }
      }
      if (!unwrapped) break;
    }
    return a;
  }

  window.webmcp_invoke_tool = function (name, args) {
    var t = TOOLS.filter(function (x) { return x.name === name; })[0];
    if (!t) return { ok: false, error: "Unknown tool: " + name };
    var a = normalizeArgs(args == null ? {} : args);
    if (a === null) return { ok: false, error: "Tool arguments must be a JSON object" };
    try { return t.run(a); }
    catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  };
  // Optional modelContext mirror
  try {
    if (typeof navigator !== "undefined") {
      navigator.modelContext = navigator.modelContext || {};
      navigator.modelContext.webmcp = { session_info: window.webmcp_session_info, list_tools: window.webmcp_list_tools, invoke_tool: window.webmcp_invoke_tool };
    }
  } catch (e) {}

  // expose a few action fns for debugging/self-test parity (non-authoritative)

  // ---------------------------------------------------------------- boot
  document.addEventListener("DOMContentLoaded", function () {
    grab();
    wire();
    renderPalette();
    render();
  });
})();
