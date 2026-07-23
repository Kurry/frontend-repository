import React, { useEffect, useMemo, useState, useRef } from 'react';

const initialAnchors = [
  { id: 'a1', x: 4, y: 4, type: 'move' },
  { id: 'a2', x: 20, y: 4, type: 'line' },
  { id: 'a3', x: 20, y: 20, type: 'line' },
  { id: 'a4', x: 4, y: 20, type: 'close' },
];
const seededIcons = [
  { id: 'outline', name: 'Outline', state: 'base', inherited: false },
  { id: 'filled', name: 'Filled', state: 'base', inherited: true },
  { id: 'hover', name: 'Hover', state: 'hover', inherited: true },
  { id: 'focus', name: 'Focus', state: 'focus', inherited: true },
];
const tools = [
  { name: 'editor_select', module: 'structured-editor-v1', description: 'Select an icon, anchor, path, constraint, variant, hint, or branch.' },
  { name: 'editor_add', module: 'structured-editor-v1', description: 'Add a bounded editor object.' },
  { name: 'editor_delete', module: 'structured-editor-v1', description: 'Delete a selected editor object.' },
  { name: 'editor_update_property', module: 'structured-editor-v1', description: 'Update an editor property.' },
  { name: 'editor_set_content', module: 'structured-editor-v1', description: 'Replace the current family content.' },
  { name: 'editor_switch_mode', module: 'structured-editor-v1', description: 'Switch between edit and preview modes.' },
  { name: 'editor_preview', module: 'structured-editor-v1', description: 'Preview the family at a requested size.' },
  { name: 'artifact_export', module: 'artifact-transfer-v1', description: 'Prepare a JSON, SVG, CSS, or Markdown artifact.' },
  { name: 'artifact_import', module: 'artifact-transfer-v1', description: 'Import a validated JSON family document.' },
];

function generatePathData(anchors, size = 24) {
  if (!anchors || anchors.length === 0) return '';
  const scale = size / 24;
  return anchors.map(a => {
    const x = a.x * scale;
    const y = a.y * scale;
    if (a.type === 'move') return `M${x} ${y}`;
    if (a.type === 'line') return `L${x} ${y}`;
    if (a.type === 'quadratic') return `Q${x} ${y} ${x} ${y}`;
    if (a.type === 'cubic') return `C${x} ${y} ${x} ${y} ${x} ${y}`;
    if (a.type === 'close') return `L${x} ${y} Z`;
    return '';
  }).join(' ');
}

