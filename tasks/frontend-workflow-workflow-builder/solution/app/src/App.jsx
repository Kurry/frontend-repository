import {  useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Button,
  ClickableTile,
  InlineNotification,
  Modal,
  Select,
  SelectItem,
  Tag,
  TextArea,
  TextInput,
  ToastNotification,
} from '@carbon/react';
import {
  Add,
  Bot,
  CheckmarkFilled,
  ChevronDown,
  ChevronRight,
  Close,
  Code,
  ConditionPoint,
  Copy,
  DataConnected,
  Document,
  Download,
  ErrorFilled,
  Export,
  Filter,
  Flow,
  Menu,
  Pause,
  Play,
  Renew,
  Restart,
  Result,
  Save,
  Settings,
  TextShortParagraph,
  Time,
  TrashCan,
  Upload,
  Undo,
  Redo,
  WarningFilled,
} from '@carbon/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AGENTS,
  ALLOWED_CONNECTIONS,
  NODE_TYPES,
  PROMPTS,
  RUBRICS,
  TYPE_META,
  configSchemas,
  importFormSchema,
  saveFormSchema,
  summarizeConfig,
} from './workflow';
import { getRollup, useWorkflowStore } from './store';
import { registerWebMCPTools } from './webmcp';

const TYPE_ICONS = {
  Prompt: TextShortParagraph,
  Agent: Bot,
  Eval: CheckmarkFilled,
  Condition: ConditionPoint,
  Output: Result,
};

const STATUS_TAG = {
  pending: { type: 'gray', label: 'Pending' },
  running: { type: 'blue', label: 'Running' },
  retrying: { type: 'warm-gray', label: 'Retrying' },
  failed: { type: 'red', label: 'Failed' },
  complete: { type: 'green', label: 'Complete' },
};

function WorkflowNode({ id, type, data, selected }) {
  const openModal = useWorkflowStore((state) => state.openModal);
  const toggleNodeExpanded = useWorkflowStore((state) => state.toggleNodeExpanded);
  const Icon = TYPE_ICONS[type];
  const status = data.status ? STATUS_TAG[data.status] : null;
  const retryText = data.status === 'retrying'
    ? `Retrying · waiting ${data.backoff}s before retry ${data.attempt + 1} of 3`
    : null;

  return (
    <article
      className={`workflow-node nodrag ${selected ? 'is-selected' : ''} ${data.status === 'running' ? 'is-running' : ''} ${data.justDropped ? 'just-dropped' : ''}`}
      style={{ '--type-color': TYPE_META[type].color }}
      aria-label={`${type} node, ${data.title}${data.status ? `, ${data.status}` : ''}`}
      tabIndex={0}
      onDoubleClick={() => openModal('configure', { nodeId: id })}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.stopPropagation();
          openModal('configure', { nodeId: id });
        }
      }}
    >
      {type !== 'Prompt' && <Handle id="in" type="target" position={Position.Left} className="typed-handle input-handle" aria-label={`${type} input`} />}
      <div className="node-heading">
        <span className="node-icon" style={{ background: TYPE_META[type].soft, color: TYPE_META[type].color }}><Icon size={16} /></span>
        <span className="node-type">{type}</span>
        <Button hasIconOnly iconDescription={`Configure ${data.title}`} renderIcon={Settings} kind="ghost" size="sm" onClick={() => openModal('configure', { nodeId: id })} className="node-settings" />
      </div>
      <h3>{data.title}</h3>
      <div className="config-badge" title={summarizeConfig(type, data.config)}>{summarizeConfig(type, data.config)}</div>
      {status && (
        <div className="node-status-wrap">
          <Tag type={status.type} size="sm" className={`status-tag status-${data.status}`}>
            {data.status === 'running' && <span className="active-dot" aria-hidden="true" />}
            {data.status === 'retrying' && <Renew size={12} />}
            {data.status === 'failed' && <ErrorFilled size={12} />}
            {data.status === 'complete' && <CheckmarkFilled size={12} />}
            {status.label}{data.attempt > 1 && data.status !== 'retrying' ? ` · attempt ${data.attempt}/3` : ''}
          </Tag>
          {retryText && <p className="retry-copy">{retryText}</p>}
          {data.error && data.status === 'failed' && <p className="node-error">{data.error}</p>}
        </div>
      )}
      {data.status && data.status !== 'pending' && (
        <div className={`io-disclosure ${data.expanded ? 'open' : ''}`}>
          <button type="button" className="io-trigger nodrag" aria-expanded={data.expanded} onClick={() => toggleNodeExpanded(id)}>
            <ChevronRight size={14} /> Input & output
          </button>
          <div className="io-content">
            <div><span>Input</span><p>{data.input || 'No input recorded'}</p></div>
            <div><span>Output</span><p>{data.output || (data.error ? 'No output — execution failed' : 'Waiting for output')}</p></div>
          </div>
        </div>
      )}
      {type !== 'Output' && <Handle id="out" type="source" position={Position.Right} className="typed-handle output-handle" aria-label={`${type} output`} />}
    </article>
  );
}

