/* Cadence daily planner board — working oracle (vanilla JS, in-memory state only).
   No localStorage/sessionStorage. Exposes the WebMCP surface required by the
   instruction's <webmcp_action_contract>: window.webmcp_session_info(),
   window.webmcp_list_tools(), window.webmcp_invoke_tool(name, args). */
(function () {
  "use strict";

  // ---------- constants ----------
  var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var WD_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var CHANNELS = ["work", "personal", "health", "focus"];
  var DAY_MIN = 6, DAY_MAX = 26, TODAY = 18; // Saturday, July 18
  var ROW_H = 26; // calendar hour-row height in px (kept in sync with styles.css)

  // July 6 is a Monday (index 1), so weekday index = (date - 5) mod 7.
  function weekdayIndex(date) { return ((date - 5) % 7 + 7) % 7; }
  function weekdayName(date) { return WEEKDAYS[weekdayIndex(date)]; }
  function weekdayAbbr(date) { return WD_ABBR[weekdayIndex(date)]; }
  function actionLabel(date) {
    if (date < TODAY) return "Reflect";
    if (date === TODAY) return "Shutdown";
    return "Plan";
  }
  function isoDay(d) { return "2026-07-" + String(d).padStart(2, "0"); }

  var HOURS = ["12 AM","1 AM","2 AM","3 AM","4 AM","5 AM","6 AM","7 AM","8 AM","9 AM","10 AM","11 AM",
    "12 PM","1 PM","2 PM","3 PM","4 PM","5 PM","6 PM","7 PM","8 PM","9 PM","10 PM","11 PM"];

  // ---------- time helpers ----------
  function parseTime(str) {
    if (!str) return 0;
    var m = String(str).trim().match(/^(\d{1,2}):([0-5]\d)$/);
    if (!m) return 0;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }
  function fmtTime(mins) {
    mins = Math.max(0, Math.round(mins || 0));
    var h = Math.floor(mins / 60), mm = mins % 60;
    return h + ":" + (mm < 10 ? "0" + mm : String(mm));
  }
  function startTimeParts(start) {
    if (!start) return null;
    var m = String(start).trim().toLowerCase().match(/^(\d{1,2}):([0-5]\d)\s*(am|pm)$/);
    if (!m) return null;
    var h = parseInt(m[1], 10) % 12;
    if (m[3] === "pm") h += 12;
    return { hour: h, minute: parseInt(m[2], 10) };
  }
  function startMinutes(start) {
    var p = startTimeParts(start);
    return p ? p.hour * 60 + p.minute : null;
  }
  function startHourIndex(start) {
    var p = startTimeParts(start);
    return p ? p.hour : null;
  }
  function clockString(hour, minute) {
    var ampm = hour >= 12 ? "pm" : "am";
    var h = hour % 12; if (h === 0) h = 12;
    return h + ":" + String(minute == null ? 0 : minute).padStart(2, "0") + " " + ampm;
  }
  function parsePlannerDay(value) {
    if (typeof value === "number") return Number.isInteger(value) ? value : NaN;
    var raw = value == null ? "" : String(value).trim();
    var iso = raw.match(/^2026-07-(\d{2})$/);
    if (iso) return parseInt(iso[1], 10);
    return /^\d{1,2}$/.test(raw) ? parseInt(raw, 10) : NaN;
  }
  function reducedMotion() {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (e) { return false; }
  }
  function icsEscape(text) {
    return String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }
  function uidHash(str) {
    var h = 5381, s = String(str);
    for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; }
    return h.toString(16).padStart(8, "0");
  }

  // ---------- state (in-memory only) ----------
  var seq = 0;
  function uid() { seq += 1; return "task-" + seq; }

  var state = {
    selectedDay: TODAY,
    tasks: [],
    filter: { channel: "all", search: "", open: false },
    selected: [] // multi-select ids
  };
  var past = [];    // undo stack of snapshots
  var future = [];  // redo stack of snapshots
  var addDrafts = {}; // per-day inline add-form drafts {open, title, day, channel, planned, start, notes}
  var newlyAddedId = null;
  var stale = false;
  var overlayOpener = {};
  var toastTimer = null;
  var rolloverCandidates = [];
  var dragState = null;
  var dragCommitTimer = null;
  var dropLine = null;

  function seed() {
    seq = 0;
    state.tasks = [
      { id: uid(), title: "Set up Cadence", day: 18, channel: "work", done: false,
        planned: "0:20", start: null,
        notes: "Walk the five-step setup checklist before the team stands up on Monday.",
        subtasks: [
          { title: "Add a task", done: false },
          { title: "Complete daily planning", done: false },
          { title: "Add integrations", done: false },
          { title: "Add channels", done: false },
          { title: "Add recurring tasks", done: false }
        ] },
      { id: uid(), title: "Weekly planning", day: 18, channel: "work", done: false,
        planned: null, start: null, notes: "", subtasks: [] },
      { id: uid(), title: "Daily planning", day: 19, channel: "work", done: false,
        planned: null, start: null, notes: "", subtasks: [] },
      { id: uid(), title: "Work", day: 20, channel: "work", done: false,
        planned: "1:00", start: "9:00 am", notes: "", subtasks: [] }
    ];
    state.selected = [];
    state.filter = { channel: "all", search: "", open: false };
    state.selectedDay = TODAY;
  }

  function snapshot() {
    return JSON.parse(JSON.stringify({ tasks: state.tasks, selected: state.selected }));
  }
  function applySnapshot(s) {
    state.tasks = JSON.parse(JSON.stringify(s.tasks));
    state.selected = s.selected.slice();
  }
  function commit(mutator) {
    past.push(snapshot());
    future.length = 0;
    mutator();
    setStale(true);
    render();
  }
  function cancelPendingDrag() {
    var cancelled = false;
    if (dragCommitTimer !== null) {
      clearTimeout(dragCommitTimer);
      dragCommitTimer = null;
      cancelled = true;
    }
    if (dragState) {
      try { dragState.el.releasePointerCapture(dragState.pid); } catch (err) { /* ignore */ }
      dragState.el.classList.remove("dragging", "settling");
      dragState.el.style.top = "";
      dragState = null;
      clearDropTarget();
      cancelled = true;
    }
    return cancelled;
  }
  function undo() {
    var cancelledDrag = cancelPendingDrag();
    if (!past.length) { if (cancelledDrag) render(); return; }
    future.push(snapshot());
    applySnapshot(past.pop());
    setStale(true);
    render();
  }
  function redo() {
    var cancelledDrag = cancelPendingDrag();
    if (!future.length) { if (cancelledDrag) render(); return; }
    past.push(snapshot());
    applySnapshot(future.pop());
    setStale(true);
    render();
  }

  function byId(id) { return document.getElementById(id); }
  function findTask(id) {
    for (var i = 0; i < state.tasks.length; i++) if (state.tasks[i].id === id) return state.tasks[i];
    return null;
  }
  function taskMatchesFilters(t) {
    if (state.filter.channel !== "all" && t.channel !== state.filter.channel) return false;
    if (state.filter.search && t.title.toLowerCase().indexOf(state.filter.search.toLowerCase()) === -1) return false;
    return true;
  }
  function tasksForDay(date) {
    return state.tasks.filter(function (t) { return t.day === date && taskMatchesFilters(t); });
  }
  function columnTotalMinutes(date) {
    return tasksForDay(date).reduce(function (sum, t) { return sum + parseTime(t.planned); }, 0);
  }
  function filtersActive() { return state.filter.channel !== "all" || !!state.filter.search; }

  // ---------- validation (Task field contract) ----------
  function validateTaskFields(f, partial) {
    var errs = {};
    f = f || {};
    function provided(key) { return f[key] != null && String(f[key]).trim() !== ""; }

    // title
    if (!partial || provided("title") || f.title === "") {
      var title = typeof f.title === "string" ? f.title.trim() : "";
      if (!title) errs.title = "Title is required";
      else if (title.length > 120) errs.title = "Title must be 120 characters or fewer";
    }
    // day
    if (!partial || provided("day")) {
      var d = parsePlannerDay(f.day);
      if (isNaN(d) || d < DAY_MIN || d > DAY_MAX) errs.day = "Day must be one of July 6 through July 26 (2026-07-06 to 2026-07-26)";
    }
    // channel
    if (provided("channel")) {
      var c = String(f.channel).replace(/^#/, "").trim().toLowerCase();
      if (CHANNELS.indexOf(c) === -1) errs.channel = "Channel must be one of work, personal, health, focus";
    }
    // plannedTime (accept legacy alias "planned")
    var planned = f.plannedTime != null ? f.plannedTime : f.planned;
    if (planned != null && String(planned).trim() !== "") {
      var pm = String(planned).trim().match(/^(\d{1,2}):([0-5]\d)$/);
      if (!pm || parseTime(planned) > 720) errs.plannedTime = "Planned time must be H:MM with minutes 00-59 and at most 12:00";
    }
    // startTime (accept legacy alias "start")
    var start = f.startTime != null ? f.startTime : f.start;
    if (start != null && String(start).trim() !== "") {
      if (!startTimeParts(start)) errs.startTime = "Start time must look like 9:00 am or 2:30 pm";
    }
    // notes
    if (provided("notes")) {
      if (typeof f.notes !== "string" || f.notes.length > 500) errs.notes = "Notes must be 500 characters or fewer";
    }
    // subtasks
    if (f.subtasks != null && f.subtasks !== "") {
      var subs = f.subtasks;
      if (!Array.isArray(subs)) errs.subtasks = "Subtasks must be a list";
      else if (subs.length > 12) errs.subtasks = "Subtasks must contain at most 12 items";
      else {
        for (var i = 0; i < subs.length; i++) {
          var st = subs[i] && subs[i].title;
          if (typeof st !== "string" || st.trim() === "" || st.length > 80) {
            errs.subtasks = "Each subtask title must be a non-empty string of 80 characters or fewer";
            break;
          }
        }
      }
    }
    return errs;
  }
  function firstError(errs) {
    for (var k in errs) if (Object.prototype.hasOwnProperty.call(errs, k)) return errs[k];
    return "Invalid task";
  }
  function normalizeTaskFields(f) {
    var planned = f.plannedTime != null ? f.plannedTime : f.planned;
    var start = f.startTime != null ? f.startTime : f.start;
    var plannedNorm = null;
    if (planned != null && String(planned).trim() !== "") plannedNorm = fmtTime(parseTime(planned));
    var startNorm = null;
    if (start != null && String(start).trim() !== "") startNorm = String(start).trim().toLowerCase().replace(/\s+/g, " ");
    var subs = [];
    if (Array.isArray(f.subtasks)) {
      f.subtasks.forEach(function (s) {
        if (s && typeof s.title === "string" && s.title.trim()) subs.push({ title: s.title.trim(), done: !!s.done });
      });
    }
    return {
      title: String(f.title).trim(),
      day: parsePlannerDay(f.day),
      channel: f.channel ? String(f.channel).replace(/^#/, "").trim().toLowerCase() : "work",
      done: !!f.done,
      planned: plannedNorm,
      start: startNorm,
      notes: typeof f.notes === "string" ? f.notes.trim() : "",
      subtasks: subs
    };
  }

  // ---------- domain commands (shared by the visible UI and WebMCP) ----------
  function createTask(fields) {
    var errs = validateTaskFields(fields, false);
    if (Object.keys(errs).length) return { ok: false, error: firstError(errs), errors: errs };
    var norm = normalizeTaskFields(fields);
    var t = { id: uid(), title: norm.title, day: norm.day, channel: norm.channel, done: norm.done,
      planned: norm.planned, start: norm.start, notes: norm.notes, subtasks: norm.subtasks };
    newlyAddedId = t.id;
    commit(function () {
      state.tasks.push(t);
      if (t.start) state.selectedDay = t.day; // keep the calendar panel coherent with the new block
    });
    return { ok: true, task: publicTask(t) };
  }

  function updateTask(id, fields) {
    var t = findTask(id);
    if (!t) return { ok: false, error: "No such task" };
    var errs = validateTaskFields(fields, true);
    if (Object.keys(errs).length) return { ok: false, error: firstError(errs), errors: errs };
    var norm = normalizeTaskFields(
      Object.assign({ title: t.title, day: t.day, channel: t.channel }, fields)
    );
    commit(function () {
      if (fields.title != null && String(fields.title).trim() !== "") t.title = norm.title;
      if (fields.channel != null && String(fields.channel).trim() !== "") t.channel = norm.channel;
      if (fields.day != null && String(fields.day).trim() !== "") t.day = norm.day;
      if (fields.done != null) t.done = !!fields.done;
      if (fields.plannedTime != null || fields.planned != null) t.planned = norm.planned;
      if (fields.startTime != null || fields.start != null) t.start = norm.start;
      if (fields.notes != null) t.notes = norm.notes;
      if (fields.subtasks != null) {
        t.subtasks = norm.subtasks;
      }
      if (t.start) state.selectedDay = t.day;
    });
    return { ok: true, task: publicTask(t) };
  }

  function deleteTask(id) {
    var t = findTask(id);
    if (!t) return { ok: false, error: "No such task" };
    var wasScheduled = !!t.start, taskDay = t.day, title = t.title;
    commit(function () {
      state.tasks = state.tasks.filter(function (x) { return x.id !== id; });
      state.selected = state.selected.filter(function (x) { return x !== id; });
      if (wasScheduled) state.selectedDay = taskDay;
    });
    return { ok: true, title: title };
  }

  function toggleTask(id) {
    var t = findTask(id);
    if (!t) return { ok: false, error: "No such task" };
    commit(function () {
      t.done = !t.done;
      if (t.start) state.selectedDay = t.day;
    });
    return { ok: true, done: t.done };
  }

  function toggleSubtask(id, index) {
    var t = findTask(id);
    if (!t || !t.subtasks || !t.subtasks[index]) return { ok: false, error: "No such subtask" };
    commit(function () { t.subtasks[index].done = !t.subtasks[index].done; });
    return { ok: true, done: t.subtasks[index].done };
  }

  function selectDay(date) {
    var d = parsePlannerDay(date);
    if (isNaN(d) || d < DAY_MIN || d > DAY_MAX) return { ok: false, error: "Day must be July 6-26" };
    state.selectedDay = d;
    render();
    return { ok: true, selectedDay: d };
  }

  function publicTask(t) {
    return {
      id: t.id, title: t.title, day: isoDay(t.day), channel: t.channel, done: t.done,
      plannedTime: t.planned, startTime: t.start, notes: t.notes || null,
      subtasks: t.subtasks && t.subtasks.length ? t.subtasks.map(function (s) { return { title: s.title, done: s.done }; }) : []
    };
  }

  // ---------- conflicts ----------
  function computeConflicts() {
    var groups = {};
    state.tasks.forEach(function (t) {
      if (t.done || !t.start) return;
      var key = t.day + "|" + startMinutes(t.start);
      (groups[key] = groups[key] || []).push(t);
    });
    var pairs = [];
    Object.keys(groups).forEach(function (key) {
      var g = groups[key];
      if (g.length < 2) return;
      for (var i = 0; i < g.length; i++) for (var j = i + 1; j < g.length; j++) {
        pairs.push({ a: g[i], b: g[j] });
      }
    });
    return pairs;
  }

  // ---------- artifacts (compiled live from the store) ----------
  function generateICS() {
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cadence//Daily Planner Board//EN", "CALSCALE:GREGORIAN"];
    var sorted = state.tasks.slice().sort(function (a, b) {
      if (a.day !== b.day) return a.day - b.day;
      return (startMinutes(a.start) == null ? -1 : startMinutes(a.start)) - (startMinutes(b.start) == null ? -1 : startMinutes(b.start));
    });
    sorted.forEach(function (t) {
      lines.push("BEGIN:VEVENT");
      lines.push("UID:cadence-" + uidHash(t.id) + "@cadence");
      lines.push("DTSTAMP:20260718T120000Z");
      lines.push("SUMMARY:" + icsEscape(t.title));
      var dd = String(t.day).padStart(2, "0");
      var parts = startTimeParts(t.start);
      if (parts) {
        lines.push("DTSTART:202607" + dd + "T" + String(parts.hour).padStart(2, "0") + String(parts.minute).padStart(2, "0") + "00");
      } else {
        lines.push("DTSTART;VALUE=DATE:202607" + dd);
      }
      if (t.planned) {
        var mins = parseTime(t.planned);
        lines.push("DURATION:PT" + Math.floor(mins / 60) + "H" + (mins % 60) + "M");
      }
      lines.push("STATUS:" + (t.done ? "COMPLETED" : "NEEDS-ACTION"));
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function generateJSON() {
    var payload = {
      schemaVersion: "1",
      board: { title: "Cadence", dateStart: "2026-07-06", dateEnd: "2026-07-26" },
      tasks: state.tasks.map(function (t) {
        var out = { title: t.title, day: isoDay(t.day), channel: t.channel, done: t.done };
        if (t.planned) out.plannedTime = t.planned;
        if (t.start) out.startTime = t.start;
        if (t.notes) out.notes = t.notes;
        if (t.subtasks && t.subtasks.length) out.subtasks = t.subtasks.map(function (s) { return { title: s.title, done: s.done }; });
        return out;
      })
    };
    return JSON.stringify(payload, null, 2);
  }

  function importJSON(jsonStr) {
    var data;
    try { data = JSON.parse(jsonStr); }
    catch (e) { return { ok: false, error: "Malformed JSON — " + String(e.message || e).split("\n")[0] }; }
    if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: false, error: "Payload must be a JSON object" };
    if (data.schemaVersion !== "1") return { ok: false, error: 'schemaVersion must be the string "1"' };
    if (!Array.isArray(data.tasks)) return { ok: false, error: "tasks must be an array" };
    var newTasks = [];
    for (var i = 0; i < data.tasks.length; i++) {
      var raw = data.tasks[i] || {};
      var label = "Task " + (i + 1) + ": ";
      var errs = validateTaskFields(raw, false);
      // day is required on import (export always writes it)
      if (raw.day == null || String(raw.day).trim() === "") errs.day = "day is required (ISO date 2026-07-06 through 2026-07-26)";
      if (Object.keys(errs).length) {
        var fieldMsg = [];
        for (var k in errs) if (Object.prototype.hasOwnProperty.call(errs, k)) fieldMsg.push(errs[k]);
        return { ok: false, error: label + fieldMsg.join("; ") };
      }
      var norm = normalizeTaskFields(raw);
      newTasks.push({ id: uid(), title: norm.title, day: norm.day, channel: norm.channel,
        done: norm.done, planned: norm.planned, start: norm.start, notes: norm.notes, subtasks: norm.subtasks });
    }
    commit(function () {
      state.tasks = newTasks;
      state.selected = [];
      addDrafts = {};
      newlyAddedId = null;
    });
    return { ok: true, count: newTasks.length };
  }

  // ---------- bulk + rollover ----------
  function bulkComplete() {
    if (!state.selected.length) return;
    var n = state.selected.length;
    commit(function () {
      state.tasks.forEach(function (t) { if (state.selected.indexOf(t.id) !== -1) t.done = true; });
      state.selected = [];
    });
    showToast("Completed " + n + (n === 1 ? " task" : " tasks"));
  }
  function openConfirmDelete() {
    var n = state.selected.length;
    if (!n) return;
    byId("confirm-body").textContent =
      "This removes " + n + (n === 1 ? " task" : " tasks") +
      " from the board, the calendar panel, and the planned-time totals. Press Undo afterwards to restore.";
    byId("confirm-ok").textContent = "Delete " + n + (n === 1 ? " task" : " tasks");
    openOverlay("confirm-overlay", byId("bulk-delete"));
  }
  function confirmDeleteSelected() {
    var n = state.selected.length;
    if (!n) return;
    commit(function () {
      state.tasks = state.tasks.filter(function (t) { return state.selected.indexOf(t.id) === -1; });
      state.selected = [];
    });
    closeOverlay("confirm-overlay");
    showToast("Deleted " + n + (n === 1 ? " task" : " tasks"));
  }
  function openMoveToDay() {
    if (!state.selected.length) return;
    var sel = byId("move-day-select");
    sel.value = String(TODAY);
    updateMovePreview();
    openOverlay("move-overlay", byId("bulk-move"));
  }
  function selectedPlannedMinutes(excludingDay) {
    return state.tasks.reduce(function (sum, t) {
      return (state.selected.indexOf(t.id) !== -1 && t.day !== excludingDay && taskMatchesFilters(t))
        ? sum + parseTime(t.planned)
        : sum;
    }, 0);
  }
  function totalMinutesForDay(date) {
    return columnTotalMinutes(date);
  }
  function updateMovePreview() {
    var day = parseInt(byId("move-day-select").value, 10);
    var current = totalMinutesForDay(day);
    var adding = selectedPlannedMinutes(day);
    var moving = state.selected.filter(function (id) { var t = findTask(id); return t && t.day !== day; }).length;
    byId("move-preview").textContent =
      "July " + day + " planned total is " + fmtTime(current) + " now and becomes " +
      fmtTime(current + adding) + " after moving " + moving + (moving === 1 ? " task" : " tasks") +
      (adding ? " (+" + fmtTime(adding) + ")" : "") + ".";
  }
  function confirmMoveToDay() {
    var day = parseInt(byId("move-day-select").value, 10);
    var n = state.selected.length;
    if (!n || isNaN(day) || day < DAY_MIN || day > DAY_MAX) return;
    commit(function () {
      state.tasks.forEach(function (t) { if (state.selected.indexOf(t.id) !== -1) t.day = day; });
      state.selected = [];
    });
    closeOverlay("move-overlay");
    showToast("Moved " + n + (n === 1 ? " task" : " tasks") + " to July " + day);
  }
  function openRollover() {
    rolloverCandidates = state.tasks.filter(function (t) { return !t.done && t.day < TODAY; });
    if (!rolloverCandidates.length) {
      showToast("No incomplete tasks before July 18 to roll over");
      return;
    }
    var n = rolloverCandidates.length;
    byId("rollover-summary").textContent =
      n + (n === 1 ? " incomplete task from" : " incomplete tasks from") +
      " July 6-17 will move to the July 18 column:";
    var list = byId("rollover-list");
    list.textContent = "";
    rolloverCandidates.slice(0, 6).forEach(function (t) {
      var li = document.createElement("li");
      li.appendChild(document.createTextNode(t.title + " "));
      var day = document.createElement("span");
      day.className = "day";
      day.textContent = "(July " + t.day + ")";
      li.appendChild(day);
      list.appendChild(li);
    });
    if (n > 6) {
      var more = document.createElement("li");
      more.className = "rollover-more";
      more.textContent = "…and " + (n - 6) + " more";
      list.appendChild(more);
    }
    byId("rollover-confirm").textContent = "Move " + n + (n === 1 ? " task" : " tasks") + " to July 18";
    openOverlay("rollover-overlay", byId("rollover-btn"));
  }
  function confirmRollover() {
    var n = rolloverCandidates.length;
    if (!n) { closeOverlay("rollover-overlay"); return; }
    commit(function () {
      rolloverCandidates.forEach(function (t) {
        var live = findTask(t.id);
        if (live && !live.done && live.day < TODAY) live.day = TODAY;
      });
    });
    rolloverCandidates = [];
    closeOverlay("rollover-overlay");
    showToast("Rolled over " + n + (n === 1 ? " task" : " tasks") + " to July 18");
  }

  // ---------- overlay / popover plumbing ----------
  var OVERLAYS = ["modal-overlay", "export-overlay", "rollover-overlay", "confirm-overlay", "move-overlay"];
  function topmostOverlay() {
    for (var i = OVERLAYS.length - 1; i >= 0; i--) {
      var ov = byId(OVERLAYS[i]);
      if (ov && !ov.hidden) return ov;
    }
    return null;
  }
  function openOverlay(id, opener) {
    var ov = byId(id);
    if (!ov) return;
    overlayOpener[id] = opener || document.activeElement;
    ov.hidden = false;
    var first = ov.querySelector("input:not([type=hidden]), select, textarea, button");
    if (id === "export-overlay") first = byId("tab-ics");
    if (first) first.focus();
  }
  function closeOverlay(id) {
    var ov = byId(id);
    if (!ov || ov.hidden) return;
    ov.hidden = true;
    var opener = overlayOpener[id];
    if (id === "modal-overlay") {
      var closedTaskId = editingId;
      editingId = null;
      if (opener && opener.isConnected) { opener.focus(); return; }
      // the board re-rendered while the dialog was open — focus the task's new edit control
      if (closedTaskId) {
        var replacement = document.querySelector('.task[data-id="' + closedTaskId + '"] [data-act="edit"]');
        if (replacement) replacement.focus();
      }
      return;
    }
    if (opener && opener.isConnected) opener.focus();
  }
  function closeTopmost() {
    var ov = topmostOverlay();
    if (ov) { closeOverlay(ov.id); return true; }
    if (!byId("conflicts-pop").hidden) { byId("conflicts-pop").hidden = true; return true; }
    if (state.filter.open) { state.filter.open = false; updateFilterUI(); return true; }
    return false;
  }

  // ---------- stale-export cue ----------
  function setStale(v) {
    stale = v;
    var btn = byId("export-btn");
    if (btn) {
      btn.classList.toggle("stale", !!v);
      btn.title = v ? "Export — artifacts changed since last export" : "Export planner artifacts";
    }
  }

  // ---------- toast ----------
  function showToast(msg) {
    var t = byId("toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    void t.offsetWidth; // restart the enter transition
    t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.hidden = true; }, reducedMotion() ? 0 : 240);
    }, 1700);
  }

  // ---------- rendering ----------
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function dayOptions(selectedDay) {
    var frag = document.createDocumentFragment();
    for (var d = DAY_MIN; d <= DAY_MAX; d++) {
      var opt = el("option", null, WD_ABBR[weekdayIndex(d)] + ", July " + d);
      opt.value = String(d);
      if (d === selectedDay) opt.selected = true;
      frag.appendChild(opt);
    }
    return frag;
  }

  function renderTaskCard(t) {
    var card = el("article", "task" + (t.done ? " done" : ""));
    if (t.id === newlyAddedId) { card.classList.add("entering"); newlyAddedId = null; }
    card.dataset.id = t.id;

    var chk = el("button", "chk");
    chk.type = "button";
    chk.dataset.act = "toggle";
    chk.setAttribute("aria-label", (t.done ? "Mark task incomplete: " : "Complete task: ") + t.title);
    chk.setAttribute("aria-pressed", String(t.done));
    chk.appendChild(el("span", "box"));
    card.appendChild(chk);

    var body = el("div", "task-body");
    var titleRow = el("div", "task-title");
    var titleBtn = el("button", "task-open", t.title);
    titleBtn.type = "button";
    titleBtn.dataset.act = "edit";
    titleBtn.setAttribute("aria-label", "Open task: " + t.title);
    titleBtn.title = t.title;
    titleRow.appendChild(titleBtn);

    var selCb = el("input", "sel-cb");
    selCb.type = "checkbox";
    selCb.dataset.act = "select-task";
    selCb.checked = state.selected.indexOf(t.id) !== -1;
    selCb.setAttribute("aria-label", "Select " + t.title + " for bulk actions");
    titleRow.appendChild(selCb);

    if (t.notes && t.notes.length) {
      var notes = el("span", "notes-ind", "✎");
      notes.setAttribute("role", "img");
      notes.setAttribute("aria-label", "Task has notes");
      notes.title = "Task has notes";
      titleRow.appendChild(notes);
    }
    var del = el("button", "task-del", "×");
    del.type = "button";
    del.dataset.act = "delete";
    del.setAttribute("aria-label", "Delete task: " + t.title);
    titleRow.appendChild(del);
    body.appendChild(titleRow);

    var chips = el("div", "chips");
    if (t.start) chips.appendChild(el("span", "start-chip", t.start));
    if (t.channel) chips.appendChild(el("span", "chan", "#" + t.channel));
    if (t.planned) {
      var time = el("span", "time", t.planned);
      time.setAttribute("aria-label", "Planned: " + t.planned);
      chips.appendChild(time);
    }
    if (t.subtasks && t.subtasks.length) {
      var doneCount = t.subtasks.filter(function (s) { return s.done; }).length;
      var cue = el("span", "subtask-cue " + (doneCount === t.subtasks.length ? "all" : doneCount > 0 ? "partial" : ""),
        doneCount + "/" + t.subtasks.length);
      cue.setAttribute("aria-label", "Subtasks: " + doneCount + " of " + t.subtasks.length + " done");
      cue.title = doneCount + " of " + t.subtasks.length + " subtasks done";
      chips.appendChild(cue);
    }
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
        sbtn.setAttribute("aria-label", (s.done ? "Mark subtask incomplete: " : "Complete subtask: ") + s.title);
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
    col.setAttribute("aria-label", weekdayName(date) + ", July " + date);

    var head = el("header", "col-head");
    var dateBtn = el("button", "col-date");
    dateBtn.type = "button";
    dateBtn.dataset.act = "select-day";
    dateBtn.setAttribute("aria-label", "Show " + weekdayName(date) + ", July " + date + " in the calendar panel");
    dateBtn.appendChild(el("span", "wd", weekdayName(date)));
    dateBtn.appendChild(el("span", "dn", "July " + date));
    head.appendChild(dateBtn);
    head.appendChild(el("span", "col-action", actionLabel(date)));
    col.appendChild(head);

    var list = el("div", "col-tasks");
    var dayTasks = tasksForDay(date);
    if (!dayTasks.length) {
      var hidden = filtersActive() && state.tasks.some(function (t) { return t.day === date && !taskMatchesFilters(t); });
      var empty = el("div", "empty");
      if (hidden) {
        var desc = "No tasks match ";
        if (state.filter.channel !== "all") desc += "#" + state.filter.channel;
        if (state.filter.search) desc += (state.filter.channel !== "all" ? " and " : "") + "“" + state.filter.search + "”";
        empty.appendChild(el("span", null, desc + "."));
        var clear = el("button", "btn ghost sm", "Clear filters to see every task");
        clear.type = "button";
        clear.dataset.act = "clear-filter";
        empty.appendChild(clear);
      } else {
        empty.appendChild(el("span", null, "No tasks yet"));
      }
      list.appendChild(empty);
    } else {
      dayTasks.forEach(function (t) { list.appendChild(renderTaskCard(t)); });
    }
    col.appendChild(list);

    // inline add-task affordance + form (drafts survive re-renders)
    var draft = addDrafts[date] || (addDrafts[date] = { open: false, title: "", day: date, channel: "work", planned: "", start: "", notes: "" });
    var addWrap = el("div", "add-wrap");
    var addBtn = el("button", "add-task", "+ Add task");
    addBtn.type = "button";
    addBtn.dataset.act = "add-open";
    addBtn.setAttribute("aria-label", "Add task to July " + date);
    if (draft.open) addBtn.hidden = true;
    addWrap.appendChild(addBtn);

    var form = el("form", "add-form");
    form.dataset.day = String(date);
    form.noValidate = true;
    if (!draft.open) form.hidden = true;

    var ti = el("input", "add-title");
    ti.type = "text"; ti.placeholder = "Task title"; ti.name = "title"; ti.autocomplete = "off";
    ti.maxLength = 140; ti.value = draft.title;
    ti.setAttribute("aria-label", "Task title for July " + date);
    ti.setAttribute("aria-describedby", "add-title-err-" + date);
    form.appendChild(ti);
    var errTitle = el("div", "fld-err", "Title is required");
    errTitle.id = "add-title-err-" + date; errTitle.hidden = true;
    form.appendChild(errTitle);

    var row1 = el("div", "add-row");
    var daySel = el("select", "add-day");
    daySel.name = "day";
    daySel.setAttribute("aria-label", "Day for new task");
    daySel.appendChild(dayOptions(draft.day || date));
    row1.appendChild(daySel);
    var chanSel = el("select", "add-channel");
    chanSel.name = "channel";
    chanSel.setAttribute("aria-label", "Channel for new task");
    CHANNELS.forEach(function (c) {
      var o = el("option", null, "#" + c); o.value = c;
      if (c === draft.channel) o.selected = true;
      chanSel.appendChild(o);
    });
    row1.appendChild(chanSel);
    form.appendChild(row1);

    var row2 = el("div", "add-row");
    var pi = el("input", "add-planned");
    pi.type = "text"; pi.placeholder = "Planned 1:00"; pi.name = "plannedTime"; pi.autocomplete = "off";
    pi.value = draft.planned;
    pi.setAttribute("aria-label", "Planned time, H:MM");
    pi.setAttribute("aria-describedby", "add-planned-err-" + date);
    row2.appendChild(pi);
    var si = el("input", "add-start");
    si.type = "text"; si.placeholder = "Start 9:00 am"; si.name = "startTime"; si.autocomplete = "off";
    si.value = draft.start;
    si.setAttribute("aria-label", "Scheduled start, like 9:00 am");
    si.setAttribute("aria-describedby", "add-start-err-" + date);
    row2.appendChild(si);
    form.appendChild(row2);
    var errPlanned = el("div", "fld-err", "Planned time must be H:MM with minutes 00-59 and at most 12:00");
    errPlanned.id = "add-planned-err-" + date; errPlanned.hidden = true;
    form.appendChild(errPlanned);
    var errStart = el("div", "fld-err", "Start time must look like 9:00 am or 2:30 pm");
    errStart.id = "add-start-err-" + date; errStart.hidden = true;
    form.appendChild(errStart);

    var ni = el("textarea", "add-notes");
    ni.name = "notes"; ni.rows = 2; ni.placeholder = "Notes (optional)";
    ni.value = draft.notes;
    ni.setAttribute("aria-label", "Notes for new task");
    ni.setAttribute("aria-describedby", "add-notes-err-" + date);
    form.appendChild(ni);
    var errNotes = el("div", "fld-err", "Notes must be 500 characters or fewer");
    errNotes.id = "add-notes-err-" + date; errNotes.hidden = true;
    form.appendChild(errNotes);

    var actions = el("div", "add-actions");
    var submit = el("button", "btn primary sm", "Add task"); submit.type = "submit";
    var cancel = el("button", "btn sm", "Cancel"); cancel.type = "button"; cancel.dataset.act = "add-cancel";
    actions.appendChild(submit); actions.appendChild(cancel);
    form.appendChild(actions);
    addWrap.appendChild(form);
    col.appendChild(addWrap);

    var foot = el("footer", "col-foot");
    foot.appendChild(el("span", null, "Planned total"));
    var total = el("span", "total", fmtTime(columnTotalMinutes(date)));
    total.setAttribute("aria-label", "Planned total for July " + date + ": " + fmtTime(columnTotalMinutes(date)));
    foot.appendChild(total);
    col.appendChild(foot);
    return col;
  }

  function renderBoard() {
    var wrap = byId("columns");
    if (!wrap) return;
    var scrollLeft = wrap.scrollLeft;
    var taskScrolls = {};
    wrap.querySelectorAll(".col-tasks").forEach(function (tc) {
      var col = tc.closest(".col");
      if (col) taskScrolls[col.dataset.day] = tc.scrollTop;
    });
    wrap.textContent = "";
    for (var d = DAY_MIN; d <= DAY_MAX; d++) wrap.appendChild(renderColumn(d));
    wrap.scrollLeft = scrollLeft;
    wrap.querySelectorAll(".col-tasks").forEach(function (tc) {
      var col = tc.closest(".col");
      if (col && taskScrolls[col.dataset.day] != null) tc.scrollTop = taskScrolls[col.dataset.day];
    });
  }

  function renderCalendar() {
    var cal = byId("cal");
    if (!cal) return;
    var hoursEl = cal.querySelector(".cal-hours");
    var scrollTop = hoursEl ? hoursEl.scrollTop : 0;
    cal.textContent = "";

    var head = el("div", "cal-head");
    head.appendChild(el("span", "cal-title", "Calendars"));
    head.appendChild(el("span", "cal-zoom", "1x"));
    cal.appendChild(head);

    var day = state.selectedDay;
    var dayLine = el("div", "cal-day");
    dayLine.appendChild(document.createTextNode(weekdayAbbr(day) + " "));
    dayLine.appendChild(el("strong", null, String(day)));
    cal.appendChild(dayLine);

    if (day === TODAY) cal.appendChild(el("div", "cal-allday", "Automatic Bill Payment - Sallie Mae"));

    var hours = el("div", "cal-hours");
    var scheduled = state.tasks.filter(function (t) { return t.day === day && startHourIndex(t.start) != null; });
    HOURS.forEach(function (label, idx) {
      var row = el("div", "hr");
      row.appendChild(el("span", "hr-l", label));
      var line = el("span", "hr-line");
      line.dataset.hour = String(idx);
      scheduled.forEach(function (t) {
        if (startHourIndex(t.start) === idx) {
          var ev = el("span", "cal-event" + (t.done ? " done" : ""), t.title);
          ev.dataset.id = t.id;
          ev.setAttribute("aria-label", t.title + " at " + t.start + (t.done ? " (completed)" : "") + " — drag to reschedule");
          ev.title = t.title + " · " + t.start + " · drag to reschedule";
          line.appendChild(ev);
        }
      });
      row.appendChild(line);
      hours.appendChild(row);
    });
    cal.appendChild(hours);
    hours.scrollTop = scrollTop;

    var foot = el("div", "cal-foot");
    var gd = el("button", "btn ghost sm", "Go to date");
    gd.type = "button"; gd.dataset.chrome = "Go to date";
    foot.appendChild(gd);
    foot.appendChild(el("div", "cal-hint", "Drag a block to a new hour to reschedule it"));
    cal.appendChild(foot);
  }

  function renderConflicts() {
    var pairs = computeConflicts();
    var btn = byId("conflicts-btn");
    var pop = byId("conflicts-pop");
    btn.textContent = "Conflicts (" + pairs.length + ")";
    btn.setAttribute("aria-label", "Schedule conflicts: " + pairs.length);
    btn.setAttribute("aria-expanded", String(!pop.hidden));
    if (!pairs.length) {
      btn.hidden = true;
      pop.hidden = true;
      return;
    }
    btn.hidden = false;
    if (!pop.hidden) {
      var list = byId("conflict-list");
      list.textContent = "";
      pairs.forEach(function (p) {
        var item = el("div", "conflict-item");
        item.appendChild(el("div", "pair", p.a.title + " ↔ " + p.b.title));
        item.appendChild(el("div", "when", "Both at " + p.a.start + " on July " + p.a.day));
        var row = el("div", "row");
        [p.a, p.b].forEach(function (t) {
          var b = el("button", "btn sm", "Edit " + t.title);
          b.type = "button";
          b.dataset.act = "edit-conflict";
          b.dataset.id = t.id;
          row.appendChild(b);
        });
        item.appendChild(row);
        list.appendChild(item);
      });
    }
  }

  function renderTray() {
    var tray = byId("bulk-tray");
    if (!tray) return;
    if (state.selected.length) {
      tray.hidden = false;
      byId("bulk-count").textContent = state.selected.length + " selected";
    } else {
      tray.hidden = true;
    }
  }

  function updateUndoRedoButtons() {
    var u = byId("undo-btn"), r = byId("redo-btn");
    if (u) u.disabled = past.length === 0;
    if (r) r.disabled = future.length === 0;
  }

  function render() {
    renderBoard();
    renderCalendar();
    renderConflicts();
    renderTray();
    updateUndoRedoButtons();
    updateFilterUI();
    var ov = byId("export-overlay");
    if (ov && !ov.hidden) refreshExportPreviews(true);
  }

  // ---------- filter UI ----------
  function updateFilterUI() {
    var pop = byId("filter-pop");
    var toggle = byId("toggle-filter");
    if (pop) pop.hidden = !state.filter.open;
    if (toggle) toggle.setAttribute("aria-expanded", String(state.filter.open));
    var chips = document.querySelectorAll("[data-act='filter-chan']");
    chips.forEach(function (c) {
      var active = c.dataset.chan === state.filter.channel;
      c.classList.toggle("active", active);
      c.setAttribute("aria-pressed", String(active));
    });
    var clear = byId("clear-filter");
    if (clear) clear.hidden = !filtersActive();
  }
  function setFilterChannel(chan) {
    state.filter.channel = CHANNELS.indexOf(chan) !== -1 ? chan : "all";
    render();
  }
  function clearFilters() {
    state.filter.channel = "all";
    state.filter.search = "";
    var inp = byId("search-input");
    if (inp) inp.value = "";
    render();
  }

  // ---------- export canvas ----------
  function refreshExportPreviews(pulse) {
    var ics = byId("out-ics"), json = byId("out-json");
    if (ics) ics.value = generateICS();
    if (json) json.value = generateJSON();
    var status = byId("export-status");
    if (status) {
      var n = state.tasks.length;
      status.textContent = "Live · " + n + (n === 1 ? " task" : " tasks") + " · compiled just now";
      if (pulse && !reducedMotion()) {
        status.classList.remove("pulse");
        void status.offsetWidth;
        status.classList.add("pulse");
      }
    }
  }
  function openExport() {
    var err = byId("import-err"); if (err) err.hidden = true;
    var inJson = byId("in-json"); if (inJson) inJson.value = "";
    openOverlay("export-overlay", byId("export-btn"));
    setStale(false);
    refreshExportPreviews(false);
  }
  function closeExport() { closeOverlay("export-overlay"); }
  function switchExportTab(tab) {
    var ics = tab === "ics";
    byId("tab-ics").classList.toggle("active", ics);
    byId("tab-json").classList.toggle("active", !ics);
    byId("tab-ics").setAttribute("aria-selected", String(ics));
    byId("tab-json").setAttribute("aria-selected", String(!ics));
    byId("pane-ics").hidden = !ics;
    byId("pane-json").hidden = ics;
  }
  function copyText(text, label) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var copied = false;
      try { copied = document.execCommand("copy"); } catch (e) { copied = false; }
      finally { document.body.removeChild(ta); }
      return copied;
    }
    function done(copied) { showToast(copied ? "Copied " + label + " to clipboard" : "Copy blocked — select the preview text and copy it manually"); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallback()); });
    } else { done(fallback()); }
  }
  function downloadText(filename, mime, text) {
    var a = document.createElement("a");
    a.href = "data:" + mime + ";charset=utf-8," + encodeURIComponent(text);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  function runImport() {
    var val = byId("in-json").value.trim();
    var errEl = byId("import-err");
    if (!val) {
      errEl.textContent = "Paste planner JSON above or choose a planner JSON file first.";
      errEl.hidden = false;
      return;
    }
    var res = importJSON(val);
    if (!res.ok) {
      errEl.textContent = "Import failed: " + res.error + ". The current board is unchanged.";
      errEl.hidden = false;
      return;
    }
    errEl.hidden = true;
    byId("in-json").value = "";
    closeExport();
    showToast("Imported " + res.count + (res.count === 1 ? " task" : " tasks") + " from planner JSON");
  }

  // ---------- edit modal ----------
  var editingId = null;
  function setFieldError(inputId, errId, msg, show) {
    var input = byId(inputId), err = byId(errId);
    if (!input || !err) return;
    if (show) {
      if (msg) err.textContent = msg;
      err.hidden = false;
      input.setAttribute("aria-invalid", "true");
    } else {
      err.hidden = true;
      input.removeAttribute("aria-invalid");
    }
  }
  function renderSubtaskEditor(subtasks) {
    var wrap = byId("edit-subtasks");
    wrap.textContent = "";
    (subtasks || []).forEach(function (s) { appendSubtaskRow(s.title, s.done); });
    updateSubtaskChrome();
  }
  function appendSubtaskRow(title, done) {
    var wrap = byId("edit-subtasks");
    var row = el("div", "subtask-row");
    var cb = el("input", "sub-cb");
    cb.type = "checkbox"; cb.checked = !!done;
    cb.setAttribute("aria-label", "Subtask done" + (title ? ": " + title : ""));
    row.appendChild(cb);
    var input = el("input", "sub-title");
    input.type = "text"; input.placeholder = "Subtask title"; input.maxLength = 90;
    input.value = title || "";
    input.setAttribute("aria-label", "Subtask title");
    row.appendChild(input);
    var rm = el("button", "rm-sub", "×");
    rm.type = "button";
    rm.setAttribute("aria-label", "Remove subtask" + (title ? ": " + title : ""));
    rm.dataset.act = "rm-sub";
    row.appendChild(rm);
    wrap.appendChild(row);
    return row;
  }
  function subtaskRows() { return Array.prototype.slice.call(byId("edit-subtasks").querySelectorAll(".subtask-row")); }
  function updateSubtaskChrome() {
    var n = subtaskRows().length;
    byId("edit-subtask-count").textContent = n + "/12";
    byId("edit-add-subtask").disabled = n >= 12;
  }
  function readSubtaskEditor() {
    return subtaskRows().map(function (row) {
      return {
        title: row.querySelector(".sub-title").value,
        done: row.querySelector(".sub-cb").checked
      };
    });
  }
  function openEdit(id, opener) {
    var t = findTask(id);
    if (!t) return;
    editingId = id;
    byId("edit-title").value = t.title;
    var daySel = byId("edit-day");
    if (!daySel.options.length) daySel.appendChild(dayOptions(t.day));
    daySel.value = String(t.day);
    byId("edit-channel").value = t.channel || "work";
    byId("edit-planned").value = t.planned || "";
    byId("edit-start").value = t.start || "";
    byId("edit-notes").value = t.notes || "";
    byId("edit-notes-count").textContent = (t.notes || "").length + "/500";
    renderSubtaskEditor(t.subtasks);
    ["edit-title", "edit-day", "edit-channel", "edit-planned", "edit-start", "edit-notes"].forEach(function (iid) {
      byId(iid).removeAttribute("aria-invalid");
    });
    ["edit-title-err", "edit-day-err", "edit-channel-err", "edit-planned-err", "edit-start-err", "edit-notes-err", "edit-subtasks-err"]
      .forEach(function (eid) { byId(eid).hidden = true; });
    openOverlay("modal-overlay", opener);
    byId("edit-title").focus();
  }
  function closeEdit() { closeOverlay("modal-overlay"); }
  function saveEdit() {
    if (!editingId) return;
    var fields = {
      title: byId("edit-title").value,
      day: byId("edit-day").value,
      channel: byId("edit-channel").value,
      plannedTime: byId("edit-planned").value.trim(),
      startTime: byId("edit-start").value.trim(),
      notes: byId("edit-notes").value,
      subtasks: readSubtaskEditor()
    };
    // Empty editor rows are placeholders, not subtasks. Validate the retained
    // rows so title-length errors cannot be erased by the count cleanup.
    var kept = fields.subtasks.filter(function (s) { return s.title.trim() !== ""; });
    fields.subtasks = kept;
    var errs = validateTaskFields(fields, false);
    // blanks mean "clear the field" for optional inputs, never an error
    if (fields.plannedTime === "") delete errs.plannedTime;
    if (fields.startTime === "") delete errs.startTime;
    if (fields.notes.trim() === "") delete errs.notes;
    setFieldError("edit-title", "edit-title-err", errs.title, !!errs.title);
    setFieldError("edit-day", "edit-day-err", errs.day, !!errs.day);
    setFieldError("edit-channel", "edit-channel-err", errs.channel, !!errs.channel);
    setFieldError("edit-planned", "edit-planned-err", errs.plannedTime, !!errs.plannedTime);
    setFieldError("edit-start", "edit-start-err", errs.startTime, !!errs.startTime);
    setFieldError("edit-notes", "edit-notes-err", errs.notes, !!errs.notes);
    byId("edit-subtasks-err").hidden = !errs.subtasks;
    if (errs.subtasks) byId("edit-subtasks-err").textContent = errs.subtasks;

    var order = ["title", "day", "channel", "plannedTime", "startTime", "notes", "subtasks"];
    var firstInvalid = null;
    for (var i = 0; i < order.length; i++) if (errs[order[i]]) { firstInvalid = order[i]; break; }
    if (firstInvalid) {
      var focusMap = { title: "edit-title", day: "edit-day", channel: "edit-channel",
        plannedTime: "edit-planned", startTime: "edit-start", notes: "edit-notes" };
      if (focusMap[firstInvalid]) byId(focusMap[firstInvalid]).focus();
      return;
    }
    var res = updateTask(editingId, fields);
    if (!res.ok) { showToast(res.error); return; }
    closeEdit();
    showToast("Task updated");
  }

  // ---------- inline add form ----------
  function openAddForm(date) {
    var draft = addDrafts[date] || (addDrafts[date] = { open: false, title: "", day: date, channel: "work", planned: "", start: "", notes: "" });
    draft.open = true;
    draft.day = draft.day || date;
    render();
    var col = byId("columns").querySelector(".col[data-day='" + date + "']");
    if (col) {
      var titleInput = col.querySelector(".add-title");
      if (titleInput) titleInput.focus();
    }
  }
  function closeAddForm(date) {
    var draft = addDrafts[date];
    if (draft) {
      draft.open = false; draft.title = ""; draft.planned = ""; draft.start = ""; draft.notes = "";
    }
    render();
    var col = byId("columns").querySelector(".col[data-day='" + date + "']");
    if (col) {
      var btn = col.querySelector(".add-task");
      if (btn) btn.focus();
    }
  }
  function setAddFormError(form, field, date, msg) {
    var err = byId("add-" + field + "-err-" + date);
    var input = form.querySelector(".add-" + field);
    if (err) {
      if (msg) err.textContent = msg;
      err.hidden = !msg;
    }
    if (input) {
      if (msg) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
  }
  function handleAddSubmit(form) {
    if (form.dataset.lock) return; // double-activation guard: exactly one task per burst
    var date = parseInt(form.dataset.day, 10);
    var fields = {
      title: form.querySelector(".add-title").value,
      day: form.querySelector(".add-day").value,
      channel: form.querySelector(".add-channel").value,
      plannedTime: form.querySelector(".add-planned").value.trim(),
      startTime: form.querySelector(".add-start").value.trim(),
      notes: form.querySelector(".add-notes").value
    };
    var errs = validateTaskFields(fields, false);
    if (fields.plannedTime === "") delete errs.plannedTime;
    if (fields.startTime === "") delete errs.startTime;
    if (fields.notes.trim() === "") delete errs.notes;

    setAddFormError(form, "title", date, errs.title);
    setAddFormError(form, "planned", date, errs.plannedTime);
    setAddFormError(form, "start", date, errs.startTime);
    setAddFormError(form, "notes", date, errs.notes);
    if (Object.keys(errs).length) {
      if (errs.title) form.querySelector(".add-title").focus();
      else if (errs.plannedTime) form.querySelector(".add-planned").focus();
      else if (errs.startTime) form.querySelector(".add-start").focus();
      else if (errs.notes) form.querySelector(".add-notes").focus();
      return;
    }
    form.dataset.lock = "1";
    setTimeout(function () { if (form.isConnected) form.dataset.lock = ""; }, 400);
    var res = createTask(fields);
    if (!res.ok) { showToast(res.error); return; }
    var draft = addDrafts[date];
    if (draft) { draft.open = false; draft.title = ""; draft.planned = ""; draft.start = ""; draft.notes = ""; }
    render();
    showToast("Added “" + res.task.title + "” to July " + res.task.day.slice(-2).replace(/^0/, ""));
    var createdDay = parsePlannerDay(res.task.day);
    var col = byId("columns").querySelector(".col[data-day='" + createdDay + "']");
    if (col) {
      var addBtn = col.querySelector(".add-task");
      if (addBtn) addBtn.focus();
    }
  }

  // ---------- calendar drag (pointer-based: follows the pointer, settles on release) ----------
  function clearDropTarget() {
    if (dropLine) dropLine.classList.remove("drop-target");
    dropLine = null;
  }
  function initCalendarDrag() {
    var cal = byId("cal");
    if (!cal) return;
    cal.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      var ev = e.target.closest(".cal-event");
      if (!ev || topmostOverlay()) return;
      dragState = { id: ev.dataset.id, el: ev, y0: e.clientY, moved: false, pid: e.pointerId };
      try { ev.setPointerCapture(e.pointerId); } catch (err) { /* capture unsupported */ }
      e.preventDefault();
    });
    cal.addEventListener("pointermove", function (e) {
      if (!dragState) return;
      var dy = e.clientY - dragState.y0;
      if (!dragState.moved && Math.abs(dy) < 5) return;
      if (!dragState.moved) {
        dragState.moved = true;
        dragState.el.classList.add("dragging");
        var t = findTask(dragState.id);
        dragState.fromHour = t ? startHourIndex(t.start) : 0;
      }
      dragState.el.style.top = (2 + dy) + "px";
      var target = Math.max(0, Math.min(23, dragState.fromHour + Math.round(dy / ROW_H)));
      clearDropTarget();
      var line = cal.querySelector(".hr-line[data-hour='" + target + "']");
      if (line) { line.classList.add("drop-target"); dropLine = line; }
      dragState.targetHour = target;
    });
    function finishDrag(e, cancelled) {
      if (!dragState) return;
      var d = dragState;
      dragState = null;
      clearDropTarget();
      try { d.el.releasePointerCapture(d.pid); } catch (err) { /* ignore */ }
      if (cancelled || !d.moved) {
        d.el.classList.remove("dragging");
        d.el.style.top = "";
        return;
      }
      var t = findTask(d.id);
      if (!t) { render(); return; }
      var target = d.targetHour != null ? d.targetHour : d.fromHour;
      if (target === d.fromHour) {
        d.el.classList.remove("dragging");
        d.el.classList.add("settling");
        d.el.style.top = "";
        return;
      }
      // settle into the target slot with a short ease, then commit the reschedule
      d.el.classList.add("settling");
      d.el.style.top = (2 + (target - d.fromHour) * ROW_H) + "px";
      var commitNow = function () {
        var start = clockString(target, 0);
        var hadTask = !!findTask(d.id);
        if (hadTask) {
          commit(function () {
            var live = findTask(d.id);
            if (live) live.start = start;
          });
          showToast("Rescheduled to " + start);
        }
      };
      if (reducedMotion()) commitNow();
      else {
        if (dragCommitTimer !== null) clearTimeout(dragCommitTimer);
        dragCommitTimer = setTimeout(function () { dragCommitTimer = null; commitNow(); }, 170);
      }
    }
    cal.addEventListener("pointerup", function (e) { finishDrag(e, false); });
    cal.addEventListener("pointercancel", function (e) { finishDrag(e, true); });
  }

  // ---------- keyboard ----------
  function initKeyboard() {
    document.addEventListener("keydown", function (e) {
      var target = e.target;
      var tag = target && target.tagName ? target.tagName.toLowerCase() : "";
      var inField = tag === "input" || tag === "textarea" || tag === "select" || (target && target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && !e.altKey && !inField) {
        if (e.code === "KeyZ") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
        if (e.code === "KeyY") { e.preventDefault(); redo(); return; }
      }
      if (e.key === "Escape") {
        if (closeTopmost()) { e.preventDefault(); return; }
      }
      if (e.key === "Tab") {
        var ov = topmostOverlay();
        if (!ov) return;
        var modal = ov.querySelector(".modal") || ov;
        var focusables = Array.prototype.slice.call(
          modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ).filter(function (elm) { return !elm.disabled && elm.offsetParent !== null; });
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!modal.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    });
  }

  // ---------- wiring ----------
  function init() {
    seed();
    byId("edit-day").appendChild(dayOptions(TODAY));
    var moveSel = byId("move-day-select");
    moveSel.appendChild(dayOptions(TODAY));
    moveSel.addEventListener("change", updateMovePreview);

    render();
    initCalendarDrag();
    initKeyboard();

    // delegated click handling for every data-act control
    document.body.addEventListener("click", function (e) {
      var actEl = e.target.closest("[data-act]");
      if (!actEl) return;
      var act = actEl.dataset.act;
      var card = e.target.closest(".task");
      var col = e.target.closest(".col");

      if (act === "toggle" && card) { toggleTask(card.dataset.id); return; }
      if (act === "subtoggle" && card) { toggleSubtask(card.dataset.id, parseInt(actEl.dataset.sub, 10)); return; }
      if (act === "edit" && card) { openEdit(card.dataset.id, actEl); return; }
      if (act === "edit-conflict") {
        var tid = actEl.dataset.id;
        byId("conflicts-pop").hidden = true;
        openEdit(tid, byId("conflicts-btn"));
        return;
      }
      if (act === "delete" && card) {
        var deletingId = card.dataset.id;
        if (card.classList.contains("leaving")) return;
        if (reducedMotion()) { deleteTask(deletingId); return; }
        card.style.height = card.offsetHeight + "px";
        void card.offsetWidth;
        card.classList.add("leaving");
        setTimeout(function () { deleteTask(deletingId); }, 210);
        return;
      }
      if (act === "select-day" && col) { selectDay(parseInt(col.dataset.day, 10)); return; }
      if (act === "add-open" && col) { openAddForm(parseInt(col.dataset.day, 10)); return; }
      if (act === "add-cancel" && col) { closeAddForm(parseInt(col.dataset.day, 10)); return; }

      switch (act) {
        case "undo": undo(); break;
        case "redo": redo(); break;
        case "go-today": {
          selectDay(TODAY);
          var todayCol = byId("columns").querySelector(".col[data-day='" + TODAY + "']");
          if (todayCol) {
            todayCol.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", inline: "center", block: "nearest" });
            todayCol.classList.remove("flash");
            void todayCol.offsetWidth;
            todayCol.classList.add("flash");
          }
          break;
        }
        case "rollover-open": openRollover(); break;
        case "rollover-cancel": closeOverlay("rollover-overlay"); break;
        case "rollover-confirm": confirmRollover(); break;
        case "conflicts-toggle": {
          var pop = byId("conflicts-pop");
          pop.hidden = !pop.hidden;
          byId("conflicts-btn").setAttribute("aria-expanded", String(!pop.hidden));
          if (!pop.hidden) renderConflicts();
          break;
        }
        case "open-export": openExport(); break;
        case "close-export": closeExport(); break;
        case "tab-ics": switchExportTab("ics"); break;
        case "tab-json": switchExportTab("json"); break;
        case "copy-ics": copyText(byId("out-ics").value, "ICS"); break;
        case "copy-json": copyText(byId("out-json").value, "planner JSON"); break;
        case "dl-ics": downloadText("cadence-planner.ics", "text/calendar", generateICS()); showToast("Downloading cadence-planner.ics"); break;
        case "dl-json": downloadText("cadence-planner.json", "application/json", generateJSON()); showToast("Downloading cadence-planner.json"); break;
        case "import-json": runImport(); break;
        case "bulk-complete": bulkComplete(); break;
        case "bulk-delete": openConfirmDelete(); break;
        case "confirm-delete": confirmDeleteSelected(); break;
        case "confirm-cancel": closeOverlay("confirm-overlay"); break;
        case "bulk-move": openMoveToDay(); break;
        case "close-move": closeOverlay("move-overlay"); break;
        case "confirm-move": confirmMoveToDay(); break;
        case "toggle-filter": state.filter.open = !state.filter.open; updateFilterUI(); if (state.filter.open) byId("search-input").focus(); break;
        case "filter-chan": setFilterChannel(actEl.dataset.chan); break;
        case "clear-filter": clearFilters(); break;
        default: break;
      }
    });

    // selection checkboxes (change is more reliable than click for checkboxes)
    byId("columns").addEventListener("change", function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains("sel-cb")) return;
      var card = t.closest(".task");
      if (!card) return;
      var id = card.dataset.id;
      if (t.checked) { if (state.selected.indexOf(id) === -1) state.selected.push(id); }
      else state.selected = state.selected.filter(function (x) { return x !== id; });
      render();
    });

    // keep inline add-form drafts in sync with typing
    byId("columns").addEventListener("input", function (e) {
      var t = e.target;
      var form = t.closest ? t.closest(".add-form") : null;
      if (!form) return;
      var day = parseInt(form.dataset.day, 10);
      var draft = addDrafts[day] || (addDrafts[day] = { open: true, title: "", day: day, channel: "work", planned: "", start: "", notes: "" });
      if (t.classList.contains("add-title")) { draft.title = t.value; setAddFormError(form, "title", day, ""); }
      else if (t.classList.contains("add-planned")) {
        draft.planned = t.value;
        var pv = t.value.trim();
        var badPlanned = pv !== "" && (!/^(\d{1,2}):([0-5]\d)$/.test(pv) || parseTime(pv) > 720);
        setAddFormError(form, "planned", day, badPlanned ? "Planned time must be H:MM with minutes 00-59 and at most 12:00" : "");
      }
      else if (t.classList.contains("add-start")) { draft.start = t.value; setAddFormError(form, "start", day, (t.value.trim() !== "" && !startTimeParts(t.value)) ? "Start time must look like 9:00 am or 2:30 pm" : ""); }
      else if (t.classList.contains("add-notes")) { draft.notes = t.value; setAddFormError(form, "notes", day, t.value.length > 500 ? "Notes must be 500 characters or fewer" : ""); }
    });
    byId("columns").addEventListener("change", function (e) {
      var t = e.target;
      var form = t.closest ? t.closest(".add-form") : null;
      if (!form) return;
      var day = parseInt(form.dataset.day, 10);
      var draft = addDrafts[day] || (addDrafts[day] = { open: true, title: "", day: day, channel: "work", planned: "", start: "", notes: "" });
      if (t.classList.contains("add-day")) draft.day = parseInt(t.value, 10);
      else if (t.classList.contains("add-channel")) draft.channel = t.value;
    });

    // inline add-form submit
    byId("columns").addEventListener("submit", function (e) {
      var form = e.target.closest(".add-form");
      if (!form) return;
      e.preventDefault();
      handleAddSubmit(form);
    });

    // edit modal
    byId("edit-form").addEventListener("submit", function (e) { e.preventDefault(); saveEdit(); });
    byId("edit-cancel").addEventListener("click", closeEdit);
    byId("edit-add-subtask").addEventListener("click", function () {
      if (subtaskRows().length >= 12) return;
      var row = appendSubtaskRow("", false);
      updateSubtaskChrome();
      row.querySelector(".sub-title").focus();
    });
    byId("edit-subtasks").addEventListener("click", function (e) {
      var rm = e.target.closest("[data-act='rm-sub']");
      if (!rm) return;
      var row = rm.closest(".subtask-row");
      if (row) row.remove();
      updateSubtaskChrome();
    });
    byId("edit-notes").addEventListener("input", function () {
      byId("edit-notes-count").textContent = byId("edit-notes").value.length + "/500";
    });

    // overlay backdrops close on outside click
    OVERLAYS.forEach(function (id) {
      byId(id).addEventListener("mousedown", function (e) {
        if (e.target === this) closeOverlay(id);
      });
    });
    byId("move-overlay").addEventListener("click", function (e) { if (e.target === this) closeOverlay("move-overlay"); });

    // search box
    byId("search-input").addEventListener("input", function () {
      state.filter.search = this.value;
      render();
    });

    // click outside closes header popovers
    document.addEventListener("pointerdown", function (e) {
      if (state.filter.open && !e.target.closest("#filter-pop") && !e.target.closest("#toggle-filter")) {
        state.filter.open = false;
        updateFilterUI();
      }
      var cPop = byId("conflicts-pop");
      if (!cPop.hidden && !e.target.closest("#conflicts-pop") && !e.target.closest("#conflicts-btn")) {
        cPop.hidden = true;
      }
    });

    // import file picker — same validation and outcome as paste
    byId("import-file").addEventListener("change", function () {
      var input = this;
      var file = input.files && input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        byId("in-json").value = String(reader.result || "");
        runImport();
        input.value = "";
      };
      reader.onerror = function () {
        var errEl = byId("import-err");
        errEl.textContent = "Import failed: could not read the file.";
        errEl.hidden = false;
        input.value = "";
      };
      reader.readAsText(file);
    });

    // chrome-only controls: demo toast, never navigate anywhere
    document.body.addEventListener("click", function (e) {
      var c = e.target.closest("[data-chrome]");
      if (!c) return;
      showToast(c.dataset.chrome + " is a demo control in this board");
    });

    registerWebmcp();
  }

  // ---------- WebMCP surface (contract zto-webmcp-v1) ----------
  function registerWebmcp() {
    function taskFields(args) {
      var raw = args && args.fields;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
      var fields = Object.assign({}, raw);
      if (fields.done !== undefined) {
        if (fields.done !== "true" && fields.done !== "false") throw new Error("done must be true or false");
        fields.done = fields.done === "true";
      }
      if (fields.subtasks !== undefined) {
        try { fields.subtasks = JSON.parse(fields.subtasks); }
        catch (e) { throw new Error("subtasks must be a JSON list"); }
      }
      return fields;
    }

    var tools = {
      // browse-query-v1 (destinations: board, calendar-day-panel, export-canvas; filters: channel, search, day)
      "browse.open": {
        description: "Open a destination: board, calendar-day-panel (optionally with a day 6-26 or ISO date), or export-canvas.",
        handler: function (args) {
          args = args || {};
          var dest = args.destination;
          if (dest === "calendar-day-panel") {
            if (args.day != null) return selectDay(args.day);
            return { ok: true, destination: dest, selectedDay: state.selectedDay };
          }
          if (dest === "board") {
            var wrap = byId("columns");
            if (wrap) wrap.scrollLeft = 0;
            return { ok: true, destination: dest };
          }
          if (dest === "export-canvas") {
            openExport();
            return { ok: true, destination: dest };
          }
          return { ok: false, error: "Unknown destination; use board, calendar-day-panel, or export-canvas" };
        }
      },
      "browse.search": {
        description: "Set a bounded task title search query.",
        handler: function (args) {
          var query = String(args && args.query || "").trim();
          if (!query || query.length > 200) return { ok: false, error: "query must be 1-200 characters" };
          state.filter.search = query;
          var inp = byId("search-input");
          if (inp) inp.value = state.filter.search;
          render();
          return { ok: true, search: state.filter.search };
        }
      },
      "browse.apply_filter": {
        description: "Apply one declared channel, search, or day filter.",
        handler: function (args) {
          args = args || {};
          var filter = args.filter;
          var value = args.value == null ? "" : String(args.value);
          if (["channel", "search", "day"].indexOf(filter) === -1) return { ok: false, error: "filter must be channel, search, or day" };
          if (filter === "channel") {
            var chan = value.replace(/^#/, "").toLowerCase();
            if (chan !== "all" && CHANNELS.indexOf(chan) === -1) return { ok: false, error: "channel must be all, work, personal, health, or focus" };
            state.filter.channel = chan;
          } else if (filter === "search") {
            state.filter.search = value;
            var input = byId("search-input");
            if (input) input.value = value;
          } else {
            var d = parsePlannerDay(value);
            if (isNaN(d) || d < DAY_MIN || d > DAY_MAX) return { ok: false, error: "day must be July 6-26" };
            state.selectedDay = d;
          }
          render();
          return { ok: true, filter: filter, value: value };
        }
      },
      "browse.clear_filter": {
        description: "Clear one declared filter or all filters.",
        handler: function (args) {
          var filter = args && args.filter;
          if (filter == null) clearFilters();
          else if (filter === "channel") { state.filter.channel = "all"; render(); }
          else if (filter === "search") { state.filter.search = ""; var input = byId("search-input"); if (input) input.value = ""; render(); }
          else if (filter === "day") { state.selectedDay = TODAY; render(); }
          else return { ok: false, error: "filter must be channel, search, or day" };
          return { ok: true, filter: filter || "all" };
        }
      },
      // entity-collection-v1 (entity: task)
      "entity.create": {
        description: "Create a task with {fields: {title, day (2026-07-DD or 6-26), channel?, plannedTime? (H:MM), startTime? (e.g. 9:00 am), notes?, subtasks?}}.",
        handler: function (args) { return createTask(taskFields(args)); }
      },
      "entity.select": {
        description: "Select (read) a task by id; returns its contracted fields.",
        handler: function (args) {
          var t = args && args.id ? findTask(args.id) : null;
          return t ? { ok: true, task: publicTask(t) } : { ok: false, error: "No such task" };
        }
      },
      "entity.update": {
        description: "Update a task with {id, fields: {title?, day?, channel?, plannedTime?, startTime?, done?, notes?, subtasks?}}.",
        handler: function (args) {
          if (!args || !args.id) return { ok: false, error: "id required" };
          return updateTask(args.id, taskFields(args));
        }
      },
      "entity.delete": {
        description: "Delete a task by id; requires confirm=true.",
        handler: function (args) {
          args = args || {};
          if (!args.id) return { ok: false, error: "id required" };
          if (args.confirm !== true) return { ok: false, error: "confirm=true required to delete" };
          return deleteTask(args.id);
        }
      },
      "entity.toggle": {
        description: "Toggle a task's completed state by id.",
        handler: function (args) {
          args = args || {};
          if (!args.id) return { ok: false, error: "id required" };
          if (args.field !== undefined && args.field !== "done") return { ok: false, error: "only done is toggleable" };
          return toggleTask(args.id);
        }
      },
      // form-workflow-v1 (task form fields)
      "form.validate": {
        description: "Validate {fields: {...}} against the Task field contract; returns per-field errors.",
        handler: function (args) {
          var errs = validateTaskFields(taskFields(args), false);
          if (Object.keys(errs).length) return { ok: false, errors: errs };
          return { ok: true };
        }
      },
      "form.submit": {
        description: "Submit {fields: {...}} through the same validation and handler as the visible Add task form.",
        handler: function (args) { return createTask(taskFields(args)); }
      },
      "form.cancel": {
        description: "Cancel the task form without saving.",
        handler: function () { return { ok: true }; }
      },
      // artifact-transfer-v1 (formats: ics, planner-json; import mode: planner-json)
      "artifact.export": {
        description: "Trigger the visible download for format ics or planner-json without returning artifact contents.",
        handler: function (args) {
          var fmt = (args || {}).format;
          if (fmt !== "ics" && fmt !== "planner-json") return { ok: false, error: "format must be ics or planner-json" };
          openExport();
          switchExportTab(fmt === "ics" ? "ics" : "json");
          byId(fmt === "ics" ? "dl-ics" : "dl-json").click();
          return { ok: true, format: fmt };
        }
      },
      "artifact.import": {
        description: "Open or submit the visible planner JSON import surface without accepting artifact contents.",
        handler: function (args) {
          if ((args || {}).mode !== "planner-json") return { ok: false, error: "mode must be planner-json" };
          var overlay = byId("export-overlay");
          if (overlay.hidden) {
            openExport();
            switchExportTab("json");
            byId("in-json").focus();
            return { ok: true, mode: "planner-json", completed: false };
          }
          switchExportTab("json");
          byId("import-json").click();
          return { ok: true, mode: "planner-json", completed: true };
        }
      },
      "artifact.copy": {
        description: "Trigger the visible copy control for the active export tab.",
        handler: function () {
          openExport();
          var ics = byId("tab-ics").classList.contains("active");
          byId(ics ? "copy-ics" : "copy-json").click();
          return { ok: true, format: ics ? "ics" : "planner-json" };
        }
      }
    };

    window.webmcp_session_info = function () {
      return {
        contract_version: "zto-webmcp-v1",
        app: "cadence-daily-planner-board",
        modules: ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"],
        entity: "task",
        destinations: ["board", "calendar-day-panel", "export-canvas"],
        filters: ["channel", "search", "day"],
        export_formats: ["ics", "planner-json"],
        import_modes: ["planner-json"],
        tool_count: Object.keys(tools).length
      };
    };
    window.webmcp_list_tools = function () {
      return Object.keys(tools).map(function (name) {
        var moduleByPrefix = {
          browse: "browse-query-v1",
          entity: "entity-collection-v1",
          form: "form-workflow-v1",
          artifact: "artifact-transfer-v1"
        };
        return { name: name, module: moduleByPrefix[name.split(".")[0]], description: tools[name].description };
      });
    };
    window.webmcp_invoke_tool = function (name, args) {
      if (!tools[name]) throw new Error("Unknown WebMCP tool: " + name);
      return tools[name].handler(args || {});
    };
  }

  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  } catch (e) { /* never throw at load */ }
})();
