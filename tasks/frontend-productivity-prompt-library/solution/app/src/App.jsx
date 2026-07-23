import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Checkbox,
  DataTable,
  InlineNotification,
  Modal,
  Search,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  TextArea,
  TextInput,
} from '@carbon/react';
import {
  Add,
  Attachment,
  Checkmark,
  ChevronRight,
  Close,
  Code,
  Copy,
  DataShare,
  Document,
  Download,
  Edit,
  Export,
  Image,
  Link,
  Music,
  OverflowMenuHorizontal,
  PromptSession,
  SearchLocate,
  Time,
  TrashCan,
  Upload,
  View,
} from '@carbon/icons-react';
import {
  ATTACHMENT_CATALOG,
  combineFormSchema,
  extendFormSchema,
  importFormSchema,
  promptEditSchema,
  promptRequestSchema,
  requestFromPrompt,
  TECHNIQUE_COLORS,
  TECHNIQUES,
} from './models';
import {
  createExportDocument,
  createMarkdownPackage,
  selectVisiblePrompts,
  useLibraryStore,
} from './store';

const TABLE_HEADERS = [
  { key: 'title', header: 'Title' },
  { key: 'technique', header: 'Technique' },
  { key: 'created', header: 'Created' },
  { key: 'version', header: 'Version' },
  { key: 'attachments', header: 'Attachments' },
  { key: 'actions', header: 'Actions' },
];

const SUGGESTIONS = [
  { label: 'Support replies', type: 'search', value: 'support' },
  { label: 'Research', type: 'search', value: 'research' },
  { label: 'Structured output', type: 'filter', value: 'Structured output' },
  { label: 'Chain-of-thought', type: 'filter', value: 'Chain-of-thought' },
  { label: 'Plain language', type: 'search', value: 'plain language' },
  { label: 'Critique & revise', type: 'filter', value: 'Critique & revise' },
];

export const modalTriggerRef = createRef();
const sourcePanelTriggerRef = createRef();

function displayTableTitle(title) {
  return title.length > 60 ? `${title.slice(0, 59)}…` : title;
}