const nodeTypes = Object.fromEntries(NODE_TYPES.map((type) => [type, WorkflowNode]));

function Palette({ open, onToggle }) {
  // landmark role region or aside

  const addNode = useWorkflowStore((state) => state.addNode);
  return (
    <aside className={`palette-panel ${open ? 'open' : 'closed'}`} aria-label="Node palette">
      <div className="panel-heading">
        <div><span className="eyebrow">BUILD</span><h2>Node palette</h2></div>
        <Button hasIconOnly iconDescription={open ? 'Collapse node palette' : 'Open node palette'} renderIcon={open ? Close : Menu} kind="ghost" size="sm" onClick={onToggle} />
      </div>
      {open && <p className="panel-description">Drag a building block onto the canvas.</p>}
      <div className="palette-items">
        {NODE_TYPES.map((type) => {
          const Icon = TYPE_ICONS[type];
          return (
            <div
              key={type}
              className="palette-item"
              style={{ '--type-color': TYPE_META[type].color, '--type-soft': TYPE_META[type].soft }}
              draggable
              role="button"
              tabIndex={0}
              aria-label={`Add ${type} node. Drag to position or press Enter to add.`}
              onDragStart={(event) => {
                event.dataTransfer.setData('application/orchestrate-node', type);
                event.dataTransfer.effectAllowed = 'move';
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  addNode(type);
                }
              }}
            >
              <span className="palette-icon"><Icon size={18} /></span>
              {open && <><span className="palette-label">{type}</span><Add size={16} className="palette-add" /></>}
            </div>
          );
        })}
      </div>
      {open && <div className="shortcut-note"><kbd>Alt</kbd> + <kbd>N</kbd><span>Cycle node selection</span></div>}
    </aside>
  );
}

