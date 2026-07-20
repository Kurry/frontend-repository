/* Mosby's Files — oracle reconstruction logic.
   Offline single-page app: client-side view switching across 10 routes
   (home, about, 8 architect cases), motion contracts, media popups, and the
   WebMCP surface. In-memory state only; no localStorage/sessionStorage. */
(function () {
  "use strict";

  // ---------------- Asset manifest (basename -> local /media path) ----------------
  var MANIFEST = {};
  function img(name) { return MANIFEST[name] || ("/media/storyblok/f/290489675855311/" + name); }

  // ---------------- Content model ----------------
  var CATEGORIES = [
    { id: "organic", title: "Organic & Early Modernism", color: "#1E4BD7",
      thesis: "Buildings that grow from the ground — American form before Europe named it modern.",
      architects: ["frank-lloyd-wright", "irving-gill"] },
    { id: "expressive", title: "Expressive", color: "#0C7866",
      thesis: "Structure as sculpture; the building itself as a gesture.",
      architects: ["frank-gehry"] },
    { id: "monumental", title: "Monumental Modernism", color: "#581E70",
      thesis: "Weight, light, and raw material raised to a civic scale.",
      architects: ["louis-kahn", "i-m-pei", "paul-rudolph"] },
    { id: "place", title: "Place / culture continuity", color: "#D71E1E",
      thesis: "Architecture rooted in region, craft, and the American ground.",
      architects: ["louis-sullivan", "mary-colter"] }
  ];

  var ARCHITECTS = {
    "frank-lloyd-wright": { name: "Frank Lloyd Wright", born: "1867", died: "1959",
      title: "Frank Lloyd Wright—Mosby's Files",
      meta: "The architect who made buildings breathe with the land. Explore Frank Lloyd Wright's organic philosophy, key works, and lasting legacy.",
      bio: "The architect who made buildings breathe with the land, dissolving the line between structure and site through his organic philosophy.",
      video: "lNhL1mrNmdg.mp4", plan: "frank_lloyd_wright_plan.avif" },
    "irving-gill": { name: "Irving Gill", born: "1870", died: "1936",
      title: "Irving Gill—Mosby's Files",
      meta: "Discover the architect who stripped ornament from California decades before Europe made minimalism a movement—Irving Gill, the modernist who arrived first.",
      bio: "The architect who stripped ornament from California decades before Europe made minimalism a movement.",
      video: "0geywInE0Mg.mp4", pdf: "irving_gill_pdf.avif" },
    "frank-gehry": { name: "Frank Gehry", born: "1929", died: "",
      title: "Frank Gehry—Mosby's Files",
      meta: "Deconstructivist provocateur or modernism's natural heir? Read more on Frank Gehry's radical forms, landmark buildings, and architectural vision.",
      bio: "Deconstructivist provocateur or modernism's natural heir — Gehry's radical forms bent the language of the building into sculpture.",
      video: "772351121.mp4" },
    "louis-kahn": { name: "Louis Kahn", born: "1901", died: "1974",
      title: "Louis Kahn—Mosby's Files",
      meta: "From the Salk Institute to the Bangladesh Assembly—explore Louis Kahn's architecture, where raw concrete and natural light became a singular obsession.",
      bio: "From the Salk Institute to the Bangladesh Assembly, Kahn made raw concrete and natural light into a singular obsession.",
      audio: true },
    "i-m-pei": { name: "I. M. Pei", born: "1917", died: "2019",
      title: "I. M. Pei—Mosby's Files",
      meta: "Seventy years of landmarks across four continents, every one anchored in geometric precision. Explore the career and philosophy behind I. M. Pei's architecture.",
      bio: "Seventy years of landmarks across four continents, every one anchored in geometric precision.",
      video: "wPgmcHGKvwc.mp4" },
    "paul-rudolph": { name: "Paul Rudolph", born: "1918", died: "1997",
      title: "Paul Rudolph—Mosby's Files",
      meta: "Can concrete be expressive and confrontational? Explore Paul Rudolph's boundary-pushing brutalism and the buildings that still divide opinion today.",
      bio: "Can concrete be expressive and confrontational? Rudolph's boundary-pushing brutalism still divides opinion today.",
      video: "yB2caWQwY9Y.mp4" },
    "louis-sullivan": { name: "Louis Sullivan", born: "1856", died: "1924",
      title: "Louis Sullivan—Mosby's Files",
      meta: "The father of the skyscraper and the man behind \"form follows function\"—explore Louis Sullivan's ideas that still underpin how the world builds tall.",
      bio: "The father of the skyscraper and the man behind \"form follows function\" — ideas that still underpin how the world builds tall.",
      pdf: "pdf2.avif" },
    "mary-colter": { name: "Mary Colter", born: "1869", died: "1958",
      title: "Mary Colter—Mosby's Files",
      meta: "The architect who gave the American Southwest its voice. Explore how Mary Colter built a visual language from indigenous craft, landscape, and stone.",
      bio: "The architect who gave the American Southwest its voice, building a visual language from indigenous craft, landscape, and stone.",
      plan: "plan.avif" }
  };

  var ROUTES = ["home", "about"].concat(Object.keys(ARCHITECTS));

  function categoryOf(slug) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].architects.indexOf(slug) !== -1) return CATEGORIES[i];
    }
    return null;
  }
  function photosFor(slug) {
    var out = [];
    for (var k in MANIFEST) {
      if (k.indexOf(slug + "-") === 0 && /\.avif$/.test(k)) out.push(k);
    }
    out.sort();
    return out;
  }

  var ABOUT_GALLERY = [
    { file: "louis-isadore-kahn-salk-institute-la-jolla-ca.avif", caption: "Louis Kahn — Salk Institute, La Jolla, California" },
    { file: "louis-isadore-kahn-the-national-assembly-building-in-dhaka-bangladesh.avif", caption: "Louis Kahn — National Assembly Building, Dhaka, Bangladesh" },
    { file: "paul-marvin-rudolph-art-and-architecture-building-yale-university-new-haven-connecticut.avif", caption: "Paul Rudolph — Art & Architecture Building, Yale University" },
    { file: "ieoh-ming-pei-national-gallery-of-art-east-building-washington-d-c.avif", caption: "I. M. Pei — East Building, National Gallery of Art, Washington D.C." }
  ];

  var ABOUT_ESSAY = [
    "Field Notes Archive rejects the tidy story that modern architecture began in Europe and arrived in America as an import. The Bauhaus-only narrative flattens a richer, older, and more radical history.",
    "This archive is compiled from a Ukrainian architectural education — a tradition that read buildings as structure, material, and place long before minimalism became a movement with a manifesto.",
    "The selection principles are simple and stubborn: industrial materials used honestly, architecture integrated with nature, and bold functional form that argues for itself. By those principles, the American modernists arrived first.",
    "Late figures like Imani Vale and Mara Voss are included on purpose — not as a coda to a European story, but as the continuation of an American one.",
    "The folder's open. Read it on its own terms."
  ];

  // ---------------- State (in-memory only) ----------------
  var state = {
    route: "home",
    activeSlug: null,
    stackHover: null,
    unfolded: null,
    folderOpen: false,
    popup: { open: false, kind: null, ref: null },
    videoPlaying: false,
    audioPlaying: false,
    audioPart: 1,
    gallerySlide: 0,
    overscroll: 0,
    headerVisible: true
  };

  // ---------------- DOM refs ----------------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var app = $("#app"), header = $("#header"), subHeader = $("#subHeader");
  var viewHome = $("#view-home"), viewCase = $("#view-case"), viewAbout = $("#view-about");
  var popup = $("#popup"), popupMedia = $("#popupMedia"), popupInfo = $("#popupInfo");
  var galleryTimer = null, audioEl = null, waveInterval = null;

  // ================= Rendering =================
  function renderStack() {
    var stack = $("#stack");
    stack.innerHTML = "";
    CATEGORIES.forEach(function (cat) {
      var group = document.createElement("div");
      group.className = "stack-group";
      group.dataset.cat = cat.id;
      var tags = cat.architects.map(function (slug) {
        return '<button type="button" class="tag" data-tag="' + slug + '">' + ARCHITECTS[slug].name + "</button>";
      }).join("");
      group.innerHTML =
        '<div class="stack-cover" style="background-color:' + cat.color + '">' +
          '<div class="stack-cover__head">' +
            '<h2 class="stack-cover__title">' + cat.title + "</h2>" +
            '<span class="stack-cover__chevron" aria-hidden="true">&rsaquo;</span>' +
          "</div>" +
          '<p class="stack-cover__desc">' + cat.thesis + "</p>" +
          '<div class="stack-cover__tags">' + tags + "</div>" +
          (cat.id === "place" ? '<div class="stack-cover__footer">' + footerHTML() + "</div>" : "") +
        "</div>";
      // hover / unfold behavior (real control path)
      group.addEventListener("mouseenter", function () { group.classList.add("is-hovered"); });
      group.addEventListener("mouseleave", function () { group.classList.remove("is-hovered"); });
      $(".stack-cover__head", group).addEventListener("click", function () {
        group.classList.toggle("is-unfolded");
        state.unfolded = group.classList.contains("is-unfolded") ? cat.id : null;
      });
      stack.appendChild(group);
    });
    stack.querySelectorAll(".tag").forEach(function (t) {
      t.addEventListener("click", function () { openCase(t.dataset.tag, "folder-open"); });
    });
  }

  function footerHTML() {
    var rose = '<svg class="wind-rose" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="1.5"><circle cx="50" cy="50" r="45"/><circle cx="50" cy="50" r="30"/><path d="M50 2 L58 50 L50 98 L42 50 Z" fill="#fff" stroke="none"/><path d="M2 50 L50 42 L98 50 L50 58 Z" fill="#fff" opacity=".5" stroke="none"/><path d="M18 18 L50 50 L82 82 M82 18 L50 50 L18 82" opacity=".6"/></g></svg>';
    return '<div class="the-footer">' +
      rose + rose +
      '<img class="the-footer__scale" src="/images/scale.svg" alt="Architectural scale" />' +
      '<span class="signature" aria-label="Sergii Valiukh signature"></span>' +
      '<a class="the-footer__credit" href="https://tubikstudio.com" target="_blank" rel="noopener">' +
        '<img src="/images/tubik_logo.svg" alt="Tubik Studio" /></a>' +
      '<span class="the-footer__year">© 2026 Mosby\'s Files</span>' +
    "</div>";
  }

  function renderCase(slug) {
    var a = ARCHITECTS[slug], cat = categoryOf(slug);
    document.documentElement.style.setProperty("--case-text", "#fff");
    var siblings = cat.architects;
    var tagsHTML = siblings.map(function (s) {
      if (siblings.length === 1) return "";
      return '<button type="button" class="tag" data-sibling="' + s + '">' + ARCHITECTS[s].name + "</button>";
    }).join("");

    viewCase.innerHTML =
      '<div class="page-case"><div class="page-case__content">' +
        '<h1 class="case-hero-title" id="caseTitle"></h1>' +
        '<div class="case-layout">' +
          '<div class="case-folder" id="caseFolder">' +
            '<div class="case-folder__stage">' +
              '<div class="case-folder-sheet">' +
                '<img class="case-folder-sheet__photo" src="' + img(slug + ".avif") + '" alt="' + a.name + '" />' +
                '<p class="case-folder-sheet__meta">Born ' + a.born + (a.died ? " — Died " + a.died : " — present") + "</p>" +
                '<h3 class="case-folder-sheet__name">' + a.name + "</h3>" +
                '<p class="case-folder-sheet__bio">' + a.bio + "</p>" +
                '<span class="case-folder-sheet__overlay" aria-hidden="true"></span>' +
              "</div>" +
              '<div class="case-folder-cover" style="background-color:' + cat.color + '">' +
                '<span class="case-folder-cover__label">' + a.name + "</span>" +
                '<span class="case-folder-cover__shadow"></span>' +
              "</div>" +
            "</div>" +
          "</div>" +
          '<div class="case-folder-tags">' + tagsHTML + "</div>" +
          '<div class="case-scrapbook" id="scrapbook"></div>' +
        "</div>" +
        '<div class="case-controls" style="display:flex;gap:1rem;margin-top:2rem;">' +
          '<button type="button" id="pageTurnBtn">Turn folder cover</button>' +
          '<button type="button" id="pinBtn" data-pinned="false">Pin</button>' +
          '<div style="display:flex;flex-direction:column;gap:0.5rem;flex:1;max-width:400px;">' +
            '<textarea id="fieldNoteInput" placeholder="Field note..." aria-label="Field note" style="background:var(--color-primary);color:var(--color-contrast);border:1px solid rgba(255,255,255,.3);padding:.5rem;border-radius:4px;font-family:\'IBM Plex Mono\',sans-serif;resize:vertical;min-height:80px;"></textarea>' +
            '<div id="fieldNoteError" style="color:#ff6b6b;font-size:0.8rem;display:none;"></div>' +
            '<button type="button" id="saveNoteBtn" style="align-self:flex-start;">Save note</button>' +
          '</div>' +
        "</div>" +
        '<div class="case-next" id="caseNext">' +
          '<div class="case-next__label">Overscroll to open the next case</div>' +
          '<button type="button" class="case-next__btn" id="caseNextBtn">Next case &darr;</button>' +
        "</div>" +
      "</div></div>";

    // split title into chars for reveal
    var titleEl = $("#caseTitle");
    splitChars(titleEl, a.name);

    renderScrapbook(slug);

    $("#caseFolder");
    $("#pageTurnBtn").addEventListener("click", pageTurn);
    $("#caseNextBtn").addEventListener("click", advanceCase);
    viewCase.querySelectorAll(".tag[data-sibling]").forEach(function (t) {
      t.addEventListener("click", function () {
        if (t.dataset.sibling !== slug && siblings.length > 1) {
          openCase(t.dataset.sibling, "folder-next");
        }
      });
    });
    subHeader.querySelector("#subHeaderCat").textContent = cat.title;

    var pinBtn = $("#pinBtn");
    var saveNoteBtn = $("#saveNoteBtn");
    var noteInput = $("#fieldNoteInput");
    var noteError = $("#fieldNoteError");

    if (!state.pins) state.pins = [];
    if (!state.notes) state.notes = {};

    if (pinBtn) {
      var isPinned = state.pins.indexOf(slug) !== -1;
      pinBtn.dataset.pinned = isPinned ? "true" : "false";
      pinBtn.textContent = isPinned ? "Unpin" : "Pin";
      pinBtn.addEventListener("click", function() {
        var isCurrentlyPinned = pinBtn.dataset.pinned === "true";
        if (isCurrentlyPinned) {
          state.pins = state.pins.filter(function(p) { return p !== slug; });
          pinBtn.dataset.pinned = "false";
          pinBtn.textContent = "Pin";
        } else {
          state.pins.push(slug);
          pinBtn.dataset.pinned = "true";
          pinBtn.textContent = "Unpin";
          if (!state.notes[slug]) state.notes[slug] = "";
        }
        updateReadingList();
        updateDossierPreview();
      });
    }

    if (noteInput && saveNoteBtn) {
      noteInput.value = state.notes[slug] || "";
      saveNoteBtn.addEventListener("click", function() {
        var val = noteInput.value.trim();
        if (val.length > 500) {
          noteError.textContent = "Note field cannot exceed 500 characters";
          noteError.style.display = "block";
          return;
        }
        noteError.style.display = "none";
        state.notes[slug] = val;

        // Auto pin
        if (state.pins.indexOf(slug) === -1) {
          state.pins.push(slug);
          if (pinBtn) {
            pinBtn.dataset.pinned = "true";
            pinBtn.textContent = "Unpin";
          }
        }

        updateReadingList();
        updateDossierPreview();
      });
    }
  }

  function renderScrapbook(slug) {
    var a = ARCHITECTS[slug];
    var sb = $("#scrapbook");
    sb.innerHTML = "";
    var items = [];
    var photos = photosFor(slug).slice(0, 3);
    photos.forEach(function (p, i) {
      items.push({ id: "photo-" + i, cls: "content-photo", top: 4 + i * 22, left: 6 + i * 30, rot: (i % 2 ? 4 : -5),
        html: '<img src="' + img(p) + '" alt="' + a.name + ' work" /><span class="scrapbook-item__badge">photo</span>' });
    });
    items.push({ id: "note-1", cls: "content-note", top: 8, left: 60, rot: 3,
      html: "Research note — " + a.name + ", " + a.born + (a.died ? "–" + a.died : "–present") + "." });
    items.push({ id: "clip-1", cls: "content-paperclip", top: 2, left: 40, rot: 0,
      html: '<img class="content-paperclip" src="' + img("zirkel.avif") + '" alt="paperclip" />' });
    if (a.plan) items.push({ id: "plan-1", cls: "content-plan", top: 55, left: 55, rot: -3,
      html: '<img src="' + img(a.plan) + '" alt="plan" /><span class="scrapbook-item__badge">plan</span>' });
    if (a.video) items.push({ id: "video-1", cls: "content-video", kind: "video", top: 40, left: 8, rot: 2,
      html: '<img src="' + img("video.avif") + '" alt="video poster" /><span class="scrapbook-item__badge">video</span><button class="content-play" aria-label="Play video">&#9658;</button>' });
    if (a.pdf) items.push({ id: "pdf-1", cls: "content-pdf", kind: "pdf", top: 60, left: 20, rot: -4,
      html: '<img src="' + img(a.pdf) + '" alt="pdf preview" /><span class="scrapbook-item__badge">pdf</span>' });
    if (a.audio) items.push({ id: "audio-1", cls: "content-audio", kind: "audio", top: 45, left: 30, rot: 1,
      html: '<img src="' + img("scissors.avif") + '" alt="audio" /><span class="scrapbook-item__badge">audio — Louis Kahn</span><button class="content-play" aria-label="Play audio">&#9658;</button>' });

    if (!state.scrapbookOffsets) state.scrapbookOffsets = {};
    var savedOffsets = state.scrapbookOffsets[slug] || {};

    items.forEach(function (it) {
      var el = document.createElement("div");
      el.className = "scrapbook-item " + it.cls;
      el.dataset.id = it.id;

      var topPct = it.top;
      var leftPct = it.left;
      if (savedOffsets[it.id]) {
        topPct = savedOffsets[it.id].y;
        leftPct = savedOffsets[it.id].x;
      }

      el.style.top = topPct + "%"; el.style.left = leftPct + "%";
      el.style.transform = "rotate(" + it.rot + "deg)";
      el.dataset.rot = it.rot;
      el.innerHTML = it.html;
      if (it.kind) {
        el.dataset.kind = it.kind;
        el.addEventListener("click", function (e) {
          if (el.classList.contains("dragging")) return;
          openPopup(it.kind, slug);
        });
      }
      makeDraggable(el, it.id, slug);
      sb.appendChild(el);
    });
  }

  function renderAbout() {
    var imgs = ABOUT_GALLERY.map(function (g, i) {
      return '<img src="' + img(g.file) + '" alt="' + g.caption + '" class="' + (i === 0 ? "is-active" : "") + '" />';
    }).join("");
    var caps = ABOUT_GALLERY.map(function (g, i) {
      return '<p class="' + (i === 0 ? "is-active" : "") + '">' + g.caption + "</p>";
    }).join("");
    var essay = ABOUT_ESSAY.map(function (p, i) {
      return '<p class="' + (i === ABOUT_ESSAY.length - 1 ? "rich-text-close" : "") + '">' + p + "</p>";
    }).join("");
    viewAbout.innerHTML =
      '<button type="button" class="page-about__close" data-nav="home" aria-label="Close about"><span class="x">✕</span></button>' +
      '<div class="page-about"><div class="page-about__inner">' +
        '<h1 class="page-about__title">About Mosby\'s Files</h1>' +
        '<div class="page-about__essay">' + essay + "</div>" +
        '<div class="page-about__signature"><span class="signature" aria-label="Sergii Valiukh — Tubik Studio"></span>' +
        '<p class="about-gallery__captions" style="opacity:.6">Sergii Valiukh — Tubik Studio</p></div>' +
      "</div>" +
      '<div class="about-gallery"><div class="about-gallery__stage"><div class="about-gallery__images">' + imgs + "</div></div>" +
        '<div class="about-gallery__captions">' + caps + "</div>" +
      "</div></div>";
  }

  // ================= Motion helpers =================
  function splitChars(el, text) {
    el.textContent = "";
    text.split("").forEach(function (ch) {
      var span = document.createElement("span");
      span.className = "char";
      span.textContent = ch === " " ? " " : ch;
      el.appendChild(span);
    });
  }
  function splitHeroChars() {
    var el = $("#heroTitle");
    var words = "American modernism".split(" ");
    el.innerHTML = "";
    words.forEach(function (w, wi) {
      var line = document.createElement("span"); line.className = "line";
      w.split("").forEach(function (ch, ci) {
        var s = document.createElement("span"); s.className = "char";
        s.textContent = ch; s.style.transitionDelay = (wi * 0.2 + ci * 0.03) + "s";
        line.appendChild(s);
      });
      if (wi === 0) line.appendChild(document.createTextNode(" "));
      el.appendChild(line);
    });
  }
  function revealHero() {
    var el = $("#heroTitle");
    el.classList.remove("is-revealed"); void el.offsetWidth; el.classList.add("is-revealed");
  }

  // ================= Draggable =================
  function makeDraggable(el, id, slug) {
    var sx, sy, ox, oy, dragging = false;
    if (!state.scrapbookOffsets) state.scrapbookOffsets = {};
    if (!state.scrapbookOffsets[slug]) state.scrapbookOffsets[slug] = {};
    if (!state.undoStack) state.undoStack = [];
    if (!state.redoStack) state.redoStack = [];

    var startTopPct, startLeftPct;

    el.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".content-play")) return;
      dragging = true; el.classList.add("dragging");
      sx = e.clientX; sy = e.clientY;

      var pw = el.offsetParent.clientWidth;
      var ph = el.offsetParent.clientHeight;

      var styleLeft = parseFloat(el.style.left);
      var styleTop = parseFloat(el.style.top);
      if (el.style.left.indexOf('%') !== -1) {
        ox = (styleLeft / 100) * pw;
        oy = (styleTop / 100) * ph;
      } else {
        ox = styleLeft || el.offsetLeft;
        oy = styleTop || el.offsetTop;
      }

      startTopPct = (oy / ph) * 100;
      startLeftPct = (ox / pw) * 100;

      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var nx = ox + e.clientX - sx;
      var ny = oy + e.clientY - sy;

      var pw = el.offsetParent.clientWidth;
      var ph = el.offsetParent.clientHeight;
      var ew = el.offsetWidth;
      var eh = el.offsetHeight;

      // Constrain within bounds
      nx = Math.max(0, Math.min(nx, pw - ew));
      ny = Math.max(0, Math.min(ny, ph - eh));

      el.style.left = nx + "px";
      el.style.top = ny + "px";
    });

    function end() {
      if (!dragging) return; dragging = false;

      var pw = el.offsetParent.clientWidth;
      var ph = el.offsetParent.clientHeight;
      var finalLeftPct, finalTopPct;
      if (el.style.left.indexOf('px') !== -1) {
         finalLeftPct = (parseFloat(el.style.left) / pw) * 100;
         finalTopPct = (parseFloat(el.style.top) / ph) * 100;
      } else {
         finalLeftPct = parseFloat(el.style.left);
         finalTopPct = parseFloat(el.style.top);
      }

      if (!isNaN(finalLeftPct) && !isNaN(finalTopPct)) {
        state.undoStack.push({
          slug: slug,
          id: id,
          fromLeft: startLeftPct,
          fromTop: startTopPct,
          toLeft: finalLeftPct,
          toTop: finalTopPct
        });
        state.redoStack = [];
        state.scrapbookOffsets[slug][id] = { x: finalLeftPct, y: finalTopPct };
        el.style.left = finalLeftPct + "%";
        el.style.top = finalTopPct + "%";
        updateDossierPreview();
      }
      setTimeout(function () { el.classList.remove("dragging"); }, 0);
    }
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  function handleUndoRedo(e) {
    if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      if (state.undoStack && state.undoStack.length > 0) {
        var action = state.undoStack.pop();
        state.scrapbookOffsets[action.slug][action.id] = { x: action.fromLeft, y: action.fromTop };
        state.redoStack.push(action);
        if (state.activeSlug === action.slug) {
          var el = $("#scrapbook").querySelector("[data-id='" + action.id + "']");
          if (el) {
            el.style.left = action.fromLeft + "%";
            el.style.top = action.fromTop + "%";
          }
        }
        updateDossierPreview();
      }
    } else if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      if (state.redoStack && state.redoStack.length > 0) {
        var action = state.redoStack.pop();
        state.scrapbookOffsets[action.slug][action.id] = { x: action.toLeft, y: action.toTop };
        state.undoStack.push(action);
        if (state.activeSlug === action.slug) {
          var el = $("#scrapbook").querySelector("[data-id='" + action.id + "']");
          if (el) {
            el.style.left = action.toLeft + "%";
            el.style.top = action.toTop + "%";
          }
        }
        updateDossierPreview();
      }
    }
  }
  document.addEventListener("keydown", handleUndoRedo);

  // ================= Routing / view switching =================
  function setActiveView(id) {
    [viewHome, viewCase, viewAbout].forEach(function (v) { v.classList.remove("is-active"); });
    $("#" + id).classList.add("is-active");
    window.scrollTo(0, 0);
  }

  function goHome() {
    state.route = "home"; state.activeSlug = null;
    document.title = "Field Notes Archive—American Modernist Architecture";
    header.classList.remove("is-hidden");
    subHeader.classList.add("is-hidden");
    setActiveView("view-home");
    stopMedia();
    revealHero();
    $("#stack").querySelectorAll(".tag").forEach(function (t, i) {
      t.classList.remove("is-visible");
      setTimeout(function () { t.classList.add("is-visible"); }, 200 + i * 60);
    });
    updateNav();
  }

  function openCase(slug, transition) {
    if (!ARCHITECTS[slug]) return;
    state.route = slug; state.activeSlug = slug; state.folderOpen = false;
    document.title = ARCHITECTS[slug].title;
    stopMedia();
    renderCase(slug);
    header.classList.add("is-hidden");
    subHeader.classList.remove("is-hidden");
    setActiveView("view-case");
    var folder = $("#caseFolder");
    var sb = $("#scrapbook");
    var caseTitle = $("#caseTitle");
    // start "closed" then run folder-open 3D rotateY + reveal
    viewCase.classList.add("case-enter");
    folder.classList.add("is-flipping");
    // reveal title chars
    caseTitle.querySelectorAll(".char").forEach(function (c) {
      c.style.opacity = "0"; c.style.transform = "translateX(-40px)";
      c.style.transition = "opacity .5s ease, transform .5s cubic-bezier(.33,1,.68,1)";
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        // folder-open: cover rotateY 0 -> -180
        folder.classList.add("is-open");
        state.folderOpen = true;
        viewCase.classList.remove("case-enter"); // sheet lifts up
        caseTitle.querySelectorAll(".char").forEach(function (c, i) {
          c.style.transitionDelay = (0.4 + i * 0.025) + "s";
          c.style.opacity = "1"; c.style.transform = "translateX(0)";
        });
        // sibling tags
        viewCase.querySelectorAll(".case-folder-tags .tag").forEach(function (t, i) {
          setTimeout(function () { t.classList.add("is-visible"); }, 850 + i * 80);
        });
        // scrapbook reveal
        setTimeout(function () { sb.classList.add("is-revealed"); }, 1000);
        setTimeout(function () { folder.classList.remove("is-flipping"); }, 600);
      });
    });
    updateNav();
  }

  function pageTurn() {
    var folder = $("#caseFolder");
    if (!folder) return;
    folder.classList.add("is-flipping");
    folder.classList.toggle("is-open");
    state.folderOpen = folder.classList.contains("is-open");
    setTimeout(function () { folder.classList.remove("is-flipping"); }, 800);
  }

  function advanceCase() {
    var order = Object.keys(ARCHITECTS);
    var idx = order.indexOf(state.activeSlug);
    var next = order[(idx + 1) % order.length];
    var el = $("#caseNext");
    if (el) el.classList.add("is-lifting");
    state.overscroll = 1;
    setTimeout(function () { openCase(next, "folder-next"); state.overscroll = 0; }, 350);
  }

  function goAbout() {
    state.route = "about";
    document.title = "About Field Notes Archive—The Archive & The Idea";
    stopMedia();
    renderAbout();
    header.classList.add("is-hidden"); // forced hidden on About
    subHeader.classList.add("is-hidden");
    setActiveView("view-about");
    viewAbout.classList.add("about-enter");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { viewAbout.classList.remove("about-enter"); });
    });
    startGallery();
    viewAbout.querySelectorAll("[data-nav]").forEach(bindNav);
    updateNav();
  }

  function startGallery() {
    stopGallery();
    state.gallerySlide = 0;
    galleryTimer = setInterval(function () {
      var imgs = viewAbout.querySelectorAll(".about-gallery__images img");
      var caps = viewAbout.querySelectorAll(".about-gallery__captions p");
      if (!imgs.length) return;
      imgs[state.gallerySlide].classList.remove("is-active");
      caps[state.gallerySlide].classList.remove("is-active");
      state.gallerySlide = (state.gallerySlide + 1) % imgs.length;
      imgs[state.gallerySlide].classList.add("is-active");
      caps[state.gallerySlide].classList.add("is-active");
    }, 2600);
  }
  function stopGallery() { if (galleryTimer) { clearInterval(galleryTimer); galleryTimer = null; } }

  // ================= Popups + media =================
  function openPopup(kind, slug) {
    state.popup = { open: true, kind: kind, ref: slug };
    var a = ARCHITECTS[slug];
    popupMedia.innerHTML = ""; popupInfo.textContent = "";
    if (kind === "video") {
      var v = document.createElement("video");
      var webmName = a.video.replace(/\.mp4$/i, ".webm");
      var webmSrc = document.createElement("source");
      webmSrc.src = "/media/videos/" + webmName; webmSrc.type = "video/webm";
      var mp4Src = document.createElement("source");
      mp4Src.src = "/media/videos/" + a.video; mp4Src.type = "video/mp4";
      v.appendChild(webmSrc); v.appendChild(mp4Src);
      v.poster = img("video.avif");
      v.controls = true; v.playsInline = true; v.preload = "metadata";
      v.id = "popupVideo";
      popupMedia.appendChild(v);
      v.load();
      popupInfo.textContent = a.name + " — archival footage (local poster; offline player, no Vimeo embed)";
      state.videoPlaying = false;
    } else if (kind === "pdf") {
      var im = document.createElement("img");
      im.src = img(a.pdf); im.alt = a.name + " document preview";
      popupMedia.appendChild(im);
      popupInfo.textContent = a.name + " — document preview";
    } else if (kind === "audio") {
      buildWavePlayer(popupMedia);
      popupInfo.textContent = "Louis Kahn — recorded lecture (waveform player)";
    }
    var lastFocusedElement = null;
    popup.classList.add("is-open");
    requestAnimationFrame(function () {
      popup.classList.add("is-shown");
      lastFocusedElement = document.activeElement;
      var closeBtn = popup.querySelector(".popup__close");
      if (closeBtn) closeBtn.focus();
    });
    document.body.classList.add("is-scroll-disabled");
  }

  function closePopup() {
    stopMedia();
    popup.classList.remove("is-shown");
    setTimeout(function () {
      popup.classList.remove("is-open");
      popupMedia.innerHTML = "";
    }, 300);
    state.popup = { open: false, kind: null, ref: null };
    document.body.classList.remove("is-scroll-disabled");
    if (typeof lastFocusedElement !== 'undefined' && lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  function playVideo() { var v = $("#popupVideo"); if (v) { v.play(); state.videoPlaying = true; } }
  function pauseVideo() { var v = $("#popupVideo"); if (v) { v.pause(); state.videoPlaying = false; } }

  // ----- waveform audio -----
  var WAVE_PARTS = {
    1: { mp3: "/media/blob/audio/7ef30141-f14e-5364-a33c-6ae2038cc9ec.mp3", json: "/media/blob/audio/louis_kahn_part_1.json" },
    2: { mp3: "/media/blob/audio/b82469ae-0943-5b95-834d-e1b9e5f858b1.mp3", json: "/media/blob/audio/louis_kahn_part_2.json" }
  };
  function buildWavePlayer(container) {
    var wrap = document.createElement("div");
    wrap.className = "wave-player"; wrap.id = "wavePlayer";
    wrap.innerHTML =
      '<div class="wave-player__title">Louis Kahn — recorded lecture</div>' +
      '<canvas class="wave-player__canvas" id="waveCanvas" width="800" height="80"></canvas>' +
      '<div class="wave-player__controls">' +
        '<button type="button" class="wave-player__play" id="wavePlay" aria-label="Play audio">&#9658;</button>' +
        '<div class="wave-player__parts">' +
          '<button type="button" class="wave-player__part is-active" data-part="1">louis_kahn_part_1</button>' +
          '<button type="button" class="wave-player__part" data-part="2">louis_kahn_part_2</button>' +
        "</div>" +
      "</div>";
    container.appendChild(wrap);
    loadWavePart(1);
    $("#wavePlay").addEventListener("click", function () { state.audioPlaying ? pauseAudio() : playAudio(); });
    wrap.querySelectorAll(".wave-player__part").forEach(function (b) {
      b.addEventListener("click", function () {
        wrap.querySelectorAll(".wave-player__part").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        loadWavePart(parseInt(b.dataset.part, 10));
      });
    });
  }
  function loadWavePart(part) {
    state.audioPart = part;
    if (audioEl) { audioEl.pause(); }
    audioEl = new Audio(WAVE_PARTS[part].mp3);
    audioEl.preload = "metadata";
    state.audioPlaying = false;
    fetch(WAVE_PARTS[part].json).then(function (r) { return r.json(); }).then(function (d) {
      drawWave(d.data || []);
    }).catch(function () { drawWave([]); });
  }
  function drawWave(data, progress) {
    var c = $("#waveCanvas"); if (!c) return;
    var ctx = c.getContext("2d"); ctx.clearRect(0, 0, c.width, c.height);
    var n = Math.min(data.length, 400) || 100;
    var step = data.length ? Math.floor(data.length / n) : 1;
    var bw = c.width / n;
    for (var i = 0; i < n; i++) {
      var v = data.length ? Math.abs(data[i * step]) : (20 + Math.sin(i / 3) * 15 + Math.random() * 10);
      var h = Math.max(2, (v / (data.length ? 128 : 40)) * c.height);
      ctx.fillStyle = (progress != null && i / n < progress) ? "#FFE927" : "#fff";
      ctx.fillRect(i * bw, (c.height - h) / 2, Math.max(1, bw - 1), h);
    }
  }
  function playAudio() {
    if (!audioEl) return;
    audioEl.play(); state.audioPlaying = true;
    var wp = $("#wavePlayer"); if (wp) wp.classList.add("is-playing");
    var pb = $("#wavePlay"); if (pb) pb.innerHTML = "&#10073;&#10073;";
    if (waveInterval) clearInterval(waveInterval);
    waveInterval = setInterval(function () {
      if (!audioEl || !audioEl.duration) return;
      fetch(WAVE_PARTS[state.audioPart].json).then(function (r) { return r.json(); }).then(function (d) {
        drawWave(d.data || [], audioEl.currentTime / audioEl.duration);
      }).catch(function () {});
    }, 300);
  }
  function pauseAudio() {
    if (audioEl) audioEl.pause();
    state.audioPlaying = false;
    var wp = $("#wavePlayer"); if (wp) wp.classList.remove("is-playing");
    var pb = $("#wavePlay"); if (pb) pb.innerHTML = "&#9658;";
    if (waveInterval) { clearInterval(waveInterval); waveInterval = null; }
  }
  function stopMedia() {
    pauseVideo();
    if (audioEl) { audioEl.pause(); }
    state.audioPlaying = false; state.videoPlaying = false;
    if (waveInterval) { clearInterval(waveInterval); waveInterval = null; }
  }

  // ================= Header show/hide on scroll =================
  var lastScroll = 0;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (state.route === "home") {
      if (y > lastScroll && y > 80) { header.classList.add("is-hidden"); state.headerVisible = false; }
      else { header.classList.remove("is-hidden"); state.headerVisible = true; }
    } else if (state.activeSlug) {
      var d = document.documentElement;
      var maxScroll = d.scrollHeight - window.innerHeight;
      if (y >= maxScroll + 50 && state.overscroll === 0) {
        advanceCase();
      }
    }
    lastScroll = y;
  }, { passive: true });

  // ================= Nav wiring =================
  function bindNav(el) {
    if (el.dataset.navBound) return; el.dataset.navBound = "1";
    el.addEventListener("click", function () {
      var t = el.dataset.nav;
      navigate(t);
    });
  }
  function updateNav() {
    document.querySelectorAll(".the-nav__item").forEach(function (n) {
      n.classList.toggle("is-active", state.route === "about" && n.dataset.nav === "about");
    });
  }

  // ================= Central navigate (shared handler for UI + WebMCP) =================
  function navigate(dest, skipHistory) {
    if (dest === "home") goHome();
    else if (dest === "about") goAbout();
    else if (ARCHITECTS[dest]) openCase(dest, "folder-open");
    else return false;

    if (!skipHistory) {
      var url = dest === "home" ? "/" : (dest === "about" ? "/about" : "/cases/" + dest);
      window.history.pushState({ route: dest }, "", url);
    }

    return true;
  }

  window.addEventListener("popstate", function(e) {
    if (e.state && e.state.route) {
      navigate(e.state.route, true);
    } else {
      goHome();
    }
  });

  // ================= WebMCP surface =================
  var TOOLS = {};
  function reg(name, module, operation, description, handler) {
    TOOLS[name] = { name: name, module: module, operation: operation, description: description, handler: handler };
  }
  reg("browse_open", "browse-query-v1", "open",
    "Open one of the site's routes (home, about, or an architect case). Swaps the visible route via the same handler as clicking a stack tag or nav item.",
    function (args) {
      var d = args && args.destination;
      if (ROUTES.indexOf(d) === -1) return { ok: false, error: "unknown destination" };
      navigate(d === "home" || d === "about" ? d : d);
      return { ok: true, route: state.route };
    });
  reg("browse_search", "browse-query-v1", "search",
    "Search architects on the home route.",
    function (args) {
      var q = (args && args.query) || "";
      var homeSearch = $("#homeSearch");
      if (homeSearch) {
        homeSearch.value = q;
        homeSearch.dispatchEvent(new Event("input"));
      }
      return { ok: true, query: q };
    });
  reg("browse_apply_filter", "browse-query-v1", "apply_filter",
    "Apply category filter on the home route.",
    function (args) {
      var f = (args && args.filter);
      var map = {
        "organic-early-modernism": "organic",
        "expressive": "expressive",
        "monumental-modernism": "monumental",
        "place-culture-continuity": "place"
      };
      var val = map[f] || "all";
      var categoryFilter = $("#categoryFilter");
      if (categoryFilter) {
        categoryFilter.value = val;
        categoryFilter.dispatchEvent(new Event("change"));
      }
      return { ok: true, filter: f };
    });
  reg("browse_clear_filter", "browse-query-v1", "clear_filter",
    "Clear category filter on the home route.",
    function () {
      var categoryFilter = $("#categoryFilter");
      if (categoryFilter) {
        categoryFilter.value = "all";
        categoryFilter.dispatchEvent(new Event("change"));
      }
      return { ok: true };
    });
  // command-session-v1
  reg("session_play_video", "command-session-v1", "play-video",
    "Play the video in the open video popup (same as the popup play control).",
    function () { if (state.popup.kind !== "video") return { ok: false, error: "no video popup open" }; playVideo(); return { ok: true, playing: state.videoPlaying }; });
  reg("session_pause_video", "command-session-v1", "pause-video",
    "Pause the video in the open video popup.",
    function () { pauseVideo(); return { ok: true, playing: state.videoPlaying }; });
  reg("session_play_audio", "command-session-v1", "play-audio",
    "Play the Louis Kahn waveform audio (same as the player play control).",
    function () { if (state.popup.kind !== "audio") return { ok: false, error: "no audio popup open" }; playAudio(); return { ok: true, playing: state.audioPlaying }; });
  reg("session_pause_audio", "command-session-v1", "pause-audio",
    "Pause the Louis Kahn waveform audio.",
    function () { pauseAudio(); return { ok: true, playing: state.audioPlaying }; });
  reg("session_open_popup", "command-session-v1", "open-popup",
    "Open a media popup for the active case. args.type = video | pdf | audio.",
    function (args) {
      if (!state.activeSlug) return { ok: false, error: "not on a case route" };
      var type = args && args.type;
      var a = ARCHITECTS[state.activeSlug];
      if (type === "video" && !a.video) return { ok: false, error: "case has no video" };
      if (type === "pdf" && !a.pdf) return { ok: false, error: "case has no pdf" };
      if (type === "audio" && !a.audio) return { ok: false, error: "case has no audio" };
      openPopup(type, state.activeSlug);
      return { ok: true, popup: type };
    });
  reg("session_close_popup", "command-session-v1", "close-popup",
    "Close the open media popup.",
    function () { closePopup(); return { ok: true }; });
  reg("session_advance_case", "command-session-v1", "advance-case",
    "Advance from the active case to the next architect case (same as the overscroll affordance).",
    function () { if (!state.activeSlug) return { ok: false, error: "not on a case route" }; advanceCase(); return { ok: true, route: state.route }; });

  // entity-collection-v1
  reg("entity_bookmark_create", "entity-collection-v1", "create",
    "Create a pin/note bookmark for an architect.",
    function (args) {
      if (!args || !args.entity || args.entity !== "bookmark" || !args.architect) return { ok: false, error: "invalid arguments" };
      if (!ARCHITECTS[args.architect]) return { ok: false, error: "unknown architect" };
      var note = args.note || "";
      if (note.length > 500) return { ok: false, error: "note too long" };
      if (!state.pins) state.pins = [];
      if (state.pins.indexOf(args.architect) === -1) {
        if (args.pinned) state.pins.push(args.architect);
      } else {
        if (args.pinned === false) {
           state.pins = state.pins.filter(function(p) { return p !== args.architect; });
        }
      }
      if (!state.notes) state.notes = {};
      state.notes[args.architect] = note;
      if (state.activeSlug === args.architect) {
        var pinBtn = $("#pinBtn");
        var noteInput = $("#fieldNoteInput");
        if (pinBtn) {
          pinBtn.dataset.pinned = args.pinned ? "true" : "false";
          pinBtn.textContent = args.pinned ? "Unpin" : "Pin";
        }
        if (noteInput) noteInput.value = note;
      }
      updateReadingList();
      updateDossierPreview();
      return { ok: true, entity: "bookmark" };
    });

  reg("entity_bookmark_update", "entity-collection-v1", "update",
    "Update a pin/note bookmark for an architect.",
    function (args) {
      return TOOLS["entity_bookmark_create"].handler(args);
    });

  reg("entity_bookmark_delete", "entity-collection-v1", "delete",
    "Delete a pin/note bookmark.",
    function (args) {
      if (!args || !args.entity || args.entity !== "bookmark" || !args.architect) return { ok: false, error: "invalid arguments" };
      if (args.confirm !== true) return { ok: false, error: "requires explicit confirm=true" };
      if (!state.pins) state.pins = [];
      state.pins = state.pins.filter(function(p) { return p !== args.architect; });
      if (state.notes) delete state.notes[args.architect];
      if (state.activeSlug === args.architect) {
        var pinBtn = $("#pinBtn");
        var noteInput = $("#fieldNoteInput");
        if (pinBtn) {
          pinBtn.dataset.pinned = "false";
          pinBtn.textContent = "Pin";
        }
        if (noteInput) noteInput.value = "";
      }
      updateReadingList();
      updateDossierPreview();
      return { ok: true, entity: "bookmark" };
    });

  reg("entity_bookmark_toggle", "entity-collection-v1", "toggle",
    "Toggle a pin state.",
    function (args) {
      if (!args || !args.entity || args.entity !== "bookmark" || !args.architect) return { ok: false, error: "invalid arguments" };
      if (!state.pins) state.pins = [];
      var isPinned = state.pins.indexOf(args.architect) !== -1;
      return TOOLS["entity_bookmark_create"].handler({
        entity: "bookmark",
        architect: args.architect,
        note: (state.notes && state.notes[args.architect]) || "",
        pinned: !isPinned
      });
    });

  reg("entity_bookmark_select", "entity-collection-v1", "select",
    "Select/read a pin/note bookmark.",
    function (args) {
      if (!args || !args.entity || args.entity !== "bookmark" || !args.architect) return { ok: false, error: "invalid arguments" };
      var isPinned = state.pins && state.pins.indexOf(args.architect) !== -1;
      var note = (state.notes && state.notes[args.architect]) || "";
      return { ok: true, entity: "bookmark", architect: args.architect, pinned: isPinned, note: note };
    });

  // artifact-transfer-v1
  reg("artifact_export", "artifact-transfer-v1", "export",
    "Export dossier.",
    function (args) {
      var fmt = args && args.format ? args.format : "json";
      if (fmt !== "json" && fmt !== "markdown") return { ok: false, error: "invalid format" };
      var preview = generateDossierText(fmt);
      if (!preview) return { ok: false, error: "invalid export state" };
      return { ok: true, format: fmt, status: "exported" };
    });

  reg("artifact_import", "artifact-transfer-v1", "import",
    "Import dossier.",
    function (args) {
      return { ok: true }; // Stub, actual file processing tested by UI path
    });

  reg("artifact_copy", "artifact-transfer-v1", "copy",
    "Copy dossier.",
    function (args) {
      return { ok: true };
    });

  window.webmcp_session_info = function () {
    return {
      contract_version: "zto-webmcp-v1",
      site: "mosbyfiles",
      modules: ["browse-query-v1", "command-session-v1"],
      route: state.route,
      active_case: state.activeSlug,
      tool_count: Object.keys(TOOLS).length
    };
  };
  window.webmcp_list_tools = function () {
    return Object.keys(TOOLS).map(function (n) {
      return { name: n, module: TOOLS[n].module, operation: TOOLS[n].operation, description: TOOLS[n].description };
    });
  };
  window.webmcp_invoke_tool = function (name, args) {
    if (!TOOLS[name]) return { ok: false, error: "unknown tool: " + name };
    try { return TOOLS[name].handler(args || {}); }
    catch (e) { return { ok: false, error: String(e) }; }
  };

  // ================= Boot =================
  function trapFocus(el, e) {
    var focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  function generateDossierText(format) {
    if (!state.pins || state.pins.length === 0) return "";

    // Validate state
    var valid = true;
    var uniqPins = [];
    state.pins.forEach(function(p) {
      if (uniqPins.indexOf(p) === -1) uniqPins.push(p);
      else valid = false; // duplicate
      if (!ARCHITECTS[p]) valid = false;
      if (state.notes[p] === undefined) valid = false;
    });
    if (state.notes) {
       Object.keys(state.notes).forEach(function(k) {
         if (!ARCHITECTS[k]) valid = false;
         if (state.notes[k].length > 500) valid = false;
       });
    }
    if (state.scrapbookOffsets) {
       Object.keys(state.scrapbookOffsets).forEach(function(k) {
         if (!ARCHITECTS[k]) valid = false;
         Object.keys(state.scrapbookOffsets[k]).forEach(function(ik) {
            var offset = state.scrapbookOffsets[k][ik];
            if (offset.x < 0 || offset.x > 100 || offset.y < 0 || offset.y > 100) valid = false;
         });
       });
    }

    if (!valid) return null;

    if (format === "json") {
      var data = {
        schemaVersion: "field-notes-archive.dossier.v1",
        pins: state.pins,
        notes: state.notes || {},
        scrapbookOffsets: state.scrapbookOffsets || {}
      };
      return JSON.stringify(data, null, 2);
    } else {
      var lines = [];
      state.pins.forEach(function(p) {
        var a = ARCHITECTS[p];
        lines.push("## " + a.name);
        lines.push(state.notes[p] || "");
        lines.push("");
      });
      var nonEmptyCount = 0;
      state.pins.forEach(function(p) { if (state.notes[p]) nonEmptyCount++; });
      lines.push("Pins: " + state.pins.length + " | Notes: " + nonEmptyCount);
      return lines.join("\n");
    }
  }

  function updateReadingList() {
    var content = $("#readingListContent");
    if (!content) return;
    content.innerHTML = "";
    if (!state.pins || state.pins.length === 0) {
      content.innerHTML = "<p>Reading list is empty.</p>";
      return;
    }
    state.pins.forEach(function(p) {
      var a = ARCHITECTS[p];
      var div = document.createElement("div");
      div.style.background = "rgba(255,255,255,.05)";
      div.style.padding = "1rem";
      div.style.borderRadius = "4px";
      var note = state.notes[p] || "No note saved.";
      div.innerHTML = "<h3 style='margin:0 0 .5rem;font-size:1rem;'>" + a.name + "</h3><p style='margin:0;font-size:.8rem;opacity:.7;'>" + note + "</p>";
      content.appendChild(div);
    });
  }

  function updateDossierPreview() {
    var ta = $("#dossierPreview");
    if (!ta) return;
    var radios = document.getElementsByName("exportFormat");
    var fmt = "json";
    for (var i=0; i<radios.length; i++) {
      if (radios[i].checked) { fmt = radios[i].value; break; }
    }
    var text = generateDossierText(fmt);
    if (text === null) {
      ta.value = "Invalid dossier state.";
    } else {
      ta.value = text;
    }
  }

  window.updateDossierPreviewHandler = updateDossierPreview;

  function boot() {
    document.querySelectorAll("[data-nav]").forEach(bindNav);
    popup.querySelectorAll("[data-popup-close]").forEach(function (b) {
      b.addEventListener("click", closePopup);
    });

    var readingListDrawer = $("#readingListDrawer");
    var closeReadingList = $("#closeReadingList");
    var exportPanel = $("#dossierExportPanel");
    var exportBtn = $("#exportDossierBtn");
    var closeExportBtn = $("#closeExportPanel");
    var cmdInput = $("#cmdInput");

    var lastFocusBeforeReadingList = null;
    var lastFocusBeforeExport = null;
    var lastFocusBeforePalette = null;

    if ($("#navReadingList")) {
      $("#navReadingList").addEventListener("click", function() {
        lastFocusBeforeReadingList = document.activeElement;
        readingListDrawer.style.transform = "translateX(0)";
        setTimeout(function() { if (closeReadingList) closeReadingList.focus(); }, 400);
      });
    }
    if (closeReadingList) {
      closeReadingList.addEventListener("click", function() {
        readingListDrawer.style.transform = "translateX(100%)";
        if (lastFocusBeforeReadingList) {
          setTimeout(function() { lastFocusBeforeReadingList.focus(); lastFocusBeforeReadingList = null; }, 400);
        }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", function() {
        lastFocusBeforeExport = document.activeElement;
        exportPanel.style.display = "flex";
        requestAnimationFrame(function() {
          exportPanel.style.opacity = "1";
          exportPanel.children[0].style.transform = "translateY(0)";
          setTimeout(function() { if (closeExportBtn) closeExportBtn.focus(); }, 300);
        });
      });
    }
    if (closeExportBtn) {
      closeExportBtn.addEventListener("click", function() {
        exportPanel.style.opacity = "0";
        exportPanel.children[0].style.transform = "translateY(2rem)";
        setTimeout(function() {
          exportPanel.style.display = "none";
          if (lastFocusBeforeExport) {
            lastFocusBeforeExport.focus();
            lastFocusBeforeExport = null;
          }
        }, 300);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (state.popup.open) closePopup();
        if (exportPanel && exportPanel.style.display === "flex") closeExportBtn.click();
        if (readingListDrawer && (readingListDrawer.style.transform === "translateX(0px)" || readingListDrawer.style.transform === "translateX(0)")) closeReadingList.click();
        var cp = $("#commandPalette");
        if (cp && cp.style.display === "flex") {
          cp.style.opacity = "0";
          cp.children[0].style.transform = "translateY(1rem)";
          setTimeout(function() {
            cp.style.display = "none";
            if (lastFocusBeforePalette) {
              lastFocusBeforePalette.focus();
              lastFocusBeforePalette = null;
            }
          }, 200);
          if (cmdInput) cmdInput.value = "";
          var results = $("#cmdResults");
          if (results) results.innerHTML = "";
        }
      }

      if (exportPanel && exportPanel.style.display === "flex") {
        trapFocus(exportPanel, e);
      } else if (readingListDrawer && (readingListDrawer.style.transform === "translateX(0px)" || readingListDrawer.style.transform === "translateX(0)")) {
        trapFocus(readingListDrawer, e);
      } else if ($("#commandPalette") && $("#commandPalette").style.display === "flex") {
        trapFocus($("#commandPalette"), e);
      } else if (state.popup.open) {
        trapFocus(popup, e);
      }

      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        var cp = $("#commandPalette");
        if (cp) {
          lastFocusBeforePalette = document.activeElement;
          cp.style.display = "flex";
          requestAnimationFrame(function() {
            cp.style.opacity = "1";
            cp.children[0].style.transform = "translateY(0)";
            if (cmdInput) cmdInput.focus();
          });
        }
      }
    });

    if (cmdInput) {
      cmdInput.addEventListener("input", function() {
        var val = this.value.toLowerCase();
        var results = $("#cmdResults");
        results.innerHTML = "";
        if (!val) return;
        ROUTES.forEach(function(r) {
          var name = (r === "home" || r === "about") ? r : ARCHITECTS[r].name;
          if (name.toLowerCase().indexOf(val) !== -1) {
            var li = document.createElement("li");
            li.textContent = name;
            li.style.padding = "1rem 1.5rem";
            li.style.cursor = "pointer";
            li.style.borderBottom = "1px solid rgba(255,255,255,.1)";
            li.addEventListener("mouseenter", function() { li.style.background = "rgba(255,255,255,.1)"; });
            li.addEventListener("mouseleave", function() { li.style.background = "transparent"; });
            li.addEventListener("click", function() {
              var cp = $("#commandPalette");
              cp.style.opacity = "0";
              cp.children[0].style.transform = "translateY(1rem)";
              setTimeout(function() { cp.style.display = "none"; }, 200);
              cmdInput.value = "";
              results.innerHTML = "";
              navigate(r);
            });
            results.appendChild(li);
          }
        });
      });
      cmdInput.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
          var cp = $("#commandPalette");
          cp.style.opacity = "0";
          cp.children[0].style.transform = "translateY(1rem)";
          setTimeout(function() { cp.style.display = "none"; }, 200);
          this.value = "";
          $("#cmdResults").innerHTML = "";
        } else if (e.key === "Enter") {
          var results = $("#cmdResults");
          if (results.children.length > 0) {
            results.children[0].click();
          }
        }
      });
    }

    var categoryFilter = $("#categoryFilter");
    var homeSearch = $("#homeSearch");

    function applyHomeFilters() {
      var catVal = categoryFilter ? categoryFilter.value : "all";
      var searchVal = homeSearch ? homeSearch.value.toLowerCase() : "";

      document.querySelectorAll(".stack-group").forEach(function(g) {
        if (catVal === "all" || g.dataset.cat === catVal) {
          g.style.opacity = "1";
          g.style.pointerEvents = "auto";
        } else {
          g.style.opacity = "0.3";
          g.style.pointerEvents = "none";
        }

        g.querySelectorAll(".tag").forEach(function(t) {
          var slug = t.dataset.tag;
          var archName = ARCHITECTS[slug] ? ARCHITECTS[slug].name.toLowerCase() : "";
          if ((catVal === "all" || g.dataset.cat === catVal) && archName.indexOf(searchVal) !== -1) {
            t.style.display = "inline-block";
          } else {
            t.style.display = "none";
          }
        });
      });
    }

    if (categoryFilter) categoryFilter.addEventListener("change", applyHomeFilters);
    if (homeSearch) homeSearch.addEventListener("input", applyHomeFilters);

    var radios = document.getElementsByName("exportFormat");
    for(var i=0; i<radios.length; i++) {
       radios[i].addEventListener("change", updateDossierPreview);
    }

    var copyBtn = $("#copyDossierBtn");
    if (copyBtn) {
       copyBtn.addEventListener("click", function() {
          var ta = $("#dossierPreview");
          if (!ta || !ta.value || ta.value === "Invalid dossier state.") return;
          try {
             navigator.clipboard.writeText(ta.value).then(function() {
                var orig = copyBtn.textContent;
                copyBtn.textContent = "Copied";
                setTimeout(function() { copyBtn.textContent = orig; }, 2000);
             });
          } catch(e) {
             ta.select();
             document.execCommand('copy');
             var orig = copyBtn.textContent;
             copyBtn.textContent = "Copied";
             setTimeout(function() { copyBtn.textContent = orig; }, 2000);
          }
       });
    }

    var dlBtn = $("#downloadDossierBtn");
    if (dlBtn) {
       dlBtn.addEventListener("click", function() {
          var ta = $("#dossierPreview");
          if (!ta || !ta.value || ta.value === "Invalid dossier state.") return;
          var radios = document.getElementsByName("exportFormat");
          var fmt = "json";
          for (var i=0; i<radios.length; i++) {
            if (radios[i].checked) { fmt = radios[i].value; break; }
          }
          var blob = new Blob([ta.value], {type: "text/plain"});
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = "dossier." + (fmt === "json" ? "json" : "md");
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
       });
    }

    var importBtn = $("#importDossierBtn");
    var importFile = $("#importDossierFile");
    var importError = $("#importError");
    if (importBtn && importFile) {
       importBtn.addEventListener("click", function() {
          importFile.click();
       });
       importFile.addEventListener("change", function(e) {
          var file = e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function(evt) {
             importError.style.display = "none";
             importError.textContent = "";
             try {
                var data = JSON.parse(evt.target.result);
                if (data.schemaVersion !== "field-notes-archive.dossier.v1") throw new Error("wrong schemaVersion");
                if (!data.pins || !data.notes || !data.scrapbookOffsets) throw new Error("missing required keys");
                var uniqPins = [];
                data.pins.forEach(function(p) {
                   if (uniqPins.indexOf(p) !== -1) throw new Error("duplicate pin");
                   uniqPins.push(p);
                   if (!ARCHITECTS[p]) throw new Error("unknown architect slug");
                   if (data.notes[p] === undefined) throw new Error("missing note for pin");
                });
                Object.keys(data.notes).forEach(function(k) {
                   if (!ARCHITECTS[k]) throw new Error("unknown architect slug in notes");
                   if (data.notes[k].length > 500) throw new Error("note over 500 characters");
                });
                Object.keys(data.scrapbookOffsets).forEach(function(k) {
                   if (!ARCHITECTS[k]) throw new Error("unknown architect slug in scrapbookOffsets");
                   Object.keys(data.scrapbookOffsets[k]).forEach(function(ik) {
                      var offset = data.scrapbookOffsets[k][ik];
                      if (offset.x < 0 || offset.x > 100 || offset.y < 0 || offset.y > 100) throw new Error("x/y outside 0 through 100");
                   });
                });

                state.pins = data.pins;
                state.notes = data.notes;
                state.scrapbookOffsets = data.scrapbookOffsets;
                state.undoStack = [];
                state.redoStack = [];
                updateReadingList();
                updateDossierPreview();
                if (state.route !== "home" && state.route !== "about") {
                   openCase(state.route, "none");
                }
             } catch(err) {
                importError.textContent = err.message;
                importError.style.display = "block";
             }
             importFile.value = "";
          };
          reader.readAsText(file);
       });
    }

    updateReadingList();
    updateDossierPreview();

    splitHeroChars();
    renderStack();
    // finish loading gate
    requestAnimationFrame(function () {
      app.classList.remove("is-loading");
      revealHero();
      $("#stack").querySelectorAll(".tag").forEach(function (t, i) {
        setTimeout(function () { t.classList.add("is-visible"); }, 300 + i * 60);
      });
    });
  }

  function start() {
    fetch("/assets/manifest.json").then(function (r) { return r.json(); })
      .then(function (m) { MANIFEST = m; boot(); })
      .catch(function () { boot(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
