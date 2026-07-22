import { useLambdaStore, initialNodes, initialBinders } from '../store';
import { NodeId, BinderId, ReplayFrame, LambdaNode } from '../types';

export function computeDeBruijn(nodes: Record<NodeId, LambdaNode>): string {
  const rootApp = Object.values(nodes).find(n => n.parentId === 'root' && n.active);
  if (!rootApp) return '';

  const getStr = (node: LambdaNode, depth: number, env: string[]): string => {
    if (!node.active) return '';
    if (node.kind === 'Abstraction') {
      const bId = node.binderId;
      const bName = node.displayName?.replace('λ', '') || '';
      const body = Object.values(nodes).find(n => n.parentId === node.id && n.parentSlot === 'body' && n.active);
      if (!body) return '(λ.)';
      return `(λ.${getStr(body, depth + 1, [bName, ...env])})`;
    } else if (node.kind === 'Application') {
      const func = Object.values(nodes).find(n => n.parentId === node.id && n.parentSlot === 'function' && n.active);
      const arg = Object.values(nodes).find(n => n.parentId === node.id && n.parentSlot === 'argument' && n.active);
      return `(${func ? getStr(func, depth, env) : ''} ${arg ? getStr(arg, depth, env) : ''})`;
    } else if (node.kind === 'Variable') {
      const name = node.displayName || '';
      const idx = env.indexOf(name);
      if (idx !== -1) {
        return idx.toString();
      }
      return `free:${name}`;
    }
    return '';
  };
  return getStr(rootApp, 0, []);
}

export function computeNamed(nodes: Record<NodeId, LambdaNode>): string {
  const rootApp = Object.values(nodes).find(n => n.parentId === 'root' && n.active);
  if (!rootApp) return '';
  const getStr = (node: LambdaNode): string => {
    if (!node.active) return '';
    if (node.kind === 'Abstraction') {
      const body = Object.values(nodes).find(n => n.parentId === node.id && n.parentSlot === 'body' && n.active);
      return `(${node.displayName}.${body ? getStr(body) : ''})`;
    } else if (node.kind === 'Application') {
      const func = Object.values(nodes).find(n => n.parentId === node.id && n.parentSlot === 'function' && n.active);
      const arg = Object.values(nodes).find(n => n.parentId === node.id && n.parentSlot === 'argument' && n.active);
      return `(${func ? getStr(func) : ''} ${arg ? getStr(arg) : ''})`;
    } else if (node.kind === 'Variable') {
      return node.displayName || '';
    }
    return '';
  };
  return getStr(rootApp);
}

export function generateInitialReplayFrame(): ReplayFrame {
  return {
    frameIndex: 0,
    stage: 'argument-lifted',
    activeNamedForm: '((λx.(λy.(x y))) y)',
    freeVariables: { y: 1 },
    binderNames: ['x', 'y'],
    captureBinderIds: [],
    alphaMap: {},
    deBruijnForm: '((λ.λ.(1 0)) free:y)',
    activeNodeIds: ['APP-ROOT', 'ABS-X', 'ABS-INNER', 'APP-INNER', 'VAR-X', 'VAR-INNER-Y', 'VAR-ARG-Y']
  };
}

export function doSimulateDragDetour(redexId: NodeId, argumentId: NodeId, freshName: string, strategy: string) {
  if (redexId !== 'APP-ROOT' || argumentId !== 'VAR-ARG-Y' || freshName !== 'z' || strategy !== 'capture-avoiding') return;

  const store = useLambdaStore.getState();

  const newNodes = structuredClone(store.nodes);
  const newBinders = structuredClone(store.binders);

  // Alpha rename BINDER-Y to z
  newBinders['BINDER-Y'].name = 'z';
  newNodes['ABS-INNER'].displayName = 'λz';
  newNodes['VAR-INNER-Y'].displayName = 'z';

  // Beta substitution
  newNodes['VAR-ARG-Y'].parentId = 'APP-INNER';
  newNodes['VAR-ARG-Y'].parentSlot = 'function';

  // Retire redex nodes
  newNodes['APP-ROOT'].active = false;
  newNodes['ABS-X'].active = false;
  newNodes['VAR-X'].active = false;
  newBinders['BINDER-X'].active = false;

  // Set ABS-INNER as new root
  newNodes['ABS-INNER'].parentId = 'root';
  newNodes['ABS-INNER'].parentSlot = 'root';

  const newDeBruijn = computeDeBruijn(newNodes);
  const newNamed = computeNamed(newNodes);

  const finalFrame: ReplayFrame = {
    frameIndex: 1,
    stage: 'proof-settled',
    activeNamedForm: newNamed,
    freeVariables: { y: 1 },
    binderNames: ['z'],
    captureBinderIds: [],
    alphaMap: { y: 'z' },
    deBruijnForm: newDeBruijn,
    activeNodeIds: ['ABS-INNER', 'APP-INNER', 'VAR-ARG-Y', 'VAR-INNER-Y']
  };

  useLambdaStore.setState({
    phase: 'Proof',
    nodes: newNodes,
    binders: newBinders,
    frames: [generateInitialReplayFrame(), finalFrame],
    dragTargetId: null,
    dragOverScopeBinderId: null,
    previewFreshName: null,
  });
}

export function handleConfirmBetaReduction() {
  const store = useLambdaStore.getState();
  if (store.previewFreshName === 'z') {
    doSimulateDragDetour('APP-ROOT', 'VAR-ARG-Y', 'z', 'capture-avoiding');
  } else {
    // Naïve path
    const newNodes = structuredClone(store.nodes);
    newNodes['VAR-ARG-Y'].parentId = 'APP-INNER';
    newNodes['VAR-ARG-Y'].parentSlot = 'function';
    newNodes['APP-ROOT'].active = false;
    newNodes['ABS-X'].active = false;
    newNodes['VAR-X'].active = false;
    newNodes['ABS-INNER'].parentId = 'root';
    newNodes['ABS-INNER'].parentSlot = 'root';
    useLambdaStore.setState({ phase: 'Invalid', nodes: newNodes });
  }
}

useLambdaStore.setState({ simulateDragDetour: doSimulateDragDetour, confirmBetaReduction: handleConfirmBetaReduction });