function Toolbar() {
  const run = useWorkflowStore((state) => state.run);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  const canUndo = useWorkflowStore((state) => state.past.length > 0);
  const canRedo = useWorkflowStore((state) => state.future.length > 0);
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const startRun = useWorkflowStore((state) => state.startRun);
  const pauseRun = useWorkflowStore((state) => state.pauseRun);
  const resumeRun = useWorkflowStore((state) => state.resumeRun);
  const retryFailed = useWorkflowStore((state) => state.retryFailed);
  const openModal = useWorkflowStore((state) => state.openModal);
  const cycleNodeSelection = useWorkflowStore((state) => state.cycleNodeSelection);
  const deleteSelected = useWorkflowStore((state) => state.deleteSelected);
  const hasSelection = useWorkflowStore((state) => state.nodes.some(n => n.selected) || state.edges.some(e => e.selected) || state.selectedNodeId || state.selectedEdgeId);
  const rollup = getRollup({ nodes, run });
  const busy = run.phase === 'running' || run.phase === 'pausing';
  const historyLocked = busy || run.phase === 'paused';
  const elapsed = `${(rollup.elapsedMs / 1000).toFixed(1)}s`;

  return (
    <section className="workflow-toolbar" aria-label="Workflow controls">
      <div className="toolbar-actions">
        <Button kind="primary" size="sm" renderIcon={Play} onClick={startRun} disabled={busy}>Run</Button>
        {(run.phase === 'running' || run.phase === 'pausing') && <Button kind="secondary" size="sm" renderIcon={Pause} onClick={pauseRun} disabled={run.phase === 'pausing'}>{run.phase === 'pausing' ? 'Pausing…' : 'Pause'}</Button>}
        {run.phase === 'paused' && <Button kind="secondary" size="sm" renderIcon={Play} onClick={resumeRun}>Resume</Button>}
        {run.phase === 'failed' && <Button kind="danger--tertiary" size="sm" renderIcon={Restart} onClick={retryFailed}>Retry from failed node</Button>}
        <div className="toolbar-divider" />
        <Button kind="ghost" size="sm" renderIcon={Undo} onClick={undo} disabled={!canUndo || historyLocked} iconDescription="Undo (Ctrl+Z)" hasIconOnly />
        <Button kind="ghost" size="sm" renderIcon={Redo} onClick={redo} disabled={!canRedo || historyLocked} iconDescription="Redo (Ctrl+Y)" hasIconOnly />
        <Button kind="tertiary" size="sm" renderIcon={Save} onClick={() => openModal('save')}>Save</Button>
        <Button kind="ghost" size="sm" renderIcon={Export} onClick={() => openModal('artifact')}>Export</Button>
        <Button hasIconOnly iconDescription="Import workflow" renderIcon={Upload} kind="ghost" size="sm" onClick={() => openModal('import')} />
        <Button hasIconOnly iconDescription="Delete selected" renderIcon={TrashCan} kind="ghost" size="sm" onClick={deleteSelected} disabled={!hasSelection} />
        <Button hasIconOnly iconDescription="Cycle node selection (Alt+N)" renderIcon={DataConnected} kind="ghost" size="sm" onClick={cycleNodeSelection} />
      </div>
      <div className="rollup" aria-label={`${rollup.complete} of ${rollup.total} nodes complete, ${rollup.failures} failures, ${elapsed} elapsed`}>
        <div className="rollup-stat"><strong>{rollup.complete}/{rollup.total}</strong><span>complete</span></div>
        <div className="rollup-stat"><strong>{elapsed}</strong><span>elapsed</span></div>
        <div className={`rollup-stat ${rollup.failures ? 'has-failure' : ''}`}><strong>{rollup.failures}</strong><span>failed</span></div>
        <span className={`run-phase phase-${run.phase}`}>{run.phase === 'idle' ? 'Ready' : run.phase}</span>
      </div>
      <div className="graph-count" aria-label={`${nodes.length} nodes and ${edges.length} edges`}>{nodes.length} nodes · {edges.length} edges</div>
    </section>
  );
}

