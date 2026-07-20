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

function restoreTriggerFocus() {
  const trigger = modalTriggerRef.current;
  window.requestAnimationFrame(() => {
    if (trigger?.isConnected) trigger.focus();
  });
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
  const copyFeedback = useLibraryStore((state) => state.copyFeedback);
  const showCopyFeedback = useLibraryStore((state) => state.showCopyFeedback);
  const copied = copyFeedback?.key === feedbackKey;

  const [isExporting, setIsExporting] = useState(false);
  const copy = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      await writeClipboard(text);
      showCopyFeedback(feedbackKey, 'Copied exact prompt body to clipboard');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      kind="ghost"
      size={size}
      renderIcon={copied ? Checkmark : Copy}
      onClick={copy}
      disabled={isExporting}
      aria-label={isExporting ? 'Copying prompt body' : (copied ? 'Copied' : label)}
    >
      {isExporting ? 'Copying…' : (copied ? 'Copied' : 'Copy')}
    </Button>
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
            {item.kind === 'image' ? <img src={item.src} alt="Attachment" /> : <AttachmentIcon attachment={item} size={28} />}
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
            {item.kind === 'image' ? <img src={item.src} alt="Attachment" /> : <AttachmentIcon attachment={item} size={24} />}
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
              aria-label="Remove attachment"
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
        <span className="section-count">{attachments.length}</span>
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
        <img src="/assets/brand-grid.svg" alt="Empty library" style={{ width: '120px', marginBottom: '1rem' }} />
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
      <Button
        kind="primary"
        renderIcon={filtered ? Close : Add}
        onClick={() => filtered ? clearFilters() : openModal({ type: 'create' })}
        aria-label={filtered ? "Clear filters" : "New prompt"}
      >
        {filtered ? 'Clear filters' : 'New Prompt'}
      </Button>
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
                        : <button type="button" className="sortable-header" onClick={() => setSort(header.key)}>{header.header} {sortColumn === header.key ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</button>}
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
                    className={`${selected ? 'row-selected' : ''} ${newPromptId === prompt.id ? 'row-created' : ''}`}
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
                        <span className="title-truncate" title={prompt.title}>{prompt.title}</span>
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
  const closeModal = () => { useLibraryStore.getState().closeModal(); restoreTriggerFocus(); };
  const createPrompt = useLibraryStore((state) => state.createPrompt);
  const updatePrompt = useLibraryStore((state) => state.updatePrompt);
  const existing = modal.type === 'edit' ? prompts.find((prompt) => prompt.id === modal.promptId) : null;
  const initial = modal.restoredData || (existing ? requestFromPrompt(existing) : { title: '', body: '', technique: '', description: '' });
  const [attachments, setAttachments] = useState(existing?.attachments || []);
  const submitLock = useRef(false);
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm({ resolver: zodResolver(promptRequestSchema), mode: 'all', defaultValues: initial });
  const values = watch();

  useEffect(() => { trigger(); }, [trigger]);

  const submit = (data) => {
    if (submitLock.current) return;
    submitLock.current = true;
    if (existing) updatePrompt(existing.id, data, attachments);
    else createPrompt(data);
    restoreTriggerFocus();
  };

  return (
    <Modal
      open
      size="lg"
      className="prompt-form-modal"
      modalHeading={existing ? 'Edit prompt' : 'Create a new prompt'}
      modalLabel={existing ? `Version ${existing.version}` : 'Prompt Library'}
      primaryButtonText={existing ? 'Save new version' : 'Create prompt'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid || submitLock.current}
      onRequestClose={closeModal}
      onSecondarySubmit={closeModal}
      onRequestSubmit={handleSubmit(submit)}
      selectorPrimaryFocus="#prompt-title"
    >
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
          maxLength={60}
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
  const closeModal = () => { useLibraryStore.getState().closeModal(); restoreTriggerFocus(); };
  const deletePrompt = useLibraryStore((state) => state.deletePrompt);
  if (!prompt) return null;
  return (
    <Modal
      danger
      open
      size="sm"
      modalHeading="Delete prompt?"
      modalLabel="This action cannot be undone"
      primaryButtonText="Delete prompt"
      secondaryButtonText="Cancel"
      onRequestClose={closeModal}
      onSecondarySubmit={closeModal}
      onRequestSubmit={() => { deletePrompt(prompt.id); restoreTriggerFocus(); }}
    >
      <p className="delete-copy">You’re about to remove <strong>“{prompt.title}”</strong> and its version history from this session.</p>
    </Modal>
  );
}

function ExtendModal({ promptIds }) {
  const prompts = useLibraryStore((state) => state.prompts);
  const closeModal = () => { useLibraryStore.getState().closeModal(); restoreTriggerFocus(); };
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
    restoreTriggerFocus();
  };

  return (
    <Modal
      open
      size="lg"
      modalHeading="Extend a prompt"
      modalLabel={`Source · ${base.title}`}
      primaryButtonText="Create extension"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid || submitLock.current}
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
  const closeModal = () => { useLibraryStore.getState().closeModal(); restoreTriggerFocus(); };
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
    restoreTriggerFocus();
  };

  return (
    <Modal
      open
      size="lg"
      modalHeading="Combine selected prompts"
      modalLabel={`${selected.length} linked sources`}
      primaryButtonText="Create combined prompt"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid || submitLock.current}
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
  const closeModal = () => { useLibraryStore.getState().closeModal(); restoreTriggerFocus(); };
  const setExportFormat = useLibraryStore((state) => state.setExportFormat);
  const showCopyFeedback = useLibraryStore((state) => state.showCopyFeedback);
  const copyFeedback = useLibraryStore((state) => state.copyFeedback);
  const json = useMemo(() => JSON.stringify(createExportDocument(prompts), null, 2), [prompts]);
  const markdown = useMemo(() => createMarkdownPackage(prompts), [prompts]);
  const visible = exportFormat === 'json' ? json : markdown;
  const filename = exportFormat === 'json' ? 'prompt-library.json' : 'prompt-library.md';
  const copied = copyFeedback?.key === 'export';

  const [isExporting, setIsExporting] = useState(false);
  const copy = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      await writeClipboard(visible);
      showCopyFeedback('export', `${filename} copied to clipboard`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal passiveModal open size="lg" modalHeading="Export library" modalLabel={isExporting ? 'Exporting...' : `${prompts.length} live prompts`} onRequestClose={closeModal}>
      <p className="modal-intro">Both artifacts are compiled from the current in-memory collection. Create, edit, delete, Extend, and Combine changes are included immediately.</p>
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
    restoreTriggerFocus();
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
      size="lg"
      modalHeading="Import library JSON"
      modalLabel={isLoading ? 'Importing library...' : 'Replace the current session collection'}
      primaryButtonText="Import and replace"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid || isLoading}
      onRequestClose={closeModal}
      onSecondarySubmit={closeModal}
      onRequestSubmit={handleSubmit(async (data) => { await importLibrary(data.payload); restoreTriggerFocus(); })}
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
    if (restoreFocus) restoreTriggerFocus();
  };
  const openModal = useLibraryStore((state) => state.openModal);
  const openHistory = useLibraryStore((state) => state.openHistory);
  const openSources = useLibraryStore((state) => state.openSources);
  if (!prompt) return null;
  return (
    <Modal passiveModal open size="lg" modalHeading={prompt.title} modalLabel="Prompt detail" onRequestClose={closeDetail}>
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
          <span className="section-count">{prompt.attachments.length}</span>
        </div>
        <AttachmentRows attachments={prompt.attachments} />
      </section>
    </Modal>
  );
}

