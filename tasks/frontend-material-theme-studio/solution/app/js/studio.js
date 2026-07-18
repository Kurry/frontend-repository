/* Material Theme Studio — app shell, preview, tools, Monaco sync */
(function () {
  "use strict";

  var TS = window.ThemeStudio;
  var state = {
    themes: [],
    activeId: null,
    options: null,
    fonts: ["Roboto"],
    tool: "palette",
    openAccordions: { Type: true },
    device: "desktop",
    sample: "instructions",
    editor: null,
    syncingEditor: false,
    dirty: false,
    undoStack: [],
    redoStack: [],
  };

  var COMPONENTS = [
    "Accordion",
    "App Bar",
    "Avatar",
    "Badge",
    "Bottom Navigation",
    "Buttons",
    "Card",
    "Checkboxes",
    "Chip",
    "Dialog",
    "Floating Action Button",
    "Icon",
    "List",
    "Menu",
    "Progress",
    "Radio",
    "Select",
    "Slider",
    "Snackbar",
    "Stepper",
    "Switch",
    "Table",
    "Tabs",
    "TextField",
    "Tooltip",
    "Typography",
  ];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 2200);
  }

  function setStatus(text) {
    $("#editor-status").textContent = text;
  }

  function uid() {
    return "theme-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function getActiveTheme() {
    return state.themes.find(function (t) {
      return t.id === state.activeId;
    });
  }

  function pushHistory() {
    state.undoStack.push(TS.deepClone(state.options));
    if (state.undoStack.length > 40) state.undoStack.shift();
    state.redoStack = [];
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    $("#btn-undo").disabled = !state.undoStack.length;
    $("#btn-redo").disabled = !state.redoStack.length;
  }

  function commitOptions(next, opts) {
    opts = opts || {};
    if (!opts.skipHistory) pushHistory();
    state.options = next;
    state.dirty = true;
    setStatus("Unsaved changes");
    TS.applyCssVars(state.options);
    if (!opts.skipEditor) syncEditorFromOptions();
    if (!opts.skipTools) renderTools();
    if (state.sample) renderSampleBody();
    if ($("#panel-components").classList.contains("is-active")) renderGallery();
    updateHistoryButtons();
  }

  function syncEditorFromOptions() {
    if (!state.editor) return;
    var src = TS.toEditorSource(state.options);
    var current = state.editor.getValue();
    if (current === src) return;
    state.syncingEditor = true;
    state.editor.setValue(src);
    state.syncingEditor = false;
  }

  function applyThemeRecord(theme, opts) {
    state.activeId = theme.id;
    state.options = TS.deepClone(theme.options);
    state.fonts = (theme.fonts || ["Roboto"]).slice();
    TS.setActiveId(theme.id);
    TS.applyCssVars(state.options);
    loadFonts(state.fonts);
    if (!opts || !opts.skipEditor) syncEditorFromOptions();
    renderTools();
    renderSampleBody();
    renderSaved();
    setStatus("All changes saved");
    state.dirty = false;
    state.undoStack = [];
    state.redoStack = [];
    updateHistoryButtons();
  }

  function persistActive() {
    var theme = getActiveTheme();
    if (!theme) return;
    theme.options = TS.deepClone(state.options);
    theme.fonts = state.fonts.slice();
    theme.updatedAt = Date.now();
    TS.saveThemes(state.themes);
    state.dirty = false;
    setStatus("All changes saved");
    renderSaved();
    toast("Theme saved");
  }

  /* —— Sample preview content —— */
  function renderSampleBody() {
    var body = $("#sample-body");
    var html = "";
    switch (state.sample) {
      case "signup":
        html =
          '<div class="sample-card"><h2>Sign Up</h2><div class="form-stack">' +
          '<div class="field"><label>Email</label><input type="email" placeholder="you@example.com" /></div>' +
          '<div class="field"><label>Password</label><input type="password" placeholder="••••••••" /></div>' +
          '<button type="button" class="mui-btn mui-btn--contained">Create account</button>' +
          '<button type="button" class="mui-btn mui-btn--text">Already have an account?</button>' +
          "</div></div>";
        break;
      case "dashboard":
        html =
          "<h2>Dashboard</h2><div class='dash-stats'>" +
          "<div class='stat'><span>Active users</span><strong>1,284</strong></div>" +
          "<div class='stat'><span>Sessions</span><strong>8,902</strong></div>" +
          "<div class='stat'><span>Conversion</span><strong>3.4%</strong></div>" +
          "</div><div class='sample-card' style='margin-top:16px'><h3>Recent activity</h3><p>Hover preview components for theme context. Primary and secondary colors drive chrome and accents.</p></div>";
        break;
      case "blog":
        html =
          "<h2>Blog</h2><article class='sample-card'><h3>Designing with ThemeOptions</h3><p>Palette, typography, and snippets stay in sync with the Monaco model so you can export production-ready theme code.</p><button type='button' class='sample-link'>Read more</button></article>" +
          "<article class='sample-card'><h3>Preview templates</h3><p>Switch device frames and sample tabs without leaving the page.</p></article>";
        break;
      case "pricing":
        html =
          "<h2>Pricing</h2><div class='pricing-grid'>" +
          "<div class='price-card'><h3>Free</h3><div class='price'>$0</div><button type='button' class='mui-btn mui-btn--outlined'>Start</button></div>" +
          "<div class='price-card'><h3>Pro</h3><div class='price'>$29</div><button type='button' class='mui-btn mui-btn--contained'>Upgrade</button></div>" +
          "<div class='price-card'><h3>Team</h3><div class='price'>$99</div><button type='button' class='mui-btn mui-btn--secondary'>Contact</button></div>" +
          "</div>";
        break;
      case "checkout":
        html =
          "<h2>Checkout</h2><div class='sample-card'><div class='form-stack'>" +
          "<div class='field'><label>Cardholder</label><input type='text' placeholder='Name on card' /></div>" +
          "<div class='field'><label>Card number</label><input type='text' placeholder='ACCT-000003' /></div>" +
          "<button type='button' class='mui-btn mui-btn--contained'>Pay now</button>" +
          "</div></div>";
        break;
      default:
        html =
          '<button type="button" class="sample-link" id="sample-tutorial-link">Check out the Tutorial!</button>' +
          "<h5 style='margin-top:16px'>Editor Usage</h5>" +
          "<ul class='feature-list'>" +
          "<li><span class='material-icons'>build</span><div><strong>Theme Tools</strong>" +
          "<div><strong>Palette</strong> — Configure palette options like primary, secondary, and surface colors</div>" +
          "<div><strong>Fonts</strong> — Add <button type='button' class='sample-link inert-nav'>Google Fonts</button> to use on typography elements on this page</div>" +
          "<div><strong>Typography</strong> — Configure typography options like font sizes and font families</div>" +
          "</div></li>" +
          "<li><span class='material-icons'>tab</span><div><strong>Tabs</strong>" +
          "<div><strong>Preview</strong> — View your theme on various website samples and templates. Hover over components for information about them</div>" +
          "<div><strong>Components</strong> — View your theme on all of the Material-UI components. Use the drawer on the left of the screen to navigate to components.</div>" +
          "<div><strong>Saved Themes</strong> — Switch between multiple saved themes or checkout templates</div>" +
          "</div></li>" +
          "</ul>" +
          "<h5>Features</h5>" +
          "<ul class='feature-list'>" +
          "<li><span class='material-icons'>code</span><div><strong><button type='button' class='sample-link inert-nav'>Monaco Editor</button></strong><div>Intellisense loaded with Material-UI ThemeOptions type data. Press Ctrl + Space for code suggestions</div></div></li>" +
          "<li><span class='material-icons'>save</span><div><strong>Saved Themes</strong><div>Themes are saved in your browser's localStorage so that they'll persist between visits to this site.</div></div></li>" +
          "<li><span class='material-icons'>font_download</span><div><strong><button type='button' class='sample-link inert-nav'>Web Font Loader</button></strong><div>Google Fonts loaded through the Web Font Loader package so you can preview your theme with a variety of fonts. Add fonts by entering the name of the font on the Font Tools tab in the bottom right corner</div></div></li>" +
          "<li><span class='material-icons'>playlist_add</span><div><strong>Snippets</strong><div>Add global styles or default options with various built in snippets. Got any useful theme snippets that you think others could use? <button type='button' class='sample-link inert-nav'>Open an issue on Gitlab!</button></div></div></li>" +
          "</ul>";
    }
    body.innerHTML = html;
    var tut = $("#sample-tutorial-link");
    if (tut) tut.addEventListener("click", openTutorial);
  }

  /* —— Theme tools —— */
  function paletteRows() {
    var p = state.options.palette;
    return [
      { key: "Type", kind: "type" },
      {
        key: "Background",
        kind: "group",
        path: "background",
        colors: [
          { role: "default", value: p.background.default },
          { role: "paper", value: p.background.paper },
        ],
      },
      {
        key: "Text",
        kind: "group",
        path: "text",
        colors: [
          { role: "primary", value: colorToHex(p.text.primary) },
          { role: "secondary", value: colorToHex(p.text.secondary) },
          { role: "disabled", value: colorToHex(p.text.disabled) },
          { role: "hint", value: colorToHex(p.text.hint) },
        ],
      },
      { key: "primary", kind: "intent", path: "primary", color: p.primary },
      { key: "secondary", kind: "intent", path: "secondary", color: p.secondary },
      { key: "error", kind: "intent", path: "error", color: p.error },
      { key: "warning", kind: "intent", path: "warning", color: p.warning },
      { key: "info", kind: "intent", path: "info", color: p.info },
      { key: "success", kind: "intent", path: "success", color: p.success },
      {
        key: "Divider",
        kind: "single",
        path: "divider",
        value: colorToHex(p.divider),
      },
    ];
  }

  function colorToHex(c) {
    if (!c) return "#000000";
    if (c.charAt(0) === "#") return c.length === 4 ? "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c;
    var m = String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return "#000000";
    return (
      "#" +
      [m[1], m[2], m[3]]
        .map(function (v) {
          return Number(v).toString(16).padStart(2, "0");
        })
        .join("")
    );
  }

  function renderTools() {
    var body = $("#theme-tools-body");
    if (state.tool === "palette") {
      body.innerHTML = '<div class="tools-panel-title">Palette</div>' + paletteRows().map(renderAccordion).join("");
      bindPalette();
    } else if (state.tool === "fonts") {
      body.innerHTML =
        '<div class="tools-panel-title">Fonts</div>' +
        '<p class="tools-help">Add <button type="button" class="inert-nav">Google Fonts</button> by name. Loaded fonts become available to Typography and the preview.</p>' +
        '<div class="font-add"><input type="text" id="font-input" placeholder="e.g. Montserrat" /><button type="button" class="mui-btn mui-btn--contained" id="font-add-btn">Add</button></div>' +
        '<ul class="font-list" id="font-list"></ul>';
      renderFontList();
      $("#font-add-btn").addEventListener("click", addFont);
      $("#font-input").addEventListener("keydown", function (e) {
        if (e.key === "Enter") addFont();
      });
    } else if (state.tool === "typography") {
      var t = state.options.typography || {};
      body.innerHTML =
        '<div class="tools-panel-title">Typography</div>' +
        '<div class="typo-grid">' +
        '<label>Font family<select id="typo-family">' +
        state.fonts
          .map(function (f) {
            var fam = f + ", Helvetica, Arial, sans-serif";
            var sel = (t.fontFamily || "").indexOf(f) === 0 ? " selected" : "";
            return "<option value=\"" + fam + "\"" + sel + ">" + f + "</option>";
          })
          .join("") +
        "</select></label>" +
        '<label>Base font size<input type="number" id="typo-size" min="10" max="24" value="' +
        (t.fontSize || 14) +
        '" /></label>' +
        "</div>";
      $("#typo-family").addEventListener("change", function (e) {
        var o = TS.deepClone(state.options);
        o.typography.fontFamily = e.target.value;
        commitOptions(o);
      });
      $("#typo-size").addEventListener("change", function (e) {
        var o = TS.deepClone(state.options);
        o.typography.fontSize = Number(e.target.value) || 14;
        commitOptions(o);
      });
    } else {
      body.innerHTML =
        '<div class="tools-panel-title">Snippets</div>' +
        '<p class="tools-help">Add global styles or default options with built-in snippets. Got useful snippets? <button type="button" class="inert-nav">Open an issue on Gitlab!</button></p>' +
        '<div class="snippet-list">' +
        TS.SNIPPETS.map(function (s) {
          return (
            '<button type="button" class="snippet-card" data-snippet="' +
            s.id +
            '"><strong>' +
            s.name +
            "</strong><span>" +
            s.description +
            "</span></button>"
          );
        }).join("") +
        "</div>";
      $all("[data-snippet]", body).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var sn = TS.SNIPPETS.find(function (x) {
            return x.id === btn.getAttribute("data-snippet");
          });
          if (!sn) return;
          commitOptions(sn.apply(state.options));
          toast("Applied: " + sn.name);
        });
      });
    }
  }

  function renderAccordion(row) {
    var open = !!state.openAccordions[row.key];
    var swatches = "";
    if (row.kind === "type") {
      var isDark = state.options.palette.type === "dark";
      return (
        '<div class="accordion' +
        (open ? " is-open" : "") +
        '" data-acc="' +
        row.key +
        '">' +
        '<div class="accordion__summary accordion__summary--type">' +
        '<button type="button" class="accordion__type-toggle" data-acc-toggle="' +
        row.key +
        '">' +
        '<span class="accordion__label">Type</span>' +
        '<span class="material-icons accordion__chevron">expand_more</span>' +
        "</button>" +
        '<span class="type-toggle" id="type-toggle">' +
        '<button type="button" class="type-label' +
        (!isDark ? " is-on" : "") +
        '" data-set-type="light">Light</button>' +
        '<button type="button" class="switch' +
        (isDark ? " is-on" : "") +
        '" id="type-switch" aria-label="Toggle light dark theme"></button>' +
        '<button type="button" class="type-label' +
        (isDark ? " is-on" : "") +
        '" data-set-type="dark">Dark</button>' +
        "</span>" +
        "</div>" +
        '<div class="accordion__panel"><p class="tools-help">Toggles <code>palette.type</code> and preview surfaces.</p></div>' +
        "</div>"
      );
    }
    if (row.kind === "intent") {
      swatches = ["main", "light", "dark", "contrastText"]
        .map(function (r) {
          return '<span class="swatch" style="background:' + row.color[r] + '"></span>';
        })
        .join("");
    } else if (row.kind === "group") {
      swatches = row.colors
        .map(function (c) {
          return '<span class="swatch" style="background:' + c.value + '"></span>';
        })
        .join("");
    } else {
      swatches = '<span class="swatch" style="background:' + row.value + '"></span>';
    }

    var panel = "";
    if (row.kind === "intent") {
      panel = ["main", "light", "dark", "contrastText"]
        .map(function (r) {
          return colorField(row.path, r, row.color[r]);
        })
        .join("");
    } else if (row.kind === "group") {
      panel = row.colors
        .map(function (c) {
          return colorField(row.path, c.role, c.value);
        })
        .join("");
    } else {
      panel = colorField("divider", "value", row.value);
    }

    return (
      '<div class="accordion' +
      (open ? " is-open" : "") +
      '" data-acc="' +
      row.key +
      '">' +
      '<button type="button" class="accordion__summary" data-acc-toggle="' +
      row.key +
      '">' +
      '<span class="accordion__label">' +
      row.key +
      "</span>" +
      '<span class="swatch-row">' +
      swatches +
      "</span>" +
      '<span class="material-icons accordion__chevron">expand_more</span>' +
      "</button>" +
      '<div class="accordion__panel">' +
      panel +
      "</div></div>"
    );
  }

  function colorField(path, role, value) {
    var hex = colorToHex(value);
    return (
      '<div class="color-field" data-path="' +
      path +
      '" data-role="' +
      role +
      '">' +
      "<label>" +
      role +
      "</label>" +
      '<input type="color" value="' +
      hex +
      '" />' +
      '<input type="text" value="' +
      value +
      '" />' +
      "</div>"
    );
  }

  function bindPalette() {
    $all("[data-acc-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-acc-toggle");
        state.openAccordions[key] = !state.openAccordions[key];
        renderTools();
      });
    });
    var typeToggle = $("#type-toggle");
    if (typeToggle) {
      typeToggle.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    var sw = $("#type-switch");
    if (sw) {
      sw.addEventListener("click", function (e) {
        e.stopPropagation();
        var next = state.options.palette.type === "dark" ? "light" : "dark";
        commitOptions(TS.setType(state.options, next));
      });
    }
    $all("[data-set-type]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var next = btn.getAttribute("data-set-type");
        if (state.options.palette.type === next) return;
        commitOptions(TS.setType(state.options, next));
      });
    });
    $all(".color-field").forEach(function (row) {
      var path = row.getAttribute("data-path");
      var role = row.getAttribute("data-role");
      var colorInput = row.querySelector('input[type="color"]');
      var textInput = row.querySelector('input[type="text"]');
      function apply(val) {
        var o;
        if (path === "divider") o = TS.setPaletteColor(state.options, "divider", "value", val);
        else o = TS.setPaletteColor(state.options, path, role, val);
        commitOptions(o);
      }
      colorInput.addEventListener("input", function () {
        textInput.value = colorInput.value;
        apply(colorInput.value);
      });
      textInput.addEventListener("change", function () {
        apply(textInput.value.trim());
      });
    });
  }

  function renderFontList() {
    var list = $("#font-list");
    if (!list) return;
    list.innerHTML = state.fonts
      .map(function (f) {
        return (
          "<li><span style=\"font-family:'" +
          f +
          "',sans-serif\">" +
          f +
          '</span><button type="button" class="text-btn" data-remove-font="' +
          f +
          '">Remove</button></li>'
        );
      })
      .join("");
    $all("[data-remove-font]", list).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-remove-font");
        if (f === "Roboto") return toast("Roboto is required");
        state.fonts = state.fonts.filter(function (x) {
          return x !== f;
        });
        state.dirty = true;
        setStatus("Unsaved changes");
        renderFontList();
      });
    });
  }

  function loadFonts(names) {
    if (!window.WebFont || !names.length) return;
    window.WebFont.load({
      google: { families: names.map(function (n) {
        return n + ":300,400,500,700";
      }) },
    });
  }

  function addFont() {
    var input = $("#font-input");
    var name = (input.value || "").trim();
    if (!name) return;
    if (state.fonts.indexOf(name) !== -1) {
      toast("Already added");
      return;
    }
    state.fonts.push(name);
    loadFonts([name]);
    input.value = "";
    state.dirty = true;
    setStatus("Unsaved changes");
    renderFontList();
    toast("Loaded " + name);
  }

  /* —— Components gallery —— */
  function renderCompNav(filter) {
    var nav = $("#comp-nav");
    var q = (filter || "").toLowerCase();
    nav.innerHTML = COMPONENTS.filter(function (c) {
      return !q || c.toLowerCase().indexOf(q) !== -1;
    })
      .map(function (c) {
        var id = slug(c);
        return (
          '<button type="button" class="comp-nav-btn" data-jump="' +
          id +
          '">' +
          c +
          "</button>"
        );
      })
      .join("");
    $all("[data-jump]", nav).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-jump");
        location.hash = id;
        var el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        $all(".comp-nav-btn").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
      });
    });
  }

  function slug(name) {
    return name.replace(/\s+/g, "");
  }

  function section(title, inner) {
    var id = slug(title);
    return (
      '<section class="comp-section" id="' +
      id +
      '"><div class="comp-section__head"><h3>' +
      title +
      '</h3><button type="button" class="docs-btn inert-nav">Docs</button></div>' +
      inner +
      "</section>"
    );
  }

  function renderGallery() {
    var g = $("#comp-gallery");
    g.innerHTML = [
      section(
        "Accordion",
        '<div class="accordion-demo"><details open><summary>Accordion 1</summary><div class="acc-body">Expandable content themed by paper and text colors.</div></details><details><summary>Accordion 2</summary><div class="acc-body">Secondary section.</div></details></div>'
      ),
      section(
        "App Bar",
        '<div class="sample-appbar" style="border-radius:4px"><button type="button" class="icon-btn"><span class="material-icons">menu</span></button><strong style="flex:1">App title</strong><button type="button" class="icon-btn"><span class="material-icons">account_circle</span></button></div>'
      ),
      section("Avatar", '<div class="demo-row"><span class="avatar">A</span><span class="avatar" style="background:var(--preview-secondary)">B</span></div>'),
      section(
        "Badge",
        '<div class="demo-row"><span class="badge-wrap"><span class="avatar">M</span><span class="badge-dot">4</span></span></div>'
      ),
      section(
        "Bottom Navigation",
        '<div class="demo-row" style="justify-content:space-around;width:100%;background:var(--preview-paper);padding:8px;border:1px solid var(--preview-divider)"><button type="button" class="mui-btn mui-btn--text"><span class="material-icons">restore</span></button><button type="button" class="mui-btn mui-btn--text"><span class="material-icons">favorite</span></button><button type="button" class="mui-btn mui-btn--text"><span class="material-icons">location_on</span></button></div>'
      ),
      section(
        "Buttons",
        '<div class="demo-row"><button type="button" class="mui-btn mui-btn--contained">Contained</button><button type="button" class="mui-btn mui-btn--outlined">Outlined</button><button type="button" class="mui-btn mui-btn--text">Text</button><button type="button" class="mui-btn mui-btn--secondary">Secondary</button></div>'
      ),
      section(
        "Card",
        '<div class="sample-card"><h3>Card title</h3><p>Paper surface with elevation and themed typography.</p><button type="button" class="mui-btn mui-btn--text">Action</button></div>'
      ),
      section(
        "Checkboxes",
        '<div class="demo-row"><label><input type="checkbox" checked /> Primary</label><label><input type="checkbox" /> Secondary</label></div>'
      ),
      section(
        "Chip",
        '<div class="chip-row"><span class="chip">Default</span><span class="chip chip--primary">Primary</span><span class="chip chip--secondary">Secondary</span></div>'
      ),
      section(
        "Dialog",
        '<div class="sample-card"><h3>Dialog title</h3><p>Sample dialog content using paper background.</p><div class="demo-row"><button type="button" class="mui-btn mui-btn--text">Cancel</button><button type="button" class="mui-btn mui-btn--contained">OK</button></div></div>'
      ),
      section("Floating Action Button", '<button type="button" class="fab" aria-label="add"><span class="material-icons">add</span></button>'),
      section("Icon", '<div class="demo-row"><span class="material-icons" style="color:var(--preview-primary)">home</span><span class="material-icons" style="color:var(--preview-secondary)">favorite</span><span class="material-icons">settings</span></div>'),
      section(
        "List",
        "<ul class='feature-list'><li><span class='material-icons'>inbox</span><div><strong>Inbox</strong><div>Primary list item</div></div></li><li><span class='material-icons'>drafts</span><div><strong>Drafts</strong><div>Secondary text</div></div></li></ul>"
      ),
      section(
        "Menu",
        '<div class="sample-card" style="max-width:220px"><button type="button" class="mui-btn mui-btn--text" style="display:block;width:100%;text-align:left">Profile</button><button type="button" class="mui-btn mui-btn--text" style="display:block;width:100%;text-align:left">My account</button><button type="button" class="mui-btn mui-btn--text" style="display:block;width:100%;text-align:left">Logout</button></div>'
      ),
      section("Progress", '<div class="progress-track"><span></span></div>'),
      section(
        "Radio",
        '<div class="demo-row"><label><input type="radio" name="r" checked /> Option A</label><label><input type="radio" name="r" /> Option B</label></div>'
      ),
      section(
        "Select",
        '<select style="padding:8px 12px;border:1px solid var(--preview-divider);border-radius:4px;background:var(--preview-paper);color:var(--preview-text)"><option>Option 1</option><option>Option 2</option><option>Option 3</option></select>'
      ),
      section("Slider", '<input type="range" min="0" max="100" value="40" style="width:100%;accent-color:var(--preview-primary)" />'),
      section(
        "Snackbar",
        '<div class="toast" style="position:static;transform:none">Theme applied successfully</div>'
      ),
      section(
        "Stepper",
        '<div class="demo-row"><span class="avatar">1</span><span>Select</span><span class="avatar" style="background:var(--preview-secondary)">2</span><span>Configure</span><span class="avatar">3</span><span>Review</span></div>'
      ),
      section("Switch", '<button type="button" class="switch-demo" aria-label="switch"></button>'),
      section(
        "Table",
        '<table class="demo-table"><thead><tr><th>Dessert</th><th>Calories</th><th>Fat</th></tr></thead><tbody><tr><td>Frozen yoghurt</td><td>159</td><td>6.0</td></tr><tr><td>Ice cream</td><td>237</td><td>9.0</td></tr></tbody></table>'
      ),
      section(
        "Tabs",
        '<div class="sample-tabs"><button type="button" class="sample-tab is-active">One</button><button type="button" class="sample-tab">Two</button><button type="button" class="sample-tab">Three</button></div>'
      ),
      section(
        "TextField",
        '<div class="form-stack"><div class="field"><label>Name</label><input type="text" placeholder="Standard" /></div></div>'
      ),
      section(
        "Tooltip",
        '<button type="button" class="mui-btn mui-btn--contained" title="Tooltip text">Hover me</button>'
      ),
      section(
        "Typography",
        "<h2>h2 Headline</h2><h3>h3 Headline</h3><p>body1 — The quick brown fox jumps over the lazy dog.</p><p style='color:var(--preview-text-secondary)'>body2 secondary text</p>"
      ),
    ].join("");
  }

  /* —— Saved themes —— */
  function renderSaved() {
    var grid = $("#saved-grid");
    if (!grid) return;
    grid.innerHTML = state.themes
      .map(function (t) {
        var p = t.options.palette;
        var active = t.id === state.activeId ? " is-active" : "";
        return (
          '<div class="theme-card' +
          active +
          '" data-load="' +
          t.id +
          '">' +
          "<strong>" +
          t.name +
          "</strong>" +
          '<div class="theme-card__swatches">' +
          '<span style="background:' +
          p.primary.main +
          '"></span>' +
          '<span style="background:' +
          p.secondary.main +
          '"></span>' +
          '<span style="background:' +
          p.background.paper +
          '"></span>' +
          "</div>" +
          '<div class="theme-card__meta">' +
          p.type +
          " · updated " +
          new Date(t.updatedAt || Date.now()).toLocaleString() +
          "</div>" +
          '<div class="theme-card__actions">' +
          '<button type="button" class="mui-btn mui-btn--contained" data-load="' +
          t.id +
          '">Load</button>' +
          '<button type="button" class="mui-btn mui-btn--outlined" data-delete="' +
          t.id +
          '">Delete</button>' +
          "</div></div>"
        );
      })
      .join("");

    $all("[data-load]", grid).forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = el.getAttribute("data-load");
        var theme = state.themes.find(function (t) {
          return t.id === id;
        });
        if (theme) {
          applyThemeRecord(theme);
          toast("Loaded " + theme.name);
        }
      });
    });
    $all("[data-delete]", grid).forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-delete");
        if (state.themes.length <= 1) return toast("Keep at least one theme");
        state.themes = state.themes.filter(function (t) {
          return t.id !== id;
        });
        TS.saveThemes(state.themes);
        if (state.activeId === id) applyThemeRecord(state.themes[0]);
        else renderSaved();
      });
    });
  }

  /* —— Tabs / chrome —— */
  function setMainTab(name) {
    $all(".main-tab").forEach(function (tab) {
      var on = tab.getAttribute("data-tab") === name;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    $all(".panel").forEach(function (panel) {
      var on = panel.id === "panel-" + (name === "saved" ? "saved" : name);
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
    });
    if (name === "components") {
      renderCompNav($("#comp-search").value);
      renderGallery();
    }
    if (name === "saved") renderSaved();
    if (name === "preview" && state.editor) {
      setTimeout(function () {
        state.editor.layout();
      }, 50);
    }
  }

  function setDevice(device) {
    state.device = device;
    var frame = $("#device-frame");
    frame.className = "device-frame device-frame--" + device;
    $all(".device-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-device") === device);
    });
  }

  function openTutorial() {
    $("#tutorial-modal").hidden = false;
  }

  function closeTutorial() {
    $("#tutorial-modal").hidden = true;
  }

  function initMonaco() {
    if (!window.require) {
      console.warn("Monaco loader missing");
      return;
    }
    window.require(["vs/editor/editor.main"], function () {
      state.editor = window.monaco.editor.create($("#monaco-root"), {
        value: TS.toEditorSource(state.options),
        language: "typescript",
        theme: "vs-dark",
        minimap: { enabled: false },
        fontSize: 13,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: "on",
      });

      window.monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });
      window.monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        target: window.monaco.languages.typescript.ScriptTarget.ES2018,
      });

      var suggestExtra = [
        "palette",
        "typography",
        "spacing",
        "shape",
        "overrides",
        "props",
        "primary",
        "secondary",
        "type",
        "main",
        "light",
        "dark",
        "contrastText",
        "background",
        "paper",
        "fontFamily",
        "fontSize",
      ];
      window.monaco.languages.registerCompletionItemProvider("typescript", {
        provideCompletionItems: function () {
          return {
            suggestions: suggestExtra.map(function (label) {
              return {
                label: label,
                kind: window.monaco.languages.CompletionItemKind.Property,
                insertText: label,
              };
            }),
          };
        },
      });

      var timer;
      state.editor.onDidChangeModelContent(function () {
        if (state.syncingEditor) return;
        setStatus("Editing…");
        clearTimeout(timer);
        timer = setTimeout(function () {
          try {
            var parsed = TS.parseEditorSource(state.editor.getValue());
            state.options = parsed;
            state.dirty = true;
            TS.applyCssVars(state.options);
            renderTools();
            renderSampleBody();
            setStatus("Synced from editor");
          } catch (err) {
            setStatus("Invalid ThemeOptions");
          }
        }, 400);
      });
    });
  }

  function bindUi() {
    $all(".main-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        setMainTab(tab.getAttribute("data-tab"));
      });
    });
    $all(".device-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setDevice(btn.getAttribute("data-device"));
      });
    });
    $all(".sample-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        state.sample = tab.getAttribute("data-sample");
        $all(".sample-tab").forEach(function (t) {
          t.classList.toggle("is-active", t === tab);
        });
        renderSampleBody();
      });
    });
    $all(".tools-nav-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.tool = btn.getAttribute("data-tool");
        $all(".tools-nav-btn").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        renderTools();
      });
    });

    $("#btn-tutorial").addEventListener("click", openTutorial);
    $all("[data-close-modal]").forEach(function (el) {
      el.addEventListener("click", closeTutorial);
    });

    $("#btn-copy").addEventListener("click", function () {
      var text = state.editor ? state.editor.getValue() : TS.toEditorSource(state.options);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          toast("Theme code copied");
        });
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast("Theme code copied");
      }
    });

    $("#btn-save").addEventListener("click", persistActive);
    $("#btn-undo").addEventListener("click", function () {
      if (!state.undoStack.length) return;
      state.redoStack.push(TS.deepClone(state.options));
      state.options = state.undoStack.pop();
      TS.applyCssVars(state.options);
      syncEditorFromOptions();
      renderTools();
      renderSampleBody();
      updateHistoryButtons();
      setStatus("Undo");
    });
    $("#btn-redo").addEventListener("click", function () {
      if (!state.redoStack.length) return;
      state.undoStack.push(TS.deepClone(state.options));
      state.options = state.redoStack.pop();
      TS.applyCssVars(state.options);
      syncEditorFromOptions();
      renderTools();
      renderSampleBody();
      updateHistoryButtons();
      setStatus("Redo");
    });
    $("#btn-editor-settings").addEventListener("click", function () {
      if (!state.editor) return;
      var dark = document.documentElement.dataset.editorTheme !== "light";
      document.documentElement.dataset.editorTheme = dark ? "light" : "dark";
      window.monaco.editor.setTheme(dark ? "vs" : "vs-dark");
      toast(dark ? "Editor: light" : "Editor: dark");
    });

    $("#comp-search").addEventListener("input", function (e) {
      renderCompNav(e.target.value);
    });

    $("#btn-new-theme").addEventListener("click", function () {
      var t = TS.defaultTheme({ id: uid(), name: "Theme " + (state.themes.length + 1) });
      state.themes.push(t);
      TS.saveThemes(state.themes);
      applyThemeRecord(t);
      toast("Created " + t.name);
    });

    $("#btn-load-template").addEventListener("click", function () {
      var tpls = TS.templates();
      var pick = tpls[Math.floor(Math.random() * tpls.length)];
      var t = TS.deepClone(pick);
      t.id = uid();
      t.name = pick.name + " copy";
      t.updatedAt = Date.now();
      state.themes.push(t);
      TS.saveThemes(state.themes);
      applyThemeRecord(t);
      setMainTab("saved");
      toast("Loaded template " + pick.name);
    });
  }

  function boot() {
    state.themes = TS.loadThemes();
    state.activeId = TS.getActiveId();
    var active = getActiveTheme() || state.themes[0];
    state.activeId = active.id;
    state.options = TS.deepClone(active.options);
    state.fonts = (active.fonts || ["Roboto"]).slice();
    TS.applyCssVars(state.options);
    loadFonts(state.fonts);

    bindUi();
    setDevice("desktop");
    renderSampleBody();
    renderTools();
    renderCompNav("");
    renderSaved();
    initMonaco();
    updateHistoryButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
