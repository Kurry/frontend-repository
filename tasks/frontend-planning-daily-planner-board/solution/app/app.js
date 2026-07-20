/* Cadence daily planner board — working oracle (vanilla JS, in-memory state only).
   No localStorage/sessionStorage. Exposes the WebMCP surface required by the
   instruction's <webmcp_action_contract>: window.webmcp_session_info(),
   window.webmcp_list_tools(), window.webmcp_invoke_tool(name, args). */
(function () {
  "use strict";

  var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var WD_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // The capture anchors July 6 = Monday (index 1), so index = (date - 5) mod 7.
  function weekdayIndex(date) { return ((date - 5) % 7 + 7) % 7; }
  function weekdayName(date) { return WEEKDAYS[weekdayIndex(date)]; }
  function weekdayAbbr(date) { return WD_ABBR[weekdayIndex(date)]; }

  var TODAY = 18; // Saturday, July 18
  function actionLabel(date) {
    if (date < TODAY) return "Reflect";
    if (date === TODAY) return "Shutdown";
    return "Plan";
  }

  var HOURS = ["12 AM","1 AM","2 AM","3 AM","4 AM","5 AM","6 AM","7 AM","8 AM","9 AM","10 AM","11 AM",
    "12 PM","1 PM","2 PM","3 PM","4 PM","5 PM","6 PM","7 PM","8 PM","9 PM","10 PM","11 PM"];

  // ---- time helpers ("H:MM" <-> minutes) ----
  function parseTime(str) {
    if (!str) return 0;
    var m = String(str).trim().match(/^(\d+):([0-5]?\d)$/);
    if (!m) return 0;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }
  function fmtTime(mins) {
    mins = Math.max(0, Math.round(mins || 0));
    var h = Math.floor(mins / 60);
    var mm = mins % 60;
    return h + ":" + (mm < 10 ? "0" + mm : String(mm));
  }
  function startTimeParts(start) {
    if (!start) return null;
    var m = String(start).trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
    if (!m) return null;
    var h = parseInt(m[1], 10) % 12;
    if (m[3] === "pm") h += 12;
    return { hour: h, minute: parseInt(m[2], 10) };
  }
  // "9:00 am" -> hour index 0..23 for the calendar grid.
  function startHourIndex(start) {
    var parts = startTimeParts(start);
    return parts ? parts.hour : null;
  }

  function parsePlannerDay(value) {
    if (typeof value === "number") return Number.isInteger(value) ? value : NaN;
    var raw = value == null ? "" : String(value).trim();
    var iso = raw.match(/^2026-07-(\d{2})$/);
    if (iso) return parseInt(iso[1], 10);
    return /^\d{1,2}$/.test(raw) ? parseInt(raw, 10) : NaN;
  }

  // ---- state ----
  var seq = 0;
  function uid() { seq += 1; return "t" + seq; }

  var selectedIds = [];
  var filterState = { channel: "all", search: "", open: false };
  var history = [];
  var historyIdx = -1;
  var hasStaleState = false;

  var state = {
    selectedDay: TODAY,
    tasks: []
  };

  function seed() {
    state.tasks = [
      { id: uid(), title: "Set up Cadence", day: 18, channel: "work", done: false,
        planned: "0:20", start: null, notes: true,
        subtasks: [
          { title: "Add a task", done: false },
          { title: "Complete daily planning", done: false },
          { title: "Add integrations", done: false },
          { title: "Add channels", done: false },
          { title: "Add recurring tasks", done: false }
        ] },
      { id: uid(), title: "Weekly planning", day: 18, channel: "work", done: false,
        planned: null, start: null, notes: false, subtasks: [] },
      { id: uid(), title: "Daily planning", day: 19, channel: "work", done: false,
        planned: null, start: null, notes: false, subtasks: [] },
      { id: uid(), title: "Work", day: 20, channel: "work", done: false,
        planned: "1:00", start: "9:00 am", notes: false, subtasks: [] }
    ];
  }


  function setStaleIndicator(stale) {
    hasStaleState = stale;
    var btn = document.getElementById("export-btn");
    if (!btn) return;
    if (stale) { btn.classList.add("stale"); btn.textContent = "Export*"; }
    else { btn.classList.remove("stale"); btn.textContent = "Export"; }
  }

  function pushHistory() {
    if (historyIdx < history.length - 1) history = history.slice(0, historyIdx + 1);
    history.push({
      tasks: JSON.parse(JSON.stringify(state.tasks)),
      selectedIds: selectedIds.slice()
    });
    historyIdx++;
    updateUndoRedoButtons();
  }

  function restoreHistory(snapshot) {
    state.tasks = JSON.parse(JSON.stringify(snapshot.tasks));
    selectedIds = snapshot.selectedIds.filter(function (id) { return !!findTask(id); });
  }

  function undo() {
    if (historyIdx >= 0 && historyIdx === history.length - 1) {
      // Save current state as the very last step if we are at the end
      history.push({ tasks: JSON.parse(JSON.stringify(state.tasks)), selectedIds: selectedIds.slice() });
    }
    if (historyIdx >= 0) {
      restoreHistory(history[historyIdx]);
      historyIdx--;
      setStaleIndicator(true);
      render();
    }
  }

  function redo() {
    if (historyIdx + 2 < history.length) {
      historyIdx++;
      restoreHistory(history[historyIdx + 1]);
      setStaleIndicator(true);
      render();
    }
  }

  function updateUndoRedoButtons() {
    var uBtn = document.getElementById("undo-btn");
    var rBtn = document.getElementById("redo-btn");
    if (uBtn) uBtn.disabled = historyIdx < 0;
    if (rBtn) rBtn.disabled = historyIdx + 2 >= history.length;
  }

  function taskMatchesFilters(t) {
    if (filterState.channel !== "all" && t.channel !== filterState.channel) return false;
    if (filterState.search && t.title.toLowerCase().indexOf(filterState.search.toLowerCase()) === -1) return false;
    return true;
  }
  function tasksForDay(date) {
    return state.tasks.filter(function (t) { return t.day === date && taskMatchesFilters(t); });
  }
  function columnTotalMinutes(date) {
    return tasksForDay(date).reduce(function (sum, t) { return sum + parseTime(t.planned); }, 0);
  }
  function findTask(id) {
    for (var i = 0; i < state.tasks.length; i++) if (state.tasks[i].id === id) return state.tasks[i];
    return null;
  }

  // ---- domain commands (shared by UI and WebMCP) ----
  var newlyCreatedTaskId = null;
  function createTask(fields) {
    var title = (fields && fields.title != null) ? String(fields.title).trim() : "";
    if (!title) return { ok: false, error: "Title is required" };
    var day = parsePlannerDay(fields.day);
    if (isNaN(day) || day < 6 || day > 26) return { ok: false, error: "Day must be July 6-26" };
    pushHistory(); setStaleIndicator(true);
    var t = {
      id: uid(), title: title, day: day,
      channel: fields.channel ? String(fields.channel).replace(/^#/, "").trim() : "work",
      done: false,
      planned: (fields.planned && parseTime(fields.planned) > 0) ? fmtTime(parseTime(fields.planned)) : null,
      start: fields.start ? String(fields.start).trim() : null,
      notes: false, subtasks: []
    };
    state.tasks.push(t);
    newlyCreatedTaskId = t.id;
    render();
    return { ok: true, task: publicTask(t) };
  }
  function updateTask(id, fields) {
    var t = findTask(id);
    if (!t) return { ok: false, error: "No such task" };
    var title = null;
    if (fields.title != null) {
      title = String(fields.title).trim();
      if (!title) return { ok: false, error: "Title is required" };
    }
    pushHistory(); setStaleIndicator(true);
    if (title != null) t.title = title;
    if (fields.channel != null) t.channel = String(fields.channel).replace(/^#/, "").trim();
    if (fields.planned != null || fields["planned-time"] != null) {
      var p = fields.planned != null ? fields.planned : fields["planned-time"];
      var mins = parseTime(p);
      t.planned = mins > 0 ? fmtTime(mins) : null;
    }
    if (fields.start != null || fields["start-time"] != null) {
      var s = fields.start != null ? fields.start : fields["start-time"];
      t.start = s ? String(s).trim() : null;
    }
    if (fields.day != null) {
      var d = parsePlannerDay(fields.day);
      if (!isNaN(d) && d >= 6 && d <= 26) t.day = d;
    }
    if (fields.done != null) t.done = !!fields.done;
    render();
    return { ok: true, task: publicTask(t) };
  }
  function deleteTask(id) {
    if (!findTask(id)) return { ok: false, error: "No such task" };
    pushHistory(); setStaleIndicator(true);
    state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
    selectedIds = selectedIds.filter(function (selectedId) { return selectedId !== id; });
    render();
    return { ok: true };
  }
  function toggleTask(id) {
    var t = findTask(id);
    if (!t) return { ok: false, error: "No such task" };
    pushHistory(); setStaleIndicator(true);
    t.done = !t.done;
    render();
    return { ok: true, done: t.done };
  }
  function toggleSubtask(id, index) {
    var t = findTask(id);
    if (!t || !t.subtasks || !t.subtasks[index]) return { ok: false, error: "No such subtask" };
    pushHistory(); setStaleIndicator(true);
    t.subtasks[index].done = !t.subtasks[index].done;
    render();
    return { ok: true, done: t.subtasks[index].done };
  }
  function selectDay(date) {
    var d = parsePlannerDay(date);
    if (isNaN(d) || d < 6 || d > 26) return { ok: false, error: "Day must be July 6-26" };
    state.selectedDay = d;
    render();
    return { ok: true, selectedDay: d };
  }
  function publicTask(t) {
    return { id: t.id, title: t.title, day: t.day, channel: t.channel, done: t.done,
      "planned-time": t.planned, "start-time": t.start };
  }

  // ---- rendering ----
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function renderTaskCard(t) {
    var card = el("article", "task" + (t.done ? " done" : ""));
    if (t.id === newlyCreatedTaskId) {
       card.style.animation = "popIn 0.2s ease-out";
       newlyCreatedTaskId = null; // Clear flag after rendering once
    }
    card.setAttribute("aria-label", t.title);
    card.dataset.id = t.id;

    var chk = el("button", "chk");
    chk.type = "button";
    chk.dataset.act = "toggle";
    chk.setAttribute("aria-label", "Complete task: " + t.title);
    chk.setAttribute("aria-pressed", String(t.done));
    chk.appendChild(el("span", "box"));
    card.appendChild(chk);

    var body = el("div", "task-body");
    var titleRow = el("div", "task-title");
    var titleBtn = el("button", "task-open");
    titleBtn.type = "button";
    titleBtn.dataset.act = "edit";
    titleBtn.textContent = t.title;
    titleBtn.setAttribute("aria-label", "Open task: " + t.title);
    titleRow.appendChild(titleBtn);

    var selCb = el("input", "sel-cb");
    selCb.type = "checkbox";
    selCb.dataset.act = "select-task";
    selCb.checked = selectedIds.indexOf(t.id) !== -1;
    selCb.setAttribute("aria-label", "Select " + t.title);
    titleRow.appendChild(selCb);
    if (t.notes) {
      var notes = el("span", "notes", "✎");
      notes.setAttribute("aria-label", "Task has notes or comments");
      notes.title = "Task has notes or comments";
      titleRow.appendChild(notes);
    }
    var del = el("button", "task-del", "×");
    del.type = "button";
    del.dataset.act = "delete";
    del.setAttribute("aria-label", "Delete task: " + t.title);
    titleRow.appendChild(del);
    body.appendChild(titleRow);

    var chips = el("div", "chips");
    if (t.start) chips.appendChild(el("span", "start", t.start));
    if (t.channel) {
      var chan = el("span", "chan", "#" + t.channel);
      chan.setAttribute("aria-label", "Work");
      chips.appendChild(chan);
    }
    if (t.planned) { var time = el("span", "time", t.planned); time.setAttribute("aria-label", "Actual: --:--, Planned: " + t.planned); chips.appendChild(time); }
    if (t.subtasks && t.subtasks.length > 0) { var completedCount = t.subtasks.filter(function(s) { return s.done; }).length; var cue = el("span", "subtask-cue", completedCount + "/" + t.subtasks.length); chips.appendChild(cue); }
    body.appendChild(chips);

    if (t.subtasks && t.subtasks.length) {
      var subs = el("ul", "subs");
      t.subtasks.forEach(function (s, i) {
        var li = el("li", "sub" + (s.done ? " done" : ""));
        var sbtn = el("button", "sub-toggle");
        sbtn.type = "button";
        sbtn.dataset.act = "subtoggle";
        sbtn.dataset.sub = String(i);
        sbtn.setAttribute("aria-pressed", String(!!s.done));
        sbtn.setAttribute("aria-label", (s.done ? "Uncomplete" : "Complete") + " subtask: " + s.title);
        sbtn.appendChild(el("span", "subbox"));
        sbtn.appendChild(el("span", "sub-label", s.title));
        li.appendChild(sbtn);
        subs.appendChild(li);
      });
      body.appendChild(subs);
    }
    card.appendChild(body);
    return card;
  }

  function renderColumn(date) {
    var col = el("section", "col" + (date === TODAY ? " today" : "") + (date === state.selectedDay ? " selected" : ""));
    col.dataset.day = String(date);
    col.setAttribute("aria-label", "Tasks for " + weekdayName(date) + ", July " + date);

    var head = el("header", "col-head");
    var dateBtn = el("button", "col-date");
    dateBtn.type = "button";
    dateBtn.dataset.act = "select-day";
    dateBtn.setAttribute("aria-label", weekdayName(date) + ", July " + date);
    dateBtn.appendChild(el("span", "wd", weekdayName(date)));
    dateBtn.appendChild(el("span", "dn", "July " + date));
    head.appendChild(dateBtn);
    head.appendChild(el("button", "col-action", actionLabel(date))).type = "button";
    col.appendChild(head);

    var list = el("div", "col-tasks");
    var dayTasks = tasksForDay(date);
    if (dayTasks.length === 0) {
      var filteredOut = state.tasks.filter(function(t) { return t.day === date; }).length > 0;
      if (filteredOut) {
        list.appendChild(el("div", "empty", "No tasks match the filter. Clear filters."));
      } else {
        list.appendChild(el("div", "empty", "No tasks yet"));
      }
    } else {
      dayTasks.forEach(function (t) { list.appendChild(renderTaskCard(t)); });
    }
    col.appendChild(list);

    // add-task form
    var addWrap = el("div", "add-wrap");
    var addBtn = el("button", "add-task", "+ Add task");
    addBtn.type = "button";
    addBtn.dataset.act = "add-open";
    addWrap.appendChild(addBtn);

    var form = el("form", "add-form");
    form.hidden = true;
    form.dataset.day = String(date);
    var ti = el("input", "add-title");
    ti.type = "text"; ti.placeholder = "Task title"; ti.name = "title"; ti.autocomplete = "off"; ti.setAttribute("aria-describedby", "add-title-err-" + date);
    var pi = el("input", "add-planned");
    pi.type = "text"; pi.placeholder = "Planned H:MM"; pi.name = "planned"; pi.autocomplete = "off"; pi.setAttribute("aria-describedby", "add-planned-err-" + date);
    var errRow = el("div", "fld-err add-err", "Title is required"); errRow.id = "add-title-err-" + date; errRow.hidden = true;
    var errRowPlanned = el("div", "fld-err add-planned-err", "Invalid planned time"); errRowPlanned.id = "add-planned-err-" + date; errRowPlanned.hidden = true;
    var actions = el("div", "add-actions");
    var submit = el("button", "btn primary sm", "Add"); submit.type = "submit";
    var cancel = el("button", "btn sm", "Cancel"); cancel.type = "button"; cancel.dataset.act = "add-cancel";
    actions.appendChild(submit); actions.appendChild(cancel);
    form.appendChild(ti); form.appendChild(errRow); form.appendChild(pi); form.appendChild(errRowPlanned); form.appendChild(actions);
    addWrap.appendChild(form);
    col.appendChild(addWrap);

    var totalMins = columnTotalMinutes(date);
    var foot = el("footer", "col-foot", "Planned " + fmtTime(totalMins));
    foot.setAttribute("aria-label", "Actual: --:--, Planned: " + fmtTime(totalMins));
    col.appendChild(foot);
    return col;
  }

  function renderBoard() {
    var wrap = document.getElementById("columns");
    if (!wrap) return;
    wrap.textContent = "";
    for (var d = 6; d <= 26; d++) wrap.appendChild(renderColumn(d));
  }

  function renderCalendar() {
    var cal = document.getElementById("cal");
    if (!cal) return;
    cal.textContent = "";

    var head = el("div", "cal-head");
    head.appendChild(el("span", "cal-title", "Calendars"));
    head.appendChild(el("span", "cal-zoom", "1x"));
    cal.appendChild(head);

    var day = state.selectedDay;
    cal.appendChild(el("div", "cal-day")).innerHTML =
      weekdayAbbr(day) + " <strong>" + day + "</strong>";

    if (day === 18) {
      cal.appendChild(el("div", "cal-allday", "Automatic Bill Payment - Sallie Mae"));
    }

    var hours = el("div", "cal-hours");
    var scheduled = state.tasks.filter(function (t) {
      return t.day === day && startHourIndex(t.start) != null;
    });
    HOURS.forEach(function (label, idx) {
      var row = el("div", "hr");
      row.appendChild(el("span", "hr-l", label));
      var line = el("span", "hr-line");
      scheduled.forEach(function (t) {
        if (startHourIndex(t.start) === idx) {
          var ev = el("span", "cal-event" + (t.done ? " done" : ""), t.title);
          ev.draggable = true; ev.dataset.id = t.id;
          line.appendChild(ev);
        }
      });
      line.dataset.hour = String(idx);
      row.appendChild(line);
      hours.appendChild(row);
    });
    cal.appendChild(hours);

    var foot = el("div", "cal-foot");
    var gd = el("button", "btn ghost", "Go to date");
    gd.type = "button"; gd.dataset.chrome = "Go to date";
    foot.appendChild(gd);
    foot.appendChild(el("div", "cal-hint", "Swap the main panel view · Tab"));
    cal.appendChild(foot);
  }

  function render() {
    renderBoard(); renderCalendar(); updateUndoRedoButtons();
    var exportOverlay = document.getElementById("export-overlay");
    if (exportOverlay && !exportOverlay.hidden) refreshExportPreviews();
    var tray = document.getElementById("bulk-tray");
    if (tray) {
      if (selectedIds.length > 0) { tray.hidden = false; document.getElementById("bulk-count").textContent = selectedIds.length + " selected"; }
      else tray.hidden = true;
    }
  }

  function openExport() {
    setStaleIndicator(false);
    var overlay = document.getElementById("export-overlay");
    if (overlay) overlay.hidden = false;
    refreshExportPreviews();
    var err = document.getElementById("import-err");
    if (err) err.hidden = true;
  }
  function refreshExportPreviews() {
    var elIcs = document.getElementById("out-ics");
    if (elIcs) elIcs.value = generateICS();
    var elJson = document.getElementById("out-json");
    if (elJson) elJson.value = generateJSON();
  }
  function closeExport() { var overlay = document.getElementById("export-overlay"); if (overlay) overlay.hidden = true; }
  function switchExportTab(tab) {
    if (tab === "ics") {
      document.getElementById("tab-ics").classList.add("active"); document.getElementById("tab-json").classList.remove("active");
      document.getElementById("pane-ics").hidden = false; document.getElementById("pane-json").hidden = true;
    } else {
      document.getElementById("tab-json").classList.add("active"); document.getElementById("tab-ics").classList.remove("active");
      document.getElementById("pane-json").hidden = false; document.getElementById("pane-ics").hidden = true;
    }
  }

  function generateICS() {
    var lines = []; lines.push("BEGIN:VCALENDAR"); lines.push("VERSION:2.0"); lines.push("PRODID:-//Cadence//Planner//EN");
    state.tasks.forEach(function(t) {
      if (!t.day) return;
      lines.push("BEGIN:VEVENT"); lines.push("SUMMARY:" + t.title);
      var dd = String(t.day).padStart(2, '0');
      var startParts = startTimeParts(t.start);
      if (startParts) {
        var hh = String(startParts.hour).padStart(2, '0');
        var mm = String(startParts.minute).padStart(2, '0');
        var dtstart = "202607" + dd + "T" + hh + mm + "00"; lines.push("DTSTART:" + dtstart);
        if (t.planned) { var mins = parseTime(t.planned); lines.push("DURATION:PT" + Math.floor(mins / 60) + "H" + (mins % 60) + "M"); }
      } else lines.push("DTSTART;VALUE=DATE:202607" + dd);
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR"); return lines.join("\r\n");
  }

  function generateJSON() {
    var payload = {
      schemaVersion: "1", board: { title: "Cadence", dateStart: "2026-07-06", dateEnd: "2026-07-26" },
      tasks: state.tasks.map(function(t) {
        var dayStr = "2026-07-" + String(t.day).padStart(2, '0');
        var out = { title: t.title, day: dayStr, channel: t.channel, done: t.done };
        if (t.planned) out.plannedTime = t.planned;
        if (t.start) out.startTime = t.start;
        if (t.notes) out.notes = "notes" in t ? String(t.notes) : "";
        if (t.subtasks && t.subtasks.length > 0) out.subtasks = t.subtasks;
        return out;
      })
    };
    return JSON.stringify(payload, null, 2);
  }

  function importJSON(jsonStr) {
    try {
      var data = JSON.parse(jsonStr);
      if (data.schemaVersion !== "1" || !Array.isArray(data.tasks)) throw new Error("Invalid schema");
      var newTasks = [];
      data.tasks.forEach(function(t) {
        if (!t.title || typeof t.title !== "string" || t.title.trim().length === 0 || t.title.length > 120) throw new Error("Invalid title");
        if (!t.day || typeof t.day !== "string" || !t.day.startsWith("2026-07-")) throw new Error("Invalid day");
        var day = parseInt(t.day.split("-")[2], 10);
        if (isNaN(day) || day < 6 || day > 26) throw new Error("Day out of bounds");
        var chan = t.channel || "work";
        if (["work", "personal", "health", "focus"].indexOf(chan) === -1) throw new Error("Invalid channel");
        if (t.plannedTime) {
          var pm = String(t.plannedTime).trim().match(/^(\d+):([0-5]?\d)$/);
          if (!pm || parseTime(t.plannedTime) > 12 * 60) throw new Error("Invalid planned time");
        }
        if (t.startTime) { var sm = String(t.startTime).trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/); if (!sm) throw new Error("Invalid start time"); }
        newTasks.push({
          id: uid(), title: t.title.trim(), day: day, channel: chan, done: !!t.done,
          planned: t.plannedTime || null, start: t.startTime || null, notes: !!t.notes, subtasks: Array.isArray(t.subtasks) ? t.subtasks : []
        });
      });
      pushHistory(); state.tasks = newTasks; selectedIds = []; setStaleIndicator(true); render(); closeExport(); return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  function bulkComplete() { if (!selectedIds.length) return; pushHistory(); setStaleIndicator(true); state.tasks.forEach(function(t) { if (selectedIds.indexOf(t.id) !== -1) t.done = true; }); selectedIds = []; render(); }
  function bulkDelete() { if (!selectedIds.length) return; if (confirm("Delete " + selectedIds.length + " selected tasks?")) { pushHistory(); setStaleIndicator(true); state.tasks = state.tasks.filter(function(t) { return selectedIds.indexOf(t.id) === -1; }); selectedIds = []; render(); } }
  function openMoveToDay() { if (!selectedIds.length) return; document.getElementById("move-overlay").hidden = false; document.getElementById("move-count").textContent = selectedIds.length; updateMovePreview(); }
  function closeMoveToDay() { document.getElementById("move-overlay").hidden = true; }
  function updateMovePreview() { var day = parseInt(document.getElementById("move-day-select").value, 10); var currentMins = columnTotalMinutes(day); var addedMins = 0; state.tasks.forEach(function(t) { if (selectedIds.indexOf(t.id) !== -1 && t.day !== day && taskMatchesFilters(t)) addedMins += parseTime(t.planned); }); var el = document.getElementById("move-preview"); if (el) el.textContent = "Dest. planned time will become " + fmtTime(currentMins + addedMins) + " (was " + fmtTime(currentMins) + ")"; }
  function confirmMoveToDay() { if (!selectedIds.length) return; pushHistory(); setStaleIndicator(true); var day = parseInt(document.getElementById("move-day-select").value, 10); state.tasks.forEach(function(t) { if (selectedIds.indexOf(t.id) !== -1) t.day = day; }); selectedIds = []; closeMoveToDay(); render(); }
  function updateFilterUI() { var bar = document.getElementById("filter-bar"); if (bar) { if (filterState.open) { bar.removeAttribute("hidden"); bar.style.display = "flex"; } else { bar.setAttribute("hidden", "true"); bar.style.display = "none"; } } var clearBtn = document.getElementById("clear-filter"); if (clearBtn) clearBtn.hidden = filterState.channel === "all" && !filterState.search; var btns = document.querySelectorAll("[data-act='filter-chan']"); for (var i = 0; i < btns.length; i++) { if (btns[i].dataset.chan === filterState.channel) btns[i].classList.add("active"); else btns[i].classList.remove("active"); } }
  function setFilterChannel(chan) { filterState.channel = chan; updateFilterUI(); render(); }
  function clearFilter() { filterState.channel = "all"; filterState.search = ""; var inp = document.getElementById("search-input"); if (inp) inp.value = ""; updateFilterUI(); render(); }
  function rollover() {
    var targets = []; state.tasks.forEach(function(t) { if (!t.done && t.day < TODAY) targets.push(t); });
    if (!targets.length) { showToast("No tasks to rollover"); return; }
    var preview = targets.length + " tasks to move:\n" + targets.map(function(t) { return "• " + t.title; }).slice(0, 5).join("\n");
    if (targets.length > 5) preview += "\n...and " + (targets.length - 5) + " more";
    if (confirm(preview + "\n\nContinue?")) { pushHistory(); setStaleIndicator(true); targets.forEach(function(t) { t.day = TODAY; }); render(); }
  }


  // ---- toast ----
  var toastTimer = null;
  function showToast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    // reflow so the enter transition replays
    void t.offsetWidth;
    t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.hidden = true; }, 220);
    }, 1600);
  }

  // ---- edit modal ----
  var editingId = null;
  var lastActiveElement = null;
  function trapFocus(e) {
    var modal = e.target.closest(".modal");
    if (!modal) return;
    var focusableEls = modal.querySelectorAll('a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select');
    var firstFocusableEl = focusableEls[0];
    var lastFocusableEl = focusableEls[focusableEls.length - 1];
    if (e.key === 'Tab' || e.keyCode === 9) {
      if (e.shiftKey) { if (document.activeElement === firstFocusableEl) { lastFocusableEl.focus(); e.preventDefault(); } }
      else { if (document.activeElement === lastFocusableEl) { firstFocusableEl.focus(); e.preventDefault(); } }
    }
  }
  function handleEscape(e) { if (e.key === 'Escape' || e.keyCode === 27) if (editingId) closeEdit(); }
  function openEdit(id) {
    var t = findTask(id); if (!t) return; editingId = id; lastActiveElement = document.activeElement;
    document.getElementById("edit-title").value = t.title; document.getElementById("edit-channel").value = t.channel || "";
    document.getElementById("edit-planned").value = t.planned || ""; document.getElementById("edit-start").value = t.start || "";
    var errs = document.querySelectorAll("#edit-form .fld-err"); for(var i=0; i<errs.length; i++) errs[i].hidden = true;
    var inputs = document.querySelectorAll("#edit-form input"); for(var i=0; i<inputs.length; i++) inputs[i].removeAttribute("aria-invalid");
    document.getElementById("modal-overlay").hidden = false; document.getElementById("edit-title").focus();
    document.addEventListener('keydown', trapFocus); document.addEventListener('keydown', handleEscape);
  }
  function closeEdit() {
    var closedTaskId = editingId;
    editingId = null; document.getElementById("modal-overlay").hidden = true;
    document.removeEventListener('keydown', trapFocus); document.removeEventListener('keydown', handleEscape);
    if (lastActiveElement && lastActiveElement.isConnected) lastActiveElement.focus();
    else if (closedTaskId) {
      var replacement = document.querySelector('.task[data-id="' + closedTaskId + '"] [data-act="edit"]');
      if (replacement) replacement.focus();
    }
  }

  // ---- wiring ----
  function init() {
    seed();
    render();

    var columns = document.getElementById("columns");
    document.body.addEventListener("click", function (e) {
      var actEl = e.target.closest("[data-act]");
      if (!actEl) return;
      var card = e.target.closest(".task");
      var col = e.target.closest(".col");
      var act = actEl.dataset.act;
      if (act === "toggle" && card) toggleTask(card.dataset.id);
      else if (act === "subtoggle" && card) toggleSubtask(card.dataset.id, parseInt(actEl.dataset.sub, 10));
      else if (act === "edit" && card) openEdit(card.dataset.id);
      else if (act === "delete" && card) {
        var deletingId = card.dataset.id;
        card.style.transition = "opacity 0.2s, height 0.2s, margin 0.2s, padding 0.2s";
        card.style.opacity = "0";
        card.style.height = "0";
        card.style.minHeight = "0";
        card.style.marginBottom = "0";
        card.style.paddingTop = "0";
        card.style.paddingBottom = "0";
        card.style.overflow = "hidden";
        card.style.border = "none";
        card.style.pointerEvents = "none";
        setTimeout(function () { deleteTask(deletingId); }, 200);
      }
      else if (act === "select-task" && card) { var id = card.dataset.id; if (e.target.checked) selectedIds.push(id); else selectedIds = selectedIds.filter(function(s) { return s !== id; }); render(); }
      else if (actEl.dataset.act === "undo") undo(); else if (actEl.dataset.act === "redo") redo();
      else if (actEl.dataset.act === "rollover") rollover(); else if (actEl.dataset.act === "open-export") openExport(); else if (actEl.dataset.act === "close-export") closeExport();
      else if (actEl.dataset.act === "tab-ics") switchExportTab("ics"); else if (actEl.dataset.act === "tab-json") switchExportTab("json");
      else if (actEl.dataset.act === "copy-ics") { navigator.clipboard.writeText(document.getElementById("out-ics").value); showToast("Copied"); }
      else if (actEl.dataset.act === "copy-json") { navigator.clipboard.writeText(document.getElementById("out-json").value); showToast("Copied"); }
      else if (actEl.dataset.act === "dl-ics") { var a = document.createElement("a"); a.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(document.getElementById("out-ics").value); a.download = "cadence-planner.ics"; a.click(); }
      else if (actEl.dataset.act === "dl-json") { var a = document.createElement("a"); a.href = "data:application/json;charset=utf-8," + encodeURIComponent(document.getElementById("out-json").value); a.download = "cadence-planner.json"; a.click(); }
      else if (actEl.dataset.act === "import-json") { var val = document.getElementById("in-json").value; var res = importJSON(val); if (!res.ok) { document.getElementById("import-err").hidden = false; document.getElementById("import-err").textContent = res.error; } }
      else if (actEl.dataset.act === "bulk-complete") bulkComplete(); else if (actEl.dataset.act === "bulk-delete") bulkDelete(); else if (actEl.dataset.act === "bulk-move") openMoveToDay(); else if (actEl.dataset.act === "close-move") closeMoveToDay(); else if (actEl.dataset.act === "confirm-move") confirmMoveToDay();
      else if (actEl.dataset.act === "toggle-filter") { filterState.open = !filterState.open; updateFilterUI(); } else if (actEl.dataset.act === "filter-chan") setFilterChannel(actEl.dataset.chan); else if (actEl.dataset.act === "clear-filter") clearFilter();
      else if (act === "select-day" && col) selectDay(parseInt(col.dataset.day, 10));
      else if (act === "add-open" && col) {
        var form = col.querySelector(".add-form");
        var btn = col.querySelector(".add-task");
        if (form && btn) { form.hidden = false; btn.hidden = true; form.querySelector(".add-title").focus(); }
      } else if (act === "add-cancel" && col) {
        var f = col.querySelector(".add-form");
        var b = col.querySelector(".add-task");
        if (f && b) {
          f.hidden = true; b.hidden = false; f.reset();
          var addErrors = f.querySelectorAll(".fld-err");
          for (var i = 0; i < addErrors.length; i++) addErrors[i].hidden = true;
          var invalidFields = f.querySelectorAll("[aria-invalid]");
          for (var i = 0; i < invalidFields.length; i++) invalidFields[i].removeAttribute("aria-invalid");
        }
      }
    });
    columns.addEventListener("submit", function (e) {
      var form = e.target.closest(".add-form");
      if (!form) return;
      e.preventDefault();
      var day = parseInt(form.dataset.day, 10);
      var titleInput = form.querySelector(".add-title"); var title = titleInput.value;
      var plannedInput = form.querySelector(".add-planned"); var planned = plannedInput.value;
      var err = form.querySelector(".add-err"); var errPlanned = form.querySelector(".add-planned-err");
      err.hidden = true; errPlanned.hidden = true; titleInput.removeAttribute("aria-invalid"); plannedInput.removeAttribute("aria-invalid");
      var hasError = false;
      if (!title || !title.trim() || title.length > 120) { err.hidden = false; titleInput.setAttribute("aria-invalid", "true"); hasError = true; }
      if (planned) { var m = planned.trim().match(/^(\d+):([0-5]?\d)$/); var pMins = parseTime(planned); if (!m || pMins > 12 * 60) { errPlanned.hidden = false; plannedInput.setAttribute("aria-invalid", "true"); hasError = true; } }
      if (hasError) return;
      createTask({ title: title, day: day, planned: planned });
      titleInput.value = ""; plannedInput.value = ""; form.hidden = true;
      var b = form.closest(".col").querySelector(".add-task"); if (b) b.hidden = false;
    });

    // new modals and keys
    var mdS = document.getElementById("move-day-select"); if (mdS) mdS.addEventListener("change", updateMovePreview);
    var mdO = document.getElementById("move-overlay"); if (mdO) mdO.addEventListener("click", function (e) { if (e.target === this) closeMoveToDay(); });
    var sInp = document.getElementById("search-input"); if (sInp) sInp.addEventListener("input", function(e) { filterState.search = e.target.value; updateFilterUI(); render(); });
    var eo = document.getElementById("export-overlay"); if (eo) eo.addEventListener("click", function (e) { if (e.target === this) closeExport(); });
    document.addEventListener("keydown", function(e) {
      var target = e.target;
      var isEditingText = editingId || (target.matches && target.matches("input, textarea, [contenteditable='true']"));
      if (isEditingText) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    });
    var cal = document.getElementById("cal");
    var draggedId = null;
    if (cal) {
      cal.addEventListener("dragstart", function(e) { if (e.target.classList.contains("cal-event")) { draggedId = e.target.dataset.id; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", draggedId); setTimeout(function() { e.target.style.opacity = "0.5"; }, 0); } });
      cal.addEventListener("dragend", function(e) { if (e.target.classList.contains("cal-event")) { e.target.style.opacity = "1"; draggedId = null; var lines = cal.querySelectorAll(".hr-line"); for(var i=0; i<lines.length; i++) lines[i].classList.remove("drag-over"); } });
      cal.addEventListener("dragover", function(e) { var line = e.target.closest(".hr-line"); if (line && draggedId) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } });
      cal.addEventListener("dragenter", function(e) { var line = e.target.closest(".hr-line"); if (line && draggedId) line.classList.add("drag-over"); });
      cal.addEventListener("dragleave", function(e) { var line = e.target.closest(".hr-line"); if (line && draggedId) line.classList.remove("drag-over"); });
      cal.addEventListener("drop", function(e) {
        var line = e.target.closest(".hr-line");
        if (line && draggedId) { e.preventDefault(); line.classList.remove("drag-over"); var newHour = parseInt(line.dataset.hour, 10); var t = findTask(draggedId); if (t && startHourIndex(t.start) !== newHour) { pushHistory(); setStaleIndicator(true); var ampm = newHour >= 12 ? "pm" : "am"; var h = newHour % 12; if (h === 0) h = 12; t.start = h + ":00 " + ampm; render(); } }
      });
    }

    // edit modal
    document.getElementById("edit-form").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!editingId) return;
      var inputs = document.querySelectorAll("#edit-form input"); for(var i=0; i<inputs.length; i++) inputs[i].removeAttribute("aria-invalid");
      var errs = document.querySelectorAll("#edit-form .fld-err"); for(var i=0; i<errs.length; i++) errs[i].hidden = true;
      var hasError = false;
      var titleInput = document.getElementById("edit-title"); var title = titleInput.value;
      if (!title || !title.trim() || title.length > 120) { document.getElementById("edit-title-err").hidden = false; titleInput.setAttribute("aria-invalid", "true"); hasError = true; }
      var chanInput = document.getElementById("edit-channel"); var chan = chanInput.value;
      if (chan) { var cleanChan = chan.replace(/^#/, "").trim(); if (["work", "personal", "health", "focus"].indexOf(cleanChan) === -1) { document.getElementById("edit-channel-err").hidden = false; chanInput.setAttribute("aria-invalid", "true"); hasError = true; } }
      var plannedInput = document.getElementById("edit-planned"); var planned = plannedInput.value;
      if (planned) { var m = planned.trim().match(/^(\d+):([0-5]?\d)$/); var pMins = parseTime(planned); if (!m || pMins > 12 * 60) { document.getElementById("edit-planned-err").hidden = false; plannedInput.setAttribute("aria-invalid", "true"); hasError = true; } }
      var startInput = document.getElementById("edit-start"); var start = startInput.value;
      if (start && start.trim()) { var sm = String(start).trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/); if (!sm) { document.getElementById("edit-start-err").hidden = false; startInput.setAttribute("aria-invalid", "true"); hasError = true; } }
      if (hasError) return;
      updateTask(editingId, { title: title, channel: chan, planned: planned, start: start });
      closeEdit();
    });
    document.getElementById("edit-cancel").addEventListener("click", closeEdit);
    document.getElementById("modal-overlay").addEventListener("click", function (e) {
      if (e.target === this) closeEdit();
    });

    // chrome-only controls: demo toast, never navigate
    document.body.addEventListener("click", function (e) {
      var c = e.target.closest("[data-chrome]");
      if (!c) return;
      showToast(c.dataset.chrome + " is a demo control in this board");
    });

    registerWebmcp();
  }

  // ---- WebMCP surface (contract zto-webmcp-v1) ----
  function registerWebmcp() {
    var tools = {
      // browse-query-v1 (destinations: board, calendar-day-panel)
      "browse_open": {
        description: "Open a destination: board, or calendar-day-panel (optionally a July day 6-26).",
        handler: function (args) {
          args = args || {};
          var dest = args.destination;
          if (dest === "calendar-day-panel") {
            if (args.day != null) return selectDay(args.day);
            return { ok: true, destination: dest, selectedDay: state.selectedDay };
          }
          if (dest === "board") {
            var wrap = document.getElementById("columns");
            if (wrap) wrap.scrollLeft = 0;
            return { ok: true, destination: dest };
          }
          return { ok: false, error: "Unknown destination; use board or calendar-day-panel" };
        }
      },
      // entity-collection-v1 (entity: task)
      "entity_create": {
        description: "Create a task {title, day (6-26), channel?, planned? (H:MM), start? (e.g. 9:00 am)}.",
        handler: function (args) {
          var payload = args || {};
          if (payload.plannedTime && !payload.planned) payload.planned = payload.plannedTime;
          if (payload.startTime && !payload.start) payload.start = payload.startTime;
          return createTask(payload);
        }
      },
      "entity_select": {
        description: "Select a task by id; returns its fields.",
        handler: function (args) {
          var t = args && args.id ? findTask(args.id) : null;
          return t ? { ok: true, task: publicTask(t) } : { ok: false, error: "No such task" };
        }
      },
      "entity_update": {
        description: "Update a task by id {id, title?, channel?, planned-time?, start-time?, day?, done?}.",
        handler: function (args) {
          var payload = args || {};
          if (!payload.id) return { ok: false, error: "id required" };
          if (payload.plannedTime && !payload.planned) payload.planned = payload.plannedTime;
          if (payload.startTime && !payload.start) payload.start = payload.startTime;
          return updateTask(payload.id, payload);
        }
      },
      "entity_delete": {
        description: "Delete a task by id; requires confirm=true.",
        handler: function (args) {
          args = args || {};
          if (!args.id) return { ok: false, error: "id required" };
          if (args.confirm !== true) return { ok: false, error: "confirm=true required to delete" };
          return deleteTask(args.id);
        }
      },
      "entity_toggle": {
        description: "Toggle a task's completed state by id.",
        handler: function (args) { args = args || {}; if (!args.id) return { ok: false, error: "id required" }; return toggleTask(args.id); }
      },
      "form_validate": {
        description: "Validate task form fields.",
        handler: function (args) {
          var payload = args || {};
          var errors = [];
          if (!payload.title || typeof payload.title !== "string" || payload.title.trim().length === 0 || payload.title.length > 120) errors.push("Invalid title");
          if (payload.day) {
             var day = parsePlannerDay(payload.day);
             if (isNaN(day) || day < 6 || day > 26) errors.push("Day out of bounds");
          }
          if (payload.channel) {
             var channel = String(payload.channel).replace(/^#/, "").trim();
             if (["work", "personal", "health", "focus"].indexOf(channel) === -1) errors.push("Invalid channel");
          }
          if (payload.plannedTime) {
             var pm = String(payload.plannedTime).trim().match(/^(\d+):([0-5]?\d)$/);
             if (!pm || parseTime(payload.plannedTime) > 12 * 60) errors.push("Invalid planned time");
          }
          if (payload.startTime) {
             var sm = String(payload.startTime).trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
             if (!sm) errors.push("Invalid start time");
          }
          if (errors.length > 0) return { ok: false, error: errors.join(", ") };
          return { ok: true };
        }
      },
      "form_submit": { description: "Submit form", handler: function (args) {
         var payload = args || {};
         if (payload.plannedTime && !payload.planned) payload.planned = payload.plannedTime;
         if (payload.startTime && !payload.start) payload.start = payload.startTime;
         return createTask(payload);
      } },
      "form_cancel": { description: "Cancel form", handler: function (args) { return { ok: true }; } },
      "artifact_export": { description: "Export", handler: function (args) { var fmt = (args || {}).format; if (fmt === "ics") return { ok: true, format: "ics", payload: generateICS() }; if (fmt === "planner-json") return { ok: true, format: "planner-json", payload: generateJSON() }; return { ok: false, error: "Unsupported" }; } },
      "artifact_import": { description: "Import", handler: function (args) { var p = (args || {}).payload; if (!p) return { ok: false, error: "Missing payload" }; return importJSON(p); } },
      "artifact_copy": { description: "Copy", handler: function (args) { return { ok: true }; } }
    };

    window.webmcp_session_info = function () {
      return {
        contract_version: "zto-webmcp-v1",
        app: "cadence-daily-planner-board",
        modules: ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"],
        entity: "task",
        destinations: ["board", "calendar-day-panel"],
        tool_count: Object.keys(tools).length
      };
    };
    window.webmcp_list_tools = function () {
      return Object.keys(tools).map(function (name) {
        return { name: name, description: tools[name].description };
      });
    };
    window.webmcp_invoke_tool = function (name, args) {
      if (!tools[name]) throw new Error("Unknown WebMCP tool: " + name);
      return tools[name].handler(args || {});
    };
  }

  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { try { init(); } catch (e) { /* no-op */ } });
    } else {
      init();
    }
  } catch (e) { /* never throw at load */ }
})();
