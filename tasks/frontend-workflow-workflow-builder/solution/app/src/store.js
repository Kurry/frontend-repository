import { create } from 'zustand';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import {
  ALLOWED_CONNECTIONS,
  DEFAULT_CONFIG,
  NODE_TYPES,
  createSeedEdges,
  createSeedNodes,
  fromContractNode,
  saveWorkflowSchema,
  toContractEdge,
  toContractNode,
  workflowDefinitionSchema,
  workflowToMermaid,
} from './workflow';

let executionToken = 0;
let elapsedTimer = null;
let toastTimer = null;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const isRunActive = (run) => ['running', 'pausing', 'paused'].includes(run.phase);

const historySnapshot = ({ nodes, edges, run, timeline, activeWorkflowName }) => ({
  nodes: structuredClone(nodes),
  edges: structuredClone(edges),
  run: structuredClone(run),
  timeline: structuredClone(timeline),
  activeWorkflowName,
});

const blankRun = () => ({
  phase: 'idle',
  runId: null,
  startedAt: null,
  elapsedMs: 0,
  pauseRequested: false,
  checkpointIndex: null,
  failedIndex: null,
  order: [],
});

function freshNodeData(node) {
  return {
    ...node,
    selected: false,
    data: {
      ...node.data,
      status: null,
      attempt: 0,
      backoff: 0,
      error: '',
      input: null,
      output: null,
      startedAt: null,
      completedAt: null,
      expanded: false,
      justDropped: false,
    },
  };
}

function stopElapsed() {
  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = null;
}

