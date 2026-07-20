import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button, ComposedModal, ModalBody, ModalFooter, ModalHeader, Select, SelectItem,
  TextInput, InlineNotification, Tag,
} from '@carbon/react';
import { Add, Edit, TrashCan } from '@carbon/icons-react';
import { createTaxonomyFormSchema, createMetadataFormSchema, PALETTE } from '../schemas';
import { useStudioStore, getClassRegionCount, getMetadataValueCount } from '../store';
import { ClassIcon, iconMap, iconNames } from '../icons';
import { useDialogDismiss } from './dialogs';

function fieldError(errors, path) {
  return path.reduce((value, key) => value?.[key], errors)?.message;
}

function TaxonomyForm({ open, editing, onClose, openerRef }) {
  const taxonomy = useStudioStore((s) => s.taxonomy);
  const save = useStudioStore((s) => s.saveTaxonomyClass);
  useDialogDismiss(open, onClose, openerRef);
  const schema = useMemo(() => createTaxonomyFormSchema(taxonomy, editing?.id), [taxonomy, editing?.id]);
  const defaults = useMemo(() => editing ? {
    name: editing.name, color: editing.color, icon: editing.icon, shortcut: editing.shortcut, attributes: editing.attributes,
  } : { name: '', color: PALETTE[0], icon: 'Tag', shortcut: '', attributes: [] }, [editing]);
  const { register, handleSubmit, control, watch, reset, setError, formState: { errors, isValid } } = useForm({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: defaults });
  const { fields, append, remove } = useFieldArray({ control, name: 'attributes' });
  const [iconQuery, setIconQuery] = useState('');
  const attributeRows = watch('attributes') || [];
  useEffect(() => { reset(defaults); setIconQuery(''); }, [defaults, reset, open]);
  const submit = (value) => {
    const result = save(value, editing?.id);
    if (!result.ok) {
      setError(result.field || 'root', { message: result.error });
      return;
    }
    onClose();
  };
  const filteredIcons = iconNames.filter((name) => name.toLowerCase().includes(iconQuery.toLowerCase()));
  return <ComposedModal open={open} onClose={onClose} size="md" preventCloseOnClickOutside selectorPrimaryFocus="#class-name" launcherButtonRef={openerRef}>
    <ModalHeader title={editing ? 'Edit class' : 'New class'} label={editing ? 'Taxonomy class editor' : 'Taxonomy class builder'} closeModal={onClose} />
    <ModalBody hasForm><form id="taxonomy-form" onSubmit={handleSubmit(submit)} className="modal-form">
      <TextInput id="class-name" labelText="Name" invalid={Boolean(errors.name)} invalidText={errors.name?.message} {...register('name')} />
      <div className="form-pair"><TextInput id="class-shortcut" labelText="Keyboard shortcut (1–9)" maxLength={1} invalid={Boolean(errors.shortcut)} invalidText={errors.shortcut?.message} {...register('shortcut')} />
      <Controller name="color" control={control} render={({ field }) => <fieldset className="color-field"><legend>Color</legend><div>{PALETTE.map((color) => <button key={color} type="button" aria-label={`Choose ${color}`} aria-pressed={field.value === color} className={field.value === color ? 'selected' : ''} style={{ background: color }} onClick={() => field.onChange(color)} />)}</div>{errors.color && <p className="field-error">Color: {errors.color.message}</p>}</fieldset>} /></div>
      <Controller name="icon" control={control} render={({ field }) => <fieldset className="icon-field"><legend>Badge icon</legend><TextInput id="icon-search" labelText="Search icons" hideLabel value={iconQuery} onChange={(e) => setIconQuery(e.target.value)} /><div className="icon-grid">{filteredIcons.map((name) => { const Icon = iconMap[name]; return <button key={name} type="button" className={field.value === name ? 'selected' : ''} aria-label={name} aria-pressed={field.value === name} onClick={() => field.onChange(name)}><Icon size={20} /><span>{name}</span></button>; })}</div>{!filteredIcons.length && <p className="empty-mini">No icons match that search.</p>}{errors.icon && <p className="field-error">Icon: {errors.icon.message}</p>}</fieldset>} />
      <section className="attribute-builder"><div className="section-title"><div><h3>Attributes</h3><p>Optional class-specific region details.</p></div><Button type="button" kind="ghost" size="sm" renderIcon={Add} onClick={() => append({ name: '', kind: 'text', options: [] })}>Add attribute</Button></div>
        {fields.map((field, index) => {
          const row = attributeRows[index] || {};
          const needsOptions = row.kind === 'select' && !(row.options || []).length;
          return <div className="attribute-row" key={field.id}>
            <TextInput id={`attribute-${index}-name`} labelText="Attribute name" invalid={Boolean(fieldError(errors, ['attributes', index, 'name']))} invalidText={fieldError(errors, ['attributes', index, 'name'])} {...register(`attributes.${index}.name`)} />
            <Controller name={`attributes.${index}.kind`} control={control} render={({ field: kindField }) => <Select id={`attribute-${index}-kind`} labelText="Kind" value={kindField.value} onChange={(e) => kindField.onChange(e.target.value)}><SelectItem value="text" text="Text" /><SelectItem value="select" text="Select" /></Select>} />
            <div>
              <Controller name={`attributes.${index}.options`} control={control} render={({ field: optionField }) => <TextInput id={`attribute-${index}-options`} labelText="Options (comma separated)" disabled={row.kind !== 'select'} value={(optionField.value || []).join(', ')} invalid={Boolean(fieldError(errors, ['attributes', index, 'options']))} invalidText={fieldError(errors, ['attributes', index, 'options'])} onChange={(e) => optionField.onChange(e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} />} />
              {needsOptions && <p className="field-error" id={`attribute-${index}-options-error`}>Attribute options: a select attribute needs at least one non-empty option.</p>}
            </div>
            <Button type="button" hasIconOnly kind="danger--ghost" size="sm" renderIcon={TrashCan} iconDescription="Remove attribute" onClick={() => remove(index)} />
          </div>;
        })}
        {!fields.length && <p className="empty-mini">No attributes. Regions of this class will use an empty attributeValues object.</p>}
      </section>
      {errors.root && <InlineNotification lowContrast kind="error" title="Class invalid" subtitle={errors.root.message} hideCloseButton />}
    </form></ModalBody>
    <ModalFooter><Button kind="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="taxonomy-form" disabled={!isValid}>{editing ? 'Save changes' : 'Save class'}</Button></ModalFooter>
  </ComposedModal>;
}

function MetadataForm({ open, onClose, openerRef }) {
  const fields = useStudioStore((s) => s.metadataFields);
  const save = useStudioStore((s) => s.saveMetadataField);
  useDialogDismiss(open, onClose, openerRef);
  const schema = useMemo(() => createMetadataFormSchema(fields), [fields]);
  const { register, handleSubmit, control, watch, reset, setError, formState: { errors, isValid } } = useForm({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: { name: '', kind: 'text', options: [] } });
  const kind = watch('kind');
  const options = watch('options') || [];
  const needsOptions = kind === 'select' && !options.length;
  useEffect(() => { if (open) reset({ name: '', kind: 'text', options: [] }); }, [open, reset]);
  const submit = (value) => {
    const result = save(value);
    if (!result.ok) { setError(result.field || 'root', { message: result.error }); return; }
    onClose();
  };
  return <ComposedModal open={open} onClose={onClose} size="sm" preventCloseOnClickOutside selectorPrimaryFocus="#metadata-name" launcherButtonRef={openerRef}>
    <ModalHeader title="New metadata field" label="Metadata field builder" closeModal={onClose} />
    <ModalBody hasForm><form id="metadata-form" className="modal-form" onSubmit={handleSubmit(submit)}>
      <TextInput id="metadata-name" labelText="Name" invalid={Boolean(errors.name)} invalidText={errors.name?.message} {...register('name')} />
      <Controller name="kind" control={control} render={({ field }) => <Select id="metadata-kind" labelText="Kind" value={field.value} onChange={(e) => field.onChange(e.target.value)} invalid={Boolean(errors.kind)} invalidText={errors.kind?.message}><SelectItem value="text" text="Text" /><SelectItem value="number" text="Number" /><SelectItem value="select" text="Select" /><SelectItem value="checkbox" text="Checkbox" /></Select>} />
      <div>
        <Controller name="options" control={control} render={({ field }) => <TextInput id="metadata-options" labelText="Options (comma separated)" disabled={kind !== 'select'} value={(field.value || []).join(', ')} invalid={Boolean(errors.options)} invalidText={errors.options?.message} onChange={(e) => field.onChange(e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} />} />
        {needsOptions && <p className="field-error">Options: a select field needs at least one non-empty option.</p>}
      </div>
      {errors.root && <InlineNotification lowContrast kind="error" title="Field invalid" subtitle={errors.root.message} hideCloseButton />}
    </form></ModalBody>
    <ModalFooter><Button kind="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="metadata-form" disabled={!isValid}>Save field</Button></ModalFooter>
  </ComposedModal>;
}

function ConfirmDelete({ deleting, count, onCancel, onConfirm }) {
  const kind = deleting?.kind || 'class';
  const noun = kind === 'class' ? 'regions' : 'saved annotations';
  return <ComposedModal open={Boolean(deleting)} onClose={onCancel} size="xs" preventCloseOnClickOutside selectorPrimaryFocus=".cds--btn--secondary">
    <ModalHeader title={`Delete ${kind}`} label="Confirmation required" closeModal={onCancel} />
    <ModalBody><p>Delete <strong>{deleting?.target?.name}</strong>? Exactly <strong>{count}</strong> {noun} carry {kind === 'class' ? 'this class' : 'values for this field'}. {kind === 'class' && 'Those regions will be marked Unclassified.'}</p></ModalBody>
    <ModalFooter><Button kind="secondary" onClick={onCancel}>Cancel</Button><Button kind="danger" onClick={onConfirm}>Delete {kind}</Button></ModalFooter>
  </ComposedModal>;
}

export default function TaxonomyView() {
  const taxonomy = useStudioStore((s) => s.taxonomy);
  const metadataFields = useStudioStore((s) => s.metadataFields);
  const deleteClass = useStudioStore((s) => s.deleteTaxonomyClass);
  const deleteMetadata = useStudioStore((s) => s.deleteMetadataField);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const newClassOpener = useRef(null);
  const newFieldOpener = useRef(null);
  const state = useStudioStore();
  const deleteCount = deleting?.kind === 'class' ? getClassRegionCount(state, deleting.target.id) : deleting ? getMetadataValueCount(state, deleting.target.name) : 0;
  return <div className="view-shell taxonomy-view">
    <header className="view-heading"><div><p className="eyebrow">Configuration</p><h1>Label taxonomy</h1><p>Classes, badge icons, shortcuts, and region attributes compile directly into Labels JSON.</p></div><Button renderIcon={Add} onClick={(event) => { newClassOpener.current = event.currentTarget; setEditing(null); setFormOpen(true); }}>New class</Button></header>
    <div className="class-list" role="list">{taxonomy.map((cls) => <article id={`taxonomy-${cls.id}`} role="listitem" className="class-row" key={cls.id} tabIndex={-1}>
      <span className="class-swatch" style={{ background: cls.color }} /><ClassIcon name={cls.icon} size={22} /><div className="class-info"><h2>{cls.name}</h2><div><Tag type="gray">Shortcut {cls.shortcut}</Tag><Tag type="cool-gray">{cls.icon}</Tag></div></div>
      <div className="attribute-tags">{cls.attributes.length ? cls.attributes.map((attribute) => <span key={attribute.name}><strong>{attribute.name}</strong> · {attribute.kind}{attribute.options.length ? ` · ${attribute.options.join(' / ')}` : ''}</span>) : <em>No attributes</em>}</div>
      <div className="row-actions"><Button hasIconOnly kind="ghost" renderIcon={Edit} iconDescription={`Edit ${cls.name}`} onClick={() => { setEditing(cls); setFormOpen(true); }} /><Button hasIconOnly kind="danger--ghost" renderIcon={TrashCan} iconDescription={`Delete ${cls.name}`} disabled={cls.id === 'cls-unclassified'} onClick={() => setDeleting({ kind: 'class', target: cls })} /></div>
    </article>)}</div>
    <section className="metadata-section"><header className="section-title"><div><p className="eyebrow">Annotation metadata</p><h2>Metadata fields</h2><p>Controls appear below comments on every annotation card.</p></div><Button kind="tertiary" renderIcon={Add} onClick={(event) => { newFieldOpener.current = event.currentTarget; setMetadataOpen(true); }}>New field</Button></header>
      <div className="metadata-list">{metadataFields.map((field) => <div key={field.id}><span><strong>{field.name}</strong><small>{field.kind}{field.options.length ? ` · ${field.options.join(', ')}` : ''}</small></span><Button hasIconOnly kind="danger--ghost" size="sm" renderIcon={TrashCan} iconDescription={`Delete ${field.name}`} onClick={() => setDeleting({ kind: 'metadata field', target: field })} /></div>)}</div>
    </section>
    <TaxonomyForm open={formOpen} editing={editing} openerRef={newClassOpener} onClose={() => setFormOpen(false)} />
    <MetadataForm open={metadataOpen} openerRef={newFieldOpener} onClose={() => setMetadataOpen(false)} />
    <ConfirmDelete deleting={deleting} count={deleteCount} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting.kind === 'class') deleteClass(deleting.target.id); else deleteMetadata(deleting.target.id); setDeleting(null); }} />
  </div>;
}
