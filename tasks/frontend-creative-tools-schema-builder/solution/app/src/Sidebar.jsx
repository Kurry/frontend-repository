// Library sidebar: saved schemas with metadata values, New / Duplicate /
// Delete-after-confirmation, the metadata field builder, and preferences
// (density + default field type).
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Add, TrashCan, Copy, ChevronRight, ChevronDown } from '@carbon/icons-react';
import { useForm } from 'react-hook-form';
import { useStore, activeSchema } from './store.js';
import { countFields, metadataFieldSchema, splitEnumText, FIELD_TYPES } from './lib.js';
import { EmptyState, Field } from './ui.jsx';

function LibraryRow({ sc, active }) {
  const selectSchema = useStore((s) => s.selectSchema);
  const duplicateSchema = useStore((s) => s.duplicateSchema);
  const requestDeleteSchema = useStore((s) => s.requestDeleteSchema);
  const metaFields = useStore((s) => s.metaFields);
  const setMetaValue = useStore((s) => s.setMetaValue);
  const [open, setOpen] = useState(active);

  return (
    <li className={`library-row ${active ? 'library-row-active' : ''}`}>
      <button
        type="button"
        className="library-main tap"
        aria-current={active ? 'true' : undefined}
        onClick={() => selectSchema(sc.id)}
      >
        <span
          className={`library-caret ${active ? 'library-caret-open' : ''}`}
          aria-hidden="true"
        >
          <ChevronRight size={12} />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-medium" title={sc.name}>
            {sc.name}
          </span>
          <span className="muted block text-xs">
            {countFields(sc.tree)} field{countFields(sc.tree) === 1 ? '' : 's'}
            {sc.versions.length ? ` · ${sc.versions.length} version${sc.versions.length === 1 ? '' : 's'}` : ''}
          </span>
        </span>
        {active && <span className="active-dot" aria-label="active schema" />}
      </button>
      <span className="library-actions">
        <button
          type="button"
          className="icon-btn tap"
          aria-label={`Show details for ${sc.name}`}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
        </button>
        <button type="button" className="icon-btn tap" aria-label={`Duplicate ${sc.name}`} onClick={() => duplicateSchema(sc.id)}>
          <Copy size={13} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn-danger tap"
          aria-label={`Delete ${sc.name}`}
          onClick={() => requestDeleteSchema(sc.id)}
        >
          <TrashCan size={13} aria-hidden="true" />
        </button>
      </span>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="library-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: 'hidden' }}
          >
            {!metaFields.length && <p className="muted text-xs">Define metadata fields below to annotate library entries.</p>}
            {metaFields.map((mf) => (
              <div key={mf.id} className="detail-field">
                <label className="field-label" htmlFor={`meta-${sc.id}-${mf.id}`}>
                  {mf.label} <span className="muted font-normal">({mf.type})</span>
                </label>
                {mf.type === 'dropdown' ? (
                  <select
                    id={`meta-${sc.id}-${mf.id}`}
                    className="select select-sm"
                    value={sc.metaValues[mf.label] ?? ''}
                    onChange={(e) => setMetaValue(sc.id, mf.label, e.target.value)}
                  >
                    <option value="">—</option>
                    {(mf.options || []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`meta-${sc.id}-${mf.id}`}
                    type={mf.type === 'number' ? 'number' : mf.type === 'date' ? 'date' : 'text'}
                    className="input input-sm"
                    value={sc.metaValues[mf.label] ?? ''}
                    onChange={(e) => setMetaValue(sc.id, mf.label, e.target.value)}
                  />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function MetadataBuilder() {
  const addMetadataField = useStore((s) => s.addMetadataField);
  const removeMetadataField = useStore((s) => s.removeMetadataField);
  const metaFields = useStore((s) => s.metaFields);
  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: { label: '', type: 'text', optionsText: '' },
    resolver: async (values) => {
      const result = metadataFieldSchema.safeParse(values);
      const errs = {};
      if (!result.success) {
        for (const issue of result.error.issues) {
          const key = String(issue.path[0] ?? 'form');
          if (!errs[key]) errs[key] = { type: 'validate', message: issue.message };
        }
      }
      return { values: result.success ? result.data : {}, errors: errs };
    },
  });
  const type = watch('type');

  function onSubmit(v) {
    addMetadataField({
      label: v.label.trim(),
      type: v.type,
      options: v.type === 'dropdown' ? splitEnumText(v.optionsText).filter((o) => o !== '') : undefined,
    });
    reset({ label: '', type: 'text', optionsText: '' });
  }

  return (
    <div>
      <h3 className="heading-sub">Metadata fields</h3>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Label" htmlFor="mf-label" error={errors.label?.message} hint="MetadataField.label — 1 to 40 characters">
          <input
            id="mf-label"
            className="input input-sm"
            autoComplete="off"
            {...register('label')}
            aria-invalid={errors.label ? 'true' : undefined}
            aria-describedby={errors.label ? 'mf-label-error' : 'mf-label-hint'}
          />
        </Field>
        <Field label="Type" htmlFor="mf-type" error={errors.type?.message}>
          <select id="mf-type" className="select select-sm" {...register('type')}>
            {['text', 'number', 'date', 'dropdown'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        {type === 'dropdown' && (
          <Field label="Options" htmlFor="mf-options" error={errors.optionsText?.message} hint="One per line — required for dropdown">
            <textarea
              id="mf-options"
              className="input input-area input-sm"
              rows={2}
              {...register('optionsText')}
              aria-invalid={errors.optionsText ? 'true' : undefined}
              aria-describedby={errors.optionsText ? 'mf-options-error' : 'mf-options-hint'}
            />
          </Field>
        )}
        <button type="submit" className="btn btn-ghost tap mt-1 w-full">
          <Add size={13} aria-hidden="true" /> Add metadata field
        </button>
      </form>
      {metaFields.length > 0 && (
        <ul className="mt-2">
          {metaFields.map((mf) => (
            <li key={mf.id} className="meta-row">
              <span className="text-sm">{mf.label}</span>
              <span className="muted text-xs">
                {mf.type}
                {mf.type === 'dropdown' ? ` · ${(mf.options || []).join(', ')}` : ''}
              </span>
              <button type="button" className="icon-btn icon-btn-danger tap ml-auto" aria-label={`Remove metadata field ${mf.label}`} onClick={() => removeMetadataField(mf.id)}>
                <TrashCan size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Sidebar() {
  const schemas = useStore((s) => s.schemas);
  const active = useStore(activeSchema);
  const newSchema = useStore((s) => s.newSchema);
  const setDensity = useStore((s) => s.setDensity);
  const density = useStore((s) => s.density);
  const defaultType = useStore((s) => s.defaultType);
  const setDefaultType = useStore((s) => s.setDefaultType);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-3">
      <section aria-labelledby="library-h">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="heading-panel m-0" id="library-h">
            Saved schemas
          </h2>
          <button type="button" className="btn btn-primary tap" onClick={() => newSchema()}>
            <Add size={13} aria-hidden="true" /> New
          </button>
        </div>
        {schemas.length ? (
          <ul className="library-list">
            {schemas.map((sc) => (
              <LibraryRow key={sc.id} sc={sc} active={active && sc.id === active.id} />
            ))}
          </ul>
        ) : (
          <EmptyState title="The library is empty">
            <p className="muted text-xs">Press New to start a blank schema with a root object, or import a SchemaPackage JSON.</p>
          </EmptyState>
        )}
      </section>
      <section aria-labelledby="meta-h" className="border-t pt-3 var-border">
        <h2 className="heading-panel" id="meta-h">
          Library metadata
        </h2>
        <MetadataBuilder />
      </section>
      <section aria-labelledby="prefs-h" className="border-t pt-3 var-border">
        <h2 className="heading-panel" id="prefs-h">
          Preferences
        </h2>
        <div className="field-block">
          <label className="field-label" htmlFor="pref-density">
            Tree density
          </label>
          <select id="pref-density" className="select select-sm" value={density} onChange={(e) => setDensity(e.target.value)}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        <div className="field-block">
          <label className="field-label" htmlFor="pref-type">
            Default type for new fields
          </label>
          <select id="pref-type" className="select select-sm" value={defaultType} onChange={(e) => setDefaultType(e.target.value)}>
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}