function getTopologicalOrder(nodes, edges) {
  if (!nodes.length) return { error: 'There is nothing to run. Drag a node from the palette onto the canvas to get started.' };
  const nodeIds = new Set(nodes.map((node) => node.id));
  const validEdges = edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  const neighbors = new Map(nodes.map((node) => [node.id, []]));
  const undirected = new Map(nodes.map((node) => [node.id, []]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  validEdges.forEach((edge) => {
    neighbors.get(edge.source).push(edge.target);
    undirected.get(edge.source).push(edge.target);
    undirected.get(edge.target).push(edge.source);
    indegree.set(edge.target, indegree.get(edge.target) + 1);
  });
  const queue = nodes.filter((node) => indegree.get(node.id) === 0).sort((a, b) => a.position.x - b.position.x).map((node) => node.id);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    neighbors.get(id).forEach((target) => {
      indegree.set(target, indegree.get(target) - 1);
      if (indegree.get(target) === 0) queue.push(target);
    });
  }
  if (order.length !== nodes.length) return { error: 'The workflow contains a cycle. Create a directed source-to-sink path before running.' };
  return { order };
}

function simulatedInput(node, nodes, edges) {
  const incoming = edges.filter((edge) => edge.target === node.id);
  if (!incoming.length) return `Source input for ${node.data.title}`;
  return incoming.map((edge) => nodes.find((item) => item.id === edge.source)?.data.output || 'Awaiting upstream output').join(' · ');
}

function simulatedOutput(node) {
  const config = node.data.config;
  if (node.type === 'Prompt') return `Prepared “${config.prompt}” prompt with 3 context fields`;
  if (node.type === 'Agent') return `${config.agent} produced a response within ${config.timeoutSeconds}s`;
  if (node.type === 'Eval') return `${config.rubric}: score 0.92, passed`;
  if (node.type === 'Condition') return `${config.conditionExpression} evaluated true`;
  return `Delivered result to ${config.destinationName}`;
}

function timestamp() {
  return new Date().toISOString();
}

export const useWorkflowStore = create((set, get) => ({
  past: [],
  future: [],
  pushHistory: () => {
    const state = get();
    if (isRunActive(state.run)) {
      get().showToast('error', 'Finish the current run before editing the workflow.');
      return false;
    }
    const snapshot = historySnapshot(state);
    set((state) => ({ past: [...state.past, snapshot], future: [] }));
    return true;
  },
  undo: () => {
    const { past, run } = get();
    if (!past.length || isRunActive(run)) return;
    const previous = past[past.length - 1];
    set((state) => ({
      past: state.past.slice(0, -1),
      future: [historySnapshot(state), ...state.future],
      nodes: previous.nodes.map((node) => ({ ...node, selected: false })),
      edges: previous.edges.map((edge) => ({ ...edge, selected: false })),
      run: structuredClone(previous.run),
      timeline: structuredClone(previous.timeline),
      activeWorkflowName: previous.activeWorkflowName,
      selectedNodeId: null,
      selectedEdgeId: null,
    }));
  },
  redo: () => {
    const { future, run } = get();
    if (!future.length || isRunActive(run)) return;
    const next = future[0];
    set((state) => ({
      past: [...state.past, historySnapshot(state)],
      future: state.future.slice(1),
      nodes: next.nodes.map((node) => ({ ...node, selected: false })),
      edges: next.edges.map((edge) => ({ ...edge, selected: false })),
      run: structuredClone(next.run),
      timeline: structuredClone(next.timeline),
      activeWorkflowName: next.activeWorkflowName,
      selectedNodeId: null,
      selectedEdgeId: null,
    }));
  },
  nodes: createSeedNodes(),
  edges: createSeedEdges(),
  selectedNodeId: null,
  selectedEdgeId: null,
  nodeDragInProgress: false,
  savedWorkflows: [],
  timeline: [],
  timelineFilter: 'all',
  run: blankRun(),
  activeWorkflowName: 'Example orchestration',
  toast: null,
  setAnnouncement: (msg) => set({ announcement: msg }),
  announcement: 'Example workflow ready',
  ui: {
    modal: null,
    modalNodeId: null,
    modalOpener: null,
    pendingWorkflowId: null,
    pendingImport: null,
    savedPanelOpen: true,
    paletteOpen: true,
    artifactOpen: false,
    artifactMode: 'json',
  },

  onNodesChange: (changes) => {
    const dragEnded = changes.some((change) => change.type === 'position' && change.dragging === false);
    const allowedChanges = isRunActive(get().run)
      ? changes.filter((change) => change.type === 'select' || change.type === 'dimensions')
      : changes;
    if (!allowedChanges.length) {
      if (dragEnded) set({ nodeDragInProgress: false });
      return;
    }
    const dragStarted = allowedChanges.some((change) => change.type === 'position' && change.dragging === true);
    if (dragStarted && !get().nodeDragInProgress) get().pushHistory();
    set((state) => {
      const nodes = applyNodeChanges(allowedChanges, state.nodes);
      const selectedNodeId = nodes.find((node) => node.selected)?.id || null;
      return {
        nodes,
        selectedNodeId,
        selectedEdgeId: selectedNodeId ? null : state.selectedEdgeId,
        nodeDragInProgress: dragEnded ? false : (dragStarted ? true : state.nodeDragInProgress),
      };
    });
  },
  onEdgesChange: (changes) => {
    const allowedChanges = isRunActive(get().run) ? changes.filter((change) => change.type === 'select') : changes;
    if (allowedChanges.length) set((state) => {
      const edges = applyEdgeChanges(allowedChanges, state.edges);
      const selectedEdgeId = edges.find((edge) => edge.selected)?.id || null;
      return {
        edges,
        selectedEdgeId,
        selectedNodeId: selectedEdgeId ? null : state.selectedNodeId,
      };
    });
  },

  selectNode: (id) => set((state) => ({
    selectedNodeId: id,
    selectedEdgeId: null,
    nodes: state.nodes.map((node) => ({ ...node, selected: node.id === id })),
    edges: state.edges.map((edge) => ({ ...edge, selected: false })),
  })),
  toggleNodeSelection: (id) => set((state) => {
    const nodes = state.nodes.map((node) => (node.id === id ? { ...node, selected: !node.selected } : node));
    const selectedIds = nodes.filter((node) => node.selected).map((node) => node.id);
    return {
      nodes,
      selectedNodeId: selectedIds[0] || null,
      selectedEdgeId: null,
      edges: state.edges.map((edge) => ({ ...edge, selected: false })),
    };
  }),
  setSelection: (nodeIds, edgeIds = []) => {
    const state = get();
    const nextNodes = [...nodeIds].sort().join('|');
    const nextEdges = [...edgeIds].sort().join('|');
    const currentNodes = state.nodes.filter((node) => node.selected).map((node) => node.id).sort().join('|');
    const currentEdges = state.edges.filter((edge) => edge.selected).map((edge) => edge.id).sort().join('|');
    if (nextNodes === currentNodes && nextEdges === currentEdges) return;
    const nodeSet = new Set(nodeIds);
    const edgeSet = new Set(edgeIds);
    set({
      selectedNodeId: nodeIds[0] || null,
      selectedEdgeId: edgeIds[0] || null,
      nodes: state.nodes.map((node) => ({ ...node, selected: nodeSet.has(node.id) })),
      edges: state.edges.map((edge) => ({ ...edge, selected: edgeSet.has(edge.id) })),
    });
  },
  selectEdge: (id) => set((state) => ({
    selectedNodeId: null,
    selectedEdgeId: id,
    nodes: state.nodes.map((node) => ({ ...node, selected: false })),
    edges: state.edges.map((edge) => ({ ...edge, selected: edge.id === id })),
  })),
  clearSelection: () => set((state) => ({
    selectedNodeId: null,
    selectedEdgeId: null,
    nodes: state.nodes.map((node) => ({ ...node, selected: false })),
    edges: state.edges.map((edge) => ({ ...edge, selected: false })),
  })),
  cycleNodeSelection: () => {
    const { nodes, selectedNodeId } = get();
    if (!nodes.length) return;
    const currentIndex = nodes.findIndex((node) => node.id === selectedNodeId);
    get().selectNode(nodes[(currentIndex + 1) % nodes.length].id);
  },

  showToast: (kind, message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: { kind, message, id: Date.now() } });
    toastTimer = setTimeout(() => set({ toast: null }), 4200);
  },
  dismissToast: () => set({ toast: null }),

  addNode: (type, position = null) => {
    if (!NODE_TYPES.includes(type)) return null;
    if (!get().pushHistory()) return null;
    const id = `${type.toLowerCase()}-${Date.now().toString(36)}`;
    const existing = get().nodes.length;
    const node = {
      id,
      type,
      position: position || { x: 80 + (existing % 4) * 240, y: 80 + Math.floor(existing / 4) * 190 },
      data: {
        title: `${type} ${existing + 1}`,
        config: structuredClone(DEFAULT_CONFIG[type]),
        status: null,
        attempt: 0,
        backoff: 0,
        error: '',
        input: null,
        output: null,
        startedAt: null,
        completedAt: null,
        expanded: false,
        justDropped: true,
      },
    };
    set((state) => ({ nodes: [...state.nodes.map((item) => ({ ...item, selected: false })), { ...node, selected: true }], selectedNodeId: id, selectedEdgeId: null }));
    setTimeout(() => set((state) => ({ nodes: state.nodes.map((item) => item.id === id ? { ...item, data: { ...item.data, justDropped: false } } : item) })), 450);
    return id;
  },

  addConnection: (connection, quiet = false) => {
    const state = get();
    const source = state.nodes.find((node) => node.id === connection.source);
    const target = state.nodes.find((node) => node.id === connection.target);
    if (!source || !target) {
      if (!quiet) get().showToast('error', 'Connection incompatible: both endpoints must be workflow nodes.');
      return false;
    }
    if (connection.sourceHandle && connection.sourceHandle !== 'out') {
      if (!quiet) get().showToast('error', 'Connection incompatible: start from an output handle.');
      return false;
    }
    if (connection.targetHandle && connection.targetHandle !== 'in') {
      if (!quiet) get().showToast('error', 'Connection incompatible: finish at an input handle.');
      return false;
    }
    if (!ALLOWED_CONNECTIONS.has(`${source.type}>${target.type}`)) {
      if (!quiet) get().showToast('error', `${source.type} output is incompatible with ${target.type} input.`);
      return false;
    }
    if (state.edges.some((edge) => edge.source === source.id && edge.target === target.id)) {
      if (!quiet) get().showToast('error', 'Connection incompatible: that edge already exists.');
      return false;
    }
    const edge = { ...connection, id: connection.id || `edge-${source.id}-${target.id}-${Date.now().toString(36)}`, sourceHandle: 'out', targetHandle: 'in', type: 'default', interactionWidth: 24 };
    if (!get().pushHistory()) return false;
    set((current) => ({ edges: addEdge(edge, current.edges) }));
    return true;
  },

  deleteSelected: () => {
    const state = get();
    const selectedNodeIds = new Set(state.nodes.filter((node) => node.selected).map((node) => node.id));
    const selectedEdgeIds = new Set(state.edges.filter((edge) => edge.selected).map((edge) => edge.id));
    if (state.selectedNodeId) selectedNodeIds.add(state.selectedNodeId);
    if (state.selectedEdgeId) selectedEdgeIds.add(state.selectedEdgeId);
    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return false;
    if (!get().pushHistory()) return false;
    set((current) => ({
      nodes: current.nodes.filter((node) => !selectedNodeIds.has(node.id)),
      edges: current.edges.filter((edge) => !selectedEdgeIds.has(edge.id) && !selectedNodeIds.has(edge.source) && !selectedNodeIds.has(edge.target)),
      selectedNodeId: null,
      selectedEdgeId: null,
    }));
    return true;
  },
  deleteObject: (kind, id) => {
    if (!get().pushHistory()) return false;
    if (kind === 'edge') set((state) => ({ edges: state.edges.filter((edge) => edge.id !== id), selectedEdgeId: null }));
    else set((state) => ({ nodes: state.nodes.filter((node) => node.id !== id), edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id), selectedNodeId: null }));
    return true;
  },
  updateNode: (id, values) => {
    if (!get().pushHistory()) return false;
    set((state) => ({
      nodes: state.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, title: values.title ?? node.data.title, config: { ...node.data.config, ...values.config } } } : node),
      announcement: 'Node configuration saved',
    }));
    return true;
  },
  toggleNodeExpanded: (id) => set((state) => ({ nodes: state.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, expanded: !node.data.expanded } } : node) })),

  openModal: (modal, options = {}) => set((state) => ({
    ui: {
      ...state.ui,
      modal,
      modalNodeId: options.nodeId || null,
      pendingWorkflowId: options.workflowId || state.ui.pendingWorkflowId,
      modalOpener: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    },
  })),
  closeModal: () => {
    const opener = get().ui.modalOpener;
    set((state) => ({ ui: { ...state.ui, modal: null, modalNodeId: null, modalOpener: null } }));
    queueMicrotask(() => {
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    });
  },
  toggleSavedPanel: () => set((state) => ({ ui: { ...state.ui, savedPanelOpen: !state.ui.savedPanelOpen } })),
  togglePalette: () => set((state) => ({ ui: { ...state.ui, paletteOpen: !state.ui.paletteOpen } })),
  toggleArtifactPanel: () => set((state) => ({ ui: { ...state.ui, artifactOpen: !state.ui.artifactOpen } })),
  setArtifactOpen: (artifactOpen) => set((state) => ({ ui: { ...state.ui, artifactOpen } })),
  applyResponsiveDefaults: (width) => set((state) => ({
    ui: {
      ...state.ui,
      savedPanelOpen: width <= 1024 ? false : state.ui.savedPanelOpen,
      paletteOpen: width <= 768 ? false : state.ui.paletteOpen,
    },
  })),
  setArtifactMode: (artifactMode) => set((state) => ({ ui: { ...state.ui, artifactMode } })),
  setTimelineFilter: (timelineFilter) => set({ timelineFilter }),

  getSaveRecord: (name) => {
    const state = get();
    return saveWorkflowSchema.parse({ name: name.trim(), nodes: state.nodes.map(toContractNode), edges: state.edges.map(toContractEdge) });
  },
  saveWorkflow: (name) => {
    const record = get().getSaveRecord(name);
    const saved = { ...structuredClone(record), savedId: `saved-${Date.now().toString(36)}` };
    const opener = get().ui.modalOpener;
    set((state) => ({
      savedWorkflows: [...state.savedWorkflows, saved],
      activeWorkflowName: record.name,
      announcement: `${record.name} saved`,
      ui: { ...state.ui, modal: null, modalOpener: null, savedPanelOpen: true },
    }));
    queueMicrotask(() => {
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    });
    return saved;
  },
  requestLoadWorkflow: (savedId) => set((state) => ({ ui: { ...state.ui, modal: 'confirm-load', pendingWorkflowId: savedId } })),
  confirmLoadWorkflow: () => {
    const state = get();
    const saved = state.savedWorkflows.find((workflow) => workflow.savedId === state.ui.pendingWorkflowId);
    if (!saved) return false;
    executionToken += 1;
    stopElapsed();
    set((current) => ({
      past: [],
      future: [],
      nodes: saved.nodes.map(fromContractNode),
      edges: saved.edges.map((edge) => ({ ...edge, type: 'default', interactionWidth: 24 })),
      selectedNodeId: null,
      selectedEdgeId: null,
      activeWorkflowName: saved.name,
      timeline: [],
      run: blankRun(),
      announcement: `${saved.name} loaded`,
      ui: { ...current.ui, modal: null, pendingWorkflowId: null },
    }));
    return true;
  },
  deleteSavedWorkflow: (savedId) => set((state) => ({ savedWorkflows: state.savedWorkflows.filter((workflow) => workflow.savedId !== savedId) })),

  exportDefinition: (savedId = null, { validate = true } = {}) => {
    const state = get();
    const saved = savedId ? state.savedWorkflows.find((item) => item.savedId === savedId) : null;
    const body = saved
      ? { name: saved.name, nodes: saved.nodes, edges: saved.edges }
      : { name: state.activeWorkflowName || 'Untitled workflow', nodes: state.nodes.map(toContractNode), edges: state.edges.map(toContractEdge) };
    const payload = { schemaVersion: 1, generatedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), ...structuredClone(body) };
    if (!validate || !payload.nodes.length) return payload;
    return workflowDefinitionSchema.parse(payload);
  },
  exportMermaid: (savedId = null) => {
    const definition = get().exportDefinition(savedId, { validate: false });
    if (!definition.nodes.length) return 'flowchart LR\n  empty["Empty canvas — add nodes to export Mermaid"]';
    return workflowToMermaid(definition);
  },
  prepareImport: (definition) => {
    const parsed = workflowDefinitionSchema.parse(definition);
    set((state) => ({
      ui: {
        ...state.ui,
        pendingImport: parsed,
        modal: 'confirm-import',
        modalOpener: document.activeElement instanceof HTMLElement ? document.activeElement : state.ui.modalOpener,
      },
    }));
    return parsed;
  },
  confirmImport: () => {
    const definition = get().ui.pendingImport;
    if (!definition) return false;
    if (!get().pushHistory()) return false;
    executionToken += 1;
    stopElapsed();
    const opener = get().ui.modalOpener;
    set((state) => ({
      nodes: definition.nodes.map(fromContractNode),
      edges: definition.edges.map((edge) => ({ ...edge, type: 'default', interactionWidth: 24 })),
      activeWorkflowName: definition.name,
      selectedNodeId: null,
      selectedEdgeId: null,
      timeline: [],
      run: blankRun(),
      announcement: `${definition.name} imported`,
      ui: { ...state.ui, pendingImport: null, modal: null, modalOpener: null, artifactOpen: true },
    }));
    queueMicrotask(() => {
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    });
    return true;
  },
  runSeededWorkflowDemo: async () => {
    const state = get();
    if (isRunActive(state.run)) {
      executionToken += 1;
      stopElapsed();
      set({ run: blankRun() });
    }
    const agent = state.nodes.find((node) => node.id === 'agent-1');
    if (agent && agent.data.config.agent !== 'Atlas Agent') {
      if (!get().updateNode('agent-1', { config: { ...agent.data.config, agent: 'Atlas Agent' } })) return false;
    }
    return get().startRun();
  },
  runRetryFromFailedDemo: async () => {
    const state = get();
    if (state.run.phase === 'failed') return get().retryFailed();
    if (isRunActive(state.run)) {
      executionToken += 1;
      stopElapsed();
      set({ run: blankRun() });
    }
    const agent = state.nodes.find((node) => node.id === 'agent-1' || node.type === 'Agent');
    if (agent) {
      if (!get().updateNode(agent.id, { config: { ...agent.data.config, agent: 'Faultline Agent' } })) return false;
    }
    return get().startRun();
  },

  appendEvent: (nodeId, event, status, detail = '') => set((state) => ({
    timeline: [...state.timeline, { id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, runId: state.run.runId, nodeId, nodeTitle: state.nodes.find((node) => node.id === nodeId)?.data.title || 'Deleted node', event, status, detail, timestamp: timestamp() }],
  })),
  setNodeExecution: (id, patch) => set((state) => ({ nodes: state.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, ...patch } } : node) })),

  startRun: async () => {
    const state = get();
    if (state.run.phase === 'running' || state.run.phase === 'pausing') return false;
    if (state.nodes.length === 0) {
      get().showToast('error', 'There is nothing to run.');
      set({ announcement: 'There is nothing to run. Drag a node from the palette onto the canvas to get started.' });
      return false;
    }
    const result = getTopologicalOrder(state.nodes, state.edges);
    if (result.error) {
      get().showToast('error', result.error);
      set({ announcement: result.error });
      return false;
    }
    executionToken += 1;
    const token = executionToken;
    stopElapsed();
    const startedAt = Date.now();
    const runId = `run-${startedAt}`;
    set((current) => ({
      nodes: current.nodes.map((node) => ({ ...freshNodeData(node), data: { ...freshNodeData(node).data, status: 'pending' } })),
      edges: current.edges.map((edge) => ({ ...edge, animated: false, data: { ...edge.data, active: false } })),
      run: { phase: 'running', runId, startedAt, elapsedMs: 0, pauseRequested: false, checkpointIndex: null, failedIndex: null, order: result.order },
      announcement: `Run started. 0 of ${current.nodes.length} nodes complete`,
    }));
    elapsedTimer = setInterval(() => {
      const run = get().run;
      if ((run.phase === 'running' || run.phase === 'pausing') && run.startedAt) set({ run: { ...run, elapsedMs: Date.now() - run.startedAt } });
    }, 250);
    await get().executeFrom(0, token);
    return true;
  },

  executeFrom: async (startIndex, token = executionToken) => {
    const order = get().run.order;
    for (let index = startIndex; index < order.length; index += 1) {
      if (token !== executionToken) return;
      const nodeId = order[index];
      const currentNode = get().nodes.find((node) => node.id === nodeId);
      if (!currentNode) continue;
      const input = simulatedInput(currentNode, get().nodes, get().edges);
      const maxAttempts = currentNode.type === 'Agent' ? 3 : 1;
      const failureCount = currentNode.type === 'Agent'
        ? (currentNode.data.config.agent === 'Faultline Agent' ? 3 : (currentNode.id === 'agent-1' && currentNode.data.config.agent === 'Atlas Agent' ? 2 : 0))
        : 0;
      let succeeded = false;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (token !== executionToken) return;
        const started = timestamp();
        get().setNodeExecution(nodeId, { status: 'running', attempt, backoff: 0, error: '', input, startedAt: currentNode.data.startedAt || started });
        get().appendEvent(nodeId, 'started', 'running', maxAttempts > 1 ? `Attempt ${attempt} of ${maxAttempts}` : 'Execution started');
        set({ announcement: `${currentNode.data.title} started${maxAttempts > 1 ? `, attempt ${attempt} of ${maxAttempts}` : ''}` });
        await wait(currentNode.type === 'Agent' ? 850 : 650);
        if (token !== executionToken) return;
        if (attempt <= failureCount) {
          if (attempt < maxAttempts) {
            let seconds = 2;
            get().appendEvent(nodeId, 'failed', 'failed', `Attempt ${attempt} failed with transient timeout`);
            get().setNodeExecution(nodeId, { status: 'retrying', attempt, backoff: seconds, error: 'Transient model timeout' });
            get().appendEvent(nodeId, 'retry scheduled', 'retrying', `Waiting ${seconds}s before retry ${attempt + 1} of ${maxAttempts}`);
            set({ announcement: `${currentNode.data.title} retrying, waiting ${seconds} seconds before retry ${attempt + 1} of ${maxAttempts}` });
            while (seconds > 0) {
              await wait(1000);
              if (token !== executionToken) return;
              seconds -= 1;
              get().setNodeExecution(nodeId, { backoff: seconds });
              if (seconds > 0) set({ announcement: `${currentNode.data.title} retry in ${seconds} second` });
            }
            continue;
          }
          const completedAt = timestamp();
          get().setNodeExecution(nodeId, { status: 'failed', attempt, backoff: 0, error: 'Model timed out after 3 attempts', completedAt });
          get().appendEvent(nodeId, 'failed', 'failed', 'Model timed out after 3 attempts');
          stopElapsed();
          const elapsedMs = Date.now() - get().run.startedAt;
          set((state) => ({ run: { ...state.run, phase: 'failed', failedIndex: index, checkpointIndex: index, elapsedMs }, announcement: `${currentNode.data.title} failed. Run stopped.` }));
          return;
        }
        const output = simulatedOutput(currentNode);
        const completedAt = timestamp();
        get().setNodeExecution(nodeId, { status: 'complete', attempt, backoff: 0, error: '', output, completedAt });
        set((state) => ({ edges: state.edges.map((edge) => edge.source === nodeId ? { ...edge, animated: true, data: { ...edge.data, active: true } } : edge) }));
        get().appendEvent(nodeId, 'completed', 'complete', output);
        set({ announcement: `${currentNode.data.title} complete` });
        succeeded = true;
        break;
      }
      if (!succeeded) return;
      if (get().run.pauseRequested) {
        stopElapsed();
        const elapsedMs = Date.now() - get().run.startedAt;
        const nextNodeId = order[index + 1] || nodeId;
        set((state) => ({ run: { ...state.run, phase: 'paused', pauseRequested: false, checkpointIndex: index + 1, elapsedMs }, announcement: `Run paused after ${currentNode.data.title}` }));
        get().appendEvent(nextNodeId, 'paused', 'paused', `Checkpoint after ${currentNode.data.title}`);
        return;
      }
    }
    stopElapsed();
    const run = get().run;
    const elapsedMs = Date.now() - run.startedAt;
    set({ run: { ...run, phase: 'complete', elapsedMs, checkpointIndex: null }, announcement: `Run complete. ${get().nodes.length} of ${get().nodes.length} nodes complete.` });
  },

  pauseRun: () => {
    const run = get().run;
    if (run.phase !== 'running') return false;
    set({ run: { ...run, phase: 'pausing', pauseRequested: true }, announcement: 'Pause requested. The active node will finish.' });
    return true;
  },
  resumeRun: async () => {
    const run = get().run;
    if (run.phase !== 'paused') return false;
    executionToken += 1;
    const token = executionToken;
    const resumedAt = Date.now();
    const adjustedStart = resumedAt - run.elapsedMs;
    const nodeId = run.order[run.checkpointIndex] || run.order.at(-1);
    set({ run: { ...run, phase: 'running', startedAt: adjustedStart, pauseRequested: false }, announcement: 'Run resumed' });
    get().appendEvent(nodeId, 'resumed', 'resumed', 'Continuing from saved checkpoint');
    elapsedTimer = setInterval(() => {
      const current = get().run;
      if ((current.phase === 'running' || current.phase === 'pausing') && current.startedAt) set({ run: { ...current, elapsedMs: Date.now() - current.startedAt } });
    }, 250);
    await get().executeFrom(run.checkpointIndex, token);
    return true;
  },
  retryFailed: async () => {
    const run = get().run;
    if (run.phase !== 'failed' || run.failedIndex == null) return false;
    executionToken += 1;
    const token = executionToken;
    const nodeIdsToReset = new Set(run.order.slice(run.failedIndex));
    const adjustedStart = Date.now() - run.elapsedMs;
    set((state) => ({
      nodes: state.nodes.map((node) => nodeIdsToReset.has(node.id) ? { ...freshNodeData(node), data: { ...freshNodeData(node).data, status: 'pending' } } : node),
      run: { ...state.run, phase: 'running', startedAt: adjustedStart, failedIndex: null, checkpointIndex: run.failedIndex, pauseRequested: false },
      announcement: `Retrying from ${state.nodes.find((node) => node.id === run.order[run.failedIndex])?.data.title}`,
    }));
    const failedNodeId = run.order[run.failedIndex];
    get().appendEvent(failedNodeId, 'resumed', 'resumed', 'Retrying from failed node; upstream outputs frozen');
    elapsedTimer = setInterval(() => {
      const current = get().run;
      if ((current.phase === 'running' || current.phase === 'pausing') && current.startedAt) set({ run: { ...current, elapsedMs: Date.now() - current.startedAt } });
    }, 250);
    await get().executeFrom(run.failedIndex, token);
    return true;
  },
}));

export function getRollup(state) {
  return {
    complete: state.nodes.filter((node) => node.data.status === 'complete').length,
    total: state.nodes.length,
    failures: state.nodes.filter((node) => node.data.status === 'failed').length,
    elapsedMs: state.run.elapsedMs,
  };
}
