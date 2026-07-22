const VERSION = 'zto-webmcp-v1';
const MODULES = ['structured-editor-v1', 'entity-collection-v1', 'command-session-v1', 'artifact-transfer-v1'];
const FORMATS = ['practice-dossier-json', 'practice-events-csv', 'score-overlay-svg', 'practice-schedule-ics', 'practice-summary-md'];

export function registerWebMCP(bridge) {
  const id = value => String(value ?? '').trim();
  const integer = (value, min, max) => {
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max ? number : null;
  };
  const handlers = {
    'editor.select': args => {
      const objectType = String(args.object_type ?? args.type ?? 'practice-loop');
      const objectId = id(args.id);
      const ok = bridge.select(objectType, objectId);
      return ok ? { ok, operation: 'select', object_type: objectType, id: objectId } : { ok, error: `unknown ${objectType}: ${objectId}` };
    },
    'editor.add': args => {
      const objectType = String(args.object_type ?? args.type ?? 'practice-loop');
      if (objectType !== 'practice-loop') return { ok: false, error: 'add supports practice-loop only' };
      const start = integer(args.start, 1, 2000);
      const end = integer(args.end, start ?? 1, 2000);
      const reps = integer(args.repetitions ?? args.reps ?? 5, 1, 100);
      if (start === null || end === null || reps === null) return { ok: false, error: 'start/end must be measures 1-2000 and repetitions 1-100' };
      const loop = bridge.createLoop({ name: String(args.name ?? `Loop ${start}-${end}`).slice(0, 120), start, end, reps, rules: String(args.rules ?? 'standard').slice(0, 80) });
      return { ok: true, operation: 'add', object_type: objectType, id: loop.id };
    },
    'editor.delete': args => {
      if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' };
      const objectId = id(args.id);
      const ok = bridge.deleteLoop(objectId);
      return ok ? { ok, operation: 'delete', id: objectId } : { ok, error: `unknown practice-loop: ${objectId}` };
    },
    'editor.update_property': args => {
      const objectId = id(args.id);
      const property = String(args.property ?? '');
      const allowed = ['name', 'start', 'end', 'repetitions', 'rules'];
      if (!allowed.includes(property)) return { ok: false, error: `unsupported property: ${property}`, allowed };
      let value = args.value;
      if (['start', 'end'].includes(property)) value = integer(value, 1, 2000);
      if (property === 'repetitions') value = integer(value, 1, 100);
      if (value === null) return { ok: false, error: `invalid ${property}` };
      const ok = bridge.updateLoop(objectId, property === 'repetitions' ? 'reps' : property, typeof value === 'string' ? value.slice(0, 120) : value);
      return ok ? { ok, operation: 'update_property', id: objectId, property, value } : { ok, error: `unknown practice-loop: ${objectId}` };
    },
    'editor.set_content': args => {
      const start = integer(args.start, 1, 2000);
      const end = integer(args.end, start ?? 1, 2000);
      if (start === null || end === null) return { ok: false, error: 'range requires integer start/end measures' };
      bridge.setRange({ start, end });
      return { ok: true, operation: 'set_content', start, end };
    },
    'editor.switch_mode': args => {
      const mode = String(args.mode ?? 'score');
      if (!['score', 'tempo', 'takes', 'schedule'].includes(mode)) return { ok: false, error: `unknown mode: ${mode}` };
      bridge.showMode(mode);
      return { ok: true, operation: 'switch_mode', mode };
    },
    'editor.preview': () => ({ ok: true, operation: 'preview', range: bridge.state().selectedRange, loopCount: bridge.state().loops.length }),
    'entity.create': args => handlers['editor.add']({ ...args, object_type: 'practice-loop' }),
    'entity.select': args => handlers['editor.select']({ ...args, object_type: String(args.entity_type ?? 'practice-loop') }),
    'entity.update': args => handlers['editor.update_property'](args),
    'entity.delete': args => handlers['editor.delete'](args),
    'entity.toggle': args => {
      const day = integer(args.day, 1, 21);
      const loopId = id(args.loop_id ?? args.id);
      if (day === null || !bridge.state().loops.some(loop => loop.id === loopId)) return { ok: false, error: 'toggle requires an existing loop_id and day 1-21' };
      const status = bridge.toggleSchedule(day, loopId);
      return { ok: true, operation: 'toggle', entity_type: 'schedule-item', day, loop_id: loopId, status };
    },
    'session.start': () => ({ ok: bridge.start(), operation: 'start', state: 'playing' }),
    'session.pause': () => ({ ok: bridge.pause(), operation: 'pause', state: 'paused' }),
    'session.resume': () => ({ ok: bridge.resume(), operation: 'resume', state: 'playing' }),
    'session.stop': () => ({ ok: bridge.stop(), operation: 'stop', state: 'idle' }),
    'session.restart': () => ({ ok: bridge.restart(), operation: 'restart', state: 'playing' }),
    'artifact.export': args => {
      const format = String(args.format ?? 'practice-dossier-json');
      if (!FORMATS.includes(format)) return { ok: false, error: `unknown format: ${format}`, allowed: FORMATS };
      bridge.exportArtifact(format);
      return { ok: true, operation: 'export', format, triggered: true };
    },
    'artifact.import': args => {
      const mode = String(args.mode ?? 'practice-dossier-json');
      if (mode !== 'practice-dossier-json') return { ok: false, error: `unknown import mode: ${mode}` };
      bridge.openImport();
      return { ok: true, operation: 'import', mode, fileChooserOpened: true };
    },
    'artifact.copy': args => {
      const format = String(args.format ?? 'practice-dossier-json');
      if (format !== 'practice-dossier-json') return { ok: false, error: 'copy supports practice-dossier-json only' };
      const bytes = bridge.copyDossier();
      return { ok: true, operation: 'copy', format, copied: true, byteLength: bytes };
    },
  };
  const descriptions = {
    'editor.select': 'Select a bounded practice-loop, take-event, or schedule item.',
    'editor.add': 'Create a practice loop through the same loop creation command as the UI.',
    'editor.delete': 'Delete a practice loop; confirm=true is required.',
    'editor.update_property': 'Update a bounded practice-loop field.',
    'editor.set_content': 'Set the active score range using integer measure boundaries.',
    'editor.switch_mode': 'Reveal the score, tempo, takes, or schedule workspace.',
    'editor.preview': 'Report live score-range and loop-count metadata.',
    'entity.create': 'Create a practice-loop entity.', 'entity.select': 'Select an existing practice entity.',
    'entity.update': 'Update a bounded practice-loop field.', 'entity.delete': 'Delete a loop with confirmation.',
    'entity.toggle': 'Toggle a loop schedule item between due and approved.',
    'session.start': 'Start the logical practice session.', 'session.pause': 'Pause a running practice session.',
    'session.resume': 'Resume a paused practice session.', 'session.stop': 'Stop the session and return to idle.',
    'session.restart': 'Restart the session from repetition one.',
    'artifact.export': 'Trigger a visible artifact download without returning its contents.',
    'artifact.import': 'Open the visible dossier JSON file picker.',
    'artifact.copy': 'Copy the current dossier JSON without returning clipboard contents.',
  };
  const tools = Object.keys(handlers).map(name => ({ name, description: descriptions[name] }));
  window.webmcp_session_info = () => ({ contract_version: VERSION, modules: MODULES, tools: tools.map(tool => tool.name) });
  window.webmcp_list_tools = () => tools;
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const handler = handlers[name];
    if (!handler) return { ok: false, error: `unknown tool: ${name}` };
    try { return await handler(args || {}); } catch (error) { return { ok: false, error: String(error) }; }
  };
}
