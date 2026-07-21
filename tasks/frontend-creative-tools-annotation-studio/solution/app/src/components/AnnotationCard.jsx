import { useEffect, useMemo, useRef, useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  ActionableNotification, Button, Checkbox, CodeSnippet, Dropdown, InlineNotification, Select, SelectItem,
  Slider, TextArea, TextInput, Tile,
} from '@carbon/react';
import {
  ThumbsUp, ThumbsDown, ZoomIn, ZoomOut, FitToScreen, PanHorizontal,
  Cursor_1, TrashCan, Checkmark,
} from '@carbon/icons-react';
import { AnnotationCreateSchema, validateMetadata } from '../schemas';
import { useStudioStore } from '../store';
import { ClassIcon } from '../icons';
import { StateChip } from './Sidebar';

function RatingControls({ rating, onChange, readOnly = false }) {
  return <div className="rating-controls" role="group" aria-label="Binary rating">
    <button type="button" disabled={readOnly} className={rating === 'up' ? 'selected' : ''} aria-pressed={rating === 'up'} onClick={() => onChange('up')}><ThumbsUp size={22} /><span>Up</span></button>
    <button type="button" disabled={readOnly} className={rating === 'down' ? 'selected' : ''} aria-pressed={rating === 'down'} onClick={() => onChange('down')}><ThumbsDown size={22} /><span>Down</span></button>
  </div>;
}

