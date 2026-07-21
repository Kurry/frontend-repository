// Field configuration panel: edits the FieldDefinition create/update
// payload for the selected node. Valid changes apply immediately to the
// shared tree (and every derived pane); invalid values show inline,
// associated errors and are never applied. Docks at 280px.
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'motion/react';
import { Close, LightFilled } from '@carbon/icons-react';
import { useStore, displayedTree, isScrubbing } from './store.js';
import { fieldFormSchema, splitEnumText, numOrUndef, retypeNode, findNode, CONSTRAINT_TEMPLATES, FIELD_TYPES, KEY_RULE } from './lib.js';
import { Field, Switch, TypeBadge, useDur } from './ui.jsx';

function zodResolverLite(schema, crossCheck) {
  return async (values) => {
    const result = schema.safeParse(values);
    const errors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) errors[key] = { type: 'validate', message: issue.message };
      }
    } else if (crossCheck) {
      const extra = crossCheck(result.data);
      if (extra && !errors[extra.path]) {
        errors[extra.path] = { type: 'validate', message: extra.message };
      }
    }
    return { values: result.success ? result.data : {}, errors };
  };
}

function defaultsFor(node) {
  return {
    key: node.key,
    type: node.type,
    required: !!node.required,
    description: node.description || '',
    enumText: (node.enumValues || []).join('\n'),
    minimum: node.minimum === undefined ? '' : String(node.minimum),
    maximum: node.maximum === undefined ? '' : String(node.maximum),
    pattern: node.pattern || '',
  };
}

function normalize(v) {
  const patch = { key: v.key.trim(), type: v.type, required: !!v.required, description: v.description.trim() };
  if (v.type === 'string') {
    const list = splitEnumText(v.enumText).filter((e) => e !== '');
    if (list.length) patch.enumValues = list;
    if (v.pattern.trim()) patch.pattern = v.pattern.trim();
  }
  if (v.type === 'number') {
    const min = numOrUndef(v.minimum);
    const max = numOrUndef(v.maximum);
    if (min !== undefined) patch.minimum = min;
    if (max !== undefined) patch.maximum = max;
  }
  return patch;
}

function sameAs(patch, node) {
  return (
    patch.key === node.key &&
    patch.type === node.type &&
    patch.required === !!node.required &&
    (patch.description || '') === (node.description || '') &&
    (patch.enumValues || []).join('|') === (node.enumValues || []).join('|') &&
    (patch.minimum === undefined ? '' : patch.minimum) === (node.minimum === undefined ? '' : node.minimum) &&
    (patch.maximum === undefined ? '' : patch.maximum) === (node.maximum === undefined ? '' : node.maximum) &&
    (patch.pattern || '') === (node.pattern || '')
  );
}