function HistoryPanel({ promptId }) {
  const prompt = useLibraryStore((state) => state.prompts.find((item) => item.id === promptId));
  const closeHistory = () => { useLibraryStore.getState().closeHistory(); restoreTriggerFocus(); };
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
    <div className="toast-region" aria-live="polite">
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
      name: 'artifact_copy',
      description: 'Copy a declared prompt body or active export format. Artifact contents are not returned.',
      inputSchema: {
        type: 'object',
        properties: { artifact: { type: 'string', enum: ['prompt-body', 'active-export'] }, promptId: { type: 'string', maxLength: 100 } },
        required: ['artifact'],
        additionalProperties: false,
      },
      execute: async ({ artifact, promptId }) => {
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
    },
  ];

  const modelContext = navigator.modelContext;
  tools.forEach((tool) => {
    window[`webmcp_${tool.name}`] = tool.execute;
    if (!modelContext?.registerTool) return;
    try {
      const result = modelContext.registerTool(tool);
      if (result?.catch) result.catch(() => {});
    } catch {
      try {
        modelContext.registerTool(tool.name, {
          description: tool.description,
          inputSchema: tool.inputSchema,
          execute: tool.execute,
        });
      } catch {
        // The public window handlers remain available when the experimental API is absent.
      }
    }
  });

  window.webmcp_contract_version = 'zto-webmcp-v1';
  return () => {
    tools.forEach((tool) => {
      try { modelContext?.unregisterTool?.(tool.name); } catch { /* no-op */ }
      delete window[`webmcp_${tool.name}`];
    });
  };
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
  const visiblePrompts = useMemo(
    () => selectVisiblePrompts({ prompts, searchQuery, techniqueFilter, sortColumn, sortDirection }),
    [prompts, searchQuery, techniqueFilter, sortColumn, sortDirection],
  );

  useEffect(() => registerWebMCPTools(), []);

  const filtered = searchQuery.trim() !== '' || techniqueFilter !== 'all';

  return (
    <div className="app-shell">
      <a className="skip-link" href="#library-content">Skip to prompt library</a>
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div><span className="product-suite">Prompt engineering workspace</span><h1>Prompt library</h1></div>
        </div>
        <div className="header-status"><span className="status-dot" /> Session workspace</div>
      </header>
      <main id="library-content" className="page-content">
        <section className="page-intro" aria-labelledby="library-heading">
          <div>
            <span className="eyebrow">Library manager</span>
            <h2 id="library-heading">Build once. Prompt consistently.</h2>
            <p>Create, version, combine, and package the prompts your team relies on.</p>
          </div>
          <div className="library-stat" aria-label={`${prompts.length} total prompts`}>
            <strong>{String(prompts.length).padStart(2, '0')}</strong>
            <span>live prompts</span>
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
      <ToastRegion />
      <div className="sr-only" role="status" aria-live="polite">{copyFeedback?.message || ''}</div>
    </div>
  );
}



export default App;