function useModalFocusTrap(active, onClose) {
  useEffect(() => {
    if (!active) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const modal = document.querySelector('.cds--modal.is-visible, .side-panel[aria-modal="true"]');
      if (!modal) return;
      const focusable = [...modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((node) => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [active]);
}

function closeModalWithFocus() {
  const layer = document.querySelector('.cds--modal.is-visible');
  if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    useLibraryStore.getState().closeModal();
    restoreModalFocus();
    return;
  }
  if (layer.classList.contains('overlay-exit')) return;
  layer.classList.add('overlay-exit');
  window.setTimeout(() => {
    useLibraryStore.getState().closeModal();
    restoreModalFocus();
  }, 220);
}

function restoreModalFocus() {
  window.requestAnimationFrame(() => modalTriggerRef.current?.focus?.());
}

function formatDate(value, includeTime = false) {
  return new Intl.DateTimeFormat('en', includeTime
    ? { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
}

function downloadText(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function getFieldError(errors, field, emptyMessage) {
  return errors[field]?.message || emptyMessage;
}

function useEscape(handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') handler();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handler, active]);
}

function TechniqueTag({ technique }) {
  return <Tag size="sm" type={TECHNIQUE_COLORS[technique] || 'gray'}>{technique}</Tag>;
}

function CopyButton({ text, feedbackKey, label = 'Copy prompt body', size = 'sm' }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const copyFeedback = useLibraryStore((state) => state.copyFeedback);
  const showCopyFeedback = useLibraryStore((state) => state.showCopyFeedback);
  const copied = copyFeedback?.key === feedbackKey || copiedKey === feedbackKey;

  const [isExporting, setIsExporting] = useState(false);
  const copy = async () => {
    if (isExporting) return;
    setIsExporting(true);
    showCopyFeedback(feedbackKey, 'Copied exact prompt body to clipboard');
    setCopiedKey(feedbackKey);
    try {
      await writeClipboard(text);
      setTimeout(() => setCopiedKey(null), 1800);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        kind="ghost"
        size={size}
        renderIcon={copied ? Checkmark : Copy}
        onClick={copy}
        disabled={isExporting}
        aria-label={isExporting ? 'Copying prompt body' : (copied ? 'Copied' : label)}
        data-clipboard-body={copied ? text : undefined}
        className={copied ? 'copy-animated' : ''}
      >
        {isExporting ? 'Copying…' : (copied ? 'Copied' : 'Copy')}
      </Button>
      <span className="copy-proof" data-testid="clipboard-body">{copied ? text : ''}</span>
    </>
  );
}

function CodeBlock({ body, feedbackKey, compact = false }) {
  return (
    <section className={`code-block ${compact ? 'code-block--compact' : ''}`} aria-label="Prompt body in plain text format">
      <div className="code-block__header">
        <span><Code size={16} aria-hidden="true" /> Prompt body</span>
        <span className="format-label">PLAIN TEXT</span>
        <CopyButton text={body} feedbackKey={feedbackKey} />
      </div>
      <pre>{body || 'Start writing to preview the prompt body.'}</pre>
    </section>
  );
}

function AttachmentIcon({ attachment: item, size = 20 }) {
  if (item.kind === 'image') return <Image size={size} aria-hidden="true" />;
  if (item.kind === 'media') return <Music size={size} aria-hidden="true" />;
  return <Document size={size} aria-hidden="true" />;
}

function AttachmentBadges({ prompt }) {
  const openDetail = useLibraryStore((state) => state.openDetail);
  if (!prompt.attachments.length) return <span className="muted-cell">—</span>;
  return (
    <div className="attachment-badges" aria-label={`${prompt.attachments.length} ${prompt.attachments.length === 1 ? 'attachment' : 'attachments'}`}>
      {prompt.attachments.slice(0, 2).map((item) => (
        <div className="attachment-badge-wrap" key={item.id} title={item.filename}>
          <Button
            className="attachment-badge"
            type="button"
            kind="ghost"
            size="sm"
            onClick={(e) => { modalTriggerRef.current = e.currentTarget; openDetail(prompt.id); }}
            aria-label={`Preview attachment ${item.filename}`}
          >
            <AttachmentIcon attachment={item} size={16} />
            <span>{item.filename}</span>
          </Button>
          <div className="attachment-preview" role="tooltip">
            {item.kind === 'image' ? <img src={item.src} alt={`Preview of ${item.filename}`} /> : <AttachmentIcon attachment={item} size={28} />}
            <strong>{item.filename}</strong>
            <span>{item.type}</span>
            <span>{item.detail}</span>
          </div>
        </div>
      ))}
      {prompt.attachments.length > 2 && <Tag size="sm" type="gray">+{prompt.attachments.length - 2}</Tag>}
    </div>
  );
}

function AttachmentRows({ attachments, editable = false, onRemove }) {
  if (!attachments.length) return <p className="attachments-empty">No attachments on this prompt.</p>;
  return (
    <div className="attachment-rows">
      {attachments.map((item) => (
        <div className="attachment-row" key={item.id} title={item.filename}>
          <div className="attachment-row__preview">
            {item.kind === 'image' ? <img src={item.src} alt={`Attachment preview for ${item.filename}`} /> : <AttachmentIcon attachment={item} size={24} />}
          </div>
          <div className="attachment-row__meta">
            <strong>{item.filename}</strong>
            <span>{item.type} · {item.detail}</span>
          </div>
          {editable && (
            <Button
              className="attachment-remove"
              type="button"
              kind="danger--ghost"
              size="sm"
              renderIcon={TrashCan}
              aria-label={`Remove attachment ${item.filename}`}
              onClick={() => onRemove(item)}
            >
              Remove
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function AttachmentEditor({ attachments, setAttachments }) {
  const [assetId, setAssetId] = useState('');
  const showAttachmentRemoved = useLibraryStore((state) => state.showAttachmentRemoved);
  const available = ATTACHMENT_CATALOG.filter((asset) => !attachments.some((item) => item.filename === asset.filename));

  const add = () => {
    const item = ATTACHMENT_CATALOG.find((asset) => asset.id === assetId);
    if (!item) return;
    setAttachments([...attachments, item]);
    setAssetId('');
  };

  const remove = (item) => {
    setAttachments(attachments.filter((attachmentItem) => attachmentItem.id !== item.id));
    showAttachmentRemoved(item.filename);
  };

  return (
    <section className="form-section" aria-labelledby="attachments-heading">
      <div className="section-heading-row">
        <div>
          <h3 id="attachments-heading">Attachments</h3>
          <p>Seeded local references are saved with this prompt.</p>
        </div>
        <span className="section-count">{attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'}</span>
      </div>
      <AttachmentRows attachments={attachments} editable onRemove={remove} />
      <div className="attachment-picker">
        <Select
          id="attachment-picker"
          labelText="Add attachment"
          value={assetId}
          onChange={(event) => setAssetId(event.target.value)}
        >
          <SelectItem value="" text="Choose a seeded asset" />
          {available.map((asset) => <SelectItem key={asset.id} value={asset.id} text={asset.filename} />)}
        </Select>
        <Button type="button" kind="tertiary" renderIcon={Attachment} disabled={!assetId} onClick={add}>Add</Button>
      </div>
    </section>
  );
}

function EmptyState({ filtered, isEmptyLibrary }) {
  const clearFilters = useLibraryStore((state) => state.clearFilters);
  const openModal = useLibraryStore((state) => state.openModal);
  if (isEmptyLibrary) {
    return (
      <div className="empty-state">
        <img src="/assets/brand-grid.svg" alt="Illustrated empty prompt library grid" style={{ width: '120px', marginBottom: '1rem' }} />
        <h2>Your library is empty</h2>
        <p>Build once. Prompt consistently.</p>
        <Button type="button" kind="primary" onClick={(event) => { modalTriggerRef.current = event.currentTarget; openModal({ type: 'create' }); }}>New prompt</Button>
      </div>
    );
  }
  return (
    <div className="empty-state">
      <div className="empty-state__art" aria-hidden="true">
        <span className="empty-orbit empty-orbit--one" />
        <span className="empty-orbit empty-orbit--two" />
        {filtered ? <SearchLocate size={44} /> : <PromptSession size={44} />}
      </div>
      <h2>{filtered ? 'No prompts match those filters' : 'Your prompts belong here'}</h2>
      <p>{filtered
        ? 'Try a different phrase or clear both constraints to see the full library.'
        : 'Create a reusable prompt, track its versions, and build from it later.'}</p>
      <div className="empty-state__actions">
        {filtered && (
          <Button kind="secondary" renderIcon={Close} onClick={clearFilters} aria-label="Clear filters">
            Clear filters
          </Button>
        )}
        <Button
          kind="primary"
          renderIcon={Add}
          onClick={(event) => { modalTriggerRef.current = event.currentTarget; openModal({ type: 'create' }); }}
          aria-label="New prompt"
        >
          New Prompt
        </Button>
      </div>
    </div>
  );
}

function SuggestionRow() {
  const setSearchQuery = useLibraryStore((state) => state.setSearchQuery);
  const setTechniqueFilter = useLibraryStore((state) => state.setTechniqueFilter);

  return (
    <div className="suggestions-wrap">
      <span className="suggestions-label">Try</span>
      <div className="suggestions flex overflow-x-auto whitespace-nowrap min-h-[44px]" aria-label="Suggested searches and filters">
        {SUGGESTIONS.map((suggestion) => (
          <Button
            type="button"
            key={suggestion.label}
            kind="tertiary"
            size="sm"
            className="suggestion-chip"
            onClick={() => suggestion.type === 'search'
              ? setSearchQuery(suggestion.value)
              : setTechniqueFilter(suggestion.value)}
          >
            {suggestion.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function LibraryToolbar({ visibleCount, totalCount }) {
  const searchQuery = useLibraryStore((state) => state.searchQuery);
  const techniqueFilter = useLibraryStore((state) => state.techniqueFilter);
  const selectedIds = useLibraryStore((state) => state.selectedIds);
  const mobileActionsOpen = useLibraryStore((state) => state.mobileActionsOpen);
  const setSearchQuery = useLibraryStore((state) => state.setSearchQuery);
  const setTechniqueFilter = useLibraryStore((state) => state.setTechniqueFilter);

  const setMobileActionsOpen = useLibraryStore((state) => state.setMobileActionsOpen);
  const openModal = useLibraryStore((state) => state.openModal);
  const derivedEnabled = selectedIds.length >= 2;

  return (
    <div className="toolbar-shell" aria-label="Prompt library toolbar">
      <div className="toolbar-main">
        <Search
          id="prompt-search"
          labelText="Search prompt titles and bodies"
          placeholder="Search titles and prompt bodies"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          size="lg"
        />
        <Select
          id="technique-filter"
          labelText="Technique"
          hideLabel
          value={techniqueFilter}
          onChange={(event) => setTechniqueFilter(event.target.value)}
        >
          <SelectItem value="all" text="All techniques" />
          {TECHNIQUES.map((technique) => <SelectItem key={technique} value={technique} text={technique} />)}
        </Select>
        <span className="prompt-count" aria-live="polite"><strong>{visibleCount}</strong> of {totalCount} prompts</span>
        <Button
          className="mobile-overflow"
          type="button"
          hasIconOnly
          kind="ghost"
          renderIcon={OverflowMenuHorizontal}
          iconDescription="Toggle library actions"
          onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
        />
        <div className={`toolbar-actions ${mobileActionsOpen ? 'toolbar-actions--open' : ''}`}>
          <Button type="button" kind="ghost" renderIcon={Upload} onClick={(e) => { modalTriggerRef.current = e.currentTarget; openModal({ type: 'import' }); }}>Import</Button>
          <Button type="button" kind="ghost" renderIcon={Export} onClick={(e) => { modalTriggerRef.current = e.currentTarget; openModal({ type: 'export' }); }}>Export library</Button>
          <Button
            type="button"
            kind="tertiary"
            renderIcon={DataShare}
            disabled={!derivedEnabled}
            onClick={(e) => { modalTriggerRef.current = e.currentTarget; openModal({ type: 'extend', promptIds: selectedIds }); }}
          >
            Extend
          </Button>
          <Button
            type="button"
            kind="tertiary"
            renderIcon={Link}
            disabled={!derivedEnabled}
            onClick={(e) => { modalTriggerRef.current = e.currentTarget; openModal({ type: 'combine', promptIds: selectedIds }); }}
          >
            Combine
          </Button>
          <Button type="button" kind="primary" renderIcon={Add} onClick={(e) => { modalTriggerRef.current = e.currentTarget; openModal({ type: 'create' }); }}>New Prompt</Button>
        </div>
      </div>
    </div>
  );
}

function LibraryTable({ prompts }) {
  const setSort = useLibraryStore((state) => state.setSort);
  const sortColumn = useLibraryStore((state) => state.sortColumn);
  const sortDirection = useLibraryStore((state) => state.sortDirection);

  const selectedIds = useLibraryStore((state) => state.selectedIds);
  const newPromptId = useLibraryStore((state) => state.newPromptId);
  const toggleSelected = useLibraryStore((state) => state.toggleSelected);
  const setSelected = useLibraryStore((state) => state.setSelected);
  const openModal = useLibraryStore((state) => state.openModal);
  const openDetail = useLibraryStore((state) => state.openDetail);
  const openHistory = useLibraryStore((state) => state.openHistory);
  const openSources = useLibraryStore((state) => state.openSources);

  const rows = prompts.map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    technique: prompt.technique,
    created: prompt.created,
    version: String(prompt.version),
    attachments: String(prompt.attachments.length),
    actions: '',
  }));
  const allVisibleSelected = prompts.length > 0 && prompts.every((prompt) => selectedIds.includes(prompt.id));
  const someVisibleSelected = prompts.some((prompt) => selectedIds.includes(prompt.id));

  const toggleAll = () => {
    if (allVisibleSelected) setSelected(selectedIds.filter((id) => !prompts.some((prompt) => prompt.id === id)));
    else setSelected([...selectedIds, ...prompts.map((prompt) => prompt.id)]);
  };

  return (
    <DataTable rows={rows} headers={TABLE_HEADERS}>
      {({ rows: carbonRows, headers, getTableProps, getHeaderProps, getRowProps }) => (
        <TableContainer className="library-table-container">
          <Table {...getTableProps()} className="library-table" aria-label="Prompt library">
            <TableHead>
              <TableRow>
                <TableHeader className="select-column">
                  <Checkbox
                    id="select-all-prompts"
                    labelText="Select all visible prompts"
                    hideLabel
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected && !allVisibleSelected}
                    onChange={toggleAll}
                  />
                </TableHeader>
                {headers.map((header) => {
                  const headerProps = getHeaderProps({ header });
                  const { key, ...rest } = headerProps;
                  return (
                    <TableHeader key={key} {...rest}>
                      {header.key === 'actions'
                        ? header.header
                        : <button type="button" className="sortable-header" aria-sort={sortColumn === header.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} onClick={() => setSort(header.key)}>{header.header} {sortColumn === header.key ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</button>}
                    </TableHeader>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {carbonRows.map((row) => {
                const prompt = prompts.find((item) => item.id === row.id);
                if (!prompt) return null;
                const rowProps = getRowProps({ row });
                const { key, ...rest } = rowProps;
                const selected = selectedIds.includes(prompt.id);
                return (
                  <TableRow
                    key={key}
                    {...rest}
                    className={`${selected ? 'row-selected' : ''} ${newPromptId === prompt.id ? 'row-created' : ''}`} data-id={prompt.id}
                  >
                    <TableCell className="select-column">
                      <Checkbox
                        id={`select-${prompt.id}`}
                        labelText={`Select ${prompt.title}`}
                        hideLabel
                        checked={selected}
                        onChange={() => toggleSelected(prompt.id)}
                      />
                    </TableCell>
                    <TableCell className="title-cell">
                      <Button className="title-link" type="button" kind="ghost" size="sm" onClick={(e) => { modalTriggerRef.current = e.currentTarget; openDetail(prompt.id); }}>
                        <span className="title-truncate title-truncate--long" title={prompt.title}>{displayTableTitle(prompt.title)}</span>
                        <span className="body-preview">{prompt.body}</span>
                      </Button>
                    </TableCell>
                    <TableCell><TechniqueTag technique={prompt.technique} /></TableCell>
                    <TableCell><span className="date-cell">{formatDate(prompt.created)}</span></TableCell>
                    <TableCell>
                      <Button className="version-button" type="button" kind="ghost" size="sm" onClick={(e) => { modalTriggerRef.current = e.currentTarget; openHistory(prompt.id); }}>
                        v{prompt.version}
                      </Button>
                    </TableCell>
                    <TableCell><AttachmentBadges prompt={prompt} /></TableCell>
                    <TableCell className="actions-cell">
                      {prompt.sources.length > 0 && (
                        <Button className="sources-button" type="button" kind="ghost" size="sm" renderIcon={Link} onClick={(e) => { sourcePanelTriggerRef.current = e.currentTarget; openSources(prompt.id); }}>
                          {prompt.sources.length} source{prompt.sources.length === 1 ? '' : 's'}
                        </Button>
                      )}
                      <div className="row-actions">
                        <Button type="button" hasIconOnly kind="ghost" size="sm" renderIcon={View} iconDescription={`View ${prompt.title}`} onClick={(e) => { modalTriggerRef.current = e.currentTarget; openDetail(prompt.id); }} />
                        <Button type="button" hasIconOnly kind="ghost" size="sm" renderIcon={Edit} iconDescription={`Edit ${prompt.title}`} onClick={(e) => { modalTriggerRef.current = e.currentTarget; openModal({ type: 'edit', promptId: prompt.id }); }} />
                        <Button type="button" hasIconOnly kind="danger--ghost" size="sm" renderIcon={TrashCan} iconDescription={`Delete ${prompt.title}`} onClick={(e) => { modalTriggerRef.current = e.currentTarget; openModal({ type: 'delete', promptId: prompt.id }); }} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
}

function PromptFormModal({ modal }) {
  const prompts = useLibraryStore((state) => state.prompts);
  const closeModal = closeModalWithFocus;
  const createPrompt = useLibraryStore((state) => state.createPrompt);
  const updatePrompt = useLibraryStore((state) => state.updatePrompt);
  const setDraftPrompt = useLibraryStore((state) => state.setDraftPrompt);
  const clearDraftPrompt = useLibraryStore((state) => state.clearDraftPrompt);
  const existing = modal.type === 'edit' ? prompts.find((prompt) => prompt.id === modal.promptId) : null;
  const initial = modal.restoredData || (existing ? requestFromPrompt(existing) : { title: '', body: '', technique: '', description: '' });
  const [attachments, setAttachments] = useState(existing?.attachments || []);
  const submitLock = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm({ resolver: zodResolver(existing ? promptEditSchema(existing.title) : promptRequestSchema), mode: 'all', defaultValues: initial });
  const values = watch();

  useEffect(() => { trigger(); }, [trigger]);
  useEffect(() => {
    if (modal.type !== 'create') return undefined;
    const timer = window.setTimeout(() => setDraftPrompt(values), 250);
    return () => window.clearTimeout(timer);
  }, [modal.type, setDraftPrompt, values]);

  const submit = async (data) => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    if (existing) updatePrompt(existing.id, data, attachments);
    else {
      createPrompt(data);
      clearDraftPrompt();
    }
    closeModalWithFocus();
  };

  return (
    <Modal
      open
      preventCloseOnClickOutside={false}
      size="lg"
      className="prompt-form-modal"
      modalHeading={existing ? 'Edit prompt' : 'Create a new prompt'}
      modalLabel={existing ? `Version ${existing.version}` : 'Prompt Library'}
      primaryButtonText={existing ? 'Save new version' : 'Create prompt'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={submitting || !isValid}
      launcherButtonRef={modalTriggerRef}
      onRequestClose={closeModal}
      onSecondarySubmit={closeModal}
      onRequestSubmit={handleSubmit(submit)}
      selectorPrimaryFocus="#prompt-title"
    >
      {submitting && <div className="mutation-progress" role="status"><span className="export-loading__spinner" aria-hidden="true" />Saving prompt…</div>}
      {modal.restoredVersion && (
        <InlineNotification
          lowContrast
          hideCloseButton
          kind="info"
          title={`Version ${modal.restoredVersion} restored to the editor`}
          subtitle="Saving creates a new version; the existing history remains intact."
        />
      )}
      <div className="form-grid">
        <TextInput
          id="prompt-title"
          labelText="Title"
          placeholder="Name this prompt"
          maxLength={existing?.title.length > 60 ? existing.title.length : 60}
          invalid={!!errors.title}
          invalidText={getFieldError(errors, 'title', 'Title is required.')}
          {...register('title')}
        />
        <Select
          className="min-h-[44px]"
          id="prompt-technique"
          labelText="Technique tag"
          invalid={!!errors.technique}
          invalidText={getFieldError(errors, 'technique', 'Technique tag is required.')}
          {...register('technique')}
        >
          <SelectItem value="" text="Select a technique" />
          {TECHNIQUES.map((technique) => <SelectItem key={technique} value={technique} text={technique} />)}
        </Select>
      </div>
      <TextArea
        id="prompt-description"
        labelText="Description (optional)"
        placeholder="When should someone use this prompt?"
        maxLength={280}
        rows={2}
        enableCounter
        invalid={!!errors.description}
        invalidText={errors.description?.message}
        {...register('description')}
      />
      <TextArea
        id="prompt-body"
        className="mono-input"
        labelText="Prompt body"
        placeholder="Write the reusable instructions…"
        rows={8}
        maxLength={8000}
        enableCounter
        invalid={!!errors.body}
        invalidText={getFieldError(errors, 'body', 'Prompt body is required.')}
        {...register('body')}
      />
      <CodeBlock body={values.body || ''} feedbackKey={`form-${existing?.id || 'new'}`} compact />
      {existing && <AttachmentEditor attachments={attachments} setAttachments={setAttachments} />}
      <div className="sr-only" aria-live="assertive">
        {Object.values(errors).map((error) => error?.message).filter(Boolean).join(' ')}
      </div>
    </Modal>
  );
}

function DeleteModal({ promptId }) {
  const prompt = useLibraryStore((state) => state.prompts.find((item) => item.id === promptId));
  const closeModal = closeModalWithFocus;
  const deletePrompt = useLibraryStore((state) => state.deletePrompt);
  const deleteTimer = useRef(null);
  useEffect(() => () => {
    if (deleteTimer.current !== null) window.clearTimeout(deleteTimer.current);
    document.querySelector(`tr[data-id="${promptId}"]`)?.classList.remove('row-deleting');
  }, [promptId]);
  if (!prompt) return null;
  return (
    <Modal
      danger
      open
      preventCloseOnClickOutside={false}
      size="sm"
      modalHeading="Delete prompt?"
      modalLabel="This action cannot be undone"
      primaryButtonText="Delete prompt"
      secondaryButtonText="Cancel"
      launcherButtonRef={modalTriggerRef}
      onRequestClose={closeModal}
      onSecondarySubmit={closeModal}
      onRequestSubmit={() => {
        if (deleteTimer.current !== null) return;
        const row = document.querySelector(`tr[data-id="${prompt.id}"]`);
        if (row) row.classList.add("row-deleting");
        deleteTimer.current = window.setTimeout(() => {
          deleteTimer.current = null;
          deletePrompt(prompt.id);
          closeModalWithFocus();
        }, 150);
      }}
    >
      <p className="delete-copy">You’re about to remove <strong>“{prompt.title}”</strong> and its version history from this session.</p>
    </Modal>
  );
}

function ExtendModal({ promptIds }) {
  const prompts = useLibraryStore((state) => state.prompts);
  const closeModal = closeModalWithFocus;
  const createPrompt = useLibraryStore((state) => state.createPrompt);
  const base = prompts.find((prompt) => prompt.id === promptIds[0]);
  const submitLock = useRef(false);
  const {
    register, handleSubmit, watch, trigger,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(extendFormSchema),
    mode: 'all',
    defaultValues: {
      title: base ? `${base.title} — extended`.slice(0, 60) : '',
      body: base?.body || '',
      technique: base?.technique || '',
      description: base ? `Extended from ${base.title}`.slice(0, 280) : '',
      extensionText: '',
    },
  });
  const values = watch();
  useEffect(() => { trigger(); }, [trigger]);
  if (!base) return null;

  const submit = (data) => {
    if (submitLock.current) return;
    submitLock.current = true;
    createPrompt({
      title: data.title,
      body: `${base.body}\n\n${data.extensionText}`,
      technique: data.technique,
      description: data.description,
    }, { sources: [base.id], toastTitle: 'Extended prompt created' });
    closeModalWithFocus();
  };

  return (
    <Modal
      open
      preventCloseOnClickOutside={false}
      size="lg"
      modalHeading="Extend a prompt"
      modalLabel={`Source · ${base.title}`}
      primaryButtonText="Create extension"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={submitLock.current}
      launcherButtonRef={modalTriggerRef}
      onRequestClose={closeModal}
      onSecondarySubmit={closeModal}
      onRequestSubmit={handleSubmit(submit)}
    >
      <p className="modal-intro">Build a new entry from the first selected prompt. The source remains linked and opens in-app.</p>
      <input type="hidden" {...register('body')} />
      <div className="form-grid">
        <TextInput id="extend-title" labelText="Title" maxLength={60} invalid={!!errors.title} invalidText={errors.title?.message} {...register('title')} />
        <Select className="min-h-[44px]" id="extend-technique" labelText="Technique tag" invalid={!!errors.technique} invalidText={errors.technique?.message} {...register('technique')}>
          <SelectItem value="" text="Select a technique" />
          {TECHNIQUES.map((technique) => <SelectItem key={technique} value={technique} text={technique} />)}
        </Select>
      </div>
      <TextInput id="extend-description" labelText="Description (optional)" maxLength={280} invalid={!!errors.description} invalidText={errors.description?.message} {...register('description')} />
      <CodeBlock body={base.body} feedbackKey={`extend-source-${base.id}`} compact />
      <TextArea
        id="extension-text"
        className="mono-input"
        labelText="Extension text"
        placeholder="Append new instructions, constraints, or context…"
        rows={5}
        maxLength={4000}
        enableCounter
        invalid={!!errors.extensionText}
        invalidText={errors.extensionText?.message}
        {...register('extensionText')}
      />
      {values.extensionText && <CodeBlock body={`${base.body}\n\n${values.extensionText}`} feedbackKey="extend-composite" compact />}
    </Modal>
  );
}

function CombineModal({ promptIds }) {
  const prompts = useLibraryStore((state) => state.prompts);
  const closeModal = closeModalWithFocus;
  const createPrompt = useLibraryStore((state) => state.createPrompt);
  const selected = promptIds.map((id) => prompts.find((prompt) => prompt.id === id)).filter(Boolean);
  const composite = selected.map((prompt) => prompt.body).join('\n\n---\n\n');
  const submitLock = useRef(false);
  const {
    register, handleSubmit, trigger,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(combineFormSchema),
    mode: 'all',
    defaultValues: {
      title: 'Combined prompt',
      body: composite,
      combinedBody: composite,
      technique: selected[0]?.technique || '',
      description: `Combined from ${selected.length} source prompts`,
    },
  });
  useEffect(() => { trigger(); }, [trigger]);
  if (selected.length < 2) return null;

  const submit = (data) => {
    if (submitLock.current) return;
    submitLock.current = true;
    createPrompt({ title: data.title, body: data.combinedBody, technique: data.technique, description: data.description }, {
      sources: selected.map((prompt) => prompt.id),
      toastTitle: 'Combined prompt created',
    });
    closeModalWithFocus();
  };

  return (
    <Modal
      open
      preventCloseOnClickOutside={false}
      size="lg"
      modalHeading="Combine selected prompts"
      modalLabel={`${selected.length} linked sources`}
      primaryButtonText="Create combined prompt"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={submitLock.current}
      launcherButtonRef={modalTriggerRef}
      onRequestClose={closeModal}
      onSecondarySubmit={closeModal}
      onRequestSubmit={handleSubmit(submit)}
    >
      <div className="source-summary">
        {selected.map((prompt, index) => <Tag key={prompt.id} type="cool-gray" size="sm">{index + 1}. {prompt.title}</Tag>)}
      </div>
      <input type="hidden" {...register('body')} />
      <div className="form-grid">
        <TextInput id="combine-title" labelText="Title" maxLength={60} invalid={!!errors.title} invalidText={errors.title?.message} {...register('title')} />
        <Select className="min-h-[44px]" id="combine-technique" labelText="Technique tag" invalid={!!errors.technique} invalidText={errors.technique?.message} {...register('technique')}>
          <SelectItem value="" text="Select a technique" />
          {TECHNIQUES.map((technique) => <SelectItem key={technique} value={technique} text={technique} />)}
        </Select>
      </div>
      <TextInput id="combine-description" labelText="Description (optional)" maxLength={280} invalid={!!errors.description} invalidText={errors.description?.message} {...register('description')} />
      <TextArea
        id="combined-body"
        className="mono-input"
        labelText="Combined body"
        rows={12}
        maxLength={8000}
        enableCounter
        invalid={!!errors.combinedBody}
        invalidText={errors.combinedBody?.message}
        {...register('combinedBody')}
      />
    </Modal>
  );
}

function ExportModal() {
  const prompts = useLibraryStore((state) => state.prompts);
  const exportFormat = useLibraryStore((state) => state.exportFormat);
  const closeModal = closeModalWithFocus;
  const setExportFormat = useLibraryStore((state) => state.setExportFormat);
  const showCopyFeedback = useLibraryStore((state) => state.showCopyFeedback);
  const copyFeedback = useLibraryStore((state) => state.copyFeedback);
  const json = useMemo(() => JSON.stringify(createExportDocument(prompts), null, 2), [prompts]);
  const markdown = useMemo(() => createMarkdownPackage(prompts), [prompts]);
  const visible = exportFormat === 'json' ? json : markdown;
  const filename = exportFormat === 'json' ? 'prompt-library.json' : 'prompt-library.md';
  const copied = copyFeedback?.key === 'export';
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, [exportFormat, prompts.length]);

  const copy = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await writeClipboard(visible);
      showCopyFeedback('export', `${filename} copied to clipboard`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal passiveModal open size="lg" modalHeading="Export library" modalLabel={isLoading || isExporting ? 'Exporting...' : `${prompts.length} live prompts`} launcherButtonRef={modalTriggerRef} onRequestClose={closeModal}>
      <p className="modal-intro">Both artifacts are compiled from the current in-memory collection. Create, edit, delete, Extend, and Combine changes are included immediately.</p>
      {(isLoading || isExporting) && (
        <div className="export-loading" role="status" aria-live="polite">
          <span className="export-loading__spinner" aria-hidden="true" />
          Compiling export…
        </div>
      )}
      <div className="format-switch" role="group" aria-label="Export format">
        <Button type="button" kind={exportFormat === 'json' ? 'primary' : 'secondary'} size="sm" onClick={() => setExportFormat('json')}>JSON</Button>
        <Button type="button" kind={exportFormat === 'markdown' ? 'primary' : 'secondary'} size="sm" onClick={() => setExportFormat('markdown')}>Markdown</Button>
      </div>
      <div className="export-filebar">
        <div><Document size={20} /><span><strong>{filename}</strong><small>{visible.length.toLocaleString()} characters</small></span></div>
        <div>
          <Button type="button" kind="ghost" size="sm" renderIcon={copied ? Checkmark : Copy} disabled={isExporting} onClick={copy}>{isExporting ? 'Loading...' : (copied ? 'Copied' : 'Copy')}</Button>
          <Button
            type="button"
            kind="primary"
            size="sm"
            renderIcon={Download}
            onClick={() => downloadText(filename, visible, exportFormat === 'json' ? 'application/json' : 'text/markdown')}
          >
            Download {exportFormat === 'json' ? 'JSON' : 'Markdown'}
          </Button>
        </div>
      </div>
      <TextArea id="export-preview" className="export-preview" labelText={`${filename} preview`} value={visible} rows={16} readOnly />
    </Modal>
  );
}

function ImportModal() {
  const closeModal = () => {
    const state = useLibraryStore.getState();
    if (state.isLoading) return;
    state.closeModal();
    closeModalWithFocus();
  };
  const importLibrary = useLibraryStore((state) => state.importLibrary);
  const isLoading = useLibraryStore((state) => state.isLoading);
  const [fileName, setFileName] = useState('');
  const {
    register, handleSubmit, setValue, trigger,
    formState: { errors, isValid },
  } = useForm({ resolver: zodResolver(importFormSchema), mode: 'all', defaultValues: { payload: '' } });
  useEffect(() => { trigger(); }, [trigger]);

  const chooseFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const payload = await file.text();
    setFileName(file.name);
    setValue('payload', payload, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Modal
      open
      preventCloseOnClickOutside={false}
      size="lg"
      modalHeading="Import library JSON"
      modalLabel={isLoading ? 'Importing library...' : 'Replace the current session collection'}
      primaryButtonText="Import and replace"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid || isLoading}
      launcherButtonRef={modalTriggerRef}
      onRequestClose={closeModal}
      onSecondarySubmit={closeModal}
      onRequestSubmit={handleSubmit(async (data) => { await importLibrary(data.payload); closeModalWithFocus(); })}
    >
      <InlineNotification
        lowContrast
        hideCloseButton
        kind="warning"
        title="The current collection will be replaced"
        subtitle="Malformed or non-conforming JSON changes nothing. Reloading the page still returns the seeded library."
      />
      <label className="file-picker-button" htmlFor="import-file">
        <Upload size={18} /> {fileName || 'Choose prompt-library.json'}
      </label>
      <input id="import-file" className="sr-only" type="file" accept="application/json,.json" onChange={chooseFile} />
      <TextArea
        id="import-payload"
        className="mono-input"
        labelText="Library JSON"
        placeholder="Paste a previously exported prompt-library.json document"
        rows={14}
        invalid={!!errors.payload}
        invalidText={errors.payload?.message}
        {...register('payload')}
      />
      <div className="sr-only" aria-live="assertive">{errors.payload?.message}</div>
    </Modal>
  );
}

function DetailModal({ promptId }) {
  const prompt = useLibraryStore((state) => state.prompts.find((item) => item.id === promptId));
  const closeDetail = (restoreFocus = true) => {
    useLibraryStore.getState().closeDetail();
    if (restoreFocus) closeModalWithFocus();
  };
  const openModal = useLibraryStore((state) => state.openModal);
  const openHistory = useLibraryStore((state) => state.openHistory);
  const openSources = useLibraryStore((state) => state.openSources);
  if (!prompt) return null;
  return (
    <Modal passiveModal open size="lg" modalHeading={prompt.title} modalLabel="Prompt detail" launcherButtonRef={modalTriggerRef} onRequestClose={closeDetail}>
      <div className="detail-meta">
        <TechniqueTag technique={prompt.technique} />
        <span>Created {formatDate(prompt.created)}</span>
        <span>Version {prompt.version}</span>
      </div>
      {prompt.description && <p className="detail-description">{prompt.description}</p>}
      <CodeBlock body={prompt.body} feedbackKey={`detail-${prompt.id}`} />
      <div className="detail-actionbar">
        <Button type="button" kind="tertiary" size="sm" renderIcon={Edit} onClick={() => { closeDetail(false); openModal({ type: 'edit', promptId: prompt.id }); }}>Edit prompt</Button>
        <Button type="button" kind="ghost" size="sm" renderIcon={Time} onClick={() => { closeDetail(false); openHistory(prompt.id); }}>View history</Button>
        {prompt.sources.length > 0 && <Button type="button" kind="ghost" size="sm" renderIcon={Link} onClick={(e) => { sourcePanelTriggerRef.current = e.currentTarget; openSources(prompt.id); }}>{prompt.sources.length} sources</Button>}
      </div>
      <section className="detail-attachments" aria-labelledby="detail-attachments-title">
        <div className="section-heading-row">
          <div>
            <h3 id="detail-attachments-title">Attachments</h3>
            <p>Local example assets linked to this prompt.</p>
          </div>
          <span className="section-count">{prompt.attachments.length} {prompt.attachments.length === 1 ? 'attachment' : 'attachments'}</span>
        </div>
        <AttachmentRows attachments={prompt.attachments} />
      </section>
    </Modal>
  );
}

function HistoryPanel({ promptId }) {
  const prompt = useLibraryStore((state) => state.prompts.find((item) => item.id === promptId));
  const closeHistory = () => {
    const layer = document.querySelector('.panel-layer:not(.panel-layer--sources)');
    const finish = () => { useLibraryStore.getState().closeHistory(); restoreModalFocus(); };
    if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
    if (layer.classList.contains('panel-layer--exit')) return;
    layer.classList.add('panel-layer--exit');
    window.setTimeout(finish, 240);
  };
  const restoreVersionToEdit = useLibraryStore((state) => state.restoreVersionToEdit);
  useEscape(closeHistory);
  if (!prompt) return null;
  return (
    <div className="panel-layer">
      <button className="panel-backdrop" type="button" aria-label="Close version history" onClick={closeHistory} />
      <aside className="side-panel" role="dialog" aria-modal="true" aria-labelledby="history-heading">
        <header className="side-panel__header">
          <div>
            <span className="eyebrow">Version history</span>
            <h2 id="history-heading">{prompt.title}</h2>
          </div>
          <Button type="button" hasIconOnly kind="ghost" renderIcon={Close} iconDescription="Close version history" onClick={closeHistory} />
        </header>
        <div className="history-current">
          <span>Current</span><strong>Version {prompt.version}</strong>
        </div>
        <ol className="history-list">
          {prompt.versions.map((version, index) => (
            <li key={version.id} className="history-item">
              <span className="history-line" aria-hidden="true" />
              <div className="history-dot" aria-hidden="true" />
              <Button type="button" kind="ghost" className="history-card" onClick={() => restoreVersionToEdit(prompt.id, version.id)}>
                <span className="history-card__top"><strong>Version {version.version}</strong>{index === 0 && <Tag size="sm" type="green">Current</Tag>}</span>
                <span className="history-time">{formatDate(version.timestamp, true)}</span>
                <span className="history-summary">{version.summary}</span>
                <span className="history-restore">Restore into editor <ChevronRight size={16} /></span>
              </Button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

function SourcesPanel({ promptId }) {
  const prompt = useLibraryStore((state) => state.prompts.find((item) => item.id === promptId));
  const prompts = useLibraryStore((state) => state.prompts);
  const closeSources = () => { useLibraryStore.getState().closeSources(); sourcePanelTriggerRef.current?.focus(); };
  const openDetail = useLibraryStore((state) => state.openDetail);
  useEscape(closeSources);
  if (!prompt) return null;
  const sources = prompt.sources.map((id) => prompts.find((item) => item.id === id)).filter(Boolean);
  return (
    <div className="panel-layer panel-layer--sources">
      <button className="panel-backdrop" type="button" aria-label="Close sources" onClick={closeSources} />
      <aside className="side-panel side-panel--sources" role="dialog" aria-modal="true" aria-labelledby="sources-heading">
        <header className="side-panel__header">
          <div><span className="eyebrow">Prompt lineage</span><h2 id="sources-heading">{prompt.sources.length} source{prompt.sources.length === 1 ? '' : 's'}</h2></div>
          <Button type="button" hasIconOnly kind="ghost" renderIcon={Close} iconDescription="Close sources" onClick={closeSources} />
        </header>
        <p className="panel-intro">These links resolve to the live prompts in this library. Choose one to open its detail.</p>
        <div className="source-list">
          {sources.map((source) => (
            <Button key={source.id} type="button" kind="ghost" className="source-card" onClick={() => {
              modalTriggerRef.current = sourcePanelTriggerRef.current;
              useLibraryStore.getState().closeSources();
              openDetail(source.id);
            }}>
              <span><strong>{source.title}</strong><small>{source.technique} · v{source.version}</small></span>
              <ChevronRight size={20} />
            </Button>
          ))}
          {!sources.length && <InlineNotification lowContrast hideCloseButton kind="info" title="Source prompts are no longer in this collection" />}
        </div>
      </aside>
    </div>
  );
}

function ToastRegion() {
  const toast = useLibraryStore((state) => state.toast);
  if (!toast) return <div className="sr-only" aria-live="polite" />;
  return (
    <div className={`toast-region ${toast.exiting ? 'toast-region--exit' : ''}`} aria-live="polite">
      <InlineNotification
        lowContrast
        hideCloseButton
        kind={toast.kind}
        title={toast.title}
        subtitle={toast.subtitle}
      />
    </div>
  );
}

function registerWebMCPTools() {
  const getState = useLibraryStore.getState;
  const techniques = TECHNIQUES;
  const requestProperties = {
    title: { type: 'string', minLength: 1, maxLength: 60 },
    body: { type: 'string', minLength: 1, maxLength: 8000 },
    technique: { type: 'string', enum: techniques },
    description: { type: 'string', maxLength: 280 },
  };
  const tools = [
    {
      name: 'entity_create',
      description: 'Create one prompt using the same validated command as the New Prompt form.',
      inputSchema: { type: 'object', properties: requestProperties, required: ['title', 'body', 'technique'], additionalProperties: false },
      execute: async (input) => {
        const prompt = getState().createPrompt(input);
        return { status: 'created', id: prompt.id, version: prompt.version };
      },
    },
    {
      name: 'entity_select',
      description: 'Select or deselect an existing prompt row.',
      inputSchema: { type: 'object', properties: { id: { type: 'string', maxLength: 100 }, selected: { type: 'boolean' } }, required: ['id', 'selected'], additionalProperties: false },
      execute: async ({ id, selected }) => {
        const state = getState();
        if (!state.prompts.some((prompt) => prompt.id === id)) throw new Error('Prompt not found.');
        const already = state.selectedIds.includes(id);
        if (already !== selected) state.toggleSelected(id);
        return { status: selected ? 'selected' : 'deselected', id };
      },
    },
    {
      name: 'entity_update',
      description: 'Update one existing prompt and append a version.',
      inputSchema: { type: 'object', properties: { id: { type: 'string', maxLength: 100 }, ...requestProperties }, required: ['id', 'title', 'body', 'technique'], additionalProperties: false },
      execute: async ({ id, ...input }) => {
        const state = getState();
        if (!state.prompts.some((prompt) => prompt.id === id)) throw new Error('Prompt not found.');
        const prompt = state.updatePrompt(id, input);
        return { status: 'updated', id, version: prompt.version };
      },
    },
    {
      name: 'entity_delete',
      description: 'Delete an existing prompt only when explicit confirmation is true.',
      inputSchema: { type: 'object', properties: { id: { type: 'string', maxLength: 100 }, confirm: { type: 'boolean' } }, required: ['id', 'confirm'], additionalProperties: false },
      execute: async ({ id, confirm }) => {
        if (!confirm) throw new Error('Delete requires confirm=true.');
        if (!getState().deletePrompt(id)) throw new Error('Prompt not found.');
        return { status: 'deleted', id };
      },
    },
    {
      name: 'browse_open',
      description: 'Open a declared Prompt Library destination.',
      inputSchema: { type: 'object', properties: { destination: { type: 'string', enum: ['library-table', 'prompt-detail', 'version-history'] }, promptId: { type: 'string', maxLength: 100 } }, required: ['destination'], additionalProperties: false },
      execute: async ({ destination, promptId }) => {
        const state = getState();
        if (destination !== 'library-table' && !state.prompts.some((prompt) => prompt.id === promptId)) throw new Error('A valid promptId is required.');
        if (destination === 'library-table') { state.closeDetail(); state.closeHistory(); state.closeModal(); }
        if (destination === 'prompt-detail') state.openDetail(promptId);
        if (destination === 'version-history') state.openHistory(promptId);
        return { status: 'opened', destination };
      },
    },
    {
      name: 'browse_search',
      description: 'Search prompt titles and bodies.',
      inputSchema: { type: 'object', properties: { query: { type: 'string', maxLength: 120 } }, required: ['query'], additionalProperties: false },
      execute: async ({ query }) => { getState().setSearchQuery(query); return { status: 'applied', filter: 'search' }; },
    },
    {
      name: 'browse_apply_filter',
      description: 'Apply one closed-list technique filter.',
      inputSchema: { type: 'object', properties: { technique: { type: 'string', enum: techniques } }, required: ['technique'], additionalProperties: false },
      execute: async ({ technique }) => { getState().setTechniqueFilter(technique); return { status: 'applied', filter: 'technique' }; },
    },
    {
      name: 'browse_clear_filter',
      description: 'Clear search and technique constraints.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: async () => { getState().clearFilters(); return { status: 'cleared' }; },
    },
    {
      name: 'form_validate',
      description: 'Validate declared create, edit, Extend, or Combine form fields without saving.',
      inputSchema: {
        type: 'object',
        properties: {
          workflow: { type: 'string', enum: ['create', 'edit', 'extend', 'combine'] },
          promptId: { type: 'string', maxLength: 100 },
          promptIds: { type: 'array', items: { type: 'string', maxLength: 100 }, minItems: 2, maxItems: 20 },
          ...requestProperties,
          extensionText: { type: 'string', minLength: 1, maxLength: 4000 },
          combinedBody: { type: 'string', minLength: 1, maxLength: 8000 },
        },
        required: ['workflow', 'title', 'technique'],
        additionalProperties: false,
      },
      execute: async ({ workflow, promptIds = [], extensionText, combinedBody, ...input }) => {
        const state = getState();
        let result;
        if (workflow === 'extend') {
          const source = state.prompts.find((prompt) => prompt.id === promptIds[0]);
          result = source
            ? extendFormSchema.safeParse({ ...input, body: source.body, extensionText })
            : { success: false };
        } else if (workflow === 'combine') {
          const validSources = promptIds.length >= 2 && promptIds.every((id) => state.prompts.some((prompt) => prompt.id === id));
          result = validSources
            ? combineFormSchema.safeParse({ ...input, body: combinedBody, combinedBody })
            : { success: false };
        } else {
          result = promptRequestSchema.safeParse(input);
        }
        return { valid: result.success };
      },
    },
    {
      name: 'form_submit',
      description: 'Submit the declared create, edit, Extend, or Combine workflow through product handlers.',
      inputSchema: {
        type: 'object',
        properties: {
          workflow: { type: 'string', enum: ['create', 'edit', 'extend', 'combine'] },
          promptId: { type: 'string', maxLength: 100 },
          promptIds: { type: 'array', items: { type: 'string', maxLength: 100 }, minItems: 2, maxItems: 20 },
          ...requestProperties,
          extensionText: { type: 'string', minLength: 1, maxLength: 4000 },
          combinedBody: { type: 'string', minLength: 1, maxLength: 8000 },
        },
        required: ['workflow', 'title', 'technique'],
        additionalProperties: false,
      },
      execute: async ({ workflow, promptId, promptIds = [], extensionText, combinedBody, ...input }) => {
        const state = getState();
        if (workflow === 'edit') {
          if (!state.prompts.some((prompt) => prompt.id === promptId)) throw new Error('A valid promptId is required for edit.');
          const prompt = state.updatePrompt(promptId, input);
          return { status: 'submitted', workflow, id: prompt.id, version: prompt.version };
        }
        if (workflow === 'extend') {
          const source = state.prompts.find((prompt) => prompt.id === promptIds[0]);
          if (!source || promptIds.length < 2) throw new Error('Extend requires at least two selected prompt IDs.');
          const data = extendFormSchema.parse({ ...input, body: source.body, extensionText });
          const prompt = state.createPrompt({
            title: data.title,
            body: `${source.body}\n\n${data.extensionText}`,
            technique: data.technique,
            description: data.description,
          }, { sources: [source.id], toastTitle: 'Extended prompt created' });
          return { status: 'submitted', workflow, id: prompt.id, version: prompt.version };
        }
        if (workflow === 'combine') {
          const sources = promptIds.map((id) => state.prompts.find((prompt) => prompt.id === id)).filter(Boolean);
          if (sources.length < 2 || sources.length !== promptIds.length) throw new Error('Combine requires at least two valid prompt IDs.');
          const data = combineFormSchema.parse({ ...input, body: combinedBody, combinedBody });
          const prompt = state.createPrompt({
            title: data.title,
            body: data.combinedBody,
            technique: data.technique,
            description: data.description,
          }, { sources: sources.map((source) => source.id), toastTitle: 'Combined prompt created' });
          return { status: 'submitted', workflow, id: prompt.id, version: prompt.version };
        }
        const prompt = state.createPrompt(input);
        return { status: 'submitted', workflow, id: prompt.id, version: prompt.version };
      },
    },
    {
      name: 'form_cancel',
      description: 'Cancel the currently visible prompt form workflow.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: async () => { getState().closeModal(); return { status: 'cancelled' }; },
    },
    {
      name: 'browse_sort',
      description: 'Sort the prompt library table by a declared column.',
      inputSchema: { type: 'object', properties: { column: { type: 'string', enum: ['title', 'technique', 'created', 'version', 'attachments'] } }, required: ['column'], additionalProperties: false },
    },
    {
      name: 'artifact_import',
      description: 'Import a previously exported prompt-library JSON document through the product handler.',
      inputSchema: { type: 'object', properties: { payload: { type: 'string', minLength: 1 } }, required: ['payload'], additionalProperties: false },
    },
  ];

  const handlers = {
    entity_create: async (input) => {
      const prompt = getState().createPrompt(input);
      return { status: 'created', id: prompt.id, version: prompt.version };
    },
    entity_select: async ({ id, selected }) => {
      const state = getState();
      if (!state.prompts.some((prompt) => prompt.id === id)) throw new Error('Prompt not found.');
      const already = state.selectedIds.includes(id);
      if (already !== selected) state.toggleSelected(id);
      return { status: selected ? 'selected' : 'deselected', id };
    },
    entity_update: async ({ id, ...input }) => {
      const state = getState();
      if (!state.prompts.some((prompt) => prompt.id === id)) throw new Error('Prompt not found.');
      const prompt = state.updatePrompt(id, input);
      return { status: 'updated', id, version: prompt.version };
    },
    entity_delete: async ({ id, confirm }) => {
      if (!confirm) throw new Error('Delete requires confirm=true.');
      if (!getState().deletePrompt(id)) throw new Error('Prompt not found.');
      return { status: 'deleted', id };
    },
    browse_open: async ({ destination, promptId }) => {
      const state = getState();
      if (destination !== 'library-table' && !state.prompts.some((prompt) => prompt.id === promptId)) throw new Error('A valid promptId is required.');
      if (destination === 'library-table') { state.closeDetail(); state.closeHistory(); state.closeModal(); }
      if (destination === 'prompt-detail') state.openDetail(promptId);
      if (destination === 'version-history') state.openHistory(promptId);
      return { status: 'opened', destination };
    },
    browse_search: async ({ query }) => { getState().setSearchQuery(query); return { status: 'applied', filter: 'search' }; },
    browse_apply_filter: async ({ technique }) => { getState().setTechniqueFilter(technique); return { status: 'applied', filter: 'technique' }; },
    browse_clear_filter: async () => { getState().clearFilters(); return { status: 'cleared' }; },
    browse_sort: async ({ column }) => { getState().setSort(column); return { status: 'sorted', column }; },
    form_validate: async ({ workflow, promptIds = [], extensionText, combinedBody, ...input }) => {
      const state = getState();
      let result;
      if (workflow === 'extend') {
        const source = state.prompts.find((prompt) => prompt.id === promptIds[0]);
        result = source ? extendFormSchema.safeParse({ ...input, body: source.body, extensionText }) : { success: false };
      } else if (workflow === 'combine') {
        const validSources = promptIds.length >= 2 && promptIds.every((id) => state.prompts.some((prompt) => prompt.id === id));
        result = validSources ? combineFormSchema.safeParse({ ...input, body: combinedBody, combinedBody }) : { success: false };
      } else {
        result = promptRequestSchema.safeParse(input);
      }
      return { valid: result.success };
    },
    form_submit: async ({ workflow, promptId, promptIds = [], extensionText, combinedBody, ...input }) => {
      const state = getState();
      if (workflow === 'edit') {
        if (!state.prompts.some((prompt) => prompt.id === promptId)) throw new Error('A valid promptId is required for edit.');
        const prompt = state.updatePrompt(promptId, input);
        return { status: 'submitted', workflow, id: prompt.id, version: prompt.version };
      }
      if (workflow === 'extend') {
        const source = state.prompts.find((prompt) => prompt.id === promptIds[0]);
        if (!source) throw new Error('Extend requires a valid source prompt ID.');
        const data = extendFormSchema.parse({ ...input, body: source.body, extensionText });
        const prompt = state.createPrompt({
          title: data.title,
          body: `${source.body}\n\n${data.extensionText}`,
          technique: data.technique,
          description: data.description,
        }, { sources: [source.id], toastTitle: 'Extended prompt created' });
        return { status: 'submitted', workflow, id: prompt.id, version: prompt.version };
      }
      if (workflow === 'combine') {
        const sources = promptIds.map((id) => state.prompts.find((prompt) => prompt.id === id)).filter(Boolean);
        if (sources.length < 2 || sources.length !== promptIds.length) throw new Error('Combine requires at least two valid prompt IDs.');
        const data = combineFormSchema.parse({ ...input, body: combinedBody, combinedBody });
        const prompt = state.createPrompt({
          title: data.title,
          body: data.combinedBody,
          technique: data.technique,
          description: data.description,
        }, { sources: sources.map((source) => source.id), toastTitle: 'Combined prompt created' });
        return { status: 'submitted', workflow, id: prompt.id, version: prompt.version };
      }
      const prompt = state.createPrompt(input);
      return { status: 'submitted', workflow, id: prompt.id, version: prompt.version };
    },
    form_cancel: async () => { getState().closeModal(); return { status: 'cancelled' }; },
    artifact_copy: async ({ artifact, promptId }) => {
      const state = getState();
      let value;
      if (artifact === 'prompt-body') {
        const prompt = state.prompts.find((item) => item.id === promptId);
        if (!prompt) throw new Error('A valid promptId is required.');
        value = prompt.body;
      } else {
        value = state.exportFormat === 'json'
          ? JSON.stringify(createExportDocument(state.prompts), null, 2)
          : createMarkdownPackage(state.prompts);
      }
      await writeClipboard(value);
      state.showCopyFeedback('webmcp-copy');
      return { status: 'copied', artifact };
    },
    artifact_import: async ({ payload }) => {
      const prompts = await getState().importLibrary(payload);
      return { status: 'imported', count: prompts.length };
    },
  };

  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['entity-collection-v1', 'browse-query-v1', 'form-workflow-v1', 'artifact-transfer-v1'],
    toolNames: tools.map((tool) => tool.name),
  });
  window.webmcp_list_tools = () => ({ tools });
  window.webmcp_invoke_tool = async (name, args = {}) => {
    if (!handlers[name]) throw new Error(`Unknown registered tool: ${name}`);
    const result = await handlers[name](args);
    // WebMCP callers inspect the browser immediately after a tool resolves.
    // Wait through React's commit and one paint so the declared result is
    // already observable in the table, detail/history views, and exports.
    await new Promise((resolve) => window.requestAnimationFrame(
      () => window.requestAnimationFrame(resolve),
    ));
    return result;
  };

  return () => {
    delete window.webmcp_session_info;
    delete window.webmcp_list_tools;
    delete window.webmcp_invoke_tool;
  };
}




function TechniqueChart({ prompts }) {
  const counts = useMemo(() => TECHNIQUES.map((technique) => ({
    technique,
    count: prompts.filter((prompt) => prompt.technique === technique).length,
  })), [prompts]);
  const max = Math.max(...counts.map((item) => item.count), 1);
  return (
    <div className="technique-chart" aria-label="Technique distribution chart">
      {counts.filter((item) => item.count > 0).map((item) => (
        <div className="technique-chart__row" key={item.technique}>
          <span>{item.technique}</span>
          <strong>{item.count}</strong>
          <div className="technique-chart__bar"><span style={{ width: `${(item.count / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function HeaderPreferences() {
  const theme = useLibraryStore((state) => state.theme);
  const density = useLibraryStore((state) => state.density);
  const setTheme = useLibraryStore((state) => state.setTheme);
  const setDensity = useLibraryStore((state) => state.setDensity);
  const setSearchQuery = useLibraryStore((state) => state.setSearchQuery);
  const addPerformanceSample = useLibraryStore((state) => state.addPerformanceSample);

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setSearchQuery(transcript);
    };
    recognition.start();
  };

  return (
    <div className="header-actions">
      <Button type="button" kind="ghost" size="sm" onClick={addPerformanceSample}>Load 120 sample prompts</Button>
      <Button type="button" kind="ghost" size="sm" onClick={startVoiceSearch} aria-label="Start voice search">Voice</Button>
      <Select id="density-pref" labelText="Density" hideLabel value={density} onChange={(event) => setDensity(event.target.value)}>
        <SelectItem value="comfortable" text="Comfortable" />
        <SelectItem value="compact" text="Compact" />
      </Select>
      <Button type="button" kind="ghost" size="sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
        {theme === 'light' ? 'Dark' : 'Light'}
      </Button>
    </div>
  );
}

const ONBOARDING_STEPS = [
  { title: 'Welcome to your prompt library', body: 'Create reusable prompts, track versions, and combine sources without leaving this workspace.' },
  { title: 'Search, filter, and sort live data', body: 'Use the toolbar and suggestion chips to narrow the table. Column headers sort ascending and descending from the shared collection.' },
  { title: 'Extend, combine, and export', body: 'Select rows to derive new prompts, then export JSON or Markdown that round-trips through Import library.' },
];

function OnboardingTour() {
  const step = useLibraryStore((state) => state.onboardingStep);
  const complete = useLibraryStore((state) => state.onboardingComplete);
  const setOnboardingStep = useLibraryStore((state) => state.setOnboardingStep);
  const completeOnboarding = useLibraryStore((state) => state.completeOnboarding);
  if (complete || step >= ONBOARDING_STEPS.length) return null;
  const current = ONBOARDING_STEPS[step];
  return (
    <aside className="onboarding-layer" aria-labelledby="onboarding-title">
      <div className="onboarding-card">
        <div className="onboarding-progress" role="progressbar" aria-label="Onboarding progress" aria-valuemin="1" aria-valuemax={ONBOARDING_STEPS.length} aria-valuenow={step + 1}>
          {ONBOARDING_STEPS.map((item, index) => <span key={item.title} className={index <= step ? 'is-complete' : ''} />)}
        </div>
        <span className="eyebrow">Step {step + 1} of {ONBOARDING_STEPS.length}</span>
        <h2 id="onboarding-title">{current.title}</h2>
        <p>{current.body}</p>
        <div className="onboarding-actions">
          <Button kind="ghost" size="sm" onClick={completeOnboarding}>Skip</Button>
          <Button kind="primary" size="sm" onClick={() => (step >= ONBOARDING_STEPS.length - 1 ? completeOnboarding() : setOnboardingStep(step + 1))}>
            {step >= ONBOARDING_STEPS.length - 1 ? 'Start building' : 'Continue tour'}
          </Button>
        </div>
      </div>
    </aside>
  );
}

function App() {

  const prompts = useLibraryStore((state) => state.prompts);
  const searchQuery = useLibraryStore((state) => state.searchQuery);
  const techniqueFilter = useLibraryStore((state) => state.techniqueFilter);
  const sortColumn = useLibraryStore((state) => state.sortColumn);
  const sortDirection = useLibraryStore((state) => state.sortDirection);
  const activeModal = useLibraryStore((state) => state.activeModal);
  const detailPromptId = useLibraryStore((state) => state.detailPromptId);
  const historyPromptId = useLibraryStore((state) => state.historyPromptId);
  const sourceListPromptId = useLibraryStore((state) => state.sourceListPromptId);
  const copyFeedback = useLibraryStore((state) => state.copyFeedback);
  const theme = useLibraryStore((state) => state.theme);
  const density = useLibraryStore((state) => state.density);
  const visiblePrompts = useMemo(
    () => selectVisiblePrompts({ prompts, searchQuery, techniqueFilter, sortColumn, sortDirection }),
    [prompts, searchQuery, techniqueFilter, sortColumn, sortDirection],
  );

  useEffect(() => registerWebMCPTools(), []);
  useModalFocusTrap(Boolean(activeModal) || Boolean(detailPromptId) || Boolean(historyPromptId), () => {
    const state = useLibraryStore.getState();
    if (state.activeModal) {
      closeModalWithFocus();
    } else if (state.detailPromptId) {
      state.closeDetail();
      restoreModalFocus();
    } else if (state.historyPromptId) {
      state.closeHistory();
      restoreModalFocus();
    }
  });
  useEffect(() => {
    const onClick = (e) => {
      if (e.target.classList.contains('cds--modal') && e.target.classList.contains('is-visible')) {
        const state = useLibraryStore.getState();
        if (state.activeModal) {
          closeModalWithFocus();
        } else if (state.detailPromptId) {
          state.closeDetail();
          restoreModalFocus();
        }
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);
  useEffect(() => {
    const onScroll = () => {
      document.documentElement.style.setProperty('--scroll-parallax', `${window.scrollY}px`);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filtered = searchQuery.trim() !== '' || techniqueFilter !== 'all';

  return (
    <div className={`app-shell ${theme === 'dark' ? 'app-shell--dark' : ''} ${density === 'compact' ? 'app-shell--compact' : ''}`}>
      <a className="skip-link" href="#library-content">Skip to prompt library</a>
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div><span className="product-suite">Prompt engineering workspace</span><h1>Prompt library</h1></div>
        </div>
        <HeaderPreferences />
      </header>
      <main id="library-content" className="page-content">
        <section className="page-intro page-intro--parallax" aria-labelledby="library-heading">
          <div>
            <span className="eyebrow">Library manager</span>
            <h2 id="library-heading">Build once. Prompt consistently.</h2>
            <p>Create, version, combine, and package the prompts your team relies on.</p>
          </div>
          <div className="library-stat" aria-label={`${prompts.length} total prompts`}>
            <strong>{String(prompts.length).padStart(2, '0')}</strong>
            <span>live prompts</span>
            <TechniqueChart prompts={prompts} />
          </div>
        </section>
        <section className="library-card" aria-label="Prompt collection">
          <LibraryToolbar visibleCount={visiblePrompts.length} totalCount={prompts.length} />
          <SuggestionRow />
          <div className="table-region">
            {visiblePrompts.length > 0 ? <LibraryTable prompts={visiblePrompts} /> : <EmptyState filtered={filtered} isEmptyLibrary={prompts.length === 0} />}
          </div>
        </section>
      </main>

      {activeModal?.type === 'create' && <PromptFormModal key="create" modal={activeModal} />}
      {activeModal?.type === 'edit' && <PromptFormModal key={`edit-${activeModal.promptId}-${activeModal.restoredVersion || 'current'}`} modal={activeModal} />}
      {activeModal?.type === 'delete' && <DeleteModal promptId={activeModal.promptId} />}
      {activeModal?.type === 'extend' && <ExtendModal promptIds={activeModal.promptIds} />}
      {activeModal?.type === 'combine' && <CombineModal promptIds={activeModal.promptIds} />}
      {activeModal?.type === 'export' && <ExportModal />}
      {activeModal?.type === 'import' && <ImportModal />}
      {detailPromptId && <DetailModal promptId={detailPromptId} />}
      {historyPromptId && <HistoryPanel promptId={historyPromptId} />}
      {sourceListPromptId && <SourcesPanel promptId={sourceListPromptId} />}
      <OnboardingTour />
      <ToastRegion />
      <div className="sr-only" role="status" aria-live="polite">{copyFeedback?.message || ''}</div>
    </div>
  );
}



export default App;
