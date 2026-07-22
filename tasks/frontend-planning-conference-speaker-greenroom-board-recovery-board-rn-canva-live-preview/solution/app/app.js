(function () {
  "use strict";

  var STATUS = ["draft", "ready", "changed", "failed", "recovery", "resolved", "archived"];
  var ROOMS = ["Main Hall", "Studio A", "Studio B"];
  var LANES = ["unassigned", "failed", "recovery", "resolved"];
  var PREVIEW = ["draft", "ready", "changed", "at-risk", "holding", "live", "archived"];
  var ROOT = document.getElementById("app");
  var LIVE = document.getElementById("live-region");
  var TOASTS = document.getElementById("toast-region");
  var lastOpener = null;
  var actionGate = { key: "", at: 0 };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function nowIso() { return new Date().toISOString(); }
  function timeLabel(minute) {
    var hours = Math.floor(minute / 60);
    var minutes = minute % 60;
    var suffix = hours >= 12 ? "PM" : "AM";
    var clock = hours % 12 || 12;
    return clock + ":" + String(minutes).padStart(2, "0") + " " + suffix;
  }
  function statusPresentation(status) {
    return status === "failed" ? { lane: "failed", previewState: "at-risk" }
      : status === "recovery" ? { lane: "recovery", previewState: "holding" }
      : status === "resolved" ? { lane: "resolved", previewState: "live" }
      : { lane: "unassigned", previewState: status };
  }
  function makeRecord(id, speaker, title, room, start, duration, status, note, link, order) {
    var p = statusPresentation(status);
    return {
      id: id,
      speakerName: speaker,
      sessionTitle: title,
      room: room,
      startMinute: start,
      durationMinutes: duration,
      status: status,
      mobileNote: note,
      shortLink: link,
      recoveryBoardState: { lane: p.lane, order: order },
      repairNote: "",
      previewState: p.previewState
    };
  }
  function seededRecords() {
    return [
      makeRecord("slot-jordan", "Jordan Bell", "Opening keynote: systems that listen", "Main Hall", 540, 45, "ready", "Keynote begins after the welcome reel.", "jordan-keynote", 1),
      makeRecord("slot-maya", "Maya Chen", "Designing calm incident rooms", "Main Hall", 600, 45, "failed", "A/V handoff missed its timing check.", "maya-incident-room", 2),
      makeRecord("slot-priya", "Priya Nair", "The accessible stage checklist", "Studio A", 660, 30, "changed", "Captioner briefing moved to five minutes before stage call.", "priya-access-stage", 3),
      makeRecord("slot-lee", "Lee Okafor", "Local-first workshop lab", "Studio B", 720, 60, "draft", "Bring workshop groups in through the west door.", "lee-local-first", 4),
      makeRecord("slot-noor", "Noor Haddad", "Metrics with a human pulse", "Studio A", 780, 30, "ready", "Hold two minutes for the audience pulse check.", "noor-human-metrics", 5),
      makeRecord("slot-sam", "Sam Rivera", "When demos do not cooperate", "Studio B", 840, 45, "failed", "Backup laptop is not mirrored to the confidence monitor.", "sam-demo-recovery", 6),
      makeRecord("slot-ava", "Ava Thompson", "A field guide to useful AI", "Main Hall", 900, 60, "changed", "Stage manager gives a ten-minute warning at 3:50 PM.", "ava-useful-ai", 7),
      makeRecord("slot-eli", "Eli Park", "Closing notes from the greenroom", "Studio A", 990, 30, "draft", "Collect one-line takeaways before the closing handoff.", "eli-closing-notes", 8)
    ];
  }
  function initialState() {
    return {
      records: seededRecords(),
      selectedId: "slot-maya",
      filter: "all",
      search: "",
      sort: "board-order",
      mobileStep: "slots",
      history: [],
      past: [],
      future: [],
      activeDialog: null,
      editingId: null,
      confirm: null,
      importDiagnostics: [],
      importText: "",
      slotErrors: {},
      repairErrors: {},
      exportedAt: null,
      customCounter: 1
    };
  }
  var state = initialState();

  function snapshot() {
    return clone({
      records: state.records,
      selectedId: state.selectedId,
      filter: state.filter,
      search: state.search,
      sort: state.sort,
      mobileStep: state.mobileStep,
      history: state.history,
      exportedAt: state.exportedAt,
      customCounter: state.customCounter
    });
  }
  function restore(snap) {
    state.records = clone(snap.records);
    state.selectedId = snap.selectedId;
    state.filter = snap.filter;
    state.search = snap.search;
    state.sort = snap.sort;
    state.mobileStep = snap.mobileStep;
    state.history = clone(snap.history);
    state.exportedAt = snap.exportedAt;
    state.customCounter = snap.customCounter || 1;
  }
  function gated(key) {
    var t = performance.now();
    if (actionGate.key === key && t - actionGate.at < 320) return true;
    actionGate = { key: key, at: t };
    return false;
  }
  function announce(message) {
    LIVE.textContent = "";
    requestAnimationFrame(function () { LIVE.textContent = message; });
  }
  function toast(message) {
    announce(message);
    var item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    TOASTS.appendChild(item);
    setTimeout(function () {
      item.style.opacity = "0";
      setTimeout(function () { item.remove(); }, 180);
    }, 2300);
  }
  function nextEvent(type, recordId, summary) {
    var seq = state.history.length ? Math.max.apply(null, state.history.map(function (e) { return e.seq; })) + 1 : 1;
    return { seq: seq, type: type, recordId: recordId, summary: summary };
  }
  function commit(type, recordId, summary, mutate) {
    var before = snapshot();
    var changed = mutate();
    if (changed === false) return false;
    state.past.push(before);
    if (state.past.length > 80) state.past.shift();
    state.future = [];
    if (type) state.history.push(nextEvent(type, recordId, summary));
    state.exportedAt = null;
    render();
    announce(summary);
    return true;
  }
  function undo() {
    if (!state.past.length || gated("undo")) return false;
    state.future.push(snapshot());
    restore(state.past.pop());
    state.activeDialog = null;
    state.confirm = null;
    render();
    toast("Last mutation undone. Selection, board order, filters, summaries, and history were restored.");
    return true;
  }
  function redo() {
    if (!state.future.length || gated("redo")) return false;
    state.past.push(snapshot());
    restore(state.future.pop());
    render();
    toast("Mutation reapplied.");
    return true;
  }

  function derive(records, selectedId) {
    var liveRecords = records.filter(function (r) { return r.status !== "archived"; });
    return {
      activeCount: liveRecords.length,
      failedCount: records.filter(function (r) { return r.status === "failed"; }).length,
      recoveryCount: records.filter(function (r) { return r.status === "recovery"; }).length,
      resolvedCount: records.filter(function (r) { return r.status === "resolved"; }).length,
      minutesAtRisk: records.filter(function (r) { return r.status === "failed" || r.status === "recovery"; })
        .reduce(function (sum, r) { return sum + r.durationMinutes; }, 0),
      selectedId: selectedId || null
    };
  }
  function findRecord(id) { return state.records.find(function (r) { return r.id === id; }); }
  function fieldError(path, message) { return { path: path, message: message }; }
  function validateRecord(input, allRecords, editingId, prefix) {
    var errors = [];
    var p = prefix || "record";
    var speaker = typeof input.speakerName === "string" ? input.speakerName.trim() : "";
    var title = typeof input.sessionTitle === "string" ? input.sessionTitle.trim() : "";
    var note = typeof input.mobileNote === "string" ? input.mobileNote.trim() : "";
    var link = typeof input.shortLink === "string" ? input.shortLink.trim() : "";
    if (speaker.length < 2 || speaker.length > 80) errors.push(fieldError(p + ".speakerName", "Speaker name must contain 2 through 80 trimmed characters; enter a name within that range."));
    if (title.length < 3 || title.length > 120) errors.push(fieldError(p + ".sessionTitle", "Session title must contain 3 through 120 trimmed characters; shorten or complete the title."));
    if (ROOMS.indexOf(input.room) < 0) errors.push(fieldError(p + ".room", "Room must be Main Hall, Studio A, or Studio B; choose one listed room."));
    if (!Number.isInteger(input.startMinute) || input.startMinute < 480 || input.startMinute > 1080 || input.startMinute % 5 !== 0) errors.push(fieldError(p + ".startMinute", "Start time must be an integer from 480 through 1080 in five-minute steps; choose a time from 8:00 AM through 6:00 PM."));
    if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 15 || input.durationMinutes > 90 || input.durationMinutes % 5 !== 0) errors.push(fieldError(p + ".durationMinutes", "Duration must be 15 through 90 minutes in five-minute steps; enter a supported duration."));
    if (STATUS.indexOf(input.status) < 0) errors.push(fieldError(p + ".status", "Status must be draft, ready, changed, failed, recovery, resolved, or archived; choose a listed state."));
    if (note.length > 160) errors.push(fieldError(p + ".mobileNote", "Mobile note cannot exceed 160 characters; shorten the speaker-time note."));
    if (!/^[a-z0-9-]{3,32}$/.test(link)) errors.push(fieldError(p + ".shortLink", "Short link must be 3 through 32 lowercase letters, numbers, or hyphens; remove unsupported characters."));
    if (allRecords.some(function (r) { return r.id !== editingId && r.shortLink === link; })) errors.push(fieldError(p + ".shortLink", "Short link " + link + " is already used; enter a unique short link."));
    if (!input.id || typeof input.id !== "string") errors.push(fieldError(p + ".id", "ID must be a non-empty stable string; provide a unique record ID."));
    if (allRecords.some(function (r) { return r.id !== editingId && r.id === input.id; })) errors.push(fieldError(p + ".id", "ID " + input.id + " is duplicated; use a unique stable ID."));
    return errors;
  }
  function normalizedRecord(input, base) {
    var status = input.status;
    var p = statusPresentation(status);
    var current = base || {};
    return {
      id: String(input.id),
      speakerName: String(input.speakerName).trim(),
      sessionTitle: String(input.sessionTitle).trim(),
      room: input.room,
      startMinute: Number(input.startMinute),
      durationMinutes: Number(input.durationMinutes),
      status: status,
      mobileNote: String(input.mobileNote || "").trim(),
      shortLink: String(input.shortLink).trim(),
      recoveryBoardState: input.recoveryBoardState ? clone(input.recoveryBoardState) : { lane: p.lane, order: current.recoveryBoardState ? current.recoveryBoardState.order : state.records.length + 1 },
      repairNote: typeof input.repairNote === "string" ? input.repairNote.trim() : (current.repairNote || ""),
      previewState: input.previewState || p.previewState
    };
  }
  function slotFieldsFromForm(form) {
    var data = new FormData(form);
    var existing = state.editingId ? findRecord(state.editingId) : null;
    return {
      id: existing ? existing.id : "slot-custom-" + String(state.customCounter).padStart(3, "0"),
      speakerName: String(data.get("speakerName") || ""),
      sessionTitle: String(data.get("sessionTitle") || ""),
      room: String(data.get("room") || ""),
      startMinute: Number(data.get("startMinute")),
      durationMinutes: Number(data.get("durationMinutes")),
      status: String(data.get("status") || "draft"),
      mobileNote: String(data.get("mobileNote") || ""),
      shortLink: String(data.get("shortLink") || "")
    };
  }
  function errorsByField(errors) {
    var result = {};
    errors.forEach(function (e) { result[e.path.split(".").pop()] = e.message; });
    return result;
  }
  function createRecord(fields) {
    var candidate = normalizedRecord(fields);
    var errors = validateRecord(candidate, state.records, null, "record");
    if (["recovery", "resolved", "archived"].indexOf(candidate.status) >= 0) errors.push(fieldError("record.status", "New slots cannot begin in recovery, resolved, or archived; create draft, ready, changed, or failed, then use the visible domain action."));
    if (errors.length) return { ok: false, errors: errors };
    if (gated("create:" + candidate.id)) return { ok: false, error: "Duplicate activation ignored" };
    commit("create", candidate.id, "Created " + candidate.sessionTitle + ".", function () {
      candidate.recoveryBoardState.order = state.records.length + 1;
      state.records.push(candidate);
      state.selectedId = candidate.id;
      state.customCounter += 1;
      return true;
    });
    return { ok: true, id: candidate.id, record: clone(candidate) };
  }
  function updateRecord(id, fields) {
    var old = findRecord(id);
    if (!old) return { ok: false, error: "No speaker slot with ID " + id };
    var candidate = normalizedRecord(Object.assign({}, old, fields, { id: id }), old);
    if (fields.status && fields.status !== old.status) {
      var presentation = statusPresentation(fields.status);
      candidate.recoveryBoardState.lane = presentation.lane;
      candidate.previewState = presentation.previewState;
    }
    var errors = validateRecord(candidate, state.records, id, "record");
    if (fields.status && ["recovery", "resolved"].indexOf(fields.status) >= 0 && fields.status !== old.status) errors.push(fieldError("record.status", "Recovery and resolved states are created only by Move to recovery and Apply repair; use the canonical board action."));
    if (errors.length) return { ok: false, errors: errors };
    if (JSON.stringify(candidate) === JSON.stringify(old)) return { ok: false, error: "No fields changed" };
    commit("edit", id, "Updated " + candidate.sessionTitle + " across slots, preview, summary, and artifact.", function () {
      state.records = state.records.map(function (r) { return r.id === id ? candidate : r; });
      state.selectedId = id;
      return true;
    });
    return { ok: true, record: clone(candidate) };
  }
  function deleteRecord(id) {
    var record = findRecord(id);
    if (!record) return { ok: false, error: "No speaker slot with ID " + id };
    if (gated("delete:" + id)) return { ok: false, error: "Duplicate activation ignored" };
    commit("delete", id, "Deleted " + record.sessionTitle + " from all linked views.", function () {
      state.records = state.records.filter(function (r) { return r.id !== id; });
      if (state.selectedId === id) state.selectedId = state.records.length ? state.records[0].id : null;
      return true;
    });
    return { ok: true, id: id };
  }
  function archiveRecord(id) {
    var record = findRecord(id);
    if (!record) return { ok: false, error: "No speaker slot with ID " + id };
    if (record.status === "archived") return { ok: false, error: "Slot is already archived" };
    if (gated("archive:" + id)) return { ok: false, error: "Duplicate activation ignored" };
    commit("archive", id, "Archived " + record.sessionTitle + " without deleting its history.", function () {
      record.status = "archived";
      record.recoveryBoardState.lane = "unassigned";
      record.previewState = "archived";
      state.selectedId = id;
      return true;
    });
    return { ok: true, id: id, status: "archived" };
  }
  function moveToRecovery(id) {
    var record = findRecord(id);
    if (!record) return { ok: false, error: "No speaker slot with ID " + id };
    if (record.status !== "failed") return { ok: false, error: "Only a failed slot can move to recovery; no state changed" };
    if (gated("recover:" + id)) return { ok: false, error: "Duplicate activation ignored" };
    commit("move-to-recovery", id, "Moved " + record.sessionTitle + " to Recovery path; mobile preview is Holding.", function () {
      record.status = "recovery";
      record.recoveryBoardState.lane = "recovery";
      record.previewState = "holding";
      record.repairNote = "";
      state.selectedId = id;
      state.mobileStep = "recover";
      return true;
    });
    return { ok: true, id: id, lane: "recovery", previewState: "holding" };
  }
  function overlaps(record, startMinute) {
    var end = startMinute + record.durationMinutes;
    return state.records.find(function (r) {
      if (r.id === record.id || r.status === "archived") return false;
      if (r.room !== record.room) return false;
      return startMinute < r.startMinute + r.durationMinutes && end > r.startMinute;
    });
  }
  function validateRepair(record, start, note) {
    var errors = [];
    if (!Number.isInteger(start) || start < 480 || start > 1080 || start % 5 !== 0) errors.push(fieldError("repair.startMinute", "Replacement start must be 480 through 1080 in five-minute steps; choose 8:00 AM through 6:00 PM."));
    var clean = String(note || "").trim();
    if (clean.length < 8 || clean.length > 160) errors.push(fieldError("repair.repairNote", "Repair note must contain 8 through 160 trimmed characters; explain the downstream correction."));
    if (!errors.length) {
      var conflict = overlaps(record, start);
      if (conflict) errors.push(fieldError("repair.startMinute", "Replacement start overlaps " + conflict.speakerName + " in " + record.room + "; choose a non-overlapping time."));
    }
    return errors;
  }
  function repairRecord(id, start, note) {
    var record = findRecord(id);
    if (!record) return { ok: false, error: "No speaker slot with ID " + id };
    if (record.status !== "recovery") return { ok: false, error: "Slot must be in Recovery path before repair" };
    var errors = validateRepair(record, start, note);
    if (errors.length) return { ok: false, errors: errors };
    if (gated("repair:" + id)) return { ok: false, error: "Duplicate activation ignored" };
    commit("repair", id, "Repaired " + record.sessionTitle + " at " + timeLabel(start) + "; downstream preview is Live.", function () {
      record.startMinute = start;
      record.repairNote = String(note).trim();
      record.status = "resolved";
      record.recoveryBoardState.lane = "resolved";
      record.previewState = "live";
      state.selectedId = id;
      state.mobileStep = "preview";
      return true;
    });
    return { ok: true, id: id, status: "resolved", previewState: "live" };
  }
  function reorderRecord(id, direction) {
    var record = findRecord(id);
    if (!record || ["failed", "recovery", "resolved"].indexOf(record.recoveryBoardState.lane) < 0) return { ok: false, error: "Record is not in a recovery board lane" };
    var lane = state.records.filter(function (r) { return r.recoveryBoardState.lane === record.recoveryBoardState.lane; })
      .sort(function (a, b) { return a.recoveryBoardState.order - b.recoveryBoardState.order; });
    var index = lane.findIndex(function (r) { return r.id === id; });
    var swap = direction === "up" ? index - 1 : direction === "down" ? index + 1 : -1;
    if (swap < 0 || swap >= lane.length) return { ok: false, error: "Record is already at that lane boundary" };
    var other = lane[swap];
    commit("reorder", id, "Reordered " + record.sessionTitle + " " + direction + " in " + record.recoveryBoardState.lane + ".", function () {
      var order = record.recoveryBoardState.order;
      record.recoveryBoardState.order = other.recoveryBoardState.order;
      other.recoveryBoardState.order = order;
      state.selectedId = id;
      return true;
    });
    return { ok: true, id: id, direction: direction };
  }
  function loadFixture() {
    if (gated("fixture")) return { ok: false, error: "Duplicate activation ignored" };
    var base = seededRecords();
    for (var i = 1; i <= 100; i += 1) {
      var room = ROOMS[i % ROOMS.length];
      var start = 480 + (i % 61) * 5;
      var statuses = ["draft", "ready", "changed", "failed"];
      base.push(makeRecord(
        "fixture-" + String(i).padStart(3, "0"),
        "Fixture Speaker " + String(i).padStart(3, "0"),
        "Greenroom timing scenario " + String(i).padStart(3, "0"),
        room,
        start,
        15 + (i % 4) * 15,
        statuses[i % statuses.length],
        "Deterministic maximum-fixture note " + i + ".",
        "fixture-speaker-" + String(i).padStart(3, "0"),
        base.length + 1
      ));
    }
    commit("fixture", "fixture", "Loaded exactly 104 deterministic non-completed speaker slots.", function () {
      state.records = base;
      state.selectedId = "slot-maya";
      state.filter = "all";
      state.search = "";
      return true;
    });
    return { ok: true, quantity: 104 };
  }

  function sortedArtifactRecords() {
    return clone(state.records).sort(function (a, b) {
      return a.recoveryBoardState.order - b.recoveryBoardState.order || a.id.localeCompare(b.id);
    });
  }
  function buildArtifact(exportedAt) {
    return {
      schemaVersion: "speaker-greenroom/v1",
      exportedAt: exportedAt,
      records: sortedArtifactRecords(),
      derived: derive(state.records, state.selectedId),
      history: clone(state.history).sort(function (a, b) { return a.seq - b.seq; })
    };
  }
  function artifactText(regenerate) {
    if (regenerate || !state.exportedAt) state.exportedAt = nowIso();
    return JSON.stringify(buildArtifact(state.exportedAt), null, 2);
  }
  function downloadArtifact() {
    var text = artifactText(true);
    render();
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "speaker-greenroom-v1-recovery-board.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Downloaded speaker-greenroom-v1-recovery-board.json with current session state.");
    return { ok: true, format: "speaker-greenroom-v1", filename: "speaker-greenroom-v1-recovery-board.json" };
  }
  async function copyArtifact() {
    var text = artifactText(true);
    render();
    try {
      await navigator.clipboard.writeText(text);
    } catch (_error) {
      var area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    toast("Copied the exact visible speaker-greenroom JSON preview.");
    return { ok: true, format: "speaker-greenroom-v1" };
  }
  function validateArtifact(raw) {
    var errors = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [fieldError("file", "File must contain one JSON object; paste or choose a speaker-greenroom artifact.")];
    var expectedKeys = ["derived", "exportedAt", "history", "records", "schemaVersion"];
    var keys = Object.keys(raw).sort();
    keys.forEach(function (key) { if (expectedKeys.indexOf(key) < 0) errors.push(fieldError("file." + key, "Unknown top-level key " + key + "; remove it and keep schemaVersion, exportedAt, records, derived, and history only.")); });
    expectedKeys.forEach(function (key) { if (!Object.prototype.hasOwnProperty.call(raw, key)) errors.push(fieldError("file." + key, "Required top-level key " + key + " is missing; add it before import.")); });
    if (raw.schemaVersion !== "speaker-greenroom/v1") errors.push(fieldError("file.schemaVersion", "schemaVersion must equal speaker-greenroom/v1; export from this greenroom board."));
    if (typeof raw.exportedAt !== "string" || Number.isNaN(Date.parse(raw.exportedAt)) || !/^\d{4}-\d\d-\d\dT/.test(raw.exportedAt)) errors.push(fieldError("file.exportedAt", "exportedAt must be an RFC3339 timestamp; provide a valid export timestamp."));
    if (!Array.isArray(raw.records)) errors.push(fieldError("file.records", "records must be an array; provide the full speaker-slot collection."));
    if (!Array.isArray(raw.history)) errors.push(fieldError("file.history", "history must be an array; provide the ordered event list."));
    var records = Array.isArray(raw.records) ? raw.records : [];
    records.forEach(function (record, index) {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        errors.push(fieldError("records[" + index + "]", "Record " + index + " must be an object; replace the invalid value."));
        return;
      }
      validateRecord(record, records, record.id, "records[" + index + "]").forEach(function (e) { errors.push(e); });
      if (!record.recoveryBoardState || typeof record.recoveryBoardState !== "object") errors.push(fieldError("records[" + index + "].recoveryBoardState", "recoveryBoardState must contain lane and integer order; restore board geometry."));
      else {
        if (LANES.indexOf(record.recoveryBoardState.lane) < 0) errors.push(fieldError("records[" + index + "].recoveryBoardState.lane", "Recovery lane must be unassigned, failed, recovery, or resolved; choose a known lane."));
        if (!Number.isInteger(record.recoveryBoardState.order) || record.recoveryBoardState.order < 0) errors.push(fieldError("records[" + index + "].recoveryBoardState.order", "Recovery order must be a non-negative integer; provide a stable board order."));
      }
      if (PREVIEW.indexOf(record.previewState) < 0) errors.push(fieldError("records[" + index + "].previewState", "previewState is unknown; use draft, ready, changed, at-risk, holding, live, or archived."));
      if (typeof record.repairNote !== "string" || record.repairNote.length > 160) errors.push(fieldError("records[" + index + "].repairNote", "repairNote must be a string no longer than 160 characters; shorten the repair evidence."));
      var expected = statusPresentation(record.status);
      if (record.recoveryBoardState && record.recoveryBoardState.lane !== expected.lane) errors.push(fieldError("records[" + index + "].recoveryBoardState.lane", "Lane " + record.recoveryBoardState.lane + " contradicts status " + record.status + "; use " + expected.lane + "."));
      if (record.previewState !== expected.previewState) errors.push(fieldError("records[" + index + "].previewState", "Preview state " + record.previewState + " contradicts status " + record.status + "; use " + expected.previewState + "."));
      if (record.status === "resolved" && record.repairNote.trim().length < 8) errors.push(fieldError("records[" + index + "].repairNote", "Resolved records require an 8-to-160-character repair note; explain the downstream correction."));
    });
    var ids = new Set();
    var links = new Set();
    records.forEach(function (record, index) {
      if (!record || typeof record !== "object") return;
      if (ids.has(record.id)) errors.push(fieldError("records[" + index + "].id", "Duplicate ID " + record.id + " was found; keep each stable ID unique."));
      ids.add(record.id);
      if (links.has(record.shortLink)) errors.push(fieldError("records[" + index + "].shortLink", "Duplicate short link " + record.shortLink + " was found; keep each share slug unique."));
      links.add(record.shortLink);
    });
    var history = Array.isArray(raw.history) ? raw.history : [];
    history.forEach(function (event, index) {
      if (!event || typeof event !== "object") { errors.push(fieldError("history[" + index + "]", "History event must be an object; replace the invalid entry.")); return; }
      if (event.seq !== index + 1) errors.push(fieldError("history[" + index + "].seq", "History sequence must be contiguous from 1; expected " + (index + 1) + "."));
      if (typeof event.type !== "string" || !event.type) errors.push(fieldError("history[" + index + "].type", "History type must be a non-empty action name; name the canonical mutation."));
      if (typeof event.recordId !== "string" || !event.recordId) errors.push(fieldError("history[" + index + "].recordId", "History recordId must be a stable ID; provide the affected record."));
      if (event.type !== "delete" && event.type !== "fixture" && !ids.has(event.recordId)) errors.push(fieldError("history[" + index + "].recordId", "History references missing record " + event.recordId + "; restore the record or remove the dangling event."));
      if (typeof event.summary !== "string" || !event.summary.trim()) errors.push(fieldError("history[" + index + "].summary", "History summary must explain the visible consequence; add a concise summary."));
    });
    if (!raw.derived || typeof raw.derived !== "object" || Array.isArray(raw.derived)) errors.push(fieldError("file.derived", "derived must contain activeCount, failedCount, recoveryCount, resolvedCount, minutesAtRisk, and selectedId."));
    else {
      var expectedDerived = derive(records, raw.derived.selectedId);
      ["activeCount", "failedCount", "recoveryCount", "resolvedCount", "minutesAtRisk"].forEach(function (key) {
        if (raw.derived[key] !== expectedDerived[key]) errors.push(fieldError("derived." + key, "Derived " + key + " is stale: expected " + expectedDerived[key] + " from records; regenerate the artifact."));
      });
      var derivedKeys = Object.keys(raw.derived).sort();
      var wantedDerived = ["activeCount", "failedCount", "minutesAtRisk", "recoveryCount", "resolvedCount", "selectedId"].sort();
      derivedKeys.forEach(function (key) { if (wantedDerived.indexOf(key) < 0) errors.push(fieldError("derived." + key, "Unknown derived key " + key + "; remove stale summary data.")); });
      wantedDerived.forEach(function (key) { if (!Object.prototype.hasOwnProperty.call(raw.derived, key)) errors.push(fieldError("derived." + key, "Required derived key " + key + " is missing; regenerate the summary.")); });
      if (raw.derived.selectedId !== null && !ids.has(raw.derived.selectedId)) errors.push(fieldError("derived.selectedId", "selectedId " + raw.derived.selectedId + " does not name an exported record; select an existing record or null."));
    }
    return errors;
  }
  function importArtifact(text) {
    var before = JSON.stringify(snapshot());
    var raw;
    try { raw = JSON.parse(text); }
    catch (error) {
      state.importDiagnostics = [fieldError("file", "Malformed JSON: " + error.message + "; correct the syntax and try again.")];
      render();
      announce("Import rejected. Malformed JSON left the session unchanged.");
      return { ok: false, errors: clone(state.importDiagnostics), unchanged: before === JSON.stringify(snapshot()) };
    }
    var errors = validateArtifact(raw);
    if (errors.length) {
      state.importDiagnostics = errors;
      render();
      announce("Import rejected with " + errors.length + " diagnostics. Session state was not changed.");
      return { ok: false, errors: clone(errors), unchanged: before === JSON.stringify(snapshot()) };
    }
    state.past.push(snapshot());
    state.future = [];
    state.records = clone(raw.records);
    state.selectedId = raw.derived.selectedId;
    state.history = clone(raw.history);
    state.exportedAt = nowIso();
    state.filter = "all";
    state.search = "";
    state.sort = "board-order";
    state.importDiagnostics = [];
    state.activeDialog = null;
    state.importText = "";
    render();
    toast("Validated and replayed " + state.records.length + " records atomically; exportedAt was regenerated.");
    return { ok: true, records: state.records.length, exportedAt: state.exportedAt };
  }
  function clearSession() {
    if (gated("clear")) return { ok: false, error: "Duplicate activation ignored" };
    commit(null, "session", "Cleared the in-memory session.", function () {
      state.records = [];
      state.selectedId = null;
      state.filter = "all";
      state.search = "";
      state.sort = "board-order";
      state.history = [];
      state.mobileStep = "slots";
      return true;
    });
    toast("Session cleared. Add slot and Import JSON remain available.");
    return { ok: true };
  }

  function visibleRecords() {
    var query = state.search.trim().toLowerCase();
    var records = state.records.filter(function (r) {
      return (state.filter === "all" || r.status === state.filter)
        && (!query || r.speakerName.toLowerCase().includes(query) || r.sessionTitle.toLowerCase().includes(query));
    });
    return records.sort(function (a, b) {
      if (state.sort === "start-asc") return a.startMinute - b.startMinute || a.id.localeCompare(b.id);
      if (state.sort === "start-desc") return b.startMinute - a.startMinute || a.id.localeCompare(b.id);
      return a.recoveryBoardState.order - b.recoveryBoardState.order || a.id.localeCompare(b.id);
    });
  }
  function slotRow(record) {
    var selected = record.id === state.selectedId;
    return '<button class="slot-row ' + (selected ? "selected" : "") + '" data-select="' + esc(record.id) + '" aria-pressed="' + selected + '">' +
      '<span class="row-title"><strong>' + esc(record.sessionTitle) + '</strong><span class="status ' + esc(record.status) + '">' + esc(record.status) + '</span></span>' +
      '<span class="speaker">' + esc(record.speakerName) + '</span>' +
      '<span class="row-meta"><span>' + esc(timeLabel(record.startMinute)) + '</span><span>·</span><span>' + esc(record.durationMinutes) + ' min</span><span>·</span><span>' + esc(record.room) + '</span>' + (selected ? '<span class="selected-text">Selected</span>' : '') + '</span>' +
    '</button>';
  }
  function boardCard(record) {
    var selected = record.id === state.selectedId;
    var isFailed = record.status === "failed";
    return '<article class="board-card ' + (selected ? "selected" : "") + '" data-card="' + esc(record.id) + '" draggable="' + isFailed + '" tabindex="0" aria-label="' + esc(record.sessionTitle + ', ' + record.status) + '">' +
      '<div><span class="status ' + esc(record.status) + '">' + esc(record.status) + '</span>' + (selected ? '<span class="selected-text" style="float:right">Selected</span>' : '') + '</div>' +
      '<h4>' + esc(record.sessionTitle) + '</h4><p class="speaker">' + esc(record.speakerName) + '</p>' +
      '<div class="card-meta"><span>' + esc(timeLabel(record.startMinute)) + '</span><span>' + esc(record.room) + '</span><span>' + esc(record.durationMinutes) + ' min</span><span>#' + esc(record.shortLink) + '</span></div>' +
      '<div class="card-actions"><button class="button small ghost" data-select="' + esc(record.id) + '">Inspect slot</button>' +
      (isFailed ? '<button class="button small primary" data-recover="' + esc(record.id) + '">Move to recovery</button>' : '') +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><button class="button small ghost" data-reorder="up" data-id="' + esc(record.id) + '" aria-label="Move ' + esc(record.sessionTitle) + ' up">↑ Up</button><button class="button small ghost" data-reorder="down" data-id="' + esc(record.id) + '" aria-label="Move ' + esc(record.sessionTitle) + ' down">↓ Down</button></div>' +
      '</div></article>';
  }
  function renderLane(lane, label) {
    var records = visibleRecords().filter(function (r) { return r.recoveryBoardState.lane === lane; });
    return '<section class="lane" data-lane="' + lane + '" aria-labelledby="lane-' + lane + '"><header class="lane-header"><span id="lane-' + lane + '" class="lane-title">' + esc(label) + '</span><span class="count-pill">' + records.length + '</span></header><div class="lane-cards">' +
      (records.length ? records.map(boardCard).join("") : '<div class="empty"><strong>No ' + esc(label.toLowerCase()) + ' slots</strong>' + (state.filter !== "all" || state.search ? 'Clear filters to inspect the full lane.' : 'A matching state transition will place a slot here.') + '</div>') +
    '</div></section>';
  }
  function renderPreview(selected) {
    if (!selected) return '<div class="phone"><div class="phone-screen preview-empty"><div><strong>No speaker selected</strong><p>Select or import a slot to preview its share card.</p></div></div></div>';
    var width = Math.max(16, Math.min(100, (selected.durationMinutes / 90) * 100));
    var stateLabel = selected.previewState === "at-risk" ? "At risk" : selected.previewState;
    return '<div class="phone" aria-label="Live mobile preview for ' + esc(selected.speakerName) + '"><div class="phone-screen"><div class="phone-notch"></div>' +
      '<span class="preview-state ' + esc(selected.previewState) + '">' + esc(stateLabel) + '</span>' +
      '<h3>' + esc(selected.sessionTitle) + '</h3><p class="preview-speaker">' + esc(selected.speakerName) + '</p>' +
      '<div class="preview-grid"><div class="preview-block"><span>Stage call</span><strong>' + esc(timeLabel(selected.startMinute)) + '</strong></div><div class="preview-block"><span>Room</span><strong>' + esc(selected.room) + '</strong></div></div>' +
      '<div class="timing-note">' + esc(selected.mobileNote || "No speaker-time note yet.") + '</div>' +
      '<div class="preview-block"><span>Timing window</span><strong>' + selected.durationMinutes + ' minutes</strong><div class="bar-track"><div class="bar-fill" style="--duration-width:' + width + '%"></div></div></div>' +
      '<div class="share-link">greenroom.local/s/' + esc(selected.shortLink) + '</div>' +
    '</div></div>';
  }
  function renderRepairForm(selected, suffix) {
    if (!selected || selected.status !== "recovery") return "";
    var id = suffix || "desktop";
    return '<div class="inspector-card"><h3>Repair downstream timing</h3><form class="repair-form" data-repair-form="' + id + '"><div class="field"><label for="repair-start-' + id + '">Replacement start</label><input id="repair-start-' + id + '" name="startMinute" type="number" min="480" max="1080" step="5" value="' + selected.startMinute + '" aria-describedby="repair-start-error-' + id + '"><div id="repair-start-error-' + id + '" class="field-error">' + esc(state.repairErrors.startMinute || "") + '</div></div><div class="field"><label for="repair-note-' + id + '">Repair note</label><textarea id="repair-note-' + id + '" name="repairNote" maxlength="160" aria-describedby="repair-note-error-' + id + '" placeholder="Describe the repaired handoff">' + esc(selected.repairNote || "Restage the A/V handoff and update the speaker call.") + '</textarea><div id="repair-note-error-' + id + '" class="field-error">' + esc(state.repairErrors.repairNote || "") + '</div></div><button class="button primary" type="submit">Apply repair</button></form></div>';
  }
  function renderInspector(selected) {
    if (!selected) return '<div class="inspector-card empty"><strong>No slot selected</strong>Add or import a speaker slot to inspect it.</div>';
    var repair = renderRepairForm(selected, "desktop");
    return renderPreview(selected) + repair + '<div class="inspector-card"><h3>Selected slot actions</h3><div class="inspector-actions"><button class="button" data-edit="' + esc(selected.id) + '">Edit slot</button><button class="button" data-archive="' + esc(selected.id) + '" ' + (selected.status === "archived" ? "disabled" : "") + '>Archive slot</button><button class="button danger" data-confirm-delete="' + esc(selected.id) + '">Delete slot</button><button class="button ghost" data-open-export>Preview artifact</button></div></div>';
  }
  function renderTimeline() {
    var events = state.history.slice().reverse();
    return '<section class="timeline" aria-labelledby="timeline-title"><div class="surface-heading"><div><h3 id="timeline-title">Event timeline</h3><p>Canonical mutations only · invalid and cancelled actions add zero events</p></div><span class="count-pill">' + state.history.length + '</span></div><div class="timeline-list">' +
      (events.length ? events.map(function (e) { return '<article class="event"><b>#' + e.seq + ' · ' + esc(e.type) + ' · ' + esc(e.recordId) + '</b><p>' + esc(e.summary) + '</p></article>'; }).join("") : '<div class="empty" style="min-width:260px"><strong>No authored events yet</strong>Move, edit, create, or repair a slot to begin the session timeline.</div>') +
    '</div></section>';
  }
  function slotDialog(selected) {
    var isEdit = !!selected;
    var item = selected || { speakerName: "", sessionTitle: "", room: "Main Hall", startMinute: 540, durationMinutes: 30, status: "draft", mobileNote: "", shortLink: "" };
    function err(name) { return esc(state.slotErrors[name] || ""); }
    var formStatuses = ["draft", "ready", "changed", "failed"].concat(isEdit ? ["archived"] : []);
    if (isEdit && formStatuses.indexOf(item.status) < 0) formStatuses.push(item.status);
    return '<dialog id="slot-dialog" class="dialog"><div class="dialog-inner"><header class="dialog-header"><div><p class="eyebrow">API-shaped speaker-slot payload</p><h2>' + (isEdit ? "Edit slot" : "Add slot") + '</h2><p>Exact boundaries are validated before one atomic mutation.</p></div><button class="icon-button" type="button" data-close-dialog aria-label="Close slot dialog">×</button></header><form id="slot-form"><div class="form-grid">' +
      '<div class="field"><label for="speakerName">Speaker name</label><input id="speakerName" name="speakerName" minlength="2" maxlength="80" value="' + esc(item.speakerName) + '" aria-describedby="speakerName-error"><div id="speakerName-error" class="field-error">' + err("speakerName") + '</div></div>' +
      '<div class="field"><label for="sessionTitle">Session title</label><input id="sessionTitle" name="sessionTitle" minlength="3" maxlength="120" value="' + esc(item.sessionTitle) + '" aria-describedby="sessionTitle-error"><div id="sessionTitle-error" class="field-error">' + err("sessionTitle") + '</div></div>' +
      '<div class="field"><label for="room">Room</label><select id="room" name="room">' + ROOMS.map(function (room) { return '<option ' + (room === item.room ? "selected" : "") + '>' + esc(room) + '</option>'; }).join("") + '</select><div id="room-error" class="field-error">' + err("room") + '</div></div>' +
      '<div class="field"><label for="status">Status</label><select id="status" name="status">' + formStatuses.map(function (status) { return '<option value="' + status + '" ' + (status === item.status ? "selected" : "") + '>' + status + '</option>'; }).join("") + '</select><div id="status-error" class="field-error">' + err("status") + '</div></div>' +
      '<div class="field"><label for="startMinute">Start minute · 480–1080</label><input id="startMinute" name="startMinute" type="number" min="480" max="1080" step="5" value="' + esc(item.startMinute) + '"><div id="startMinute-error" class="field-error">' + err("startMinute") + '</div></div>' +
      '<div class="field"><label for="durationMinutes">Duration · 15–90 minutes</label><input id="durationMinutes" name="durationMinutes" type="number" min="15" max="90" step="5" value="' + esc(item.durationMinutes) + '"><div id="durationMinutes-error" class="field-error">' + err("durationMinutes") + '</div></div>' +
      '<div class="field full"><label for="mobileNote">Speaker-time note · maximum 160 characters</label><textarea id="mobileNote" name="mobileNote" maxlength="160">' + esc(item.mobileNote) + '</textarea><div id="mobileNote-error" class="field-error">' + err("mobileNote") + '</div></div>' +
      '<div class="field full"><label for="shortLink">Short link · 3–32 lowercase characters</label><input id="shortLink" name="shortLink" minlength="3" maxlength="32" pattern="[a-z0-9-]+" value="' + esc(item.shortLink) + '"><div id="shortLink-error" class="field-error">' + err("shortLink") + '</div></div>' +
      '</div><div class="dialog-actions"><button class="button ghost" type="button" data-close-dialog>Cancel</button><button class="button primary" type="submit">' + (isEdit ? "Save slot" : "Add slot") + '</button></div></form></div></dialog>';
  }
  function importDialog() {
    var report = state.importDiagnostics.length ? '<strong>Import rejected with ' + state.importDiagnostics.length + ' diagnostics. No state changed.</strong><ul>' + state.importDiagnostics.map(function (e) { return '<li><code>' + esc(e.path) + '</code> — ' + esc(e.message) + '</li>'; }).join("") + '</ul>' : '';
    return '<dialog id="import-dialog" class="dialog"><div class="dialog-inner"><header class="dialog-header"><div><p class="eyebrow">Atomic artifact validation</p><h2>Import JSON</h2><p>Every record and relationship is validated before commit.</p></div><button class="icon-button" type="button" data-close-dialog aria-label="Close import dialog">×</button></header><label class="file-button">Choose .json file<input id="import-file" type="file" accept="application/json,.json"></label><div class="field" style="margin-top:12px"><label for="import-text">Or paste speaker-greenroom-v1 JSON</label><textarea id="import-text" rows="13" spellcheck="false">' + esc(state.importText) + '</textarea></div><div class="import-report" id="import-report">' + report + '</div><div class="dialog-actions"><button class="button ghost" type="button" data-close-dialog>Cancel import</button><button class="button primary" type="button" id="validate-import">Validate and import</button></div></div></dialog>';
  }
  function exportDialog() {
    var text = artifactText(false);
    return '<dialog id="export-dialog" class="dialog"><div class="dialog-inner"><header class="dialog-header"><div><p class="eyebrow">Portable session artifact</p><h2>Artifact preview</h2><p>Stable board order, derived summaries, selected ID, and canonical history.</p></div><button class="icon-button" type="button" data-close-dialog aria-label="Close artifact preview">×</button></header><pre class="export-preview" id="export-preview">' + esc(text) + '</pre><div class="dialog-actions"><button class="button ghost" type="button" data-copy>Copy JSON</button><button class="button primary" type="button" data-download>Export JSON</button></div></div></dialog>';
  }
  function confirmDialog() {
    var record = state.confirm && state.confirm.id ? findRecord(state.confirm.id) : null;
    var kind = state.confirm ? state.confirm.kind : "";
    var title = kind === "delete" ? "Delete speaker slot?" : "Clear the session?";
    var copy = kind === "delete" && record ? "Delete " + record.sessionTitle + " from every linked view? Undo can restore it." : "Clear records, summaries, selection, and event history? Undo can restore this in-memory snapshot.";
    return '<dialog id="confirm-dialog" class="dialog" style="max-width:480px"><div class="dialog-inner"><header class="dialog-header"><div><p class="eyebrow">Confirm destructive action</p><h2>' + esc(title) + '</h2><p>' + esc(copy) + '</p></div><button class="icon-button" type="button" data-close-dialog aria-label="Cancel confirmation">×</button></header><div class="dialog-actions"><button class="button ghost" type="button" data-close-dialog>Cancel</button><button class="button danger" type="button" id="confirm-action">' + (kind === "delete" ? "Delete slot" : "Clear session") + '</button></div></div></dialog>';
  }

  function render() {
    var derived = derive(state.records, state.selectedId);
    var selected = findRecord(state.selectedId);
    var visible = visibleRecords();
    ROOT.innerHTML = '<div class="app-shell"><header class="topbar"><div class="brand"><div class="brand-mark" aria-hidden="true">GR</div><div><p class="eyebrow">Conference operations · Local session</p><h1>Greenroom Recovery Board</h1></div></div><div class="header-actions">' +
      '<button class="button dark" data-undo ' + (!state.past.length ? "disabled" : "") + '>↶ Undo</button><button class="button dark" data-redo ' + (!state.future.length ? "disabled" : "") + '>↷ Redo</button>' +
      '<button class="button dark" data-fixture>Load 104</button><button class="button dark" data-open-import>Import JSON</button><button class="button dark" data-copy>Copy JSON</button><button class="button primary" data-download>Export JSON</button><button class="button danger" data-confirm-clear>Clear</button></div></header>' +
      '<section class="summary-ribbon" aria-label="Greenroom summary"><div class="metric"><span>Total</span><strong>' + state.records.length + '</strong></div><div class="metric"><span>Active</span><strong>' + derived.activeCount + '</strong></div><div class="metric"><span>Failed</span><strong>' + derived.failedCount + '</strong></div><div class="metric"><span>Recovery</span><strong>' + derived.recoveryCount + '</strong></div><div class="metric"><span>Resolved</span><strong>' + derived.resolvedCount + '</strong></div><div class="metric risk"><span>Minutes at risk</span><strong>' + derived.minutesAtRisk + '</strong></div></section>' +
      '<div class="mobile-steps" role="tablist" aria-label="Mobile workbench steps"><button class="mobile-step" role="tab" data-mobile-step="slots" aria-selected="' + (state.mobileStep === "slots") + '">1 · Slots</button><button class="mobile-step" role="tab" data-mobile-step="recover" aria-selected="' + (state.mobileStep === "recover") + '">2 · Recover</button><button class="mobile-step" role="tab" data-mobile-step="preview" aria-selected="' + (state.mobileStep === "preview") + '">3 · Preview</button></div>' +
      '<main id="workbench" class="workbench" tabindex="-1"><section class="surface slots-surface ' + (state.mobileStep === "slots" ? "mobile-active" : "") + '" aria-labelledby="slots-title"><div class="surface-heading"><div><h2 id="slots-title">Speaker slots</h2><p>Shared collection · exact API-shaped fields</p></div><button class="button primary" data-add>Add slot</button></div><div class="filter-stack"><input class="search" id="slot-search" type="search" aria-label="Search speaker slots" placeholder="Search speaker or session" value="' + esc(state.search) + '"><div class="filter-chips" aria-label="Status filters">' + ["all"].concat(STATUS).map(function (status) { return '<button class="chip ' + (state.filter === status ? "active" : "") + '" data-filter="' + status + '" aria-pressed="' + (state.filter === status) + '">' + status + '</button>'; }).join("") + '</div><div class="sort-row"><select id="slot-sort" aria-label="Sort speaker slots"><option value="board-order" ' + (state.sort === "board-order" ? "selected" : "") + '>Board order</option><option value="start-asc" ' + (state.sort === "start-asc" ? "selected" : "") + '>Start time · ascending</option><option value="start-desc" ' + (state.sort === "start-desc" ? "selected" : "") + '>Start time · descending</option></select><button class="button small ghost" data-clear-filters>Clear</button></div></div><div class="slot-list">' +
      (visible.length ? visible.map(slotRow).join("") : '<div class="empty"><strong>No slots match</strong>Clear filters to restore the collection, add a new slot, or import JSON.<div style="display:grid;gap:7px;margin-top:10px"><button class="button" data-clear-filters>Clear filters</button><button class="button" data-add>Add slot</button><button class="button" data-open-import>Import JSON</button></div></div>') +
      '</div></section><section class="surface board-surface ' + (state.mobileStep === "recover" ? "mobile-active" : "") + '" aria-labelledby="board-title"><div class="surface-heading"><div><h2 id="board-title">Recovery board</h2><p>Failed consequence → holding path → repaired share state</p></div><div class="board-tools"><span class="status failed">Failed</span><span class="status recovery">Holding</span><span class="status resolved">Live</span></div></div><div class="board-scroll"><div class="lanes">' + renderLane("failed", "Failed feed") + renderLane("recovery", "Recovery path") + renderLane("resolved", "Resolved") + '</div></div><div class="mobile-repair">' + renderRepairForm(selected, "mobile") + '</div>' + renderTimeline() + '</section><aside class="surface inspector-surface ' + (state.mobileStep === "preview" ? "mobile-active" : "") + '" aria-labelledby="preview-title"><div><div class="surface-heading"><div><h2 id="preview-title">Mobile preview</h2><p>Canva-inspired live share canvas</p></div>' + (selected ? '<span class="status ' + esc(selected.status) + '">' + esc(selected.status) + '</span>' : '') + '</div>' + renderInspector(selected) + '</div></aside></main></div>' +
      slotDialog(state.editingId ? findRecord(state.editingId) : null) + importDialog() + exportDialog() + confirmDialog();
    bind();
    if (state.activeDialog) {
      requestAnimationFrame(function () {
        var dialog = document.getElementById(state.activeDialog + "-dialog");
        if (dialog && !dialog.open) dialog.showModal();
      });
    }
  }

  function openDialog(name, editingId) {
    lastOpener = document.activeElement;
    state.activeDialog = name;
    state.editingId = editingId || null;
    state.slotErrors = {};
    if (name !== "import") state.importDiagnostics = [];
    render();
  }
  function closeDialog() {
    state.activeDialog = null;
    state.editingId = null;
    state.slotErrors = {};
    state.repairErrors = {};
    state.confirm = null;
    render();
    if (lastOpener && typeof lastOpener.focus === "function") requestAnimationFrame(function () { lastOpener.focus(); });
  }
  function bind() {
    document.querySelectorAll("[data-select]").forEach(function (element) {
      element.addEventListener("click", function (event) {
        if (event.target.closest("[data-recover],[data-reorder]")) return;
        state.selectedId = element.dataset.select;
        render();
        announce("Selected " + findRecord(state.selectedId).speakerName + " in slots, board, and mobile preview.");
      });
    });
    document.querySelectorAll("[data-filter]").forEach(function (button) { button.addEventListener("click", function () { state.filter = button.dataset.filter; render(); }); });
    document.querySelectorAll("[data-clear-filters]").forEach(function (button) { button.addEventListener("click", function () { state.filter = "all"; state.search = ""; state.sort = "board-order"; render(); }); });
    var search = document.getElementById("slot-search");
    if (search) search.addEventListener("input", function () { state.search = search.value; render(); requestAnimationFrame(function () { var next = document.getElementById("slot-search"); if (next) { next.focus(); next.setSelectionRange(next.value.length, next.value.length); } }); });
    var sort = document.getElementById("slot-sort");
    if (sort) sort.addEventListener("change", function () { state.sort = sort.value; render(); });
    document.querySelectorAll("[data-add]").forEach(function (button) { button.addEventListener("click", function () { openDialog("slot", null); }); });
    document.querySelectorAll("[data-edit]").forEach(function (button) { button.addEventListener("click", function () { openDialog("slot", button.dataset.edit); }); });
    document.querySelectorAll("[data-recover]").forEach(function (button) { button.addEventListener("click", function () { var result = moveToRecovery(button.dataset.recover); if (!result.ok) toast(result.error); }); });
    document.querySelectorAll("[data-reorder]").forEach(function (button) { button.addEventListener("click", function () { var result = reorderRecord(button.dataset.id, button.dataset.reorder); if (!result.ok) toast(result.error); }); });
    document.querySelectorAll("[data-archive]").forEach(function (button) { button.addEventListener("click", function () { var result = archiveRecord(button.dataset.archive); if (!result.ok) toast(result.error); else toast("Slot archived without deleting its history."); }); });
    document.querySelectorAll("[data-confirm-delete]").forEach(function (button) { button.addEventListener("click", function () { state.confirm = { kind: "delete", id: button.dataset.confirmDelete }; openDialog("confirm"); }); });
    document.querySelectorAll("[data-confirm-clear]").forEach(function (button) { button.addEventListener("click", function () { state.confirm = { kind: "clear" }; openDialog("confirm"); }); });
    document.querySelectorAll("[data-open-import]").forEach(function (button) { button.addEventListener("click", function () { openDialog("import"); }); });
    document.querySelectorAll("[data-open-export]").forEach(function (button) { button.addEventListener("click", function () { state.exportedAt = nowIso(); openDialog("export"); }); });
    document.querySelectorAll("[data-download]").forEach(function (button) { button.addEventListener("click", downloadArtifact); });
    document.querySelectorAll("[data-copy]").forEach(function (button) { button.addEventListener("click", copyArtifact); });
    document.querySelectorAll("[data-undo]").forEach(function (button) { button.addEventListener("click", undo); });
    document.querySelectorAll("[data-redo]").forEach(function (button) { button.addEventListener("click", redo); });
    document.querySelectorAll("[data-fixture]").forEach(function (button) { button.addEventListener("click", function () { var result = loadFixture(); if (result.ok) toast("Loaded the 104-record performance fixture."); }); });
    document.querySelectorAll("[data-mobile-step]").forEach(function (button) { button.addEventListener("click", function () { state.mobileStep = button.dataset.mobileStep; render(); }); });
    document.querySelectorAll("[data-close-dialog]").forEach(function (button) { button.addEventListener("click", closeDialog); });
    document.querySelectorAll("dialog").forEach(function (dialog) { dialog.addEventListener("cancel", function (event) { event.preventDefault(); closeDialog(); }); });

    var slotForm = document.getElementById("slot-form");
    if (slotForm) {
      slotForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var fields = slotFieldsFromForm(slotForm);
        var result = state.editingId ? updateRecord(state.editingId, fields) : createRecord(fields);
        if (!result.ok) {
          state.slotErrors = errorsByField(result.errors || [fieldError("record", result.error || "Slot could not be saved")]);
          state.activeDialog = "slot";
          render();
          announce("Slot validation found " + Object.keys(state.slotErrors).length + " field errors.");
        } else {
          var wasEditing = !!state.editingId;
          state.activeDialog = null;
          state.editingId = null;
          state.slotErrors = {};
          render();
          toast(wasEditing ? "Speaker slot updated." : "Speaker slot added.");
        }
      });
      slotForm.addEventListener("input", function () {
        var fields = slotFieldsFromForm(slotForm);
        var candidate = normalizedRecord(fields, state.editingId ? findRecord(state.editingId) : null);
        state.slotErrors = errorsByField(validateRecord(candidate, state.records, state.editingId, "record"));
        Object.keys({ speakerName: 1, sessionTitle: 1, room: 1, startMinute: 1, durationMinutes: 1, status: 1, mobileNote: 1, shortLink: 1 }).forEach(function (name) {
          var node = document.getElementById(name + "-error");
          if (node) node.textContent = state.slotErrors[name] || "";
        });
      });
    }
    document.querySelectorAll("[data-repair-form]").forEach(function (repairForm) {
      repairForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var selected = findRecord(state.selectedId);
        var data = new FormData(repairForm);
        var result = repairRecord(selected.id, Number(data.get("startMinute")), String(data.get("repairNote") || ""));
        if (!result.ok) {
          state.repairErrors = errorsByField(result.errors || []);
          render();
          announce("Repair rejected. Correct the named fields; no state changed.");
        } else {
          toast("Recovery resolved. Timing summary, event history, mobile preview, and artifact are synchronized.");
          requestAnimationFrame(function () {
            var previewStep = document.querySelector('[data-mobile-step="preview"]');
            if (previewStep && getComputedStyle(previewStep.parentElement).display !== "none") previewStep.focus();
            else {
              var previewTitle = document.getElementById("preview-title");
              if (previewTitle) { previewTitle.setAttribute("tabindex", "-1"); previewTitle.focus(); }
            }
          });
        }
      });
    });
    var importText = document.getElementById("import-text");
    if (importText) importText.addEventListener("input", function () { state.importText = importText.value; });
    var importFile = document.getElementById("import-file");
    if (importFile) importFile.addEventListener("change", function () {
      var file = importFile.files && importFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { state.importText = String(reader.result || ""); render(); };
      reader.onerror = function () { state.importDiagnostics = [fieldError("file", "The selected file could not be read; choose a readable JSON file.")]; render(); };
      reader.readAsText(file);
    });
    var validateImport = document.getElementById("validate-import");
    if (validateImport) validateImport.addEventListener("click", function () { importArtifact((document.getElementById("import-text") || {}).value || ""); });
    var confirmAction = document.getElementById("confirm-action");
    if (confirmAction) confirmAction.addEventListener("click", function () {
      var action = state.confirm;
      state.activeDialog = null;
      state.confirm = null;
      if (action.kind === "delete") { var result = deleteRecord(action.id); if (result.ok) toast("Speaker slot deleted from every linked view."); }
      else clearSession();
    });

    document.querySelectorAll('[draggable="true"]').forEach(function (card) {
      card.addEventListener("dragstart", function (event) { event.dataTransfer.setData("text/plain", card.dataset.card); event.dataTransfer.effectAllowed = "move"; card.classList.add("dragging"); });
      card.addEventListener("dragend", function () { card.classList.remove("dragging"); document.querySelectorAll(".lane").forEach(function (lane) { lane.classList.remove("drag-over"); }); });
    });
    document.querySelectorAll("[data-lane]").forEach(function (lane) {
      lane.addEventListener("dragover", function (event) { if (lane.dataset.lane === "recovery") { event.preventDefault(); lane.classList.add("drag-over"); } });
      lane.addEventListener("dragleave", function () { lane.classList.remove("drag-over"); });
      lane.addEventListener("drop", function (event) { event.preventDefault(); lane.classList.remove("drag-over"); if (lane.dataset.lane === "recovery") { var result = moveToRecovery(event.dataTransfer.getData("text/plain")); if (!result.ok) toast(result.error); } });
    });
  }

  function registerWebMCP() {
    var tools = {
      "browse.open": { module: "browse-query-v1", description: "Open the bounded slots, recovery-board, mobile-preview, import, or export destination.", handler: function (args) {
        var destination = args && args.destination;
        if (["slots", "recovery-board", "mobile-preview", "import", "export"].indexOf(destination) < 0) return { ok: false, error: "Unknown bounded destination" };
        if (destination === "import") openDialog("import");
        else if (destination === "export") { state.exportedAt = nowIso(); openDialog("export"); }
        else { state.mobileStep = destination === "slots" ? "slots" : destination === "recovery-board" ? "recover" : "preview"; render(); }
        return { ok: true, destination: destination };
      } },
      "browse.search": { module: "browse-query-v1", description: "Search speakerName and sessionTitle with a bounded string query.", handler: function (args) { state.search = String((args && args.query) || "").slice(0, 120); render(); return { ok: true, query: state.search, visible: visibleRecords().length }; } },
      "browse.apply_filter": { module: "browse-query-v1", description: "Apply the declared status filter.", handler: function (args) { var value = args && (args.value || args.filter); if (["all"].concat(STATUS).indexOf(value) < 0) return { ok: false, error: "Unknown status filter" }; state.filter = value; render(); return { ok: true, filter: value, visible: visibleRecords().length }; } },
      "browse.clear_filter": { module: "browse-query-v1", description: "Clear status and search filters.", handler: function () { state.filter = "all"; state.search = ""; render(); return { ok: true, visible: state.records.length }; } },
      "browse.sort": { module: "browse-query-v1", description: "Sort by start-asc, start-desc, or board-order.", handler: function (args) { var value = args && args.sort; if (["start-asc", "start-desc", "board-order"].indexOf(value) < 0) return { ok: false, error: "Unknown sort" }; state.sort = value; render(); return { ok: true, sort: value, ids: visibleRecords().map(function (r) { return r.id; }) }; } },
      "entity.create": { module: "entity-collection-v1", description: "Create one speaker-slot through the same API-shaped validation and command as Add slot.", handler: function (args) { var fields = clone((args && args.fields) || {}); if (!fields.id) fields.id = "slot-custom-" + String(state.customCounter).padStart(3, "0"); return createRecord(fields); } },
      "entity.select": { module: "entity-collection-v1", description: "Select and query one stable speaker-slot ID, plus linked derived state and history.", handler: function (args) { var record = findRecord(args && args.id); if (!record) return { ok: false, error: "No speaker slot with that ID" }; state.selectedId = record.id; render(); return { ok: true, record: clone(record), derived: derive(state.records, state.selectedId), history: clone(state.history) }; } },
      "entity.update": { module: "entity-collection-v1", description: "Update bounded slot fields, move a failed slot to recovery, or repair a recovery slot using the visible commands.", handler: function (args) { if (!args || !args.id) return { ok: false, error: "id is required" }; if (args.action === "move_to_recovery") return moveToRecovery(args.id); if (args.action === "repair") return repairRecord(args.id, Number(args.fields && args.fields.recoveryStartMinute), String((args.fields && args.fields.repairNote) || "")); return updateRecord(args.id, clone(args.fields || {})); } },
      "entity.delete": { module: "entity-collection-v1", description: "Delete one declared speaker-slot ID with confirm=true.", handler: function (args) { if (!args || args.confirm !== true) return { ok: false, error: "confirm=true is required" }; return deleteRecord(args.id); } },
      "entity.toggle": { module: "entity-collection-v1", description: "Toggle the bounded archived field for a stable speaker-slot ID.", handler: function (args) { if (!args || args.field !== "archived") return { ok: false, error: "Only archived is toggleable" }; return archiveRecord(args.id); } },
      "entity.quantity": { module: "entity-collection-v1", description: "Load the exact 104-record performance fixture.", handler: function (args) { if (!args || Number(args.quantity) !== 104) return { ok: false, error: "Only quantity 104 is declared" }; return loadFixture(); } },
      "entity.reorder": { module: "entity-collection-v1", description: "Move a board-lane record one step up or down when gesture mechanics are not graded.", handler: function (args) { if (!args || ["up", "down"].indexOf(args.direction) < 0) return { ok: false, error: "direction must be up or down" }; return reorderRecord(args.id, args.direction); } },
      "form.validate": { module: "form-workflow-v1", description: "Validate declared speaker-slot or repair fields and return all field diagnostics.", handler: function (args) { if (args && args.form === "repair") { var record = findRecord(args.id); if (!record) return { ok: false, errors: [fieldError("repair.id", "Choose an existing recovery slot.")] }; var repairErrors = validateRepair(record, Number(args.fields && args.fields.recoveryStartMinute), String((args.fields && args.fields.repairNote) || "")); return { ok: !repairErrors.length, errors: repairErrors }; } var fields = clone((args && args.fields) || {}); if (!fields.id) fields.id = "slot-validation-probe"; var candidate = normalizedRecord(fields); var errors = validateRecord(candidate, state.records, null, "record"); return { ok: !errors.length, errors: errors }; } },
      "form.submit": { module: "form-workflow-v1", description: "Submit declared speaker-slot or repair fields through the same visible command.", handler: function (args) { if (args && args.form === "repair") return repairRecord(args.id, Number(args.fields && args.fields.recoveryStartMinute), String((args.fields && args.fields.repairNote) || "")); var fields = clone((args && args.fields) || {}); if (!fields.id) fields.id = "slot-custom-" + String(state.customCounter).padStart(3, "0"); return createRecord(fields); } },
      "form.cancel": { module: "form-workflow-v1", description: "Cancel the open form without mutation.", handler: function () { closeDialog(); return { ok: true, mutated: false }; } },
      "form.reset": { module: "form-workflow-v1", description: "Reset visible form diagnostics without changing session state.", handler: function () { state.slotErrors = {}; state.repairErrors = {}; state.importDiagnostics = []; render(); return { ok: true, mutated: false }; } },
      "artifact.import": { module: "artifact-transfer-v1", description: "Open the visible speaker-greenroom-v1 import surface; artifact contents remain a browser file/paste responsibility.", handler: function (args) { if (!args || args.mode !== "speaker-greenroom-v1") return { ok: false, error: "mode must be speaker-greenroom-v1" }; openDialog("import"); return { ok: true, mode: args.mode, completed: false }; } },
      "artifact.export": { module: "artifact-transfer-v1", description: "Trigger the real visible speaker-greenroom-v1 download without returning artifact bytes.", handler: function (args) { if (!args || args.format !== "speaker-greenroom-v1") return { ok: false, error: "format must be speaker-greenroom-v1" }; return downloadArtifact(); } },
      "artifact.copy": { module: "artifact-transfer-v1", description: "Trigger the visible Copy JSON control without returning clipboard contents.", handler: function (args) { if (!args || args.format !== "speaker-greenroom-v1") return { ok: false, error: "format must be speaker-greenroom-v1" }; copyArtifact(); return { ok: true, format: args.format }; } },
      "artifact.print_preview": { module: "artifact-transfer-v1", description: "Open the visible structured JSON artifact preview.", handler: function (args) { if (!args || args.format !== "speaker-greenroom-v1") return { ok: false, error: "format must be speaker-greenroom-v1" }; state.exportedAt = nowIso(); openDialog("export"); return { ok: true, format: args.format }; } }
    };
    window.webmcp_session_info = function () {
      return {
        contract_version: "zto-webmcp-v1",
        app: "greenroom-recovery-board",
        modules: ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"],
        destinations: ["slots", "recovery-board", "mobile-preview", "import", "export"],
        entity: "speaker-slot",
        filters: ["all"].concat(STATUS),
        sorts: ["start-asc", "start-desc", "board-order"],
        artifact_format: "speaker-greenroom-v1",
        tool_count: Object.keys(tools).length
      };
    };
    window.webmcp_list_tools = function () {
      return Object.keys(tools).map(function (name) {
        return { name: name, module: tools[name].module, description: tools[name].description };
      });
    };
    window.webmcp_invoke_tool = function (name, args) {
      if (!tools[name]) throw new Error("Unknown WebMCP tool: " + name);
      return tools[name].handler(args || {});
    };
  }

  document.addEventListener("keydown", function (event) {
    var target = event.target;
    var typing = target && (target.matches("input, textarea, select") || target.isContentEditable);
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !typing) {
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
    }
  });
  registerWebMCP();
  render();
})();
