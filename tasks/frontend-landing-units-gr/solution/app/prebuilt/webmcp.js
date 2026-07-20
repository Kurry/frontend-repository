/*
 * units-gr oracle — WebMCP surface + real menu wiring.
 * Contract: zto-webmcp-v1, module browse-query-v1 (browse_open only).
 * Every tool handler calls the SAME code path a visible control uses.
 * Runs after the app bundle's DOMContentLoaded init (script is last in <body>).
 * In-memory only: no localStorage / sessionStorage.
 * The live units.gr homepage has no theme toggle and no in-page locale switch,
 * so none are added here — the "English" control stays inert, non-navigating chrome.
 */
(function () {
  "use strict";

  /* ---- Real control: menu overlay (backs the hamburger) ------------------ */
  var overlay = null;
  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    overlay.setAttribute("aria-hidden", "true");
    var inner =
      '<div class="nav-overlay__inner"><button type="button" class="nav-overlay__close" aria-label="Κλείσιμο μενού">&times;</button><ul class="nav-overlay__list no-list">';
    document.querySelectorAll(".main-menu .menu-item a").forEach(function (a) {
      var t = a.querySelector(".f-ab-16-120");
      inner += '<li><a href="' + a.getAttribute("href") + '">' + (t ? t.textContent : a.textContent.trim()) + "</a></li>";
    });
    inner += '<li><a href="/book">Book your Unit</a></li></ul></div>';
    overlay.innerHTML = inner;
    document.body.appendChild(overlay);
    overlay.querySelector(".nav-overlay__close").addEventListener("click", closeMenu);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeMenu();
    });
  }
  function openMenu() {
    if (!overlay) buildOverlay();
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
    return true;
  }
  function closeMenu() {
    if (!overlay) return true;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    return true;
  }

  /* ---- Real control: scroll to a homepage section ------------------------ */
  var SECTION_SELECTORS = {
    "home-hero": "section.hero",
    locations: "section.locations",
    living: "section.living",
    "typical-unit": "section.typical_unit",
    community: "section.community",
    "what-we-stand-for": "section.what-we-stand-for",
    "insta-feed": "section.insta-feed",
    "book-cta": "section.arrows-header.background-orange",
    "book-inquiry": "#booking-inquiry-overlay"
  };
  function scrollToEl(el) {
    if (!el) return false;
    if (window.lenis && typeof window.lenis.scrollTo === "function") {
      window.lenis.scrollTo(el, { offset: 0, duration: 1.1 });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return true;
  }
  function browseOpen(destination) {
    if (destination === "menu") return openMenu();
    if (destination === "book-inquiry") { openInquiry(); return true; }
    var sel = SECTION_SELECTORS[destination];
    if (!sel) return false;
    return scrollToEl(document.querySelector(sel));
  }

  /* ---- Wire the hamburger to the real menu ------------------------------- */
  function injectControls() {
    var burger = document.querySelector(".hamburger");
    if (burger) {
      burger.addEventListener("click", function (e) {
        e.preventDefault();
        if (document.body.classList.contains("menu-open")) closeMenu();
        else openMenu();
      });
    }
  }

  /* ---- Neutralize outbound navigation (chrome stays non-navigating) ------ */
  function neutralizeNavigation() {
    // capture phase so we run before the bundle's data-href click handler
    document.addEventListener(
      "click",
      function (e) {
        var el = e.target.closest && e.target.closest("a[href],[data-href]");
        if (!el) return;
        var href = el.getAttribute("href") || "";
        if (href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return; // contact facts
        // Every other homepage anchor/button (nav, Book, socials, the "English"
        // language control) is out-of-scope, inert chrome: keep on page.
        e.preventDefault();
        e.stopImmediatePropagation();
        var logo = el.closest(".logo");
        if (logo) scrollToEl(document.querySelector("section.hero"));
      },
      true
    );
  }

  
  /* ---- Shortlist Logic ---------------------------------------------------- */
  var shortlist = [];
  function getMonthlyEstimate() {
    return shortlist.reduce((sum, item) => sum + item.monthly_rent, 0);
  }
  
  function updateShortlistUI() {
    document.querySelectorAll('.add-to-shortlist-btn').forEach(btn => {
      var tier = btn.getAttribute('data-tier');
      var isSelected = shortlist.some(item => item.tier === tier);
      btn.textContent = isSelected ? 'Remove' : 'Add to Shortlist';
    });
    
    var badge = document.querySelector('.shortlist-badge');
    if (badge) {
      badge.textContent = shortlist.length;
      badge.style.display = shortlist.length > 0 ? 'inline-block' : 'none';
    }
    
    var drawerList = document.querySelector('.shortlist-drawer-list');
    if (drawerList) {
      drawerList.innerHTML = '';
      shortlist.forEach(item => {
        var li = document.createElement('li');
        li.textContent = item.tier + ' - ' + item.monthly_rent + '€';
        drawerList.appendChild(li);
      });
    }
    
    var estimateEl = document.querySelector('.monthly-estimate');
    if (estimateEl) {
      estimateEl.textContent = getMonthlyEstimate() + '€';
    }
  }
  
  window.toggleShortlist = function(tier, monthlyRent) {
    var index = shortlist.findIndex(item => item.tier === tier);
    if (index >= 0) {
      shortlist.splice(index, 1);
    } else {
      shortlist.push({ tier: tier, monthly_rent: monthlyRent });
    }
    updateShortlistUI();
    return true;
  };
  
  window.getShortlist = function() {
    return shortlist;
  }
  
  window.setShortlist = function(newShortlist) {
    shortlist = newShortlist || [];
    updateShortlistUI();
  }
  
  function injectShortlistControls() {
    document.querySelectorAll('.pricing-list li').forEach(li => {
      var tierSpan = li.querySelector('.f-ab-20-120');
      var priceSpan = li.querySelector('.f-a-20-120');
      if (tierSpan && priceSpan) {
        var tier = tierSpan.textContent.trim();
        var price = parseInt(priceSpan.textContent.replace('€/μήνα', '').trim(), 10);
        
        var btn = document.createElement('button');
        btn.className = 'add-to-shortlist-btn cky-btn cky-btn-accept';
        btn.setAttribute('data-tier', tier);
        btn.textContent = 'Add to Shortlist';
        btn.style.marginLeft = '10px';
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          window.toggleShortlist(tier, price);
        });
        
        li.appendChild(btn);
      }
    });
  }

  
  /* ---- Booking Inquiry Logic ---------------------------------------------- */
  var inquiryData = null;
  
  function openInquiry() {
    var dialog = document.getElementById('booking-inquiry-overlay');
    if (dialog) {
      dialog.showModal();
    }
  }
  
  function closeInquiry() {
    var dialog = document.getElementById('booking-inquiry-overlay');
    if (dialog) {
      dialog.close();
    }
  }
  
  function submitInquiry(data) {
    var form = document.getElementById('inquiry-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }
    
    // Check custom patterns if needed, though HTML5 handles most.
    if (!data.email.includes('@')) return false;
    if (data.phone.length < 10) return false;
    if (!/^(0[1-9]|1[0-2])\/20[2-9][0-9]$/.test(data.move_in_month)) return false;
    
    inquiryData = {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      studio_tier: data.studio_tier,
      move_in_month: data.move_in_month,
      message: data.message || "",
      privacy_consent: !!data.privacy_consent
    };
    
    document.getElementById('inquiry-form').style.display = 'none';
    document.getElementById('inquiry-success').style.display = 'block';
    return true;
  }
  
  function getPacketData() {
      return {
          inquiry: inquiryData,
          shortlist: window.getShortlist(),
          monthly_estimate_eur: getMonthlyEstimate()
      };
  }

  function exportJSON() {
    var packet = getPacketData();
    var blob = new Blob([JSON.stringify(packet, null, 2)], {type: "application/json"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'inquiry-packet.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return packet;
  }
  
  function exportMarkdown() {
     var packet = getPacketData();
     var md = "# Inquiry Packet\n\n";
     md += "## Inquiry\n";
     for (var key in packet.inquiry) {
         md += "- **" + key + "**: " + packet.inquiry[key] + "\n";
     }
     md += "\n## Shortlist\n";
     packet.shortlist.forEach(item => {
         md += "- " + item.tier + " (" + item.monthly_rent + "€)\n";
     });
     md += "\n## Monthly Estimate\n";
     md += packet.monthly_estimate_eur + "€\n";
     
     var blob = new Blob([md], {type: "text/markdown"});
     var url = URL.createObjectURL(blob);
     var a = document.createElement('a');
     a.href = url;
     a.download = 'inquiry-packet.md';
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
     return md;
  }

  function importPacket(jsonString) {
      try {
          var data = JSON.parse(jsonString);
          if (data.inquiry && data.shortlist && typeof data.monthly_estimate_eur !== 'undefined') {
              inquiryData = data.inquiry;
              window.setShortlist(data.shortlist);
              
              var form = document.getElementById('inquiry-form');
              form.elements['full_name'].value = inquiryData.full_name || '';
              form.elements['email'].value = inquiryData.email || '';
              form.elements['phone'].value = inquiryData.phone || '';
              form.elements['studio_tier'].value = inquiryData.studio_tier || 'Kick Unit';
              form.elements['move_in_month'].value = inquiryData.move_in_month || '';
              form.elements['message'].value = inquiryData.message || '';
              form.elements['privacy_consent'].checked = inquiryData.privacy_consent || false;
              
              document.getElementById('inquiry-form').style.display = 'block';
              document.getElementById('inquiry-success').style.display = 'none';
              
              return {ok: true};
          }
      } catch (e) {}
      return {ok: false, error: "Invalid format"};
  }

  function injectInquiryControls() {
    document.querySelectorAll('a[href="/book"], button[data-href="/book"]').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        openInquiry();
      });
    });
    
    var closeBtn = document.querySelector('.close-inquiry-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeInquiry);
    }
    
    var form = document.getElementById('inquiry-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(form);
            var data = Object.fromEntries(formData.entries());
            data.privacy_consent = formData.has('privacy_consent');
            submitInquiry(data);
        });
    }
    
    var jsonBtn = document.querySelector('.export-json-btn');
    if (jsonBtn) jsonBtn.addEventListener('click', exportJSON);
    
    var mdBtn = document.querySelector('.export-md-btn');
    if (mdBtn) mdBtn.addEventListener('click', exportMarkdown);
    
    var copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) copyBtn.addEventListener('click', function() {
        var packet = getPacketData();
        navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
    });
    
    var importInput = document.getElementById('import-file');
    if (importInput) {
        importInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(evt) {
                importPacket(evt.target.result);
            };
            reader.readAsText(file);
        });
    }
  }

  /* ---- WebMCP registry --------------------------------------------------- */
    var TOOLS = {
    browse_open: {
      description: "Scroll to / activate a homepage section, or open the menu.",
      enum: { destination: Object.keys(SECTION_SELECTORS).concat(["menu"]) },
      handler: function (args) {
        var d = (args && args.destination) || "";
        var ok = browseOpen(d);
        return { ok: !!ok, destination: d };
      }
    },
    entity_toggle: {
      description: "Toggle a studio in the shortlist.",
      enum: { entity: ["shortlist-studio"], tier: ["Kick Unit", "Boost Unit", "Flex Unit"], monthly_rent: [640, 690, 740] },
      handler: function(args) {
          var t = args && args.tier;
          var r = args && args.monthly_rent;
          if (!t || !r) return {ok: false, error: "Missing args"};
          window.toggleShortlist(t, r);
          var isSelected = window.getShortlist().some(item => item.tier === t);
          return { ok: true, tier: t, selected: isSelected };
      }
    }
  
    form_submit: {
      description: "Submit the booking inquiry form.",
      enum: { form_fields: ["full_name", "email", "phone", "studio_tier", "move_in_month", "message", "privacy_consent"] },
      handler: function(args) {
          var ok = submitInquiry(args);
          return { ok: ok };
      }
    },
    artifact_export: {
       description: "Export the inquiry and shortlist.",
       enum: { export_formats: ["json", "markdown"] },
       handler: function(args) {
           var format = args && args.format;
           var content = "";
           if (format === "markdown") {
               content = exportMarkdown();
           } else {
               content = exportJSON();
           }
           return { ok: true, format: format || "json", result: "Export triggered" };
       }
    },
    artifact_import: {
       description: "Import an inquiry packet.",
       enum: { import_modes: ["inquiry-packet"] },
       handler: function(args) {
           var payload = args && args.payload;
           if (!payload) return {ok: false, error: "Missing payload"};
           return importPacket(payload);
       }
    }
  };

  window.webmcp_session_info = function () {
    return {
      contract_version: "zto-webmcp-v1",
      modules: ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"],
      title: "Units — homepage browse/query",
      browsable_entity: "sections",
      tool_count: Object.keys(TOOLS).length
    };
  };
  window.webmcp_list_tools = function () {
    return Object.keys(TOOLS).map(function (name) {
      return { name: name, description: TOOLS[name].description, args: TOOLS[name].enum };
    });
  };
  window.webmcp_invoke_tool = function (name, args) {
    var t = TOOLS[name];
    if (!t) return { ok: false, error: "unknown_tool: " + name };
    try {
      return t.handler(args || {});
    } catch (err) {
      return { ok: false, error: String((err && err.message) || err) };
    }
  };

  // Optional navigator.modelContext mirror
  try {
    if (typeof navigator !== "undefined") {
      navigator.modelContext = navigator.modelContext || {};
      navigator.modelContext.units = {
        session_info: window.webmcp_session_info,
        list_tools: window.webmcp_list_tools,
        invoke_tool: window.webmcp_invoke_tool
      };
    }
  } catch (e) {}

  function boot() {
    injectControls();
    neutralizeNavigation();
    injectShortlistControls();
    updateShortlistUI();
    injectInquiryControls();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
