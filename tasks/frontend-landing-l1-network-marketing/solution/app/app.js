(() => {
  // —— State ——
  const storedTheme = localStorage.getItem("ridge-theme");
  window.__ridgeState = {
    theme: storedTheme === "dark" ? "dark" : "light",
    currentDestination: "marketing-home",
    events: [
      { id: "e1", title: "Alpine Summit", date: "2026-09-10", city: "Denver", category: "Summit", status: "featured", featured: "true" },
      { id: "e2", title: "Valley Hackathon", date: "2026-10-15", city: "San Francisco", category: "Hackathon", status: "upcoming", featured: "false" },
      { id: "e3", title: "Glacier Meetup", date: "2026-11-20", city: "Berlin", category: "Meetup", status: "upcoming", featured: "false" },
      { id: "e4", title: "Avalanche Workshop", date: "2026-12-05", city: "London", category: "Workshop", status: "featured", featured: "true" },
      { id: "e5", title: "Snowcap Webinar", date: "2026-03-12", city: "Zurich", category: "Webinar", status: "past", featured: "false" },
      { id: "e6", title: "Frostbite Mixer", date: "2026-02-14", city: "New York", category: "Meetup", status: "past", featured: "false" }
    ],
    leads: [],
    undoStack: [], // stores collection snapshots or one atomic catalog snapshot
    redoStack: [],
    filters: { status: "", category: "" },
    sorts: { date: "", title: "" },
    selectedEventIds: []
  };

  const state = window.__ridgeState;
  const CONTACT_INTERESTS = ["Build", "Solutions", "Community", "Enterprise"];
  const EVENT_CATEGORIES = ["Summit", "Meetup", "Workshop", "Hackathon", "Webinar"];
  const EVENT_STATUSES = ["upcoming", "featured", "past"];
  const VALID_DESTINATIONS = ["marketing-home", "events-manager", "global-events", "export-catalog", "session-leads"];

  function pushUndo(type) {
    state.undoStack.push({
      type,
      previousState: JSON.parse(JSON.stringify(state[type]))
    });
    state.redoStack = [];
  }

  function applyTheme(t) {
    const nextTheme = t === "dark" ? "dark" : "light";
    state.theme = nextTheme;
    const root = document.documentElement;
    root.setAttribute("data-theme", nextTheme);
    localStorage.setItem("ridge-theme", nextTheme);
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;



  function sanitize(str) {
    if (str === null || str === undefined) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }

  function validateContactPayload(payload) {
    const errors = [];
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim();
    const message = String(payload.message || "").trim();
    if (name.length < 2) errors.push("name must be at least 2 characters");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email must be valid");
    if (!CONTACT_INTERESTS.includes(payload.interest)) errors.push("interest is required");
    if (payload.privacy_consent !== true) errors.push("privacy_consent must be accepted");
    if (message && message.length < 10) errors.push("message must be at least 10 characters");
    return errors;
  }

  function validateEventPayload(event) {
    const errors = [];
    if (String(event.title || "").trim().length < 2) errors.push("title must be at least 2 characters");
    if (!event.date) errors.push("date is required");
    if (String(event.city || "").trim().length < 2) errors.push("city must be at least 2 characters");
    if (!EVENT_CATEGORIES.includes(event.category)) errors.push("category is invalid");
    if (!EVENT_STATUSES.includes(event.status)) errors.push("status is invalid");
    if (!["true", "false"].includes(event.featured)) errors.push("featured is invalid");
    if (event.featured === "true" && event.status !== "featured") errors.push("featured events must have status featured");
    if (event.status === "featured" && event.featured !== "true") errors.push("status featured requires featured true");
    return errors;
  }

  function makeLead(payload) {
    return {
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      kind: "contact",
      submittedAt: new Date().toISOString(),
      payload: {
        name: String(payload.name || "").trim(),
        email: String(payload.email || "").trim(),
        company: String(payload.company || ""),
        interest: payload.interest,
        privacy_consent: payload.privacy_consent === true,
        message: String(payload.message || "")
      }
    };
  }

  function catalogCounts() {
    return {
      events: state.events.length,
      leads: state.leads.length,
      upcoming: state.events.filter(event => event.status === "upcoming").length,
      featured: state.events.filter(event => event.status === "featured").length,
      past: state.events.filter(event => event.status === "past").length
    };
  }

  function buildCatalog() {
    return { version: 1, theme: state.theme, events: state.events, leads: state.leads, counts: catalogCounts() };
  }

  function escapeICSText(text) {
    return String(text || "")
      .replaceAll("\\", "\\\\")
      .replaceAll(";", "\\;")
      .replaceAll(",", "\\,")
      .replaceAll(/\r\n|\r|\n/g, "\\n");
  }

  function buildICS() {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ridge//Events//EN"];
    state.events.forEach(event => {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${event.id}@ridge`);
      lines.push(`DTSTART:${String(event.date || "").replaceAll("-", "")}`);
      lines.push(`SUMMARY:${escapeICSText(event.title)}`);
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function buildLeadsExport() {
    return { version: 1, theme: state.theme, counts: { total: state.leads.length }, leads: state.leads };
  }

  function validateCatalog(data) {
    if (!data || data.version !== 1 || !["light", "dark"].includes(data.theme) || !Array.isArray(data.events) || !Array.isArray(data.leads) || !data.counts) {
      throw new Error("catalog must include version, theme, events, leads, and counts");
    }
    for (const event of data.events) {
      if (!event.id || String(event.title || "").trim().length < 2 || !event.date || String(event.city || "").trim().length < 2) throw new Error("catalog event fields are invalid");
      if (!EVENT_CATEGORIES.includes(event.category) || !EVENT_STATUSES.includes(event.status) || !["true", "false"].includes(event.featured)) throw new Error("catalog event enum is invalid");
      if (event.featured === "true" && event.status !== "featured") throw new Error("catalog featured events must have status featured");
      if (event.status === "featured" && event.featured !== "true") throw new Error("catalog status featured requires featured true");
    }
    for (const lead of data.leads) {
      if (!lead.id || lead.kind !== "contact" || Number.isNaN(Date.parse(lead.submittedAt)) || validateContactPayload(lead.payload || {}).length) throw new Error("catalog lead fields are invalid");
    }
    return data;
  }

  function importCatalog(data) {
    const catalog = validateCatalog(data);
    state.undoStack.push({
      type: "catalog",
      previousState: { events: JSON.parse(JSON.stringify(state.events)), leads: JSON.parse(JSON.stringify(state.leads)), theme: state.theme }
    });
    state.redoStack = [];
    state.events = JSON.parse(JSON.stringify(catalog.events));
    state.leads = JSON.parse(JSON.stringify(catalog.leads));
    applyTheme(catalog.theme);
    if (window.renderEventsManager) window.renderEventsManager();
    if (window.renderGlobalEvents) window.renderGlobalEvents();
    if (window.renderExportCatalog) window.renderExportCatalog();
    if (window.renderLeads) window.renderLeads();
  }

  // —— Navigation ——
  const megaMenu = document.getElementById("megaMenu");
  const hamburger = document.querySelector(".hamburger");
  const closeMegaMenuBtn = document.getElementById("closeMegaMenu");
  const outsideMegaMenu = document.querySelectorAll('.void > :not(#chrome), #chrome > .chrome-inner');

  function openMegaMenu() {
    megaMenu.setAttribute("aria-hidden", "false");
    megaMenu.classList.add("is-open");
    outsideMegaMenu.forEach(element => element.setAttribute('inert', ''));
    closeMegaMenuBtn?.focus();

    // Focus trap
    const focusableElements = megaMenu.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleMegaMenuKeydown(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
      if (e.key === 'Escape') {
        closeMegaMenu();
      }
    }

    megaMenu.removeEventListener('keydown', megaMenu._handleMegaMenuKeydown);
    megaMenu.addEventListener('keydown', handleMegaMenuKeydown);
    megaMenu._handleMegaMenuKeydown = handleMegaMenuKeydown;
  }

  function closeMegaMenu() {
    megaMenu.setAttribute("aria-hidden", "true");
    megaMenu.classList.remove("is-open");
    outsideMegaMenu.forEach(element => element.removeAttribute('inert'));
    hamburger?.focus();
    if (megaMenu._handleMegaMenuKeydown) {
      megaMenu.removeEventListener('keydown', megaMenu._handleMegaMenuKeydown);
    }
  }

  hamburger?.addEventListener("click", openMegaMenu);
  closeMegaMenuBtn?.addEventListener("click", closeMegaMenu);

  function navigateTo(dest) {
    if (!VALID_DESTINATIONS.includes(dest)) {
      // Unknown/undeclared destination: no-op, leave the current view showing.
      return;
    }
    state.currentDestination = dest;

    // Hide all view sections
    document.querySelectorAll(".view-section").forEach(el => {
      el.style.display = "none";
    });

    // Show sections matching the current destination
    document.querySelectorAll(".view-" + dest).forEach(el => {
      el.style.display = ""; // revert to default (block/flex)
    });

    closeMegaMenu();
    window.scrollTo(0, 0);

    // Call render functions for specific views if they exist
    if (typeof window.renderEventsManager === 'function') window.renderEventsManager();
    if (typeof window.renderExportCatalog === 'function') window.renderExportCatalog();
    if (typeof window.renderLeads === 'function') window.renderLeads();
    if (typeof window.renderGlobalEvents === 'function') window.renderGlobalEvents();
  }

  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const dest = e.target.getAttribute("data-dest");
      if (dest) navigateTo(dest);
    });
  });

  if (typeof window.renderGlobalEvents === "function") window.renderGlobalEvents();


  window.renderEventsManager = window.renderEventsManager || function(){};
  // —— Theme ——
  applyTheme(state.theme);

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
    if (window.renderExportCatalog) window.renderExportCatalog();
  });

  // —— Clock ——
  const clockEl = document.getElementById("clock");
  function tickClock() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  tickClock();
  setInterval(tickClock, 1000);


  // —— Events Manager & Global Events ——
  const eventsTableBody = document.getElementById("eventsTableBody");
  const eventsEmptyState = document.getElementById("eventsEmptyState");
  const eventForm = document.getElementById("eventForm");
  const eventFormErrors = document.getElementById("eventFormErrors");
  const eventSubmitBtn = document.getElementById("eventSubmitBtn");

  const filterStatus = document.getElementById("filterStatus");
  const filterCategory = document.getElementById("filterCategory");
  const sortDate = document.getElementById("sortDate");
  const sortTitle = document.getElementById("sortTitle");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  const emptyStateClearBtn = document.getElementById("emptyStateClearBtn");
  const emptyStateCreateBtn = document.getElementById("emptyStateCreateBtn");
  const eventsEmptyMessage = document.getElementById("eventsEmptyMessage");

  function eventPayloadFromForm() {
    return {
      id: document.getElementById('eventId').value,
      title: document.getElementById('eventTitle').value.trim(),
      date: document.getElementById('eventDate').value,
      city: document.getElementById('eventCity').value.trim(),
      category: document.getElementById('eventCategory').value,
      status: document.getElementById('eventStatus').value,
      featured: document.getElementById('eventFeatured').value
    };
  }

  function updateEventSubmitState() {
    if (eventSubmitBtn) eventSubmitBtn.disabled = validateEventPayload(eventPayloadFromForm()).length > 0;
  }

  eventForm?.addEventListener('input', updateEventSubmitState);
  eventForm?.addEventListener('change', updateEventSubmitState);
  updateEventSubmitState();

  function getFilteredAndSortedEvents() {
    let result = [...state.events];

    if (state.filters.status) {
      result = result.filter(e => e.status === state.filters.status);
    }
    if (state.filters.category) {
      result = result.filter(e => e.category === state.filters.category);
    }

    if (state.sorts.date) {
      result.sort((a, b) => {
        return state.sorts.date === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      });
    } else if (state.sorts.title) {
      result.sort((a, b) => {
        return state.sorts.title === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      });
    }

    return result;
  }

  function renderStatusRollup() {
    const counts = catalogCounts();
    const upcomingEl = document.getElementById('rollupUpcoming');
    const featuredEl = document.getElementById('rollupFeatured');
    const pastEl = document.getElementById('rollupPast');
    if (upcomingEl) upcomingEl.textContent = String(counts.upcoming);
    if (featuredEl) featuredEl.textContent = String(counts.featured);
    if (pastEl) pastEl.textContent = String(counts.past);
  }

  window.renderEventsManager = function() {
    if (!eventsTableBody) return;

    renderStatusRollup();

    // Sync UI with state
    if(filterStatus) filterStatus.value = state.filters.status;
    if(filterCategory) filterCategory.value = state.filters.category;
    if(sortDate) sortDate.value = state.sorts.date;
    if(sortTitle) sortTitle.value = state.sorts.title;

    eventsTableBody.innerHTML = '';
    const filtered = getFilteredAndSortedEvents();

    if (filtered.length === 0) {
      eventsTableBody.parentElement.style.display = 'none';
      eventsEmptyState.style.display = 'block';
      if (state.events.length === 0) {
        if (eventsEmptyMessage) eventsEmptyMessage.textContent = 'No events yet.';
        if (emptyStateClearBtn) emptyStateClearBtn.style.display = 'none';
        if (emptyStateCreateBtn) emptyStateCreateBtn.style.display = 'inline';
      } else {
        if (eventsEmptyMessage) eventsEmptyMessage.textContent = 'No events found.';
        if (emptyStateClearBtn) emptyStateClearBtn.style.display = 'inline';
        if (emptyStateCreateBtn) emptyStateCreateBtn.style.display = 'none';
      }
    } else {
      eventsTableBody.parentElement.style.display = '';
      eventsEmptyState.style.display = 'none';

      filtered.forEach(ev => {
        const tr = document.createElement('tr');
        const safeId = sanitize(ev.id).replaceAll('"', '&quot;').replaceAll("'", '&#39;');
        const isSelected = state.selectedEventIds.includes(ev.id);
        tr.innerHTML = `
          <td><input type="checkbox" class="event-select-cb" data-id="${safeId}" ${isSelected ? "checked" : ""} /></td>
          <td>${sanitize(ev.title)}</td>
          <td>${sanitize(ev.date)}</td>
          <td>${sanitize(ev.city)}</td>
          <td>${sanitize(ev.category)}</td>
          <td>${sanitize(ev.status)}</td>
          <td>${sanitize(ev.featured)}</td>
          <td>
            <button type="button" class="edit-event-btn" data-id="${safeId}">Edit</button>
            <button type="button" class="delete-event-btn" data-id="${safeId}">Delete</button>
          </td>
        `;
        eventsTableBody.appendChild(tr);
      });

      // Keep shared selection state in sync with manual checkbox clicks
      document.querySelectorAll('.event-select-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const id = e.target.getAttribute('data-id');
          if (e.target.checked) {
            if (!state.selectedEventIds.includes(id)) state.selectedEventIds.push(id);
          } else {
            state.selectedEventIds = state.selectedEventIds.filter(existingId => existingId !== id);
          }
        });
      });

      // Attach edit/delete listeners
      document.querySelectorAll('.edit-event-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const ev = state.events.find(ev => ev.id === id);
          if(ev) {
            document.getElementById('eventId').value = ev.id;
            document.getElementById('eventTitle').value = ev.title;
            document.getElementById('eventDate').value = ev.date;
            document.getElementById('eventCity').value = ev.city;
            document.getElementById('eventCategory').value = ev.category;
            document.getElementById('eventStatus').value = ev.status;
            document.getElementById('eventFeatured').value = ev.featured;
            updateEventSubmitState();
          }
        });
      });

      document.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if(confirm("Are you sure you want to delete this event?")) {
            const id = e.target.getAttribute('data-id');
            pushUndo('events');
            state.events = state.events.filter(ev => ev.id !== id);
            state.selectedEventIds = state.selectedEventIds.filter(existingId => existingId !== id);
            renderEventsManager();
            if(window.renderGlobalEvents) window.renderGlobalEvents();
            if(window.renderExportCatalog) window.renderExportCatalog();
          }
        });
      });
    }
  };

  // Setup Filters/Sorts
  function applyFiltersAndSorts() {
    state.filters.status = filterStatus.value;
    state.filters.category = filterCategory.value;

    // Sorts mutually exclusive
    if (this === sortDate && sortDate.value) {
      sortTitle.value = "";
    } else if (this === sortTitle && sortTitle.value) {
      sortDate.value = "";
    }

    state.sorts.date = sortDate.value;
    state.sorts.title = sortTitle.value;
    renderEventsManager();
  }

  filterStatus?.addEventListener('change', applyFiltersAndSorts);
  filterCategory?.addEventListener('change', applyFiltersAndSorts);
  sortDate?.addEventListener('change', applyFiltersAndSorts);
  sortTitle?.addEventListener('change', applyFiltersAndSorts);

  function clearFilters() {
    state.filters = { status: "", category: "" };
    state.sorts = { date: "", title: "" };
    renderEventsManager();
  }

  clearFiltersBtn?.addEventListener('click', clearFilters);
  emptyStateClearBtn?.addEventListener('click', clearFilters);
  emptyStateCreateBtn?.addEventListener('click', () => {
    eventForm?.reset();
    document.getElementById('eventId').value = "";
    if (eventFormErrors) eventFormErrors.textContent = "";
    updateEventSubmitState();
    document.getElementById('eventTitle')?.focus();
  });

  // Bulk Delete
  document.getElementById("bulkDeleteBtn")?.addEventListener('click', () => {
    const selectedIds = Array.from(document.querySelectorAll('.event-select-cb:checked')).map(cb => cb.getAttribute('data-id'));
    if (selectedIds.length > 0) {
      pushUndo('events');
      state.events = state.events.filter(ev => !selectedIds.includes(ev.id));
      state.selectedEventIds = state.selectedEventIds.filter(id => !selectedIds.includes(id));
      renderEventsManager();
      if(window.renderGlobalEvents) window.renderGlobalEvents();
      if(window.renderExportCatalog) window.renderExportCatalog();
    }
  });

  // Event Form Submit
  eventForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = eventPayloadFromForm();
    const errors = validateEventPayload(payload);
    if (errors.length) {
      eventFormErrors.textContent = errors.join('; ');
      return;
    }
    eventFormErrors.textContent = "";

    const newEv = {
      ...payload,
      id: payload.id || ('ev_' + Date.now() + Math.random().toString(36).substr(2, 9))
    };

    pushUndo('events');

    if (payload.id) {
      const idx = state.events.findIndex(ev => ev.id === payload.id);
      if(idx !== -1) state.events[idx] = newEv;
    } else {
      state.events.push(newEv);
    }

    eventForm.reset();
    document.getElementById('eventId').value = "";
    updateEventSubmitState();
    renderEventsManager();
    if(window.renderGlobalEvents) window.renderGlobalEvents();
    if(window.renderExportCatalog) window.renderExportCatalog();
  });

  document.getElementById('eventCancelBtn')?.addEventListener('click', () => {
    eventForm.reset();
    document.getElementById('eventId').value = "";
    eventFormErrors.textContent = "";
    updateEventSubmitState();
  });



  // —— WebMCP Contract ——

  // browse
  window.webmcp_browse_open = function(args) {
    if (args.destinations && VALID_DESTINATIONS.includes(args.destinations)) {
      navigateTo(args.destinations);
      return { status: "success", view: state.currentDestination };
    }
    return { status: "error" };
  };

  window.webmcp_browse_set_theme = function(args) {
    if (args.themes) {
      applyTheme(args.themes);
      if(window.renderExportCatalog) window.renderExportCatalog();
      return { status: "success", theme: state.theme };
    }
    return { status: "error" };
  };

  window.webmcp_browse_apply_filter = function(args) {
    if (args.filters) {
      if (args.filters.status !== undefined) state.filters.status = args.filters.status;
      if (args.filters.category !== undefined) state.filters.category = args.filters.category;
      if (window.renderEventsManager) window.renderEventsManager();
      return { status: "success", filters: state.filters };
    }
    return { status: "error" };
  };

  window.webmcp_browse_clear_filter = function(args) {
    clearFilters();
    return { status: "success", filters: state.filters };
  };

  window.webmcp_browse_sort = function(args) {
    if (args.sorts) {
      if (args.sorts.date !== undefined) {
         state.sorts.date = args.sorts.date;
         if (args.sorts.date) state.sorts.title = "";
      }
      if (args.sorts.title !== undefined) {
         state.sorts.title = args.sorts.title;
         if (args.sorts.title) state.sorts.date = "";
      }
      if (window.renderEventsManager) window.renderEventsManager();
      return { status: "success", sorts: state.sorts };
    }
    return { status: "error" };
  };

  // form
  window.webmcp_form_validate = function(args) {
    const vals = args.form_fields || {};
    const errors = validateContactPayload(vals);

    // update live region
    const errEl = document.getElementById("contactFormErrors");
    if (errEl) {
      errEl.textContent = errors.length > 0 ? "Errors in: " + errors.join(", ") : "";
    }
    return { status: "success", errors };
  };

  window.webmcp_form_submit = function(args) {
    const vals = args.form_fields || {};
    const valResult = window.webmcp_form_validate(args);
    if (valResult.errors && valResult.errors.length > 0) {
       return { status: "error", errors: valResult.errors };
    }

    const newLead = makeLead(vals);

    pushUndo('leads');
    state.leads.unshift(newLead);
    if(window.renderLeads) window.renderLeads();
    if(window.renderExportCatalog) window.renderExportCatalog();
    contactForm?.reset();
    updateContactSubmitState();

    const succEl = document.getElementById("contactFormSuccess");
    if (succEl) succEl.textContent = "Thank you! Your message has been sent.";

    return { status: "success" };
  };

  window.webmcp_form_cancel = function(args) {
    const form = document.getElementById("contactForm");
    if (form) form.reset();
    updateContactSubmitState();
    const errEl = document.getElementById("contactFormErrors");
    if (errEl) errEl.textContent = "";
    const succEl = document.getElementById("contactFormSuccess");
    if (succEl) succEl.textContent = "";
    return { status: "success" };
  };

  window.webmcp_form_reset = window.webmcp_form_cancel;

  // entity
  window.webmcp_entity_create = function(args) {
    if (args.entity === 'event' && args.entity_fields) {
      if (!args.entity_fields.title || !args.entity_fields.date) return { status: "error", message: "title and date required" };

      const newEv = {
        id: 'ev_' + Date.now() + Math.random().toString(36).substr(2, 9),
        title: args.entity_fields.title,
        date: args.entity_fields.date,
        city: args.entity_fields.city || "",
        category: args.entity_fields.category || "Summit",
        status: args.entity_fields.status || "upcoming",
        featured: args.entity_fields.featured || "false",
      };
      const errors = validateEventPayload(newEv);
      if (errors.length) return { status: "error", message: errors.join('; ') };

      pushUndo('events');
      state.events.push(newEv);
      if(window.renderEventsManager) window.renderEventsManager();
      if(window.renderGlobalEvents) window.renderGlobalEvents();
      if(window.renderExportCatalog) window.renderExportCatalog();
      return { status: "success", id: newEv.id };
    }
    return { status: "error" };
  };

  window.webmcp_entity_update = function(args) {
    if (args.entity === 'event' && args.entity_fields && args.entity_fields.id) {
      const idx = state.events.findIndex(e => e.id === args.entity_fields.id);
      if (idx > -1) {
        const nextEvent = { ...state.events[idx], ...args.entity_fields };
        const errors = validateEventPayload(nextEvent);
        if (errors.length) return { status: "error", message: errors.join('; ') };
        pushUndo('events');
        state.events[idx] = nextEvent;
        if(window.renderEventsManager) window.renderEventsManager();
        if(window.renderGlobalEvents) window.renderGlobalEvents();
        if(window.renderExportCatalog) window.renderExportCatalog();
        return { status: "success", id: args.entity_fields.id };
      }
    }
    return { status: "error" };
  };

  window.webmcp_entity_delete = function(args) {
    if (args.entity === 'event' && args.entity_fields && args.entity_fields.id && args.confirm) {
      const idx = state.events.findIndex(e => e.id === args.entity_fields.id);
      if (idx > -1) {
        pushUndo('events');
        state.events = state.events.filter(e => e.id !== args.entity_fields.id);
        if(window.renderEventsManager) window.renderEventsManager();
        if(window.renderGlobalEvents) window.renderGlobalEvents();
        if(window.renderExportCatalog) window.renderExportCatalog();
        return { status: "success" };
      }
    }
    return { status: "error" };
  };

  window.webmcp_entity_select = function(args) {
    if (args.entity === 'event' && args.entity_fields && args.entity_fields.id) {
      const id = args.entity_fields.id;
      const ev = state.events.find(e => e.id === id);
      if (!ev) return { status: "error", message: "unknown event id" };

      const desired = args.entity_fields.selected !== undefined
        ? Boolean(args.entity_fields.selected)
        : !state.selectedEventIds.includes(id);

      if (desired) {
        if (!state.selectedEventIds.includes(id)) state.selectedEventIds.push(id);
      } else {
        state.selectedEventIds = state.selectedEventIds.filter(existingId => existingId !== id);
      }

      // Reflect the real selection checkbox the same way the visible control does
      const checkbox = document.querySelector(`.event-select-cb[data-id="${CSS.escape(id)}"]`);
      if (checkbox) checkbox.checked = desired;

      return { status: "success", id, selected: desired };
    }
    return { status: "error" };
  };

  window.webmcp_entity_toggle = function(args) {
    if (args.entity === 'event' && args.entity_fields && args.entity_fields.id) {
      const idx = state.events.findIndex(e => e.id === args.entity_fields.id);
      if (idx === -1) return { status: "error", message: "unknown event id" };

      const current = state.events[idx];
      const nextFeatured = current.featured === "true" ? "false" : "true";
      const nextStatus = nextFeatured === "true"
        ? "featured"
        : (current.status === "featured" ? "upcoming" : current.status);
      const nextEvent = { ...current, featured: nextFeatured, status: nextStatus };

      const errors = validateEventPayload(nextEvent);
      if (errors.length) return { status: "error", message: errors.join('; ') };

      pushUndo('events');
      state.events[idx] = nextEvent;
      if (window.renderEventsManager) window.renderEventsManager();
      if (window.renderGlobalEvents) window.renderGlobalEvents();
      if (window.renderExportCatalog) window.renderExportCatalog();
      return { status: "success", id: nextEvent.id, featured: nextFeatured, status: nextStatus };
    }
    return { status: "error" };
  };

  // artifact
  window.webmcp_artifact_export = function(args) {
    if (args.export_formats === 'json' || args.export_formats === 'ics') {
      navigateTo('export-catalog');
      if (window.renderExportCatalog) window.renderExportCatalog();
      return { status: "success", view: "export-catalog", format: args.export_formats };
    }
    if (args.export_formats === 'leads-json') {
      navigateTo('session-leads');
      return { status: "success", view: "session-leads", format: "leads-json" };
    }
    return { status: "error" };
  };

  window.webmcp_artifact_import = function(args) {
    if (args.import_modes === 'declared-catalog') {
      navigateTo('export-catalog');
      const importStatus = document.getElementById('importCatalogStatus');
      if (importStatus) importStatus.textContent = 'Choose a declared catalog JSON file to import.';
      fileInput.click();
      return { status: "success", view: "export-catalog", picker: "open" };
    }
    return { status: "error" };
  };

  window.webmcp_artifact_copy = function(args = {}) {
    navigateTo('export-catalog');
    if (window.renderExportCatalog) window.renderExportCatalog();
    document.getElementById('copyJsonBtn')?.click();
    return { status: "success", view: "export-catalog", format: args.export_formats || 'json' };
  };

  // —— WebMCP required entrypoints ——
  // The verifier's MCP bridge only calls window.webmcp_session_info(),
  // window.webmcp_list_tools(), and window.webmcp_invoke_tool(name, args).
  // Register the tool manifest and wire invoke_tool to dispatch to the
  // individual webmcp_* handlers defined above.
  const webmcpTools = {
    browse_open: { description: "Open a destination: marketing-home, events-manager, global-events, export-catalog, session-leads.", handler: window.webmcp_browse_open },
    browse_set_theme: { description: "Set theme: light or dark.", handler: window.webmcp_browse_set_theme },
    browse_apply_filter: { description: "Apply status and/or category filters to the events manager.", handler: window.webmcp_browse_apply_filter },
    browse_clear_filter: { description: "Clear all filters and sorts on the events manager.", handler: window.webmcp_browse_clear_filter },
    browse_sort: { description: "Sort events by date or title (mutually exclusive).", handler: window.webmcp_browse_sort },
    form_validate: { description: "Validate contact form field values without submitting.", handler: window.webmcp_form_validate },
    form_submit: { description: "Submit the contact form as a new session lead.", handler: window.webmcp_form_submit },
    form_cancel: { description: "Cancel the contact form: reset fields and clear errors/success.", handler: window.webmcp_form_cancel },
    form_reset: { description: "Reset the contact form: reset fields and clear errors/success.", handler: window.webmcp_form_reset },
    entity_create: { description: "Create an event {title, date, city, category, status, featured}.", handler: window.webmcp_entity_create },
    entity_select: { description: "Select or deselect an event by id for bulk actions.", handler: window.webmcp_entity_select },
    entity_update: { description: "Update an event's fields by id.", handler: window.webmcp_entity_update },
    entity_delete: { description: "Delete an event by id; requires confirm=true.", handler: window.webmcp_entity_delete },
    entity_toggle: { description: "Toggle an event's featured state by id.", handler: window.webmcp_entity_toggle },
    artifact_export: { description: "Export the catalog or leads (formats: json, ics, leads-json).", handler: window.webmcp_artifact_export },
    artifact_import: { description: "Open the declared-catalog JSON file picker to import.", handler: window.webmcp_artifact_import },
    artifact_copy: { description: "Copy the export catalog JSON to the clipboard.", handler: window.webmcp_artifact_copy }
  };

  window.webmcp_session_info = function() {
    return {
      contract_version: "zto-webmcp-v1",
      app: "ridge-network-marketing",
      modules: ["browse-query-v1", "form-workflow-v1", "entity-collection-v1", "artifact-transfer-v1"],
      entity: "event",
      destinations: VALID_DESTINATIONS,
      tool_count: Object.keys(webmcpTools).length
    };
  };

  window.webmcp_list_tools = function() {
    return Object.keys(webmcpTools).map(name => ({
      name,
      description: webmcpTools[name].description
    }));
  };

  window.webmcp_invoke_tool = function(name, args) {
    if (!webmcpTools[name]) throw new Error("Unknown WebMCP tool: " + name);
    return webmcpTools[name].handler(args || {});
  };

  // —— Load entrance (one-shot mount) ——
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (reduceMotion) {
        document.documentElement.classList.add("is-mounted");
        // Instant final clips already handled by CSS reduce rules
        return;
      }
      document.documentElement.classList.add("is-mounted");
    });
  });

  // —— Get started trio in-view ——
  const trio = document.getElementById("trio");
  if (trio) {
    if (reduceMotion) {
      trio.classList.add("is-visible");
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              trio.classList.add("is-visible");
              io.disconnect();
            }
          }
        },
        { threshold: 0.25 }
      );
      io.observe(trio);
    }
  }





  // Handle file import manually to support round trip
  const importCatalogBtn = document.createElement('button');
  importCatalogBtn.textContent = 'Import Catalog';
  importCatalogBtn.id = 'importCatalogBtn';
  importCatalogBtn.style.display = 'none'; // Playwright will click it or use input

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'importCatalogInput';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const importStatus = document.getElementById('importCatalogStatus');
      try {
        const data = JSON.parse(ev.target.result);
        importCatalog(data);
        if (importStatus) importStatus.textContent = 'Catalog imported successfully.';
      } catch (err) {
        if (importStatus) importStatus.textContent = `Catalog import error: ${err.message}`;
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  importCatalogBtn.addEventListener('click', () => {
     fileInput.click();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const exportContent = document.querySelector('.export-catalog-content');
    if (exportContent) {
      exportContent.prepend(importCatalogBtn);
      exportContent.prepend(fileInput);
    }
  });


  // —— Undo Logic globally ——
  document.addEventListener('keydown', (e) => {
    // Basic undo on Ctrl+Z or global Undo button if we add one.
    // Spec says "Undo/Redo reverse that mutation across the same surfaces".
    const key = e.key.toLowerCase();
    if ((key === 'z' || key === 'y') && (e.ctrlKey || e.metaKey)) {
      const target = e.target;
      if (target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable)) {
        return;
      }
      e.preventDefault();
      if (key === 'y' || e.shiftKey) window.performRedo(); else window.performUndo();
    }
  });

  function currentSnapshot(type) {
    if (type === 'catalog') return { events: JSON.parse(JSON.stringify(state.events)), leads: JSON.parse(JSON.stringify(state.leads)), theme: state.theme };
    return JSON.parse(JSON.stringify(state[type]));
  }

  function restoreAction(action) {
    if (action.type === 'events') state.events = action.previousState;
    if (action.type === 'leads') state.leads = action.previousState;
    if (action.type === 'catalog') {
      state.events = action.previousState.events;
      state.leads = action.previousState.leads;
      applyTheme(action.previousState.theme);
    }
    if(window.renderEventsManager) window.renderEventsManager();
    if(window.renderGlobalEvents) window.renderGlobalEvents();
    if(window.renderLeads) window.renderLeads();
    if(window.renderExportCatalog) window.renderExportCatalog();
  }

  window.performUndo = function() {
    if (state.undoStack.length > 0) {
      const lastAction = state.undoStack.pop();
      state.redoStack.push({ type: lastAction.type, previousState: currentSnapshot(lastAction.type) });
      restoreAction(lastAction);
    }
  };

  window.performRedo = function() {
    if (state.redoStack.length > 0) {
      const nextAction = state.redoStack.pop();
      state.undoStack.push({ type: nextAction.type, previousState: currentSnapshot(nextAction.type) });
      restoreAction(nextAction);
    }
  };

  // —— Export Catalog ——
  const exportTextarea = document.getElementById("exportTextarea");
  const exportIcsTextarea = document.getElementById("exportIcsTextarea");

  window.renderExportCatalog = function() {
    if (!exportTextarea) return;

    // Include live theme as part of the export catalog contract
    exportTextarea.value = JSON.stringify(buildCatalog(), null, 2);
    if (exportIcsTextarea) exportIcsTextarea.value = buildICS();
  };

  document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
    const exportData = buildCatalog();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "catalog.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  });

  document.getElementById('copyJsonBtn')?.addEventListener('click', () => {
    const exportData = buildCatalog();
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => {
      const msg = document.getElementById('copySuccessMsg');
      if (msg) {
        msg.style.display = 'inline';
        setTimeout(() => { msg.style.display = 'none'; }, 2000);
      }
    });
  });


  // —— Contact Form & Session Leads ——
  const contactForm = document.getElementById("contactForm");
  const contactFormErrors = document.getElementById("contactFormErrors");
  const contactFormSuccess = document.getElementById("contactFormSuccess");
  const leadsTableBody = document.getElementById("leadsTableBody");
  const contactSubmitBtn = document.getElementById("contactSubmitBtn");

  function contactPayloadFromForm() {
    return {
      name: document.getElementById('contactName').value.trim(),
      email: document.getElementById('contactEmail').value.trim(),
      company: document.getElementById('contactCompany').value,
      interest: document.getElementById('contactInterest').value,
      privacy_consent: document.getElementById('contactPrivacy').checked,
      message: document.getElementById('contactMessage').value
    };
  }

  function updateContactSubmitState() {
    if (contactSubmitBtn) contactSubmitBtn.disabled = validateContactPayload(contactPayloadFromForm()).length > 0;
  }

  contactForm?.addEventListener('input', updateContactSubmitState);
  contactForm?.addEventListener('change', updateContactSubmitState);
  updateContactSubmitState();

  window.renderLeads = function() {
    if (!leadsTableBody) return;
    leadsTableBody.innerHTML = '';

    state.leads.forEach(lead => {
      const payload = lead.payload || lead;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${sanitize(payload.name)}</td>
        <td>${sanitize(payload.email)}</td>
        <td>${sanitize(payload.company || "")}</td>
        <td>${sanitize(payload.interest || "")}</td>
        <td>${sanitize(payload.message || "")}</td>
      `;
      leadsTableBody.appendChild(tr);
    });
  };

  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const payload = contactPayloadFromForm();
    const errors = validateContactPayload(payload);
    if (errors.length) {
      contactFormErrors.textContent = errors.join('; ');
      contactFormSuccess.textContent = "";
      return;
    }

    contactFormErrors.textContent = "";

    const newLead = makeLead(payload);

    pushUndo('leads');
    state.leads.unshift(newLead);
    renderExportCatalog();

    contactFormSuccess.textContent = "Thank you! Your message has been sent.";
    contactForm.reset();
    updateContactSubmitState();

    renderLeads();
  });

  document.getElementById('downloadLeadsBtn')?.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(buildLeadsExport(), null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "ridge-session-leads.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  });

  document.getElementById('copyLeadsBtn')?.addEventListener('click', () => {
    const exportData = buildLeadsExport();
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => {
      const msg = document.getElementById('copyLeadsSuccessMsg');
      if (msg) {
        msg.style.display = 'inline';
        setTimeout(() => { msg.style.display = 'none'; }, 2000);
      }
    });
  });

  document.getElementById('undoLastLeadBtn')?.addEventListener('click', () => {
    // Only undo if last action was lead append...
    // Actually, simple pop from leads state and push to undoStack for this specific button.
    if(state.leads.length > 0) {
      pushUndo('leads');
      state.leads.shift();
      renderLeads();
      renderExportCatalog();
    }
  });


  // —— Global Events: scramble + line masks ——
  const HEADLINE = "RIDGE GLOBAL EVENTS";
  const BLURB =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Placeholder events pitch for the decode lab.";
  const DECOYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const headlineEl = document.getElementById("eventsHeadline");
  const blurbEl = document.getElementById("eventsBlurb");
  const eventsSection = document.getElementById("events");

  function randomDecoy() {
    return DECOYS[Math.floor(Math.random() * DECOYS.length)];
  }

  function buildHeadline() {
    if (!headlineEl) return [];
    headlineEl.replaceChildren();
    const chars = [];
    let index = 0;
    HEADLINE.split(" ").forEach((word) => {
      const wordWrap = document.createElement("span");
      wordWrap.className = "word";
      wordWrap.setAttribute("aria-hidden", "true");
      [...word].forEach((glyph) => {
        const span = document.createElement("span");
        span.className = "char";
        span.dataset.final = glyph;
        span.dataset.d0 = randomDecoy();
        span.dataset.d1 = randomDecoy();
        span.dataset.d2 = randomDecoy();
        span.textContent = reduceMotion ? glyph : span.dataset.d0;
        span.style.setProperty("--char-delay", `${index * 60}ms`);
        span.style.setProperty("--char-dur", `${50 + (index + 1) * 75}ms`);
        wordWrap.appendChild(span);
        chars.push({ span, index, final: glyph });
        index += 1;
      });
      headlineEl.appendChild(wordWrap);
    });
    return chars;
  }

  function buildBlurbLines() {
    if (!blurbEl) return;
    blurbEl.replaceChildren();
    // Approximate two lines for mask demo
    const mid = Math.ceil(BLURB.length / 2);
    let split = BLURB.lastIndexOf(" ", mid);
    if (split < 0) split = mid;
    const lines = [BLURB.slice(0, split).trim(), BLURB.slice(split).trim()];
    lines.forEach((text, i) => {
      const mask = document.createElement("span");
      mask.className = "line-mask";
      const inner = document.createElement("span");
      inner.className = "line-inner";
      inner.style.setProperty("--li", String(i));
      inner.textContent = text;
      mask.appendChild(inner);
      blurbEl.appendChild(mask);
    });
  }

  function runScramble(chars) {
    if (reduceMotion) {
      chars.forEach(({ span, final }) => {
        span.textContent = final;
        span.style.color = "var(--ridge-ink)";
      });
      return;
    }

    chars.forEach(({ span, index, final }) => {
      const delay = index * 60;
      const duration = 50 + (index + 1) * 75;
      const steps = 4;
      const stepMs = duration / steps;

      setTimeout(() => {
        let step = 0;
        const iv = setInterval(() => {
          if (step < steps - 1) {
            span.textContent = span.dataset[`d${step}`] || randomDecoy();
            span.style.color = `color-mix(in srgb, var(--ridge-ink) ${30 + step * 20}%, transparent)`;
            step += 1;
          } else {
            clearInterval(iv);
            span.textContent = final;
            span.style.color = "var(--ridge-ink)";
          }
        }, stepMs);
      }, delay);
    });
  }


  window.renderGlobalEvents = function() {
    const container = document.getElementById('globalEventsCards');
    if (!container) return;

    // List upcoming and featured events from the shared collection; featured
    // events surface with a Featured label in the landing listings.
    const listedEvents = state.events.filter(e => e.status !== 'past');

    container.replaceChildren();
    listedEvents.forEach(ev => {
      const div = document.createElement('div');
      div.className = 'events-card notch-br';
      div.innerHTML = `
          <div class="events-card-block"></div>
          <p class="label">${ev.featured === 'true' ? 'Featured / ' : ''}${sanitize(ev.category)}</p>
          <h3>${sanitize(ev.title)}</h3>
          <p>${sanitize(ev.date)} - ${sanitize(ev.city)}</p>
          <button type="button" class="cta notch-br">Learn more →</button>
      `;
      container.appendChild(div);
    });
  };

  const chars = buildHeadline();
  buildBlurbLines();

  if (eventsSection) {
    if (reduceMotion) {
      eventsSection.classList.add("is-visible");
      runScramble(chars);
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              eventsSection.classList.add("is-visible");
              runScramble(chars);
              io.disconnect();
            }
          }
        },
        { threshold: 0.35 }
      );
      io.observe(eventsSection);
    }
  }



  // Set initial view
  navigateTo(state.currentDestination);
  if (typeof window.renderGlobalEvents === "function") window.renderGlobalEvents();

})();
