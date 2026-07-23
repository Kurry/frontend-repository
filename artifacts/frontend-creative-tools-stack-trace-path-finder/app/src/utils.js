import { fixtureGraph } from './fixture';

const nodeById = new Map(fixtureGraph.nodes.map((n) => [n.id, n]));

export function nodeLabel(id) {
  const n = nodeById.get(id);
  return n ? `${id} (${n.basename}:${n.symbol})` : id;
}

export function getNode(id) {
  return nodeById.get(id) || null;
}

export function parseTrace(rawText) {
  const lines = rawText.split('\n');
  const frames = [];
  let frameId = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("Traceback")) {
      frames.push({ id: `f${frameId++}`, originalLine: i, text: line, type: 'noise', confidence: 100 });
      continue;
    }

    let parsed = { id: `f${frameId++}`, originalLine: i, text: line, type: 'frame', pinned: null, candidates: [], rejected: [], weight: 100, mappedNode: null, collapsed: false };

    // File "main.py", line 12, in start_app
    const pyMatch = line.match(/File "([^"]+)", line (\d+), in (\S+)(?:\s+\((.*?)\))?/);
    if (pyMatch) {
      parsed = { ...parsed, basename: pyMatch[1], line: parseInt(pyMatch[2]), symbol: pyMatch[3], language: 'python', confidence: 90 };
      if (pyMatch[4] === 'wrapper') parsed.isWrapper = true;
    } else {
      // at fetchRecord (handler.js:135)
      const jsMatch1 = line.match(/at (\S+) \(([^:]+):(\d+)\)/);
      if (jsMatch1) {
        parsed = { ...parsed, basename: jsMatch1[2], line: parseInt(jsMatch1[3]), symbol: jsMatch1[1], language: 'javascript', confidence: 90 };
      } else {
        // at db.js:45 (execute)
        const jsMatch2 = line.match(/at ([^:]+):(\d+) \(([^)]+)\)/);
        if (jsMatch2) {
          parsed = { ...parsed, basename: jsMatch2[1], line: parseInt(jsMatch2[2]), symbol: jsMatch2[3], language: 'javascript', confidence: 90 };
        } else {
          parsed = { ...parsed, type: 'unresolved', confidence: 50 };
        }
      }
    }

    // Expand deterministic candidates: basename, whole-word symbol, line range,
    // and language must all agree with a fixture node.
    if (parsed.type === 'frame') {
      parsed.candidates = fixtureGraph.nodes.filter(n =>
        n.basename === parsed.basename &&
        n.symbol === parsed.symbol &&
        n.language === parsed.language &&
        parsed.line >= n.lineRange[0] && parsed.line <= n.lineRange[1]
      ).map(n => ({ ...n, score: 100 }));
    }

    frames.push(parsed);
  }
  return frames;
}

function bfs(from, to, neighbors) {
  const queue = [[from]];
  const visited = new Set([from]);
  while (queue.length > 0) {
    const curPath = queue.shift();
    const tail = curPath[curPath.length - 1];
    if (tail === to) return curPath;
    for (const n of neighbors(tail)) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push([...curPath, n]);
      }
    }
  }
  return null;
}

// Computes the connector route through the frozen graph for the current frame
// order. Contradictions are structured ({ message, frameIds, nodeIds }) so the
// UI can focus-sync the offending frames, graph segment, and excerpts.
export function computePath(frames, edges) {
  const path = [];
  let valid = true;
  const contradictions = [];
  const unresolved = frames.filter((f) => f.type === 'unresolved');

  const mappedFrames = frames.filter((f) => f.mappedNode && !f.collapsed && f.type === 'frame');
  if (mappedFrames.length === 0) {
    return { path: [], valid: true, contradictions: [], unresolved };
  }

  path.push(mappedFrames[0].mappedNode);

  for (let i = 0; i < mappedFrames.length - 1; i++) {
    const fromFrame = mappedFrames[i];
    const toFrame = mappedFrames[i + 1];
    const from = fromFrame.mappedNode;
    const to = toFrame.mappedNode;

    if (from === to) {
      contradictions.push({
        message: `Duplicate node reuse: consecutive frames ${fromFrame.id} and ${toFrame.id} both map to ${nodeLabel(from)}.`,
        frameIds: [fromFrame.id, toFrame.id],
        nodeIds: [from],
      });
      valid = false;
      continue;
    }

    // Shortest directed caller→callee segment between consecutive mapped frames.
    const forward = bfs(from, to, (tail) => edges.filter((e) => e.source === tail).map((e) => e.target));
    if (forward) {
      path.push(...forward.slice(1));
      continue;
    }

    // A reversed caller/callee mapping means the opposite directed path
    // exists; anything else is a genuinely missing connector.
    const reversed = bfs(to, from, (tail) => edges.filter((e) => e.source === tail).map((e) => e.target));

    if (reversed) {
      contradictions.push({
        message: `Reversed caller/callee order between ${nodeLabel(from)} and ${nodeLabel(to)} — the graph only calls ${nodeLabel(from)} from ${nodeLabel(to)}. Reorder the frames or remap one endpoint.`,
        frameIds: [fromFrame.id, toFrame.id],
        nodeIds: [from, to],
      });
    } else {
      const wrapperEnd = toFrame.isWrapper ? toFrame : fromFrame.isWrapper ? fromFrame : null;
      const hint = wrapperEnd
        ? ` Collapse the wrapper frame ${wrapperEnd.id} to bridge it out of the route.`
        : ' Remap one endpoint to a connected node.';
      contradictions.push({
        message: `Missing connector: no directed path from ${nodeLabel(from)} to ${nodeLabel(to)}.${hint}`,
        frameIds: [fromFrame.id, toFrame.id],
        nodeIds: [from, to],
      });
    }
    valid = false;
  }

  // Wrapper constraint: a collapse may bridge a frame out of the route, but it
  // can never hide the unresolved terminal frame.
  for (const f of frames) {
    if (f.type === 'unresolved' && f.collapsed) {
      contradictions.push({
        message: `Cannot hide unresolved terminal frame ${f.id}: "${f.text}".`,
        frameIds: [f.id],
        nodeIds: [],
      });
      valid = false;
    }
  }

  return { path, valid, contradictions, unresolved };
}

// Deterministic minimal locus: the lowest common enclosing symbol span in the
// terminal decisive frame's file, covering every decisive mapped node that
// shares that file.
export function computeMinimalLocus(frames) {
  const decisive = frames
    .filter((f) => f.mappedNode && !f.collapsed && f.type === 'frame')
    .map((f) => nodeById.get(f.mappedNode))
    .filter(Boolean);
  if (decisive.length === 0) return null;
  const terminal = decisive[decisive.length - 1];
  const inFile = decisive.filter((n) => n.basename === terminal.basename);
  return {
    file: terminal.basename,
    symbol: terminal.symbol,
    startLine: Math.min(...inFile.map((n) => n.lineRange[0])),
    endLine: Math.max(...inFile.map((n) => n.lineRange[1])),
    nodeIds: inFile.map((n) => n.id),
  };
}

// Small stable checksum (djb2) for export provenance fields.
export function hashString(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}
