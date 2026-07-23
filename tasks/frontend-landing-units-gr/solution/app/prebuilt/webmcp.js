/* Noma oracle — single in-memory store + visible-UI wiring + WebMCP contract.
   zto-webmcp-v1: browse-query-v1, entity-collection-v1, form-workflow-v1,
   artifact-transfer-v1. Every tool handler calls the SAME function a visible
   control uses. In-memory only — no localStorage/sessionStorage. No ground-truth
   state is exposed on window (only the required window.webmcp_* surface). */
(function () {
  "use strict";
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var RENT = { Kick: 640, Boost: 690, Flex: 740 };
  var TIERS = ["Kick", "Boost", "Flex"];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- shared store (closure-private) ---------------- */
  var store = { shortlist: [], undo: [], redo: [], inquiry: null, submitted: false, coachSeen: false };
  function estimate() { return store.shortlist.reduce(function (a, t) { return a + RENT[t]; }, 0); }
  function snapshot() { return store.shortlist.slice(); }

  /* ---------------- DOM refs ---------------- */
  var badge = $('[data-role="badge"]');
  var rows = $('[data-role="rows"]');
  var emptyEl = $('[data-role="empty"]');
  var estEl = $('[data-role="estimate"]');
  var undoBtn = $('[data-action="undo"]');
  var redoBtn = $('[data-action="redo"]');
  var opener = $('[data-action="open-drawer"]');
  var dialog = $("#booking-inquiry-overlay");
  var form = $("#inquiry-form");
  var readyEl = $('[data-role="ready"]');
  var exportActions = $('[data-role="export-actions"]');
  var preview = $('[data-role="preview"]');
  var inqLive = $('[data-role="inq-live"]');
  var importErr = $('[data-role="import-err"]');
  var copiedFlag = $('[data-role="copied"]');
  var pasteBox = $("#import-paste");
  var importFile = $("#import-file");
  var drawer = $("#shortlist-drawer");

  /* ---------------- shortlist render + mutations ---------------- */
  function renderShortlist() {
    if (badge) badge.textContent = String(store.shortlist.length);
    if (estEl) estEl.textContent = estimate() + "€";
    if (rows) {
      rows.innerHTML = "";
      store.shortlist.forEach(function (t) {
        var li = document.createElement("li");
        var label = document.createElement("span");
        label.textContent = t + " Studio " + RENT[t] + "€/μήνα";
        var btn = document.createElement("button");
        btn.type = "button"; btn.textContent = "Remove from shortlist";
        btn.setAttribute("data-tier", t);
        btn.addEventListener("click", function () { toggleTier(t); });
        li.appendChild(label); li.appendChild(btn); rows.appendChild(li);
      });
    }
    if (emptyEl) emptyEl.style.display = store.shortlist.length ? "none" : "block";
    if (rows) rows.style.display = store.shortlist.length ? "flex" : "none";
    if (undoBtn) undoBtn.disabled = store.undo.length === 0;
    if (redoBtn) redoBtn.disabled = store.redo.length === 0;
    $$(".add-to-shortlist-btn").forEach(function (b) {
      var on = store.shortlist.indexOf(b.getAttribute("data-tier")) >= 0;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", (on ? "Remove " : "Add ") + b.getAttribute("data-tier") + " Studio " + (on ? "from" : "to") + " shortlist");
      b.textContent = on ? "Remove from shortlist" : "Add to shortlist";
    });
    refreshPacketPreview();
  }
  function pushUndo() { store.undo.push(snapshot()); store.redo = []; }
  function toggleTier(tier) {
    if (TIERS.indexOf(tier) < 0) return false;
    pushUndo();
    var i = store.shortlist.indexOf(tier);
    if (i >= 0) store.shortlist.splice(i, 1); else store.shortlist.push(tier);
    store.shortlist.sort(function (a, b) { return TIERS.indexOf(a) - TIERS.indexOf(b); });
    renderShortlist(); maybeCoach(); return true;
  }
  function selectTier(tier, selected) {
    if (TIERS.indexOf(tier) < 0) return false;
    var has = store.shortlist.indexOf(tier) >= 0;
    if (selected === has) return true;
    pushUndo();
    if (selected && !has) store.shortlist.push(tier);
    if (!selected && has) store.shortlist.splice(store.shortlist.indexOf(tier), 1);
    store.shortlist.sort(function (a, b) { return TIERS.indexOf(a) - TIERS.indexOf(b); });
    renderShortlist(); maybeCoach(); return true;
  }
  function deleteTier(tier, confirm) {
    if (confirm !== true) return false;
    if (store.shortlist.indexOf(tier) < 0) return true;
    pushUndo(); store.shortlist.splice(store.shortlist.indexOf(tier), 1);
    renderShortlist(); return true;
  }
  function undo() {
    if (!store.undo.length) return false;       // empty history -> no-op, no crash
    store.redo.push(snapshot());
    store.shortlist = store.undo.pop();
    renderShortlist(); return true;
  }
  function redo() {
    if (!store.redo.length) return false;        // nothing undone -> no-op
    store.undo.push(snapshot());
    store.shortlist = store.redo.pop();
    renderShortlist(); return true;
  }

  /* ---------------- drawer ---------------- */
  function openDrawer() {
    document.body.classList.add("drawer-open");
    if (drawer) { drawer.style.right = "0"; drawer.style.transform = "translate3d(0,0,0)"; }
    if (opener) opener.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    document.body.classList.remove("drawer-open");
    if (drawer) { drawer.style.right = ""; drawer.style.transform = ""; }
    if (opener) opener.setAttribute("aria-expanded", "false");
  }

  /* ---------------- smooth scroll (lenis-aware, reduced-safe) ---------------- */
  function scrollToEl(el) {
    if (!el) return false;
    if (REDUCED) { el.scrollIntoView({ block: "start" }); return true; }
    if (window.lenis && typeof window.lenis.scrollTo === "function") { window.lenis.scrollTo(el, { offset: 0, duration: 1.1 }); }
    else { el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    return true;
  }
  function scrollToSel(sel) { return scrollToEl($(sel)); }

  var SECTION = {
    "home-hero": "#top", locations: "#locations", living: "#living",
    "typical-unit": "#typical-studio", community: "#community",
    "what-we-stand-for": "#what-we-stand-for", "insta-feed": "#insta-feed",
    "book-cta": "#book-cta", faq: "#faq"
  };

  /* ---------------- menu overlay ---------------- */
  var overlay = null, savedScrollY = 0, lockHandlers = null, scrollGuard = null;
  var NAV = [
    ["01", "Student Homes", "#typical-studio"], ["02", "Our way of living", "#insta-feed"],
    ["03", "Community", "#community"], ["04", "Επικοινωνία", "#footer-contact"]
  ];
  function buildMenu() {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay"; overlay.id = "nav-overlay"; overlay.setAttribute("aria-hidden", "true");
    var links = NAV.map(function (n) {
      return '<li><a href="' + n[2] + '" data-scroll="' + n[2] + '"><span class="idx"><span>' + n[0] + '</span><svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true"><path d="M1 10 L9.6 1.4 M2.4 1 H10 V8.6" stroke="black" stroke-width="1.6"></path></svg></span><span class="lbl">' + n[1] + '</span></a></li>';
    }).join("");
    overlay.innerHTML = '<div class="nav-overlay__inner"><button type="button" class="nav-overlay__close" data-action="close-menu" aria-label="Κλείσιμο μενού">&times;</button><ul class="nav-overlay__list no-list">' + links + '</ul><button type="button" class="nav-overlay__book" data-action="open-inquiry">Book your Studio</button></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeMenu(); });
  }
  function lockScroll() {
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    if (window.lenis && typeof window.lenis.scrollTo === "function") {
      try { window.lenis.scrollTo(savedScrollY, { immediate: true, duration: 0 }); } catch (e) {}
    }
    document.documentElement.classList.add("menu-locked");
    if (window.lenis && typeof window.lenis.stop === "function") { try { window.lenis.stop(); } catch (e) {} }
    lockHandlers = function (e) { e.preventDefault(); };
    document.addEventListener("wheel", lockHandlers, { passive: false });
    document.addEventListener("touchmove", lockHandlers, { passive: false });
    scrollGuard = function () {
      if (Math.abs((window.scrollY || window.pageYOffset || 0) - savedScrollY) > 1) window.scrollTo(0, savedScrollY);
    };
    window.addEventListener("scroll", scrollGuard, { passive: true });
    window.scrollTo(0, savedScrollY);
  }
  function unlockScroll() {
    document.documentElement.classList.remove("menu-locked");
    if (lockHandlers) {
      document.removeEventListener("wheel", lockHandlers);
      document.removeEventListener("touchmove", lockHandlers);
      lockHandlers = null;
    }
    if (scrollGuard) { window.removeEventListener("scroll", scrollGuard); scrollGuard = null; }
    var y = savedScrollY;
    if (window.lenis) {
      if (typeof window.lenis.start === "function") { try { window.lenis.start(); } catch (e) {} }
      if (typeof window.lenis.scrollTo === "function") window.lenis.scrollTo(y, { immediate: true, duration: 0 });
    }
    window.scrollTo(0, y);
  }
  function openMenu() {
    if (!overlay) buildMenu();
    closeDrawer();
    lockScroll();
    overlay.classList.add("is-open"); overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
    var b = $(".hamburger"); if (b) b.setAttribute("aria-expanded", "true");
    var c = $(".nav-overlay__close");
    if (c) { try { c.focus({ preventScroll: true }); } catch (e) { c.focus(); } }
    requestAnimationFrame(function () { if (scrollGuard) scrollGuard(); });
    return true;
  }
  function closeMenu() {
    if (!overlay) return true;
    overlay.classList.remove("is-open"); overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    var b = $(".hamburger"); if (b) { b.setAttribute("aria-expanded", "false"); }
    unlockScroll();
    return true;
  }

  /* ---------------- inquiry dialog ---------------- */
  var lastOpener = null;
  function openInquiry(openerEl) {
    if (!dialog) return false;
    lastOpener = openerEl || document.activeElement;
    if (typeof dialog.showModal === "function") { if (!dialog.open) dialog.showModal(); }
    else { dialog.setAttribute("open", ""); }
    var f = $('input[name="full_name"]', form); if (f) f.focus();
    return true;
  }
  function closeInquiry() {
    if (!dialog) return false;
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    return true;
  }
  function restoreFocus() { if (lastOpener && lastOpener.focus && document.body.contains(lastOpener)) { try { lastOpener.focus(); } catch (e) {} } }

  function trapDialogFocus(e) {
    if (e.key !== "Tab" || !dialog.open) return;
    var focusable = $$('button:not([disabled]):not([hidden]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', dialog)
      .filter(function (el) { return !el.hidden && el.getClientRects().length > 0; });
    if (!focusable.length) { e.preventDefault(); dialog.focus(); return; }
    var first = focusable[0], last = focusable[focusable.length - 1], active = document.activeElement;
    if (!dialog.contains(active) || (e.shiftKey && active === first) || (!e.shiftKey && active === last)) {
      e.preventDefault(); (e.shiftKey ? last : first).focus();
    }
  }

  function readForm() {
    return {
      full_name: (form.full_name.value || "").trim(),
      email: (form.email.value || "").trim(),
      phone: (form.phone.value || "").trim(),
      studio_tier: form.studio_tier.value,
      move_in_month: (form.move_in_month.value || "").trim(),
      message: (form.message.value || "").trim(),
      privacy_consent: form.privacy_consent.checked
    };
  }
  function writeForm(v) {
    if (!v) return;
    if (v.full_name != null) form.full_name.value = v.full_name;
    if (v.email != null) form.email.value = v.email;
    if (v.phone != null) form.phone.value = v.phone;
    if (v.studio_tier != null) form.studio_tier.value = v.studio_tier;
    if (v.move_in_month != null) form.move_in_month.value = v.move_in_month;
    if (v.message != null) form.message.value = v.message;
    if (v.privacy_consent != null) form.privacy_consent.checked = !!v.privacy_consent;
  }
  function currentMonthStr() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
  function validate(v) {
    var e = {};
    if (typeof v.full_name !== "string" || v.full_name.length < 2 || v.full_name.length > 80) e.full_name = "full_name must be 2–80 characters after trimming.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email || "")) e.email = "email must be a valid address with a dotted domain (e.g. name@example.com).";
    if (((v.phone || "").match(/\d/g) || []).length < 10) e.phone = "phone must contain at least ten digits.";
    if (TIERS.indexOf(v.studio_tier) < 0) e.studio_tier = "studio_tier must be exactly Kick, Boost, or Flex.";
    var mm = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(v.move_in_month || "");
    if (!mm || mm[1] + "-" + mm[2] < currentMonthStr()) e.move_in_month = "move_in_month must be YYYY-MM for the current month or a future month.";
    if (v.message && v.message.length > 500) e.message = "message must be 500 characters or fewer when provided.";
    if (!v.privacy_consent) e.privacy_consent = "privacy consent must be checked (Συμφωνώ με την Πολιτική Απορρήτου).";
    return e;
  }
  function showErrors(errs) {
    $$("[data-err]", form).forEach(function (s) { s.textContent = errs[s.getAttribute("data-err")] || ""; });
    var keys = Object.keys(errs);
    if (inqLive) inqLive.textContent = keys.length ? keys.map(function (k) { return k + ": " + errs[k]; }).join(" ") : "";
  }
  function clearErrors() { $$("[data-err]", form).forEach(function (s) { s.textContent = ""; }); if (inqLive) inqLive.textContent = ""; }
  function setReady(on) {
    if (readyEl) {
      readyEl.hidden = !on;
      readyEl.style.display = on ? 'block' : 'none';
      if (on) readyEl.removeAttribute('hidden'); else readyEl.setAttribute('hidden', '');
    }
    if (exportActions) {
      exportActions.hidden = !on;
      exportActions.style.display = on ? 'flex' : 'none';
      if (on) exportActions.removeAttribute('hidden'); else exportActions.setAttribute('hidden', '');
    }
    if (!on && preview) preview.hidden = true;
  }
  function submitInquiry(values) {
    if (values) writeForm(values);
    var v = readForm(); var errs = validate(v);
    if (Object.keys(errs).length) { store.submitted = false; setReady(false); showErrors(errs); return { ok: false, errors: errs }; }
    clearErrors();
    if (importErr) importErr.textContent = "";
    store.inquiry = v; store.submitted = true;
    setReady(true);
    preview.textContent = JSON.stringify(buildPacket(), null, 2); preview.hidden = false;
    return { ok: true };
  }
  function resetForm() { form.reset(); clearErrors(); store.submitted = false; store.inquiry = null; setReady(false); if (importErr) importErr.textContent = ""; if (pasteBox) pasteBox.value = ""; }

  function buildPacket() {
    if (!store.submitted || !store.inquiry) return null;
    var inq = store.inquiry;
    return {
      inquiry: {
        full_name: inq.full_name, email: inq.email, phone: inq.phone, studio_tier: inq.studio_tier,
        move_in_month: inq.move_in_month, message: inq.message || "", privacy_consent: !!inq.privacy_consent, submitted: true
      },
      shortlist: store.shortlist.map(function (t) { return { tier: t, monthly_rent_eur: RENT[t] }; }),
      monthly_estimate_eur: estimate()
    };
  }
  function refreshPacketPreview() {
    if (!preview || preview.hidden || !store.submitted) return;
    var packet = buildPacket();
    if (packet) preview.textContent = JSON.stringify(packet, null, 2);
  }
  function download(name, text, type) {
    try {
      var blob = new Blob([text], { type: type }); var url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) {}
  }
  function exportJSON() { var p = buildPacket(); if (!p) return false; var t = JSON.stringify(p, null, 2); if (preview) { preview.textContent = t; preview.hidden = false; } download("noma-inquiry-packet.json", t, "application/json"); return true; }
  function exportMarkdown() {
    var p = buildPacket(); if (!p) return false; var i = p.inquiry;
    var md = "# Noma inquiry packet\n\n## Inquiry\n- full_name: " + i.full_name + "\n- email: " + i.email + "\n- phone: " + i.phone + "\n- studio_tier: " + i.studio_tier + "\n- move_in_month: " + i.move_in_month + "\n- message: " + (i.message || "") + "\n- privacy_consent: " + i.privacy_consent + "\n- submitted: " + i.submitted + "\n\n## Shortlist\n" + (p.shortlist.length ? p.shortlist.map(function (s) { return "- " + s.tier + " Studio (" + s.monthly_rent_eur + "€/μήνα)"; }).join("\n") : "- (none)") + "\n\n## Monthly estimate\n" + p.monthly_estimate_eur + "€\n";
    if (preview) { preview.textContent = md; preview.hidden = false; }
    download("noma-inquiry-packet.md", md, "text/markdown"); return true;
  }
  function copyPacket() {
    var p = buildPacket(); if (!p) return Promise.resolve(false); var t = JSON.stringify(p, null, 2);
    if (preview) { preview.textContent = t; preview.hidden = false; }
    function flag() { if (inqLive) inqLive.textContent = ""; if (copiedFlag) { copiedFlag.hidden = false; setTimeout(function () { copiedFlag.hidden = true; }, 1500); } }
    function fail() { if (inqLive) inqLive.textContent = "Copy failed. Use Export JSON instead."; return false; }
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { flag(); return true; }, function () { if (legacyCopy(t)) { flag(); return true; } return fail(); });
    if (legacyCopy(t)) { flag(); return Promise.resolve(true); }
    return Promise.resolve(fail());
  }
  function legacyCopy(t) { var ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand("copy") === true; } catch (e) {} document.body.removeChild(ta); return ok; }

  function hasExactKeys(value, keys) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    var actual = Object.keys(value).sort(); var expected = keys.slice().sort();
    return actual.length === expected.length && actual.every(function (key, index) { return key === expected[index]; });
  }

  function importPacket(payload) {
    var data = payload;
    if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { return importFail("payload is not valid JSON"); } }
    if (!hasExactKeys(data, ["inquiry", "shortlist", "monthly_estimate_eur"])) return importFail("packet must contain only inquiry, shortlist, and monthly_estimate_eur");
    var i = data.inquiry;
    var inquiryKeys = ["full_name", "email", "phone", "studio_tier", "move_in_month", "message", "privacy_consent", "submitted"];
    if (!hasExactKeys(i, inquiryKeys)) return importFail("inquiry must contain exactly the required packet fields");
    if (typeof i.full_name !== "string" || typeof i.email !== "string" || typeof i.phone !== "string" || typeof i.studio_tier !== "string" || typeof i.move_in_month !== "string" || typeof i.message !== "string" || i.privacy_consent !== true || i.submitted !== true) return importFail("inquiry field types or submitted/privacy values are invalid");
    var normalized = { full_name: i.full_name.trim(), email: i.email.trim(), phone: i.phone.trim(), studio_tier: i.studio_tier, move_in_month: i.move_in_month.trim(), message: i.message.trim(), privacy_consent: i.privacy_consent };
    if (normalized.full_name !== i.full_name || normalized.email !== i.email || normalized.phone !== i.phone || normalized.move_in_month !== i.move_in_month || normalized.message !== i.message) return importFail("inquiry strings must already be trimmed");
    var errs = validate(normalized);
    if (Object.keys(errs).length) return importFail("inquiry fields invalid: " + Object.keys(errs).join(", "));
    if (!Array.isArray(data.shortlist)) return importFail("shortlist must be an array");
    var sum = 0; var seen = {};
    for (var s = 0; s < data.shortlist.length; s++) {
      var it = data.shortlist[s];
      if (!hasExactKeys(it, ["tier", "monthly_rent_eur"]) || typeof it.tier !== "string" || typeof it.monthly_rent_eur !== "number" || TIERS.indexOf(it.tier) < 0) return importFail("shortlist entries require a valid tier and numeric monthly_rent_eur");
      if (seen[it.tier]) return importFail("shortlist contains duplicate tier: " + it.tier);
      seen[it.tier] = true;
      if (it.monthly_rent_eur !== RENT[it.tier]) return importFail("shortlist rent does not match " + it.tier + " (" + RENT[it.tier] + ")");
      sum += RENT[it.tier];
    }
    if (typeof data.monthly_estimate_eur !== "number" || data.monthly_estimate_eur !== sum) return importFail("monthly_estimate_eur (" + data.monthly_estimate_eur + ") does not equal shortlist sum (" + sum + ")");
    // valid -> restore whole session atomically
    store.undo = []; store.redo = [];
    store.shortlist = data.shortlist.map(function (it) { return it.tier; }).sort(function (a, b) { return TIERS.indexOf(a) - TIERS.indexOf(b); });
    writeForm(normalized);
    store.inquiry = normalized; store.submitted = true;
    clearErrors();
    setReady(true);
    preview.textContent = JSON.stringify(buildPacket(), null, 2); preview.hidden = false;
    if (importErr) importErr.textContent = "";
    renderShortlist();
    maybeCoach();
    return { ok: true };
  }
  function importFail(reason) { if (importErr) importErr.textContent = "Import failed: " + reason + " Current session was not changed."; return { ok: false, error: reason }; }

  /* ---------------- coachmark ---------------- */
  var coach = $("#coach");
  function maybeCoach() { if (store.shortlist.length && coach) coach.classList.remove("show"); }
  function showCoach() {
    if (!coach || store.coachSeen || store.shortlist.length) return;
    store.coachSeen = true;
    // anchor to the (always visible) shortlist opener, bottom-right — never over the sidebar/hero
    var o = opener ? opener.getBoundingClientRect() : null;
    if (o) { coach.style.left = Math.max(8, Math.min(window.innerWidth - 250, o.right - 240)) + "px"; coach.style.top = Math.max(8, o.top - 80) + "px"; }
    else { coach.style.right = "18px"; coach.style.bottom = "80px"; }
    coach.classList.add("show");
    setTimeout(function () { if (coach) coach.classList.remove("show"); }, 9000);
  }

  /* ---------------- lottie-style mini renderer (reduced-safe) ---------------- */
  function bootLottie() {
    $$("[data-json]").forEach(function (host) {
      var g = $(".lh-house", host); if (!g) return;
      var url = host.getAttribute("data-json");
      fetch(url).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
        if (!j || !Array.isArray(j.layers) || !j.layers[0]) throw 0;
        var fr = j.fr || 30, op = j.op || 60, ks = j.layers[0].ks, rk = ks && ks.r && ks.r.k;
        var base = "translate(50,55)";
        if (REDUCED || !Array.isArray(rk)) { g.setAttribute("transform", base + " rotate(0)"); return; }
        var keys = rk; var t0 = null;
        function valAt(frame) {
          for (var k = 0; k < keys.length - 1; k++) {
            var a = keys[k], b = keys[k + 1];
            if (frame >= a.t && frame <= b.t) { var p = (frame - a.t) / Math.max(1, (b.t - a.t)); var e = 0.5 - 0.5 * Math.cos(p * Math.PI); return a.s[0] + (b.s[0] - a.s[0]) * e; }
          }
          return keys[keys.length - 1].s[0];
        }
        function tick(ts) { if (t0 === null) t0 = ts; var frame = (((ts - t0) / 1000) * fr) % op; g.setAttribute("transform", base + " rotate(" + valAt(frame).toFixed(2) + ")"); requestAnimationFrame(tick); }
        requestAnimationFrame(tick);
      }).catch(function () { /* static fallback already drawn inline */ });
    });
  }

  /* ---------------- global click delegation + neutralization ---------------- */
  function onDocClick(e) {
    var scrollEl = e.target.closest && e.target.closest("[data-scroll]");
    var actEl = e.target.closest && e.target.closest("[data-action]");
    var togEl = e.target.closest && e.target.closest(".add-to-shortlist-btn");
    var anchor = e.target.closest && e.target.closest("a[href]");
    if (togEl) { e.preventDefault(); toggleTier(togEl.getAttribute("data-tier")); return; }
    if (scrollEl) {
      e.preventDefault();
      var sel = scrollEl.getAttribute("data-scroll");
      if (document.body.classList.contains("menu-open") && !scrollEl.closest(".nav-overlay__book")) closeMenu();
      scrollToSel(sel); return;
    }
    if (actEl) { e.preventDefault(); dispatch(actEl.getAttribute("data-action"), actEl); return; }
    if (anchor && (anchor.hasAttribute("download") || (anchor.getAttribute("href") || "").indexOf("blob:") === 0)) return;
    if (anchor) {
      e.preventDefault(); e.stopImmediatePropagation();   // homepage-only: never navigate
      var href = anchor.getAttribute("href") || "";
      if (href === "#top" || anchor.closest(".logo")) scrollToSel("#top");
    }
  }
  function dispatch(action, el) {
    switch (action) {
      case "open-inquiry": openInquiry(el); break;
      case "close-inquiry": closeInquiry(); break;
      case "reset-inquiry": resetForm(); break;
      case "import-open":
        if (pasteBox && pasteBox.value.trim()) importPacket(pasteBox.value.trim());
        else if (importFile) importFile.click();
        else if (pasteBox) pasteBox.focus();
        break;
      case "export-json": exportJSON(); break;
      case "export-md": exportMarkdown(); break;
      case "copy-packet": copyPacket(); break;
      case "open-drawer": openDrawer(); break;
      case "close-drawer": closeDrawer(); break;
      case "open-menu": openMenu(); break;
      case "close-menu": closeMenu(); break;
      case "undo": undo(); break;
      case "redo": redo(); break;
      case "coach-close": store.coachSeen = true; if (coach) coach.classList.remove("show"); break;
      case "noop": default: break;
    }
  }

  /* ---------------- FAQ accordion (exclusive) ---------------- */
  function bootFaq() {
    $$(".faq-q").forEach(function (q) {
      q.addEventListener("click", function () {
        var item = q.closest(".faq-item"); var isOpen = item.classList.contains("open");
        $$(".faq-item.open").forEach(function (o) { o.classList.remove("open"); var b = $(".faq-q", o); if (b) b.setAttribute("aria-expanded", "false"); });
        if (!isOpen) { item.classList.add("open"); q.setAttribute("aria-expanded", "true"); }
        else { q.setAttribute("aria-expanded", "false"); }
      });
    });
  }

  /* ---------------- command palette ---------------- */
  var palette = $("#cmd-palette"), cmdInput = $("#cmd-input"), cmdList = $("#cmd-list"), cmdActive = 0, cmdFiltered = [];
  var CMD = [
    ["Student Homes", "typical-unit", "#typical-studio"], ["Our way of living", "insta-feed", "#insta-feed"],
    ["Community", "community", "#community"], ["Values", "what-we-stand-for", "#what-we-stand-for"],
    ["Locations", "locations", "#locations"], ["Living", "living", "#living"],
    ["FAQs", "faq", "#faq"], ["Book your Studio", "book-inquiry", null], ["Shortlist", "shortlist", null]
  ];
  function renderCmd(q) {
    q = (q || "").toLowerCase();
    cmdFiltered = CMD.filter(function (c) { return !q || c[0].toLowerCase().indexOf(q) >= 0 || c[1].indexOf(q) >= 0; });
    cmdActive = 0; cmdList.innerHTML = "";
    if (!cmdFiltered.length) { cmdList.innerHTML = '<li class="cmd-empty">No matches</li>'; return; }
    cmdFiltered.forEach(function (c, i) {
      var li = document.createElement("li"); li.className = "cmd-item" + (i === 0 ? " active" : ""); li.setAttribute("role", "option");
      li.innerHTML = '<span>' + c[0] + '</span><span class="hint">' + c[1] + '</span>';
      li.addEventListener("click", function () { chooseCmd(i); });
      li.addEventListener("mouseenter", function () { setCmdActive(i); });
      cmdList.appendChild(li);
    });
  }
  function setCmdActive(i) { cmdActive = i; $$(".cmd-item", cmdList).forEach(function (li, k) { li.classList.toggle("active", k === i); }); }
  function chooseCmd(i) { var c = cmdFiltered[i]; if (!c) return; closePalette(); if (c[1] === "book-inquiry") openInquiry(); else if (c[1] === "shortlist") openDrawer(); else scrollToSel(c[2]); }
  function openPalette(query) { if (!palette) return false; var q = query || ""; palette.classList.add("open"); cmdInput.value = q; renderCmd(q); cmdInput.focus(); return true; }
  function closePalette() { if (!palette) return; palette.classList.remove("open"); }
  function bootPalette() {
    if (!palette) return;
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); palette.classList.contains("open") ? closePalette() : openPalette(); return; }
      if (!palette.classList.contains("open")) return;
      if (e.key === "Escape") { e.preventDefault(); closePalette(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setCmdActive(Math.min(cmdFiltered.length - 1, cmdActive + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setCmdActive(Math.max(0, cmdActive - 1)); }
      else if (e.key === "Enter") { e.preventDefault(); chooseCmd(cmdActive); }
    });
    cmdInput.addEventListener("input", function () { renderCmd(cmdInput.value); });
    palette.addEventListener("click", function (e) { if (e.target === palette) closePalette(); });
  }

  /* ---------------- dialog close/escape + focus restore ---------------- */
  function bootDialog() {
    if (!dialog) return;
    dialog.addEventListener("keydown", trapDialogFocus);
    dialog.addEventListener("close", restoreFocus);
    dialog.addEventListener("cancel", function () { setTimeout(restoreFocus, 0); });
    form.addEventListener("submit", function (e) { e.preventDefault(); submitInquiry(); });
    form.addEventListener("input", function (event) {
      if (event.target === pasteBox || event.target === importFile) return;
      if (!store.inquiry) return;
      var values = readForm();
      if (Object.keys(validate(values)).length) { store.submitted = false; setReady(false); return; }
      store.inquiry = values; store.submitted = true; setReady(true);
      if (preview) { preview.textContent = JSON.stringify(buildPacket(), null, 2); preview.hidden = false; }
    });
    if (importFile) importFile.addEventListener("change", function () {
      var file = importFile.files && importFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { importPacket(String(reader.result || "")); importFile.value = ""; };
      reader.onerror = function () { importFail("file could not be read"); importFile.value = ""; };
      reader.readAsText(file);
    });
  }

  /* ---------------- deterministic living carousel ---------------- */
  function bootLivingCarousel() {
    var root = $(".swiper-living");
    if (!root) return;
    var wrapper = $(".swiper-wrapper", root), slides = $$(".swiper-slide", root);
    var next = $(".button-next", root), previous = $(".button-prev", root);
    if (!wrapper || slides.length < 2 || !next || !previous) return;
    if (root.swiper && typeof root.swiper.destroy === "function") {
      try { root.swiper.destroy(false, false); } catch (e) {}
    }
    var index = 0;
    var status = document.createElement("span");
    status.className = "living-slide-status";
    status.setAttribute("aria-live", "polite");
    var controls = $(".swiper-controls", root);
    if (controls) controls.appendChild(status);
    function render(animate) {
      var target = slides[index];
      wrapper.style.transition = !animate || REDUCED ? "none" : "transform .45s cubic-bezier(.19,1,.22,1)";
      wrapper.style.transform = "translate3d(" + (-target.offsetLeft) + "px,0,0)";
      slides.forEach(function (slide, slideIndex) { slide.setAttribute("aria-current", slideIndex === index ? "true" : "false"); });
      previous.disabled = index === 0;
      next.disabled = index === slides.length - 1;
      previous.classList.toggle("swiper-button-disabled", previous.disabled);
      next.classList.toggle("swiper-button-disabled", next.disabled);
      var title = $(".data-wrap .title", target);
      var titleText = title ? title.textContent.trim() : "";
      if (titleText.toLowerCase() === "community living spaces") {
        titleText = "Community living spaces";
      }
      status.textContent = (index + 1) + " / " + slides.length + (titleText ? " · " + titleText : "");
    }
    function move(delta) {
      var nextIndex = Math.max(0, Math.min(slides.length - 1, index + delta));
      if (nextIndex === index) return;
      index = nextIndex; render(true);
    }
    next.addEventListener("click", function (event) { event.preventDefault(); event.stopImmediatePropagation(); move(1); }, true);
    previous.addEventListener("click", function (event) { event.preventDefault(); event.stopImmediatePropagation(); move(-1); }, true);
    window.addEventListener("resize", function () { render(false); });
    requestAnimationFrame(function () { render(false); });
  }

  /* ---------------- WebMCP contract ---------------- */
  var DESTINATIONS = Object.keys(SECTION).concat(["shortlist", "book-inquiry", "menu"]);
  var FORM_FIELDS = ["full_name", "email", "phone", "studio_tier", "move_in_month", "message", "privacy_consent"];
  function objectSchema(properties, required) { var schema = { type: "object", additionalProperties: false, properties: properties }; if (required && required.length) schema.required = required; return schema; }
  function formSchema() { return objectSchema({ fields: { type: "object", additionalProperties: { type: "string", maxLength: 200 } } }); }
  function webmcpFormValues(args) {
    var fields = args && args.fields;
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) return {};
    var out = {};
    Object.keys(fields).forEach(function (key) {
      if (FORM_FIELDS.indexOf(key) < 0 || typeof fields[key] !== "string" || fields[key].length > 200) throw new Error("invalid form field: " + key);
      out[key] = key === "privacy_consent" ? fields[key] === "true" : fields[key];
    });
    return out;
  }
  function validateToolInput(schema, args) {
    if (!args || typeof args !== "object" || Array.isArray(args)) return "arguments must be an object";
    var properties = schema.properties || {};
    var unknown = Object.keys(args).filter(function (key) { return !(key in properties); });
    if (unknown.length) return "unknown argument: " + unknown[0];
    var missing = (schema.required || []).filter(function (key) { return args[key] === undefined; });
    if (missing.length) return "missing required argument: " + missing[0];
    for (var key in properties) {
      if (args[key] === undefined) continue;
      var rule = properties[key]; var value = args[key];
      if (rule.type === "string" && typeof value !== "string") return key + " must be a string";
      if (rule.type === "boolean" && typeof value !== "boolean") return key + " must be a boolean";
      if (rule.type === "object" && (!value || typeof value !== "object" || Array.isArray(value))) return key + " must be an object";
      if (rule.maxLength && typeof value === "string" && value.length > rule.maxLength) return key + " is too long";
      if (rule.enum && rule.enum.indexOf(value) < 0) return key + " is outside the declared enum";
      if (rule.const !== undefined && value !== rule.const) return key + " must equal " + rule.const;
      if (rule.type === "object" && rule.additionalProperties && typeof rule.additionalProperties === "object") {
        for (var nestedKey in value) {
          var nested = value[nestedKey]; var nestedRule = rule.additionalProperties;
          if (nestedRule.type === "string" && typeof nested !== "string") return key + "." + nestedKey + " must be a string";
          if (nestedRule.maxLength && typeof nested === "string" && nested.length > nestedRule.maxLength) return key + "." + nestedKey + " is too long";
        }
      }
    }
    return "";
  }
  function entityId(args) { var id = args && args.id; if (typeof id !== "string" || id.length > 128 || TIERS.indexOf(id) < 0) throw new Error("id must be Kick, Boost, or Flex"); return id; }
  var TOOLS = {
    "browse.open": { description: "Open a declared destination (route, tab, section, or item).",
      inputSchema: objectSchema({ destination: { type: "string", enum: DESTINATIONS, description: "Declared destination" } }, ["destination"]),
      handler: function (a) { var d = a && a.destination; if (DESTINATIONS.indexOf(d) < 0) return { ok: false, error: "invalid destination" }; if (d === "menu") return { ok: openMenu(), destination: d }; if (d === "book-inquiry") return { ok: openInquiry(), destination: d }; if (d === "shortlist") { openDrawer(); return { ok: true, destination: d }; } return { ok: !!scrollToSel(SECTION[d]), destination: d }; } },
    "browse.search": { description: "Search within the browsable surface.",
      inputSchema: objectSchema({ query: { type: "string", maxLength: 200 } }, ["query"]),
      handler: function (a) { var q = a && a.query; if (typeof q !== "string" || q.length > 200) return { ok: false, error: "query must be a string of 200 characters or fewer" }; return { ok: openPalette(q), matches: cmdFiltered.length }; } },
    "entity.toggle": { description: "Toggle a boolean field on an entity.",
      inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, field: { type: "string", enum: ["tier", "monthly_rent", "selected"] } }, ["id"]),
      handler: function (a) { var t = entityId(a); if (a.field !== undefined && a.field !== "selected") return { ok: false, error: "only the selected field is toggleable" }; toggleTier(t); return { ok: true, id: t, selected: store.shortlist.indexOf(t) >= 0, monthly_estimate_eur: estimate() }; } },
    "entity.select": { description: "Select an entity by public id.",
      inputSchema: objectSchema({ id: { type: "string", maxLength: 128 } }, ["id"]),
      handler: function (a) { var t = entityId(a); selectTier(t, true); return { ok: true, id: t, selected: true, monthly_estimate_eur: estimate() }; } },
    "entity.delete": { description: "Delete an entity with explicit confirmation.",
      inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, confirm: { type: "boolean", const: true } }, ["id", "confirm"]),
      handler: function (a) { var t = entityId(a); if (!a || a.confirm !== true) return { ok: false, error: "delete requires confirm=true" }; deleteTier(t, true); return { ok: true, id: t, selected: false, monthly_estimate_eur: estimate() }; } },
    "form.validate": { description: "Run declared form validation.", inputSchema: formSchema(),
      handler: function (a) { writeForm(webmcpFormValues(a)); store.submitted = false; setReady(false); var errs = validate(readForm()); showErrors(errs); return { ok: Object.keys(errs).length === 0, errors: errs }; } },
    "form.submit": { description: "Submit the form through the visible handler.", inputSchema: formSchema(),
      handler: function (a) { var r = submitInquiry(webmcpFormValues(a)); return { ok: r.ok, errors: r.errors || null }; } },
    "form.cancel": { description: "Cancel the active form workflow.", inputSchema: objectSchema({}), handler: function () { return { ok: closeInquiry() }; } },
    "form.reset": { description: "Reset the form to its initial state.", inputSchema: objectSchema({}), handler: function () { resetForm(); return { ok: true }; } },
    "artifact.import": { description: "Start a declared import mode (no file bytes in WebMCP).",
      inputSchema: objectSchema({ mode: { type: "string", enum: ["inquiry-packet"] } }, ["mode"]),
      handler: function (a) { if (!a || a.mode !== "inquiry-packet") return { ok: false, error: "invalid import mode" }; openInquiry(); if (pasteBox) pasteBox.focus(); return { ok: true, mode: a.mode, import_started: true }; } },
    "artifact.export": { description: "Export using a declared format (no blob/base64 in results).",
      inputSchema: objectSchema({ format: { type: "string", enum: ["json", "markdown"] } }, ["format"]),
      handler: function (a) { var f = a && a.format; if (f !== "json" && f !== "markdown") return { ok: false, error: "invalid export format" }; var ok = f === "markdown" ? exportMarkdown() : exportJSON(); return ok ? { ok: true, format: f, export_started: true } : { ok: false, error: "submit a valid inquiry before exporting" }; } },
    "artifact.copy": { description: "Trigger copy via the visible control (clipboard verified in Playwright).", inputSchema: objectSchema({}),
      handler: function () { return copyPacket().then(function (ok) { return ok ? { ok: true, copy_triggered: true } : { ok: false, error: "copy failed or inquiry not ready" }; }); } }
  };
  window.webmcp_session_info = function () {
    return { contract_version: "zto-webmcp-v1", title: "Noma Student Homes — homepage",
      modules: ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"],
      browsable_entity: "sections", entity: "shortlist-studio", tool_count: Object.keys(TOOLS).length };
  };
  window.webmcp_list_tools = function () { return Object.keys(TOOLS).map(function (n) { return { name: n, description: TOOLS[n].description, inputSchema: TOOLS[n].inputSchema }; }); };
  function settleVisibleUi() { return new Promise(function (resolve) { requestAnimationFrame(function () { requestAnimationFrame(resolve); }); }); }
  window.webmcp_invoke_tool = async function (name, args) {
    var t = TOOLS[name]; if (!t) return { ok: false, error: "unknown_tool: " + name };
    var input = args || {}; var inputError = validateToolInput(t.inputSchema, input); if (inputError) return { ok: false, error: inputError };
    try { var result = await t.handler(input); await settleVisibleUi(); return result; }
    catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
  };

  /* ---------------- boot ---------------- */
  function boot() {
    var consentDismissed = false;
    document.addEventListener("click", onDocClick, true);  // capture: neutralize + delegate
    $(".hamburger") && $(".hamburger").addEventListener("click", function (e) { e.preventDefault(); document.body.classList.contains("menu-open") ? closeMenu() : openMenu(); });
    var consent = $("#cky-consent-container");
    if (consent) {
      consent.classList.add("is-visible");
      new MutationObserver(function () { if (consentDismissed && consent.classList.contains("is-visible")) consent.classList.remove("is-visible"); })
        .observe(consent, { attributes: true, attributeFilter: ["class"] });
    }
    $$("[data-consent]").forEach(function (b) { b.addEventListener("click", function () { consentDismissed = true; if (consent) consent.classList.remove("is-visible"); }); });
    renderShortlist();
    bootFaq(); bootDialog(); bootPalette(); bootLottie(); bootLivingCarousel();
    setTimeout(function () { if (consent && !consentDismissed && !consent.classList.contains("is-visible")) consent.classList.add("is-visible"); }, 1300);
    setTimeout(showCoach, 4500);
    function syncLenis() { if (!window.lenis) return; try { if (document.body.classList.contains("menu-open")) { window.lenis.stop && window.lenis.stop(); } else { window.lenis.start && window.lenis.start(); } } catch (e) {} }
    window.addEventListener("resize", function () { if (window.innerWidth >= 1024 && document.body.classList.contains("menu-open")) closeMenu(); syncLenis(); });
    var desktopMedia = window.matchMedia && window.matchMedia("(min-width: 1024px)");
    if (desktopMedia && desktopMedia.addEventListener) desktopMedia.addEventListener("change", function (event) { if (event.matches && document.body.classList.contains("menu-open")) closeMenu(); syncLenis(); });
    syncLenis();
    window.addEventListener("scroll", function onscroll() { if (store.coachSeen) return; var t = $(".typical_unit"); if (t && t.getBoundingClientRect().top < window.innerHeight) { showCoach(); window.removeEventListener("scroll", onscroll); } }, { passive: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
