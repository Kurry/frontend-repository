import { fixtureGraph } from './fixture';

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

    let parsed = { id: `f${frameId++}`, originalLine: i, text: line, type: 'frame', pinned: null, candidates: [], weight: 100, mappedNode: null, collapsed: false };

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
          parsed = { ...parsed, basename: jsMatch2[1], line: parseInt(jsMatch1[2]), symbol: jsMatch2[3], language: 'javascript', confidence: 90 };
        } else {
          parsed = { ...parsed, type: 'unresolved', confidence: 50 };
        }
      }
    }

    // Expand candidates
    if (parsed.type === 'frame') {
      parsed.candidates = fixtureGraph.nodes.filter(n =>
        n.basename === parsed.basename &&
        n.symbol === parsed.symbol &&
        n.language === parsed.language &&
        parsed.line >= n.lineRange[0] && parsed.line <= n.lineRange[1]
      ).map(n => ({ ...n, score: 100 })); // simplified score
    }

    frames.push(parsed);
  }
  return frames;
}

export function computePath(frames, edges) {
  // Finds shortest path in directed graph between mapped frames
  let path = [];
  let valid = true;
  let contradictions = [];

  const mappedFrames = frames.filter(f => f.mappedNode && !f.collapsed && f.type === 'frame');
  for (let i = 0; i < mappedFrames.length - 1; i++) {
    const from = mappedFrames[i].mappedNode;
    const to = mappedFrames[i+1].mappedNode;

    // BFS
    let q = [[from]];
    let visited = new Set([from]);
    let found = false;

    while (q.length > 0) {
      let curPath = q.shift();
      let tail = curPath[curPath.length - 1];

      if (tail === to) {
        // Exclude first node in next path segment except for the very first
        path.push(...curPath.slice(path.length === 0 ? 0 : 1));
        found = true;
        break;
      }

      let nextNodes = edges.filter(e => e.source === tail).map(e => e.target);
      for (let n of nextNodes) {
        if (!visited.has(n)) {
          visited.add(n);
          q.push([...curPath, n]);
        }
      }
    }

    if (!found) {
      valid = false;
      contradictions.push(`No path from ${from} to ${to}`);
      break;
    }
  }
  return { path, valid, contradictions };
}