function RegionWorkspace({ item, draft }) {
  const taxonomy = useStudioStore((s) => s.taxonomy);
  const storedUi = useStudioStore((s) => s.regionUi[item.id]);
  const selectedRegionId = useStudioStore((s) => s.selectedRegionId);
  const updateUi = useStudioStore((s) => s.updateRegionUi);
  const addRegion = useStudioStore((s) => s.addRegion);
  const deleteRegion = useStudioStore((s) => s.deleteRegion);
  const selectRegion = useStudioStore((s) => s.selectRegion);
  const updateAttributes = useStudioStore((s) => s.updateRegionAttributes);
  const [drawing, setDrawing] = useState(null);
  const [regionError, setRegionError] = useState('');
  const viewportRef = useRef(null);
  const panRef = useRef(null);
  const anchorRef = useRef(null);
  const drawingRef = useRef(null);
  const [layerRef] = useAutoAnimate();
  const [listRef] = useAutoAnimate();
  const ui = storedUi || { zoom: 1, panX: 0, panY: 0, tool: 'draw', armedClassId: taxonomy[0]?.id };
  const armed = taxonomy.find((cls) => cls.id === ui.armedClassId) || taxonomy[0];
  const selected = draft.regions.find((region) => region.id === selectedRegionId);

  useEffect(() => {
    const handler = (event) => {
      const tag = event.target?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || event.metaKey || event.ctrlKey || event.altKey) return;
      const cls = taxonomy.find((entry) => entry.shortcut === event.key);
      if (cls) updateUi(item.id, { armedClassId: cls.id, tool: 'draw' });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [taxonomy, item.id, updateUi]);

  const point = (event) => {
    const rect = viewportRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(640, ((event.clientX - rect.left - ui.panX) / (rect.width * ui.zoom)) * 640)),
      y: Math.max(0, Math.min(360, ((event.clientY - rect.top - ui.panY) / (rect.height * ui.zoom)) * 360)),
    };
  };
  const commitDrawing = (rect) => { drawingRef.current = rect; setDrawing(rect); };
  const pointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* capture is best-effort */ }
    if (ui.tool === 'pan') {
      panRef.current = { x: event.clientX, y: event.clientY, panX: ui.panX, panY: ui.panY };
      return;
    }
    const start = point(event);
    anchorRef.current = start;
    commitDrawing({ x: start.x, y: start.y, w: 0, h: 0 });
  };
  const pointerMove = (event) => {
    if (panRef.current) {
      updateUi(item.id, { panX: panRef.current.panX + event.clientX - panRef.current.x, panY: panRef.current.panY + event.clientY - panRef.current.y });
      return;
    }
    const anchor = anchorRef.current;
    if (!anchor) return;
    const current = point(event);
    commitDrawing({ x: Math.min(anchor.x, current.x), y: Math.min(anchor.y, current.y), w: Math.abs(current.x - anchor.x), h: Math.abs(current.y - anchor.y) });
  };
  const pointerUp = () => {
    panRef.current = null;
    const anchor = anchorRef.current;
    const rect = drawingRef.current;
    anchorRef.current = null;
    drawingRef.current = null;
    if (!anchor || !rect) return;
    if (rect.w < 8 || rect.h < 8) {
      setRegionError('Region discarded: width and height must each be at least 8 image pixels.');
      setDrawing(null);
      return;
    }
    const attributeValues = Object.fromEntries((armed?.attributes || []).map((attribute) => [attribute.name, attribute.kind === 'select' ? attribute.options[0] : '']));
    const result = addRegion(item.id, { classId: armed.id, x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.w), h: Math.round(rect.h), attributeValues });
    setRegionError(result.ok ? '' : result.error);
    setDrawing(null);
  };
  const boxStyle = (region) => ({ left: `${(region.x / 640) * 100}%`, top: `${(region.y / 360) * 100}%`, width: `${(region.w / 640) * 100}%`, height: `${(region.h / 360) * 100}%`, borderColor: taxonomy.find((c) => c.id === region.classId)?.color || '#6f6f6f' });
  return <section className="region-section" aria-label="Image region annotation">
    <div className="region-toolbar">
      <Dropdown id={`class-picker-${item.id}`} titleText="Armed class" label="Choose a class" items={taxonomy} selectedItem={armed} itemToString={(entry) => entry?.name || ''} onChange={({ selectedItem }) => updateUi(item.id, { armedClassId: selectedItem.id, tool: 'draw' })} />
      <div className="zoom-tools">
        <Button hasIconOnly kind={ui.tool === 'draw' ? 'primary' : 'ghost'} size="sm" renderIcon={Cursor_1} iconDescription="Draw regions" onClick={() => updateUi(item.id, { tool: 'draw' })} />
        <Button hasIconOnly kind={ui.tool === 'pan' ? 'primary' : 'ghost'} size="sm" renderIcon={PanHorizontal} iconDescription="Pan image" onClick={() => updateUi(item.id, { tool: 'pan' })} />
        <Button hasIconOnly kind="ghost" size="sm" renderIcon={ZoomOut} iconDescription="Zoom out" onClick={() => updateUi(item.id, { zoom: Math.max(0.75, ui.zoom - 0.25) })} />
        <span>{Math.round(ui.zoom * 100)}%</span>
        <Button hasIconOnly kind="ghost" size="sm" renderIcon={ZoomIn} iconDescription="Zoom in" onClick={() => updateUi(item.id, { zoom: Math.min(2.5, ui.zoom + 0.25) })} />
        <Button hasIconOnly kind="ghost" size="sm" renderIcon={FitToScreen} iconDescription="Fit image" onClick={() => updateUi(item.id, { zoom: 1, panX: 0, panY: 0 })} />
      </div>
    </div>
    <p className="region-help"><ClassIcon name={armed?.icon} /> {armed?.name} is armed · drag on the image to draw · shortcut {armed?.shortcut}</p>
    <div className="region-layout">
      <div ref={viewportRef} className={`image-viewport tool-${ui.tool}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
        <div className="image-transform" style={{ transform: `translate(${ui.panX}px, ${ui.panY}px) scale(${ui.zoom})` }}>
          <img src={item.image} alt="Warehouse evaluation scene for region labeling" draggable="false" />
          <div className="region-layer" ref={layerRef}>
            {draft.regions.map((region) => {
              const cls = taxonomy.find((c) => c.id === region.classId);
              return <button key={region.id} type="button" aria-label={`Select ${cls?.name || 'Unclassified'} region`} className={`region-box ${region.id === selectedRegionId ? 'selected' : ''}`} style={boxStyle(region)} onPointerDown={(e) => e.stopPropagation()} onClick={() => selectRegion(region.id)}><span style={{ background: cls?.color || '#6f6f6f' }}>{cls?.name || 'Unclassified'}</span></button>;
            })}
          </div>
          {drawing && <div className="region-box drawing" style={boxStyle({ ...drawing, classId: armed.id })} />}
        </div>
      </div>
      <div className="region-list" aria-label="Region list" ref={listRef}>
        <h3>Regions <span>{draft.regions.length}</span></h3>
        {draft.regions.map((region) => {
          const cls = taxonomy.find((c) => c.id === region.classId);
          return <div key={region.id} className={`region-row ${region.id === selectedRegionId ? 'selected' : ''}`} style={{ '--class-color': cls?.color || '#6f6f6f' }} onClick={() => selectRegion(region.id)}>
            <ClassIcon name={cls?.icon} /><span><strong>{cls?.name || 'Unclassified'}</strong><small>{Math.round(region.w)} × {Math.round(region.h)} at {Math.round(region.x)}, {Math.round(region.y)}</small>{Object.entries(region.attributeValues).map(([key, value]) => <em key={key}>{key}: {String(value)}</em>)}</span>
            <Button hasIconOnly kind="ghost" size="sm" renderIcon={TrashCan} iconDescription={`Delete ${cls?.name || 'Unclassified'} region`} onClick={(event) => { event.stopPropagation(); deleteRegion(item.id, region.id); }} />
          </div>;
        })}
        {!draft.regions.length && <p className="empty-mini">No regions yet. Arm a class, then drag a box on the image.</p>}
        {selected && (() => {
          const cls = taxonomy.find((c) => c.id === selected.classId);
          return <div className="attribute-form"><h4>{cls?.name} attributes</h4>{cls?.attributes.length ? cls.attributes.map((attribute) => attribute.kind === 'select'
            ? <Select key={attribute.name} id={`${selected.id}-${attribute.name}`} labelText={attribute.name} value={selected.attributeValues[attribute.name] || ''} onChange={(e) => updateAttributes(item.id, selected.id, { ...selected.attributeValues, [attribute.name]: e.target.value })}>{attribute.options.map((option) => <SelectItem key={option} value={option} text={option} />)}</Select>
            : <TextInput key={attribute.name} id={`${selected.id}-${attribute.name}`} labelText={attribute.name} maxLength={120} value={selected.attributeValues[attribute.name] || ''} onChange={(e) => updateAttributes(item.id, selected.id, { ...selected.attributeValues, [attribute.name]: e.target.value })} />) : <p className="empty-mini">This class has no attributes.</p>}</div>;
        })()}
      </div>
    </div>
    {regionError && <InlineNotification lowContrast kind="error" title="Region invalid" subtitle={regionError} hideCloseButton />}
  </section>;
}

function MetadataControls({ itemId, draft }) {
  const fields = useStudioStore((s) => s.metadataFields);
  const update = useStudioStore((s) => s.updateMetadataValue);
  return <section className="metadata-controls"><h3>Custom metadata</h3><div className="metadata-grid">{fields.map((field) => {
    const value = draft.metadata[field.name];
    if (field.kind === 'select') return <Select key={field.id} id={`${itemId}-${field.id}`} labelText={field.name} value={value} onChange={(e) => update(itemId, field.name, e.target.value)}>{field.options.map((option) => <SelectItem key={option} value={option} text={option} />)}</Select>;
    if (field.kind === 'checkbox') return <Checkbox key={field.id} id={`${itemId}-${field.id}`} labelText={field.name} checked={Boolean(value)} onChange={(event, data) => update(itemId, field.name, data?.checked ?? event.target.checked)} />;
    const invalid = field.kind === 'number' && (typeof value !== 'number' || !Number.isFinite(value));
    return <TextInput key={field.id} id={`${itemId}-${field.id}`} type={field.kind === 'number' ? 'number' : 'text'} labelText={field.name} value={value} invalid={invalid} invalidText={`${field.name} must be a finite number`} onChange={(e) => update(itemId, field.name, field.kind === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} />;
  })}</div></section>;
}

export default function AnnotationCard() {
  const itemId = useStudioStore((s) => s.activeItemId);
  const item = useStudioStore((s) => itemId ? s.items[itemId] : null);
  const draft = useStudioStore((s) => itemId ? s.drafts[itemId] : null);
  const suites = useStudioStore((s) => s.suites);
  const suite = useStudioStore((s) => s.suites.find((entry) => entry.id === s.activeSuiteId));
  const metadataFields = useStudioStore((s) => s.metadataFields);
  const updateDraft = useStudioStore((s) => s.updateDraft);
  const updateScore = useStudioStore((s) => s.updateScore);
  const submit = useStudioStore((s) => s.submitAnnotation);
  const skip = useStudioStore((s) => s.skipItems);
  const accept = useStudioStore((s) => s.acceptSuggestion);
  const selectSuite = useStudioStore((s) => s.selectSuite);
  const setView = useStudioStore((s) => s.setView);
  const [error, setError] = useState('');
  const [transitionKey, setTransitionKey] = useState(0);

  const validation = useMemo(() => {
    if (!draft) return { valid: false };
    const payload = { rating: draft.rating, scores: draft.scores, comment: draft.comment, metadata: draft.metadata, regions: draft.regions.map(({ id, ...region }) => region) };
    const schemaValid = AnnotationCreateSchema.safeParse(payload).success;
    const metadataValid = !validateMetadata(draft.metadata, metadataFields);
    return { valid: schemaValid && metadataValid && Object.values(draft.touchedScores).every(Boolean) };
  }, [draft, metadataFields]);

  if (!item || !draft) return <div className="empty-state"><div className="empty-mark"><Checkmark size={36} /></div><p className="eyebrow">Suite complete</p><h2>{suite?.name} is complete</h2><p>Every output in this suite has an annotation. Pick another suite to keep labeling, or review the work this suite produced.</p><div className="empty-actions"><Select id="switch-suite" labelText="Switch suite" value="" onChange={(e) => e.target.value && selectSuite(e.target.value)}><SelectItem value="" text="Choose a suite" disabled />{suites.map((entry) => <SelectItem key={entry.id} value={entry.id} text={entry.name} />)}</Select><Button kind="tertiary" onClick={() => setView('review-queue')}>Open Review queue</Button><Button kind="secondary" onClick={() => setView('export')}>Open Export</Button></div></div>;
  const onSubmit = () => {
    const result = submit(item.id);
    if (!result.ok) setError(result.error);
    else { setError(''); setTransitionKey((key) => key + 1); }
  };
  return <article key={`${item.id}-${transitionKey}`} className="annotation-card card-enter">
    <header className="card-header"><div><p className="eyebrow">{suite?.name} · {item.id}</p><h1>{item.title}</h1></div><StateChip state={item.review_state} /></header>
    {item.suggested && !item.suggestionAccepted && <ActionableNotification inline lowContrast kind="info" role="status" title="Suggested rating available" subtitle={`${item.suggested.rating === 'up' ? 'Up' : 'Down'} · Accuracy ${item.suggested.scores.Accuracy}, Clarity ${item.suggested.scores.Clarity}, Relevance ${item.suggested.scores.Relevance}`} actionButtonLabel="Accept suggestion" onActionButtonClick={() => accept(item.id)} hideCloseButton />}
    <section className="prompt-section"><h2>Original prompt</h2><CodeSnippet type="multi" hideCopyButton>{item.prompt}</CodeSnippet></section>
    {item.image && <RegionWorkspace item={item} draft={draft} />}
    <section className="response-section"><h2>Model response</h2><Tile className="response-tile">{item.response}</Tile></section>
    <section className="rating-section"><div><h2>Binary rating</h2><p>Choose the overall evaluation outcome.</p></div><RatingControls rating={draft.rating} onChange={(rating) => updateDraft(item.id, { rating })} /></section>
    <section className="rubric-section"><h2>Rubric scores</h2><p className="rubric-help">Move each slider or focus it and use the arrow keys to confirm all three scores.</p><div className="rubric-grid">{Object.keys(draft.scores).map((key) => <div className="rubric-row" key={key} onPointerDown={() => updateScore(item.id, key, draft.scores[key])}>
      <div><strong>{key}</strong><span>{draft.touchedScores[key] ? 'Scored' : 'Move slider to confirm'}</span></div>
      <Slider id={`${item.id}-${key}`} labelText={`${key} score`} hideLabel min={1} max={5} step={1} value={draft.scores[key]} hideTextInput onChange={({ value }) => updateScore(item.id, key, Number(value))} />
      <output key={`${key}-${draft.scores[key]}`} className="score-pop" aria-label={`${key} score`}>{draft.scores[key]}</output>
    </div>)}</div></section>
    <section className="comment-section"><TextArea id={`${item.id}-comment`} labelText="Annotator comments (optional)" maxLength={500} value={draft.comment} onChange={(event) => updateDraft(item.id, { comment: event.target.value.slice(0, 500) })} /><span className="char-counter">{500 - draft.comment.length} remaining</span></section>
    <MetadataControls itemId={item.id} draft={draft} />
    {error && <InlineNotification lowContrast kind="error" title="Annotation invalid" subtitle={error} hideCloseButton />}
    <footer className="card-actions"><Button kind="secondary" onClick={() => skip([item.id])}>Skip</Button><Button disabled={!validation.valid} onClick={onSubmit}>Submit &amp; Next</Button></footer>
  </article>;
}

export { RatingControls };
