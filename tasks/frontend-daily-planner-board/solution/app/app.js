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
  // "9:00 am" -> hour index 0..23 for the calendar grid.
  function startHourIndex(start) {
    if (!start) return null;
    var m = String(start).trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
    if (!m) return null;
    var h = parseInt(m[1], 10) % 12;
    if (m[3] === "pm") h += 12;
    return h;
  }

  // ---- state ----
  var seq = 0;
  function uid() { seq += 1; return "t" + seq; }

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

  function tasksForDay(date) { return state.tasks.filter(function (t) { return t.day === date; }); }
  function columnTotalMinutes(date) {
    return tasksForDay(date).reduce(function (sum, t) { return sum + parseTime(t.planned); }, 0);
  }
  function findTask(id) {
    for (var i = 0; i < state.tasks.length; i++) if (state.tasks[i].id === id) return state.tasks[i];
    return null;
  }

  // ---- domain commands (shared by UI and WebMCP) ----
  function createTask(fields) {
    var title = (fields && fields.title != null) ? String(fields.title).trim() : "";
    if (!title) return { ok: false, error: "Title is required" };
    var day = parseInt(fields.day, 10);
    if (isNaN(day) || day < 6 || day > 26) return { ok: false, error: "Day must be July 6-26" };
    var t = {
      id: uid(), title: title, day: day,
      channel: fields.channel ? String(fields.channel).replace(/^#/, "").trim() : "work",
      done: false,
      planned: (fields.planned && parseTime(fields.planned) > 0) ? fmtTime(parseTime(fields.planned)) : null,
      start: fields.start ? String(fields.start).trim() : null,
      notes: false, subtasks: []
    };
    state.tasks.push(t);
    render();
    return { ok: true, task: publicTask(t) };
  }
  function updateTask(id, fields) {
    var t = findTask(id);
    if (!t) return { ok: false, error: "No such task" };
    if (fields.title != null) {
      var title = String(fields.title).trim();
      if (!title) return { ok: false, error: "Title is required" };
      t.title = title;
    }
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
      var d = parseInt(fields.day, 10);
      if (!isNaN(d) && d >= 6 && d <= 26) t.day = d;
    }
    if (fields.done != null) t.done = !!fields.done;
    render();
    return { ok: true, task: publicTask(t) };
  }
  function deleteTask(id) {
    var before = state.tasks.length;
    state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
    render();
    return { ok: state.tasks.length < before };
  }
  function toggleTask(id) {
    var t = findTask(id);
    if (!t) return { ok: false, error: "No such task" };
    t.done = !t.done;
    render();
    return { ok: true, done: t.done };
  }
  function toggleSubtask(id, index) {
    var t = findTask(id);
    if (!t || !t.subtasks || !t.subtasks[index]) return { ok: false, error: "No such subtask" };
    t.subtasks[index].done = !t.subtasks[index].done;
    render();
    return { ok: true, done: t.subtasks[index].done };
  }
  function selectDay(date) {
    var d = parseInt(date, 10);
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
    if (t.planned) {
      var time = el("span", "time", t.planned);
      time.setAttribute("aria-label", "Actual: --:--, Planned: " + t.planned);
      chips.appendChild(time);
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
      list.appendChild(el("div", "empty", "No tasks yet"));
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
    ti.type = "text"; ti.placeholder = "Task title"; ti.name = "title"; ti.autocomplete = "off";
    var pi = el("input", "add-planned");
    pi.type = "text"; pi.placeholder = "Planned H:MM"; pi.name = "planned"; pi.autocomplete = "off";
    var errRow = el("div", "fld-err add-err", "Title is required");
    errRow.hidden = true;
    var actions = el("div", "add-actions");
    var submit = el("button", "btn primary sm", "Add");
    submit.type = "submit";
    var cancel = el("button", "btn sm", "Cancel");
    cancel.type = "button"; cancel.dataset.act = "add-cancel";
    actions.appendChild(submit); actions.appendChild(cancel);
    form.appendChild(ti); form.appendChild(pi); form.appendChild(errRow); form.appendChild(actions);
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
    var scheduled = tasksForDay(day).filter(function (t) { return startHourIndex(t.start) != null; });
    HOURS.forEach(function (label, idx) {
      var row = el("div", "hr");
      row.appendChild(el("span", "hr-l", label));
      var line = el("span", "hr-line");
      scheduled.forEach(function (t) {
        if (startHourIndex(t.start) === idx) {
          var ev = el("span", "cal-event" + (t.done ? " done" : ""), t.title);
          line.appendChild(ev);
        }
      });
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

  function render() { renderBoard(); renderCalendar(); }

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
  function openEdit(id) {
    var t = findTask(id);
    if (!t) return;
    editingId = id;
    document.getElementById("edit-title").value = t.title;
    document.getElementById("edit-channel").value = t.channel || "";
    document.getElementById("edit-planned").value = t.planned || "";
    document.getElementById("edit-start").value = t.start || "";
    document.getElementById("edit-error").hidden = true;
    document.getElementById("modal-overlay").hidden = false;
    document.getElementById("edit-title").focus();
  }
  function closeEdit() {
    editingId = null;
    document.getElementById("modal-overlay").hidden = true;
  }

  // ---- wiring ----
  function init() {
    seed();
    render();

    var columns = document.getElementById("columns");
    columns.addEventListener("click", function (e) {
      var actEl = e.target.closest("[data-act]");
      if (!actEl) return;
      var card = e.target.closest(".task");
      var col = e.target.closest(".col");
      var act = actEl.dataset.act;
      if (act === "toggle" && card) toggleTask(card.dataset.id);
      else if (act === "subtoggle" && card) toggleSubtask(card.dataset.id, parseInt(actEl.dataset.sub, 10));
      else if (act === "edit" && card) openEdit(card.dataset.id);
      else if (act === "delete" && card) deleteTask(card.dataset.id);
      else if (act === "select-day" && col) selectDay(parseInt(col.dataset.day, 10));
      else if (act === "add-open" && col) {
        var form = col.querySelector(".add-form");
        var btn = col.querySelector(".add-task");
        if (form && btn) { form.hidden = false; btn.hidden = true; form.querySelector(".add-title").focus(); }
      } else if (act === "add-cancel" && col) {
        var f = col.querySelector(".add-form");
        var b = col.querySelector(".add-task");
        if (f && b) { f.hidden = true; b.hidden = false; f.reset(); f.querySelector(".add-err").hidden = true; }
      }
    });
    columns.addEventListener("submit", function (e) {
      var form = e.target.closest(".add-form");
      if (!form) return;
      e.preventDefault();
      var day = parseInt(form.dataset.day, 10);
      var title = form.querySelector(".add-title").value;
      var planned = form.querySelector(".add-planned").value;
      var err = form.querySelector(".add-err");
      if (!title || !title.trim()) { err.hidden = false; return; }
      createTask({ title: title, day: day, planned: planned });
    });

    // edit modal
    document.getElementById("edit-form").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!editingId) return;
      var title = document.getElementById("edit-title").value;
      if (!title || !title.trim()) { document.getElementById("edit-error").hidden = false; return; }
      updateTask(editingId, {
        title: title,
        channel: document.getElementById("edit-channel").value,
        planned: document.getElementById("edit-planned").value,
        start: document.getElementById("edit-start").value
      });
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
        handler: function (args) { return createTask(args || {}); }
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
          args = args || {};
          if (!args.id) return { ok: false, error: "id required" };
          return updateTask(args.id, args);
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
        handler: function (args) {
          args = args || {};
          if (!args.id) return { ok: false, error: "id required" };
          return toggleTask(args.id);
        }
      }
    };

    window.webmcp_session_info = function () {
      return {
        contract_version: "zto-webmcp-v1",
        app: "cadence-daily-planner-board",
        modules: ["browse-query-v1", "entity-collection-v1"],
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
