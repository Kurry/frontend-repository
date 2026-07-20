import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, ComposedModal, FileUploaderButton, InlineNotification, ModalBody, ModalFooter, ModalHeader, TextArea } from '@carbon/react';
import { Checkmark, Copy, Download, Upload } from '@carbon/icons-react';
import { compileJsonl, compileLabelsPackage, compileStats, useStudioStore } from '../store';

const ImportFormSchema = z.object({ payload: z.string().trim().min(1, 'Labels JSON is required') });

function downloadText(text, name, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}

function ImportModal({ open, onClose }) {
  const importLabels = useStudioStore((s) => s.importLabels);
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, setValue, reset, formState: { errors, isValid } } = useForm({ resolver: zodResolver(ImportFormSchema), mode: 'onChange', defaultValues: { payload: '' } });
  const close = () => { reset(); setApiError(''); onClose(); };
  const submit = ({ payload }) => { const result = importLabels(payload); if (!result.ok) setApiError(result.error); else close(); };
  const readFile = async (event) => { const file = event.target.files?.[0]; if (file) { setValue('payload', await file.text(), { shouldValidate: true }); setApiError(''); } };
  return <ComposedModal open={open} onClose={close} size="md" preventCloseOnClickOutside><ModalHeader title="Import Labels JSON" label="LabelsPackage · atomic validation" closeModal={close} /><ModalBody hasForm><form id="import-form" onSubmit={handleSubmit(submit)} className="modal-form"><TextArea id="labels-json-import" rows={12} labelText="Labels JSON" invalid={Boolean(errors.payload)} invalidText={errors.payload?.message} {...register('payload')} /><div className="file-row"><FileUploaderButton labelText="Choose JSON file" buttonKind="tertiary" accept={['.json', 'application/json']} onChange={readFile} /><span>or paste the complete LabelsPackage above</span></div>{apiError && <InlineNotification lowContrast kind="error" title="Import rejected" subtitle={apiError} hideCloseButton />}</form></ModalBody><ModalFooter><Button kind="secondary" onClick={close}>Cancel</Button><Button type="submit" form="import-form" disabled={!isValid}>Import</Button></ModalFooter></ComposedModal>;
}

export default function ExportView() {
  const state = useStudioStore();
  const [tab, setTab] = useState('labels');
  const [copied, setCopied] = useState(false);
  const importOpen = useStudioStore((s) => s.importOpen);
  const setImportOpen = useStudioStore((s) => s.setImportOpen);
  const labelsText = useMemo(() => JSON.stringify(compileLabelsPackage(state), null, 2), [state.items, state.suites, state.taxonomy, state.metadataFields]);
  const statsText = useMemo(() => compileStats(state), [state.items, state.suites, state.taxonomy, state.agreement, state.drafts]);
  const jsonlText = useMemo(() => compileJsonl(state), [state.items, state.suites]);
  const visible = tab === 'labels' ? labelsText : statsText;
  const copy = async () => { await navigator.clipboard.writeText(visible); setCopied(true); state.setToast('Visible export copied'); window.setTimeout(() => setCopied(false), 1800); };
  return <div className="view-shell export-view"><header className="view-heading"><div><p className="eyebrow">Live artifacts</p><h1>Export center</h1><p>Compiled from the same session state that drives the queue, taxonomy, history, and review tiers.</p></div><div className="export-actions"><Button kind="ghost" renderIcon={Download} onClick={() => downloadText(jsonlText, 'corvid-annotations.jsonl', 'application/x-ndjson')}>Download JSONL</Button>{tab === 'labels' && <Button kind="tertiary" renderIcon={Upload} onClick={() => setImportOpen(true)}>Import</Button>}<Button kind="secondary" renderIcon={copied ? Checkmark : Copy} onClick={copy}>{copied ? 'Copied' : 'Copy export'}</Button><Button renderIcon={Download} onClick={() => downloadText(visible, tab === 'labels' ? 'corvid-labels.json' : 'corvid-stats.txt', tab === 'labels' ? 'application/json' : 'text/plain')}>Download</Button></div></header>
    <div className="export-tabs" role="tablist"><button role="tab" aria-selected={tab === 'labels'} onClick={() => setTab('labels')}>Labels JSON</button><button role="tab" aria-selected={tab === 'stats'} onClick={() => setTab('stats')}>Stats summary</button></div>
    <div className="schema-strip"><span>API-shaped payload</span>{tab === 'labels' ? <><code>schemaVersion</code><code>taxonomy[]</code><code>metadataFields[]</code><code>items[]</code></> : <><code>suite progress</code><code>agreement</code><code>class usage</code><code>disputed</code></>}</div>
    <pre className="export-preview" aria-label={tab === 'labels' ? 'Labels JSON preview' : 'Stats summary preview'}>{visible}</pre>
    <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
  </div>;
}