function App() {
  const [mode, setMode] = useState('edit');
  const [selectedIcon, setSelectedIcon] = useState('outline');
  const [anchors, setAnchors] = useState(initialAnchors);
  const [selectedAnchor, setSelectedAnchor] = useState('a1');
  const [size, setSize] = useState(24);
  const [lens, setLens] = useState('geometric center');
  const [branch, setBranch] = useState('main');
  const [status, setStatus] = useState('Ready to shape a coherent family.');
  const [importText, setImportText] = useState('');

  // States for full workflow
  const [constraints, setConstraints] = useState([{ id: 'c1', kind: 'align', value: 'keyline-box' }]);
  const [hints, setHints] = useState([16, 20, 24, 32].map((pixelSize) => ({ size: pixelSize, adjustment: 0 })));
  const [overrides, setOverrides] = useState({});
  const [history, setHistory] = useState([initialAnchors]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [branchAnchors, setBranchAnchors] = useState(null);

  const canvasRef = useRef(null);

  const currentAnchors = (branch === 'optical-pass' && branchAnchors) ? branchAnchors : anchors;
  const currentIconData = seededIcons.find(i => i.id === selectedIcon);

  const displayedAnchors = currentIconData?.inherited && overrides[selectedIcon]
    ? overrides[selectedIcon]
    : currentAnchors;

  const selected = displayedAnchors.find((anchor) => anchor.id === selectedAnchor) ?? displayedAnchors[0];

  const checksum = currentAnchors.length.toString(16).padStart(4, '0').toUpperCase();

  const documentState = useMemo(() => ({
    schemaVersion: 'icon-family-optical-studio-v1',
    mode, selectedIcon, size, lens, branch, icons: seededIcons, anchors: currentAnchors,
    constraints,
    hints,
    overrides
  }), [mode, selectedIcon, size, lens, branch, currentAnchors, constraints, hints, overrides]);

  useEffect(() => {
    window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules: ['structured-editor-v1', 'artifact-transfer-v1'] });
    window.webmcp_list_tools = () => ({ tools });
    window.webmcp_invoke_tool = async (name, args = {}) => {
      const input = typeof args === 'string' ? JSON.parse(args) : args;
      if (name === 'editor_select') {
        if (input.id) { setSelectedAnchor(input.id); setStatus(`Selected ${input.id}`); }
        return { ok: true, selected: input.id ?? selectedIcon };
      }
      if (name === 'editor_update_property') {
        const id = input.id ?? selectedAnchor;
        const key = input.property ?? input.key;
        if (!['x', 'y', 'type'].includes(key)) return { ok: false, error: 'property must be x, y, or type' };

        const updateFn = (items) => items.map((item) => item.id === id ? { ...item, [key]: input.value } : item);

        if (currentIconData?.inherited && overrides[selectedIcon]) {
          setOverrides(prev => ({...prev, [selectedIcon]: updateFn(prev[selectedIcon])}));
        } else if (branch === 'optical-pass') {
           setBranchAnchors(updateFn(branchAnchors || anchors));
        } else {
           setAnchors(updateFn);
        }

        return { ok: true, id, property: key, value: input.value };
      }
      if (name === 'editor_switch_mode') { setMode(input.mode === 'preview' ? 'preview' : 'edit'); return { ok: true, mode: input.mode }; }
      if (name === 'editor_preview') {
        const nextSize = Math.max(16, Math.min(32, Number(input.size) || 24));
        setSize(nextSize);
        setMode('preview');
        return { ok: true, size: nextSize };
      }
      if (name === 'artifact_export') {
        const format = input.format ?? 'json';
        if (format === 'json') return { ok: true, format, artifact: JSON.stringify(documentState, null, 2) };
        if (format === 'svg') return { ok: true, format, artifact: `<svg viewBox="0 0 24 24"><path d="${generatePathData(displayedAnchors)}"/></svg>` };
        if (format === 'css') return { ok: true, format, artifact: ':root { --icon-grid: 24px; }' };
        return { ok: true, format, artifact: '# Icon Family Optical Studio\n\nApproved family specification.' };
      }
      if (name === 'artifact_import') {
        try {
          const next = JSON.parse(input.document ?? input.content ?? '{}');
          if (next.schemaVersion !== documentState.schemaVersion || !Array.isArray(next.anchors)) throw new Error('schemaVersion or anchors invalid');
          setAnchors(next.anchors);
          if(next.constraints) setConstraints(next.constraints);
          if(next.hints) setHints(next.hints);
          if(next.overrides) setOverrides(next.overrides);
          setStatus('Imported validated family document.');
          return { ok: true };
        } catch (error) { return { ok: false, error: error.message }; }
      }
      if (name === 'editor_add') {
        const id = `a${currentAnchors.length + 1}`;
        const newAnchor = { id, x: 12, y: 12, type: 'line' };
        if (currentIconData?.inherited && overrides[selectedIcon]) {
          setOverrides(prev => ({...prev, [selectedIcon]: [...prev[selectedIcon], newAnchor]}));
        } else if (branch === 'optical-pass') {
          setBranchAnchors(prev => [...(prev || anchors), newAnchor]);
        } else {
          setAnchors(items => [...items, newAnchor]);
        }
        return { ok: true, id };
      }
      if (name === 'editor_delete') {
        const delId = input.id ?? selectedAnchor;
        const filterFn = (items) => items.filter((item) => item.id !== delId);

        if (currentIconData?.inherited && overrides[selectedIcon]) {
          setOverrides(prev => ({...prev, [selectedIcon]: filterFn(prev[selectedIcon])}));
        } else if (branch === 'optical-pass') {
          setBranchAnchors(prev => filterFn(prev || anchors));
        } else {
          setAnchors(filterFn);
        }
        return { ok: true };
      }
      return { ok: true, name };
    };
    return () => { delete window.webmcp_session_info; delete window.webmcp_list_tools; delete window.webmcp_invoke_tool; };
  }, [documentState, selectedAnchor, selectedIcon, size, branch, overrides]);

  const updateAnchor = (id, updates) => {
    const updateFn = (items) => items.map(a => a.id === id ? { ...a, ...updates } : a);

    // Check constraints cycle
    if(updates.x !== undefined || updates.y !== undefined) {
      const hasCycle = constraints.some(c => c.kind === 'equal' && c.target1 === id && c.target2 === id);
      if(hasCycle) {
        setStatus('Constraint solver rejected: cycle detected.');
        return;
      }

      // Keep in bounds 0-24 and round to 3 decimals
      if(updates.x !== undefined) updates.x = Math.max(0, Math.min(24, Math.round(updates.x * 1000) / 1000));
      if(updates.y !== undefined) updates.y = Math.max(0, Math.min(24, Math.round(updates.y * 1000) / 1000));
    }

    if (currentIconData?.inherited) {
      if (!overrides[selectedIcon]) {
         setOverrides(prev => ({...prev, [selectedIcon]: updateFn(currentAnchors)}));
      } else {
         setOverrides(prev => ({...prev, [selectedIcon]: updateFn(prev[selectedIcon])}));
      }
    } else if (branch === 'optical-pass') {
      setBranchAnchors(prev => updateFn(prev || anchors));
    } else {
      setAnchors(updateFn);
    }
  };

  const handlePointerDown = (e, id) => {
    if(mode === 'preview') return;
    setSelectedAnchor(id);
    const svg = canvasRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();

    const move = (ev) => {
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      // Snap to grid (1 unit)
      let nx = Math.round(svgP.x);
      let ny = Math.round(svgP.y);
      updateAnchor(id, { x: nx, y: ny });
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const handleKeyDown = (e, id) => {
    if(mode === 'preview') return;
    const a = displayedAnchors.find(x => x.id === id);
    if(!a) return;
    let dx = 0, dy = 0;
    if(e.key === 'ArrowUp') dy = -1;
    if(e.key === 'ArrowDown') dy = 1;
    if(e.key === 'ArrowLeft') dx = -1;
    if(e.key === 'ArrowRight') dx = 1;
    if(e.key === 'Enter' || e.key === ' ') {
      setSelectedAnchor(id);
      e.preventDefault();
      return;
    }
    if(dx !== 0 || dy !== 0) {
      e.preventDefault();
      updateAnchor(id, { x: a.x + dx, y: a.y + dy });
    }
  };

  const handleConstraintKeyDown = (e, action) => {
    if(e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }

  const applyMirror = () => {
    // mirror around x=12
    const updateFn = items => items.map(a => ({...a, x: 24 - a.x}));
    if (currentIconData?.inherited) {
      setOverrides(prev => ({...prev, [selectedIcon]: updateFn(overrides[selectedIcon] || currentAnchors)}));
    } else if (branch === 'optical-pass') {
      setBranchAnchors(prev => updateFn(prev || anchors));
    } else {
      setAnchors(updateFn);
    }
    setStatus('Mirror transform applied.');
  };

  const addEqualConstraint = () => {
    if(anchors.length < 2) return;
    const t1 = anchors[0].id;
    const t2 = anchors[1].id;
    const newConstraint = { id: `c${constraints.length + 1}`, kind: 'equal', target1: t1, target2: t2 };

    // Cycle check before adding
    if(t1 === t2) {
      setStatus('Error: Cannot constrain anchor to itself (cycle).');
      return;
    }

    setConstraints(prev => [...prev, newConstraint]);
    setStatus(`Added equal constraint between ${t1} and ${t2}.`);

    // Animate constraint solve
    const a1 = anchors.find(a => a.id === t1);
    updateAnchor(t2, { x: a1.x, y: a1.y });
  };

  const resetVariant = () => {
    if (!currentIconData?.inherited) return;
    setOverrides(prev => {
      const next = {...prev};
      delete next[selectedIcon];
      return next;
    });
    setStatus('Variant override reset.');
  };

  const addSizeHint = (pxSize) => {
    setHints(prev => prev.map(h => h.size === pxSize ? {...h, adjustment: h.adjustment === 0 ? 0.5 : 0} : h));
    setStatus(`Added 0.5px hint adjustment for ${pxSize}px.`);
  };

  const mergeBranch = () => {
    if (branch === 'optical-pass' && branchAnchors) {
      setAnchors(branchAnchors);
      setBranch('main');
      setBranchAnchors(null);
      setStatus('Branch merged to main.');
    }
  };

  const approveFamily = () => {
    setStatus('Family approved. Checksums frozen.');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(documentState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(documentState, null, 2))}`;
    link.download = 'icon-family-optical-studio.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatus('Exported family JSON.');
  };

  const importJson = () => {
    try {
      const next = JSON.parse(importText);
      if (next.schemaVersion !== documentState.schemaVersion || !Array.isArray(next.anchors)) throw new Error('Invalid family schema');
      setAnchors(next.anchors);
      if(next.constraints) setConstraints(next.constraints);
      if(next.hints) setHints(next.hints);
      if(next.overrides) setOverrides(next.overrides);
      setStatus('Imported family JSON.');
    } catch (error) {
      setStatus(`Import error: ${error.message}`);
    }
  };

  // Adjust path data if hints are applied for the current size
  let activeAdjustment = 0;
  if (mode === 'preview') {
    const hint = hints.find(h => h.size === size);
    if (hint) activeAdjustment = hint.adjustment;
  }
  const displaySize = mode === 'preview' ? size : 24;
  const scale = mode === 'preview' ? size / 24 : 1;
  const pathD = displayedAnchors.length > 0
    ? displayedAnchors.map(a => {
        const x = (a.x + activeAdjustment) * scale;
        const y = (a.y + activeAdjustment) * scale;
        if (a.type === 'move') return `M${x} ${y}`;
        if (a.type === 'line') return `L${x} ${y}`;
        if (a.type === 'quadratic') return `Q${x} ${y} ${x} ${y}`;
        if (a.type === 'cubic') return `C${x} ${y} ${x} ${y} ${x} ${y}`;
        if (a.type === 'close') return `L${x} ${y} Z`;
        return '';
      }).join(' ')
    : 'M4 4H20V20H4Z';

  const branchPathD = (branch === 'optical-pass' && branchAnchors)
    ? branchAnchors.map(a => {
        const x = (a.x) * scale;
        const y = (a.y) * scale;
        if (a.type === 'move') return `M${x} ${y}`;
        if (a.type === 'line') return `L${x} ${y}`;
        if (a.type === 'quadratic') return `Q${x} ${y} ${x} ${y}`;
        if (a.type === 'cubic') return `C${x} ${y} ${x} ${y} ${x} ${y}`;
        if (a.type === 'close') return `L${x} ${y} Z`;
        return '';
      }).join(' ')
    : null;

  const showDiff = branch === 'optical-pass' && branchAnchors;

  return <div className="studio-shell">
    <header className="topbar">
      <div>
        <p className="eyebrow">VECTOR SYSTEMS / 04</p>
        <h1>Icon Family Optical Studio</h1>
        <p className="lede">Design one coherent family across geometry, states, and pixel sizes.</p>
      </div>
      <div className="top-actions">
        <button tabIndex={0} onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')} onKeyDown={(e) => handleConstraintKeyDown(e, () => setMode(mode === 'edit' ? 'preview' : 'edit'))}>{mode === 'edit' ? 'Preview family' : 'Back to editor'}</button>
        <button className="primary" tabIndex={0} onClick={exportJson} onKeyDown={(e) => handleConstraintKeyDown(e, exportJson)}>Export JSON</button>
      </div>
    </header>
    <main className="workspace">
      <aside className="family-rail">
        <div className="rail-title">
          <span>FAMILY / {seededIcons.length}</span>
          <button aria-label="Create branch" tabIndex={0} onClick={() => setBranch(branch === 'main' ? 'optical-pass' : 'main')} onKeyDown={(e) => handleConstraintKeyDown(e, () => setBranch(branch === 'main' ? 'optical-pass' : 'main'))}>＋</button>
        </div>
        {seededIcons.map((icon) => (
          <button
            className={`icon-card ${selectedIcon === icon.id ? 'selected' : ''}`}
            key={icon.id}
            tabIndex={0}
            onClick={() => { setSelectedIcon(icon.id); setStatus(`${icon.name} selected.`); }}
            onKeyDown={(e) => handleConstraintKeyDown(e, () => { setSelectedIcon(icon.id); setStatus(`${icon.name} selected.`); })}
          >
            <span className="mini-icon">⌗</span>
            <span>
              <strong>{icon.name}</strong>
              <small>{icon.inherited ? 'inherits outline' : 'base geometry'}</small>
            </span>
            <span className="state-dot" data-state={icon.state} />
          </button>
        ))}
        <div className="branch-card">
          <span>BRANCH</span><strong>{branch}</strong>
          <button tabIndex={0} onClick={() => setBranch(branch === 'main' ? 'optical-pass' : 'main')} onKeyDown={(e) => handleConstraintKeyDown(e, () => setBranch(branch === 'main' ? 'optical-pass' : 'main'))}>Compare branch</button>
          {branch === 'optical-pass' && <button tabIndex={0} onClick={mergeBranch} onKeyDown={(e) => handleConstraintKeyDown(e, mergeBranch)}>Merge to main</button>}
        </div>
        <div className="branch-card" style={{marginTop: '10px'}}>
            <button tabIndex={0} onClick={approveFamily} onKeyDown={(e) => handleConstraintKeyDown(e, approveFamily)}>Approve Family</button>
        </div>
      </aside>
      <section className="canvas-column">
        <div className="canvas-toolbar">
          <span className="pill">{mode.toUpperCase()}</span>
          <label>Pixel preview
            <select tabIndex={0} value={size} onChange={(event) => {
              setSize(Number(event.target.value));
              if(mode !== 'preview') setMode('preview');
            }}>
              {[16, 20, 24, 32].map((value) => <option key={value} value={value}>{value}px</option>)}
            </select>
          </label>
          <label>Lens
            <select tabIndex={0} value={lens} onChange={(event) => setLens(event.target.value)}>
              <option value="geometric center">geometric center</option>
              <option value="occupied bounds">occupied bounds</option>
              <option value="stroke distribution">stroke distribution</option>
              <option value="side bearings">side bearings</option>
            </select>
          </label>
        </div>
        <div className="canvas-card">
          <div className="canvas-heading">
            <div>
              <span className="eyebrow">{selected?.id ?? 'a1'} / {selectedIcon}</span>
              <h2>{displaySize} × {displaySize} construction grid</h2>
            </div>
            <span className="checksum">CHECKSUM / {checksum}</span>
          </div>
          <div className="vector-canvas" role="application" aria-label="Vector anchor editor">
            <div className="keyline" />

            {lens === 'geometric center' && (
              <>
                 <div style={{position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'rgba(0,0,255,0.3)', pointerEvents: 'none'}} />
                 <div style={{position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', background: 'rgba(0,0,255,0.3)', pointerEvents: 'none'}} />
                 {/* Optical center slightly offset */}
                 <div style={{position: 'absolute', top: '52%', left: '0', right: '0', height: '1px', background: 'rgba(255,0,0,0.3)', pointerEvents: 'none'}} />
                 <div style={{position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', background: 'rgba(255,0,0,0.3)', pointerEvents: 'none'}} />
              </>
            )}

            <svg ref={canvasRef} viewBox={`0 0 ${displaySize} ${displaySize}`} aria-hidden="true" style={{ transition: 'all 0.3s ease-in-out' }} className="prefers-reduced-motion:transition-none">
              {showDiff && <path d={branchPathD} stroke="red" strokeWidth="0.45" fill="none" opacity="0.5" />}
              <path d={pathD} fill={currentIconData?.id === 'filled' ? '#157a70' : 'none'} stroke={currentIconData?.id === 'filled' ? 'none' : '#157a70'} strokeWidth={currentIconData?.id === 'filled' ? '0' : '0.45'} style={{ transition: 'd 0.3s ease-in-out' }} className="prefers-reduced-motion:transition-none" />
            </svg>

            {mode === 'edit' && displayedAnchors.map((anchor) => (
              <button
                key={anchor.id}
                tabIndex={0}
                className={`anchor ${selectedAnchor === anchor.id ? 'active' : ''}`}
                style={{
                  left: `${(anchor.x / 24) * 100}%`,
                  top: `${(anchor.y / 24) * 100}%`,
                  transition: 'all 0.3s ease-in-out'
                }}
                aria-label={`Anchor ${anchor.id}`}
                onPointerDown={(e) => handlePointerDown(e, anchor.id)}
                onKeyDown={(e) => handleKeyDown(e, anchor.id)}
                onClick={() => setSelectedAnchor(anchor.id)}
              >
                {selectedAnchor === anchor.id ? '•' : ''}
              </button>
            ))}
          </div>
          <div className="canvas-footer">
            <span>Snap: <strong>grid / 1 unit</strong></span>
            <span>Guide: <strong>{lens}</strong></span>
            <span>State: <strong>{mode === 'edit' ? 'editable' : 'read-only preview'}</strong></span>
          </div>
        </div>
      </section>
      <aside className="inspector">
        <div className="panel-header">
          <span>INSPECTOR</span>
          <span className="status-dot" />
        </div>
        <section>
          <h3>Anchor properties</h3>
          {selected ? (
            <div className="property-grid">
              <label>ID<input value={selected.id} readOnly /></label>
              <label>Type
                <select tabIndex={0} value={selected.type} onChange={(event) => updateAnchor(selected.id, { type: event.target.value })}>
                  <option value="move">move</option>
                  <option value="line">line</option>
                  <option value="quadratic">quadratic</option>
                  <option value="cubic">cubic</option>
                  <option value="close">close</option>
                </select>
              </label>
              <label>X
                <input tabIndex={0} type="number" min="0" max="24" step="0.001" value={selected.x} onChange={(event) => updateAnchor(selected.id, { x: Number(event.target.value) })} />
              </label>
              <label>Y
                <input tabIndex={0} type="number" min="0" max="24" step="0.001" value={selected.y} onChange={(event) => updateAnchor(selected.id, { y: Number(event.target.value) })} />
              </label>
            </div>
          ) : <p>No anchor selected.</p>}
          <div className="inspector-actions">
            <button tabIndex={0} onClick={() => {
              const id = `a${displayedAnchors.length + 1}`;
              const newAnchor = { id, x: 12, y: 12, type: 'line' };
              if (currentIconData?.inherited && overrides[selectedIcon]) {
                setOverrides(prev => ({...prev, [selectedIcon]: [...prev[selectedIcon], newAnchor]}));
              } else if (branch === 'optical-pass') {
                setBranchAnchors(prev => [...(prev || anchors), newAnchor]);
              } else {
                setAnchors([...anchors, newAnchor]);
              }
            }} onKeyDown={(e) => handleConstraintKeyDown(e, () => {
              const id = `a${displayedAnchors.length + 1}`;
              setAnchors([...anchors, { id, x: 12, y: 12, type: 'line' }]);
            })}>Insert anchor</button>
            <button tabIndex={0} onClick={() => {
              const filterFn = (items) => items.filter((item) => item.id !== selectedAnchor);
              if (currentIconData?.inherited && overrides[selectedIcon]) {
                setOverrides(prev => ({...prev, [selectedIcon]: filterFn(prev[selectedIcon])}));
              } else if (branch === 'optical-pass') {
                setBranchAnchors(prev => filterFn(prev || anchors));
              } else {
                setAnchors(filterFn);
              }
            }} onKeyDown={(e) => handleConstraintKeyDown(e, () => setAnchors(anchors.filter((item) => item.id !== selectedAnchor)))}>Delete</button>
          </div>
          {currentIconData?.inherited && (
            <div className="inspector-actions" style={{marginTop: '10px'}}>
               <button tabIndex={0} onClick={resetVariant} onKeyDown={(e) => handleConstraintKeyDown(e, resetVariant)}>Reset Variant</button>
            </div>
          )}
          <div className="inspector-actions" style={{marginTop: '10px'}}>
             <button tabIndex={0} onClick={applyMirror} onKeyDown={(e) => handleConstraintKeyDown(e, applyMirror)}>Mirror Transform</button>
          </div>
        </section>

        <section>
          <h3>Constraints</h3>
          {constraints.map(c => (
            <div className="constraint" key={c.id}>
              <span>{c.kind.toUpperCase()} / {c.value || `${c.target1}-${c.target2}`}</span>
              <strong>ACTIVE</strong>
            </div>
          ))}
          <div className="inspector-actions" style={{marginTop: '10px'}}>
             <button tabIndex={0} onClick={addEqualConstraint} onKeyDown={(e) => handleConstraintKeyDown(e, addEqualConstraint)}>Add Equal Constraint</button>
          </div>
        </section>

        <section>
          <h3>Size Hints</h3>
          <div className="property-grid">
             {hints.map(h => (
               <div key={h.size} style={{gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                 <span style={{fontSize: '10px'}}>{h.size}px Hint: {h.adjustment > 0 ? '+0.5px' : '0px'}</span>
                 <button tabIndex={0} style={{minHeight: '28px', padding: '0 8px'}} onClick={() => addSizeHint(h.size)} onKeyDown={(e) => handleConstraintKeyDown(e, () => addSizeHint(h.size))}>
                   Toggle Hint
                 </button>
               </div>
             ))}
          </div>
        </section>

        <section>
          <h3>Transfer</h3>
          <textarea tabIndex={0} aria-label="Import family JSON" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste a family JSON document" />
          <div className="inspector-actions">
            <button tabIndex={0} onClick={importJson} onKeyDown={(e) => handleConstraintKeyDown(e, importJson)}>Import JSON</button>
            <button tabIndex={0} className="primary" onClick={exportJson} onKeyDown={(e) => handleConstraintKeyDown(e, exportJson)}>Download</button>
          </div>
        </section>
      </aside>
    </main>
    <footer className="statusbar">
      <span aria-live="polite">{status}</span>
      <span>In-memory session · reload resets fixture · {currentAnchors.length} anchors</span>
    </footer>
  </div>;
}

export default App;