function Canvas() {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const addConnection = useWorkflowStore((state) => state.addConnection);
  const addNode = useWorkflowStore((state) => state.addNode);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  const selectEdge = useWorkflowStore((state) => state.selectEdge);
  const clearSelection = useWorkflowStore((state) => state.clearSelection);
  const openModal = useWorkflowStore((state) => state.openModal);
  const showToast = useWorkflowStore((state) => state.showToast);
  const { screenToFlowPosition } = useReactFlow();
  const validationToastAt = useRef(0);

  const isValidConnection = useCallback((connection) => {
    const state = useWorkflowStore.getState();
    const source = state.nodes.find((node) => node.id === connection.source);
    const target = state.nodes.find((node) => node.id === connection.target);
    const valid = source && target && connection.sourceHandle === 'out' && connection.targetHandle === 'in' && ALLOWED_CONNECTIONS.has(`${source.type}>${target.type}`);
    if (!valid && Date.now() - validationToastAt.current > 900) {
      validationToastAt.current = Date.now();
      const sourceLabel = source?.type || 'Unknown';
      const targetLabel = target?.type || 'unknown';
      showToast('error', `Connection incompatible: ${sourceLabel} output cannot connect to ${targetLabel} input.`);
    }
    return !!valid;
  }, [showToast]);

  const onConnectEnd = useCallback((_, connectionState) => {
    if (connectionState?.isValid) return;
    const fromType = connectionState?.fromHandle?.type;
    const toType = connectionState?.toHandle?.type;
    const sourceType = connectionState?.fromNode?.type || 'Unknown';
    const targetType = connectionState?.toNode?.type || 'unknown';
    if (fromType && toType && fromType === toType) {
      showToast('error', `Connection incompatible: cannot connect an ${fromType === 'source' ? 'output' : 'input'} handle to another ${fromType === 'source' ? 'output' : 'input'} handle.`);
    } else if (connectionState?.toNode) {
      showToast('error', `Connection incompatible: ${sourceType} output cannot connect to ${targetType} input.`);
    } else {
      showToast('error', 'Connection incompatible: drop the edge on a compatible input handle.');
    }
  }, [showToast]);

  const decoratedEdges = useMemo(() => edges.map((edge) => ({
    ...edge,
    style: { stroke: edge.selected ? '#0f62fe' : (edge.animated ? '#0f62fe' : '#8d8d8d'), strokeWidth: edge.selected ? 3 : 2 },
  })), [edges]);

  return (
    <div
      className="canvas-wrap"
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
      onDrop={(event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/orchestrate-node');
        if (NODE_TYPES.includes(type)) addNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={decoratedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={addConnection}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        connectionMode={ConnectionMode.Strict}
        onNodeClick={(_, node) => selectNode(node.id)}
        onNodeDoubleClick={(_, node) => openModal('configure', { nodeId: node.id })}
        onEdgeClick={(_, edge) => selectEdge(edge.id)}
        onPaneClick={clearSelection}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.35}
        maxZoom={1.8}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        aria-label="Workflow canvas"
      >
        <Background color="#b7c2ce" gap={20} size={1.2} variant={BackgroundVariant.Dots} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap position="bottom-right" pannable zoomable nodeColor={(node) => TYPE_META[node.type]?.color || '#8d8d8d'} />
      </ReactFlow>
      <div className="canvas-hint"><Flow size={14} /> Drag to pan · Scroll to zoom · Double-click to configure</div>
    </div>
  );
}

function SavedPanel() {
  const open = useWorkflowStore((state) => state.ui.savedPanelOpen);
  const saved = useWorkflowStore((state) => state.savedWorkflows);
  const toggle = useWorkflowStore((state) => state.toggleSavedPanel);
  const requestLoad = useWorkflowStore((state) => state.requestLoadWorkflow);
  const deleteSaved = useWorkflowStore((state) => state.deleteSavedWorkflow);
  return (
    <aside className={`saved-panel ${open ? 'open' : 'closed'}`} aria-label="Saved workflows">
      <div className="panel-heading">
        {open && <div><span className="eyebrow">LIBRARY</span><h2>Saved workflows</h2></div>}
        <Button hasIconOnly iconDescription={open ? 'Collapse saved workflows' : 'Open saved workflows'} renderIcon={open ? Close : Document} kind="ghost" size="sm" onClick={toggle} />
      </div>
      {open && (
        <div className="saved-content">
          <p className="panel-description">Session-only workflow snapshots.</p>
          {!saved.length && (
            <div className="empty-state"><Document size={24} /><strong>No saved workflows</strong><span>Use Save to create your first snapshot.</span></div>
          )}
          <div className="saved-list">
            {saved.map((workflow) => (
              <div className="saved-row" key={workflow.savedId}>
                <ClickableTile onClick={() => requestLoad(workflow.savedId)}>
                  <span className="saved-row-icon"><Flow size={16} /></span>
                  <span><strong>{workflow.name}</strong><small>{workflow.nodes.length} nodes · {workflow.edges.length} edges</small></span>
                  <ChevronRight size={16} />
                </ClickableTile>
                <Button hasIconOnly iconDescription={`Delete saved workflow ${workflow.name}`} renderIcon={TrashCan} kind="ghost" size="sm" onClick={() => deleteSaved(workflow.savedId)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function Timeline() {
  const timeline = useWorkflowStore((state) => state.timeline);
  const filter = useWorkflowStore((state) => state.timelineFilter);
  const setFilter = useWorkflowStore((state) => state.setTimelineFilter);
  const nodes = useWorkflowStore((state) => state.nodes);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  const { fitView } = useReactFlow();
  const filtered = filter === 'all' ? timeline : timeline.filter((event) => event.status === filter);
  const labels = { all: 'All', complete: 'Complete', failed: 'Failed', retrying: 'Retrying' };
  const eventIcon = (status) => {
    if (status === 'complete') return CheckmarkFilled;
    if (status === 'failed') return ErrorFilled;
    if (status === 'retrying') return Renew;
    if (status === 'paused') return Pause;
    return Time;
  };
  return (
    <section className="timeline-panel" aria-label="Execution event timeline">
      <div className="timeline-heading">
        <div><span className="eyebrow">OBSERVE</span><h2>Execution timeline</h2></div>
        <div className="timeline-filters" role="group" aria-label="Filter timeline by status">
          <Filter size={16} />
          {Object.entries(labels).map(([value, label]) => (
            <button key={value} type="button" className={`filter-chip ${filter === value ? 'active' : ''}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>
      </div>
      {!timeline.length && <div className="timeline-empty"><Time size={20} /><span>Run the workflow to see events appear here.</span></div>}
      {!!timeline.length && !filtered.length && <div className="timeline-empty"><Filter size={20} /><span>No {filter} events. Clear the filter to restore the full log.</span><Button kind="ghost" size="sm" onClick={() => setFilter('all')}>Clear filter</Button></div>}
      <div className="timeline-scroll">
        {filtered.map((event, index) => {
          const Icon = eventIcon(event.status);
          const nodeExists = nodes.some((node) => node.id === event.nodeId);
          return (
            <div
              role="button"
              tabIndex={nodeExists ? 0 : -1}
              aria-disabled={!nodeExists}
              className={`timeline-row status-${event.status}`}
              key={event.id}
              onClick={() => {
                if (!nodeExists) return;
                selectNode(event.nodeId);
                fitView({ nodes: [{ id: event.nodeId }], duration: 700, padding: 0.7, maxZoom: 1.15 });
              }}
              onKeyDown={(keyboardEvent) => {
                if (nodeExists && (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ')) {
                  keyboardEvent.preventDefault();
                  selectNode(event.nodeId);
                  fitView({ nodes: [{ id: event.nodeId }], duration: 700, padding: 0.7, maxZoom: 1.15 });
                }
              }}
              style={{ '--row-index': Math.min(index, 8) }}
              title={nodeExists ? `Select ${event.nodeTitle} on canvas` : 'This node has been deleted'}
            >
              <span className="timeline-icon"><Icon size={15} /></span>
              <span className="timeline-copy"><strong>{event.nodeTitle}</strong><span>{event.event} · {event.detail}</span></span>
              <Tag type={event.status === 'complete' ? 'green' : event.status === 'failed' ? 'red' : event.status === 'retrying' ? 'warm-gray' : 'cool-gray'} size="sm">{event.event}</Tag>
              <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ConfigurationModal() {
  const ui = useWorkflowStore((state) => state.ui);
  const node = useWorkflowStore((state) => state.nodes.find((item) => item.id === state.ui.modalNodeId));
  const close = useWorkflowStore((state) => state.closeModal);
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const schema = useMemo(() => node ? z.object({ title: z.string().trim().min(1, 'Display title is required'), config: configSchemas[node.type] }) : z.object({}), [node]);
  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    values: node ? { title: node.data.title, config: node.data.config } : {},
  });
  useEffect(() => {
    if (node) reset({ title: node.data.title, config: node.data.config });
  }, [node, reset]);
  if (!node) return null;
  const configErrors = errors.config || {};
  const submit = handleSubmit((values) => {
    if (updateNode(node.id, values)) close();
  });
  return (
    <Modal
      open={ui.modal === 'configure'}
      modalHeading={`Configure ${node.type} node`}
      modalLabel="Node configuration"
      primaryButtonText="Save configuration"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid}
      onRequestSubmit={submit}
      onRequestClose={close}
      selectorPrimaryFocus="#node-title"
      className="orchestrate-modal"
    >
      <form onSubmit={submit} className="modal-form" aria-live="polite">
        <TextInput id="node-title" labelText="Display title" invalid={!!errors.title} invalidText={errors.title?.message} {...register('title')} />
        {node.type === 'Prompt' && (
          <Select id="prompt-select" labelText="Prompt" invalid={!!configErrors.prompt} invalidText={configErrors.prompt?.message} {...register('config.prompt')}>
            {PROMPTS.map((prompt) => <SelectItem key={prompt} value={prompt} text={prompt} />)}
          </Select>
        )}
        {node.type === 'Agent' && <>
          <Select id="agent-select" labelText="Agent" invalid={!!configErrors.agent} invalidText={configErrors.agent?.message} {...register('config.agent')}>
            {AGENTS.map((agent) => <SelectItem key={agent} value={agent} text={agent} />)}
          </Select>
          <TextInput id="timeout-seconds" type="number" min={1} max={300} labelText="Timeout (seconds)" helperText="Required · 1 to 300 seconds" invalid={!!configErrors.timeoutSeconds} invalidText={configErrors.timeoutSeconds?.message} {...register('config.timeoutSeconds')} />
          {node.id === 'agent-1' && <InlineNotification lowContrast hideCloseButton kind="info" title="Retry demo enabled" subtitle="Atlas Agent fails twice, then succeeds on its third attempt. Faultline Agent exhausts all retries." />}
        </>}
        {node.type === 'Eval' && (
          <Select id="rubric-select" labelText="Rubric" invalid={!!configErrors.rubric} invalidText={configErrors.rubric?.message} {...register('config.rubric')}>
            {RUBRICS.map((rubric) => <SelectItem key={rubric} value={rubric} text={rubric} />)}
          </Select>
        )}
        {node.type === 'Condition' && <TextInput id="condition-expression" labelText="Condition expression" placeholder="score >= 0.8" invalid={!!configErrors.conditionExpression} invalidText={configErrors.conditionExpression?.message} {...register('config.conditionExpression')} />}
        {node.type === 'Output' && <TextInput id="destination-name" labelText="Destination name" placeholder="Review queue" invalid={!!configErrors.destinationName} invalidText={configErrors.destinationName?.message} {...register('config.destinationName')} />}
      </form>
    </Modal>
  );
}

function SaveModal() {
  const open = useWorkflowStore((state) => state.ui.modal === 'save');
  const close = useWorkflowStore((state) => state.closeModal);
  const saveWorkflow = useWorkflowStore((state) => state.saveWorkflow);
  const activeName = useWorkflowStore((state) => state.activeWorkflowName);
  const { register, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm({ resolver: zodResolver(saveFormSchema), mode: 'onChange', defaultValues: { name: '' } });
  useEffect(() => { if (open) reset({ name: activeName === 'Example orchestration' ? '' : activeName }); }, [open, activeName, reset]);
  const value = watch('name') || '';
  const empty = !value.trim();
  const submit = handleSubmit(({ name }) => saveWorkflow(name));
  return (
    <Modal open={open} modalHeading="Save workflow" modalLabel="Create an in-memory snapshot" primaryButtonText="Save workflow" secondaryButtonText="Cancel" primaryButtonDisabled={!isValid || empty} onRequestSubmit={submit} onRequestClose={close} selectorPrimaryFocus="#workflow-name">
      <form onSubmit={submit} className="modal-form" aria-live="polite">
        <TextInput id="workflow-name" labelText="Workflow name" placeholder="e.g. Customer response pipeline" invalid={empty || !!errors.name} invalidText={errors.name?.message || 'Workflow name is required'} {...register('name')} />
        <p className="form-footnote">Saved workflows live only in this browser session and include every current node and edge.</p>
      </form>
    </Modal>
  );
}

function ConfirmLoadModal() {
  const ui = useWorkflowStore((state) => state.ui);
  const saved = useWorkflowStore((state) => state.savedWorkflows.find((item) => item.savedId === state.ui.pendingWorkflowId));
  const close = useWorkflowStore((state) => state.closeModal);
  const confirm = useWorkflowStore((state) => state.confirmLoadWorkflow);
  return (
    <Modal danger open={ui.modal === 'confirm-load'} modalHeading="Replace the current canvas?" primaryButtonText="Load workflow" secondaryButtonText="Keep current canvas" onRequestSubmit={confirm} onRequestClose={close}>
      <p>Loading <strong>{saved?.name}</strong> replaces the current nodes and edges. Its execution state starts fresh.</p>
    </Modal>
  );
}

function ArtifactModal() {
  const open = useWorkflowStore((state) => state.ui.modal === 'artifact');
  const mode = useWorkflowStore((state) => state.ui.artifactMode);
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const activeName = useWorkflowStore((state) => state.activeWorkflowName);
  const close = useWorkflowStore((state) => state.closeModal);
  const setMode = useWorkflowStore((state) => state.setArtifactMode);
  const exportDefinition = useWorkflowStore((state) => state.exportDefinition);
  const exportMermaid = useWorkflowStore((state) => state.exportMermaid);
  const showToast = useWorkflowStore((state) => state.showToast);
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString());
  useEffect(() => { if (open) setGeneratedAt(new Date().toISOString()); }, [open, nodes, edges, activeName]);
  const content = useMemo(() => {
    if (!open) return '';
    if (mode === 'mermaid') return exportMermaid();
    const definition = exportDefinition();
    return JSON.stringify({ ...definition, generatedAt }, null, 2);
  }, [open, mode, nodes, edges, activeName, generatedAt, exportDefinition, exportMermaid]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(content); showToast('success', `${mode === 'json' ? 'JSON' : 'Mermaid'} copied to clipboard.`); }
    catch { showToast('error', 'Clipboard access was unavailable. Select the preview text to copy it.'); }
  };
  const download = () => {
    const blob = new Blob([content], { type: mode === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = mode === 'json' ? 'workflow.json' : 'workflow.mmd';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return (
    <Modal passiveModal open={open} modalHeading="Export workflow" modalLabel="Live artifact preview" onRequestClose={close} size="lg" className="artifact-modal">
      {nodes.length === 0 && <p className="empty-artifact-state">The canvas is empty. Add nodes from the palette to export a workflow.</p>}
      <div className="artifact-tabs" role="tablist" aria-label="Export format">
        <Button kind={mode === 'json' ? 'secondary' : 'ghost'} size="sm" renderIcon={Code} onClick={() => setMode('json')} role="tab" aria-selected={mode === 'json'}>JSON</Button>
        <Button kind={mode === 'mermaid' ? 'secondary' : 'ghost'} size="sm" renderIcon={Flow} onClick={() => setMode('mermaid')} role="tab" aria-selected={mode === 'mermaid'}>Mermaid</Button>
      </div>
      <pre className="artifact-preview" aria-label={`${mode} artifact preview`}>{content}</pre>
      <div className="artifact-actions">
        <Button kind="primary" size="sm" renderIcon={Download} onClick={download} disabled={nodes.length === 0}>{mode === 'json' ? 'Download workflow.json' : 'Download workflow.mmd'}</Button>
        <Button kind="tertiary" size="sm" renderIcon={Copy} onClick={copy} disabled={nodes.length === 0}>{mode === 'json' ? 'Copy JSON' : 'Copy Mermaid'}</Button>
      </div>
    </Modal>
  );
}

function ImportModal() {
  const open = useWorkflowStore((state) => state.ui.modal === 'import');
  const close = useWorkflowStore((state) => state.closeModal);
  const prepareImport = useWorkflowStore((state) => state.prepareImport);
  const [parseError, setParseError] = useState('');
  const { register, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm({ resolver: zodResolver(importFormSchema), mode: 'onChange', defaultValues: { definition: '' } });
  useEffect(() => { if (open) { reset({ definition: '' }); setParseError(''); } }, [open, reset]);
  const value = watch('definition') || '';
  const submit = handleSubmit(({ definition }) => {
    try { prepareImport(JSON.parse(definition)); setParseError(''); }
    catch (error) {
      const issue = error?.issues?.[0];
      setParseError(issue ? `Invalid workflow definition: ${issue.message}` : 'Invalid workflow definition: enter valid workflow JSON.');
    }
  });
  return (
    <Modal open={open} modalHeading="Import workflow definition" modalLabel="JSON · schema version 1" primaryButtonText="Review import" secondaryButtonText="Cancel" primaryButtonDisabled={!isValid || !value.trim()} onRequestSubmit={submit} onRequestClose={close} size="lg">
      <form onSubmit={submit} className="modal-form" aria-live="polite">
        <TextArea id="import-definition" rows={12} labelText="Workflow definition JSON" placeholder={'{\n  "schemaVersion": 1,\n  ...\n}'} invalid={!!errors.definition || !!parseError} invalidText={parseError || errors.definition?.message} {...register('definition')} />
        <p className="form-footnote">The canvas changes only after validation and confirmation.</p>
      </form>
    </Modal>
  );
}

function ConfirmImportModal() {
  const ui = useWorkflowStore((state) => state.ui);
  const close = useWorkflowStore((state) => state.closeModal);
  const confirm = useWorkflowStore((state) => state.confirmImport);
  const workflow = ui.pendingImport;
  return (
    <Modal danger open={ui.modal === 'confirm-import'} modalHeading="Import and replace the canvas?" primaryButtonText="Import workflow" secondaryButtonText="Cancel" onRequestSubmit={confirm} onRequestClose={close}>
      <p><strong>{workflow?.name}</strong> contains {workflow?.nodes.length || 0} nodes and {workflow?.edges.length || 0} edges. Current unsaved canvas changes will be replaced.</p>
    </Modal>
  );
}

function ToastLayer() {
  const toast = useWorkflowStore((state) => state.toast);
  const dismiss = useWorkflowStore((state) => state.dismissToast);
  if (!toast) return null;
  return <div className="toast-layer"><ToastNotification lowContrast kind={toast.kind} title={toast.kind === 'error' ? 'Action unavailable' : 'Done'} subtitle={toast.message} timeout={0} onCloseButtonClick={dismiss} /></div>;
}

function App() {
  const [coachmarkVisible, setCoachmarkVisible] = useState(true);
  const paletteOpen = useWorkflowStore((state) => state.ui.paletteOpen);
  const togglePalette = useWorkflowStore((state) => state.togglePalette);
  const announcement = useWorkflowStore((state) => state.announcement);
  const activeName = useWorkflowStore((state) => state.activeWorkflowName);
  const activeModal = useWorkflowStore((state) => state.ui.modal);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const hasSelection = useWorkflowStore((state) => state.nodes.some((node) => node.selected) || state.edges.some((edge) => edge.selected) || state.selectedNodeId || state.selectedEdgeId);
  const cycleNodeSelection = useWorkflowStore((state) => state.cycleNodeSelection);
  const deleteSelected = useWorkflowStore((state) => state.deleteSelected);
  const openModal = useWorkflowStore((state) => state.openModal);
  const applyResponsiveDefaults = useWorkflowStore((state) => state.applyResponsiveDefaults);

  useEffect(() => { registerWebMCPTools(); }, []);
  useEffect(() => {
    const apply = () => applyResponsiveDefaults(window.innerWidth);
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [applyResponsiveDefaults]);
  useEffect(() => {
    const onKeyDown = (event) => {
      const element = event.target;
      const typing = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element?.isContentEditable;
      if (event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        cycleNodeSelection();
        return;
      }
      if (typing || activeModal) return;
      if ((event.key === 'Delete' || event.key === 'Backspace') && hasSelection) {
        event.preventDefault();
        deleteSelected();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) useWorkflowStore.getState().redo(); else useWorkflowStore.getState().undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        useWorkflowStore.getState().redo();
        return;
      }
      if (event.key === 'Enter' && selectedNodeId) {
        event.preventDefault();
        openModal('configure', { nodeId: selectedNodeId });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, cycleNodeSelection, deleteSelected, hasSelection, openModal, selectedNodeId]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark"><Flow size={20} /></div>
        <h1 className="brand-copy"><strong>Orchestrate</strong><span>Studio</span></h1>
        <div className="header-divider" />
        <div className="workflow-identity"><span className="live-dot" />{activeName}</div>
        <div className="header-meta">AI agent workspace</div>
      </header>
      <main className="workspace">
        <Palette open={paletteOpen} onToggle={togglePalette} />
        <div className="center-column">
          <Toolbar />
          {coachmarkVisible && <div className="coachmark"><InlineNotification kind="info" title="Welcome to Orchestrate Studio" subtitle="Drag a Prompt node from the palette to begin, or click Import to load an existing workflow. Run the orchestration using the toolbar." hideCloseButton={false} onCloseButtonClick={() => setCoachmarkVisible(false)} /></div>}
          <Canvas />
          <Timeline />
        </div>
        <SavedPanel />
      </main>
      <ConfigurationModal />
      <SaveModal />
      <ConfirmLoadModal />
      <ArtifactModal />
      <ImportModal />
      <ConfirmImportModal />
      <ToastLayer />
      <div className="sr-only" aria-live="assertive" aria-atomic="true">{announcement}</div>
    </div>
  );
}

export default App;