export default function ConfigPanel() {
  const dur = useDur();
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const readOnly = useStore(isScrubbing);
  const tree = useStore(displayedTree);
  const selectNode = useStore((s) => s.selectNode);
  const applyPanelEdit = useStore((s) => s.applyPanelEdit);
  const checkSiblingKey = useStore((s) => s.checkSiblingKey);
  const toast = useStore((s) => s.toast);

  const node = tree && selectedNodeId ? findNode(tree, selectedNodeId) : null;

  const {
    register,
    reset,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: node ? defaultsFor(node) : {},
    resolver: zodResolverLite(fieldFormSchema, (v) => {
      if (node) {
        const sib = checkSiblingKey(node.id, v.key.trim());
        if (sib) return { path: 'key', message: sib };
      }
      return null;
    }),
  });

  useEffect(() => {
    if (node) reset(defaultsFor(node));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId]);

  useEffect(() => {
    if (!node || readOnly) return undefined;
    const sub = watch(async () => {
      const ok = await trigger();
      if (!ok) return;
      const v = getValues();
      const patch = normalize(v);
      if (sameAs(patch, node)) return;
      const retyped = patch.type !== node.type;
      applyPanelEdit(
        node.id,
        (n) => {
          const base = retyped ? retypeNode(n, patch.type) : { ...n };
          const next = { ...base, key: patch.key, required: patch.required, description: patch.description };
          if (patch.type === 'string') {
            if (patch.enumValues) next.enumValues = patch.enumValues;
            else delete next.enumValues;
            if (patch.pattern) next.pattern = patch.pattern;
            else delete next.pattern;
          }
          if (patch.type === 'number') {
            if (patch.minimum !== undefined) next.minimum = patch.minimum;
            else delete next.minimum;
            if (patch.maximum !== undefined) next.maximum = patch.maximum;
            else delete next.maximum;
          }
          return next;
        },
        retyped ? 'Retype field' : patch.key !== node.key ? 'Rename field' : 'Update field',
      );
    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId, readOnly]);

  const v = watch();

  function applyTemplate(t) {
    setValue('type', t.type, { shouldValidate: true, shouldDirty: true });
    setValue('pattern', t.apply.pattern || '', { shouldValidate: true, shouldDirty: true });
    setValue('enumText', t.apply.enumValues ? t.apply.enumValues.join('\n') : '', { shouldValidate: true, shouldDirty: true });
    setValue('minimum', t.apply.minimum === undefined ? '' : String(t.apply.minimum), { shouldValidate: true, shouldDirty: true });
    setValue('maximum', t.apply.maximum === undefined ? '' : String(t.apply.maximum), { shouldValidate: true, shouldDirty: true });
    toast(`Applied the "${t.name}" template`);
  }

  const errProps = (name) => ({
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${`cfg-${name}`}-error` : undefined,
  });

  return (
    <AnimatePresence initial={false}>
      {node && (
        <motion.aside
          className="config-panel"
          initial={{ width: 0, opacity: 0, x: 24 }}
          animate={{ width: 280, opacity: 1, x: 0 }}
          exit={{ width: 0, opacity: 0, x: 24 }}
          transition={{ duration: dur.base, ease: 'easeOut' }}
          aria-label="Field configuration panel"
        >
          <div className="config-inner">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="heading-panel m-0">Field configuration</h2>
              <button type="button" className="icon-btn tap" aria-label="Close configuration panel" onClick={() => selectNode(null)}>
                <Close size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <TypeBadge type={node.type} />
              <span className="truncate text-sm font-semibold" title={node.key}>
                {node.key}
              </span>
              {node.required && <span className="req-star" aria-label="required">*</span>}
            </div>
            {readOnly ? (
              <p className="muted text-sm">The configuration panel is read-only while previewing history.</p>
            ) : (
              <form onSubmit={(e) => e.preventDefault()} noValidate>
                <Field label="Key" htmlFor="cfg-key" error={errors.key?.message} hint={`1–40 chars — ${KEY_RULE}`}>
                  <input id="cfg-key" className="input" autoComplete="off" {...register('key')} {...errProps('key')} />
                </Field>
                <Field label="Type" htmlFor="cfg-type" error={errors.type?.message} hint="Closed enum — changing type clears constraints that do not apply">
                  <select id="cfg-type" className="select" {...register('type')} {...errProps('type')}>
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="field-block">
                  <span className="field-label" id="cfg-required-label">
                    Required
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="cfg-required"
                      checked={!!v.required}
                      label={`Required for ${node.key}`}
                      onChange={() => setValue('required', !v.required, { shouldValidate: true, shouldDirty: true })}
                    />
                    <span className="muted text-xs">{v.required ? 'Required' : 'Optional'}</span>
                  </div>
                </div>
                <Field label="Description (optional)" htmlFor="cfg-description">
                  <textarea id="cfg-description" className="input input-area" rows={2} {...register('description')} />
                </Field>
                {v.type === 'string' && (
                  <>
                    <Field
                      label="Enum values (optional)"
                      htmlFor="cfg-enum"
                      error={errors.enumText?.message}
                      hint="One entry per line — empty entries are rejected"
                    >
                      <textarea id="cfg-enum" className="input input-area mono" rows={3} {...register('enumText')} {...errProps('enumText')} />
                    </Field>
                    <Field
                      label="Pattern (optional)"
                      htmlFor="cfg-pattern"
                      error={errors.pattern?.message}
                      hint="A valid regular expression, e.g. ^[a-z0-9_]+$"
                    >
                      <input id="cfg-pattern" className="input mono" autoComplete="off" {...register('pattern')} {...errProps('pattern')} />
                    </Field>
                  </>
                )}
                {v.type === 'number' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Minimum (optional)" htmlFor="cfg-minimum" error={errors.minimum?.message} hint="Smallest accepted number">
                      <input id="cfg-minimum" className="input mono" inputMode="decimal" autoComplete="off" {...register('minimum')} {...errProps('minimum')} />
                    </Field>
                    <Field label="Maximum (optional)" htmlFor="cfg-maximum" error={errors.maximum?.message} hint="Largest accepted number">
                      <input id="cfg-maximum" className="input mono" inputMode="decimal" autoComplete="off" {...register('maximum')} {...errProps('maximum')} />
                    </Field>
                  </div>
                )}
                <div className="mt-4">
                  <h3 className="heading-sub">Constraint templates</h3>
                  <ul className="template-list">
                    {CONSTRAINT_TEMPLATES.map((t) => (
                      <li key={t.name}>
                        <button type="button" className="template-btn tap" onClick={() => applyTemplate(t)}>
                          <LightFilled size={12} aria-hidden="true" />
                          <span className="template-name">{t.name}</span>
                          <span className="muted text-xs">{t.hint}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </form>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
