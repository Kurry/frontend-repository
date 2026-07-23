import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, ComposedModal, ModalBody, ModalFooter, ModalHeader, Select, SelectItem, TextArea, Tag } from '@carbon/react';
import { Checkmark, Flag } from '@carbon/icons-react';
import { DisputeCreateSchema, ResolveCreateSchema } from '../schemas';
import { useStudioStore } from '../store';
import { StateChip } from './Sidebar';
import { useDialogDismiss } from './dialogs';
import { RatingControls } from './AnnotationCard';

function DisputeForm({ item, onClose, openerRef }) {
  const changeState = useStudioStore((s) => s.setReviewState);
  useDialogDismiss(Boolean(item), onClose, openerRef);
  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({ resolver: zodResolver(DisputeCreateSchema), mode: 'onChange', reValidateMode: 'onChange', defaultValues: { reason: '' } });
  const reason = watch('reason');
  const submit = ({ reason }) => { changeState(item.id, 'disputed', { disputeReason: reason }); onClose(); };
  return <ComposedModal open={Boolean(item)} onClose={onClose} size="sm" preventCloseOnClickOutside selectorPrimaryFocus="#dispute-reason" launcherButtonRef={openerRef} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}><ModalHeader title="Dispute annotation" label="Dispute reason" closeModal={onClose} /><ModalBody hasForm><form id="dispute-form" onSubmit={handleSubmit(submit)} className="modal-form"><TextArea id="dispute-reason" rows={3} labelText="Reason" invalid={Boolean(errors.reason) || !reason.trim()} invalidText={errors.reason?.message || 'Reason is required'} {...register('reason')} /><p className="form-hint">One line, 1–200 characters. The reason field is required and is preserved in History.</p></form></ModalBody><ModalFooter><Button kind="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="dispute-form" disabled={!isValid}>Dispute</Button></ModalFooter></ComposedModal>;
}

function ResolveForm({ item, onClose, openerRef }) {
  const resolve = useStudioStore((s) => s.resolveDispute);
  useDialogDismiss(Boolean(item), onClose, openerRef);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm({ resolver: zodResolver(ResolveCreateSchema), mode: 'onChange', defaultValues: { rating: '' } });
  const submit = ({ rating }) => { resolve(item.id, rating); onClose(); };
  return <ComposedModal open={Boolean(item)} onClose={onClose} size="xs" preventCloseOnClickOutside selectorPrimaryFocus=".rating-controls button" launcherButtonRef={openerRef} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}><ModalHeader title="Resolve dispute" label="Corrected rating" closeModal={onClose} /><ModalBody hasForm><form id="resolve-form" onSubmit={handleSubmit(submit)} className="modal-form"><Controller name="rating" control={control} render={({ field }) => <div className={errors.rating ? "has-error" : ""}><RatingControls rating={field.value} onChange={(v) => field.onChange(v)} />{errors.rating && <p className="field-error">{errors.rating.message}</p>}</div>} /></form></ModalBody><ModalFooter><Button kind="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="resolve-form" disabled={!isValid}>Resolve</Button></ModalFooter></ComposedModal>;
}

const tierEmptyCopy = {
  disputed: 'No disputed items. Flag a disagreement in the Agreement view or dispute a labeled annotation, and it lands here ahead of everything else.',
  labeled: 'No labeled items waiting for review. Submit annotations in the queue and they appear here for a review pass.',
  reviewed: 'No reviewed items yet. Mark labeled items reviewed — individually or in bulk — to build the quality-checked tier.',
};

export default function ReviewView() {
  const items = useStudioStore((s) => s.items);
  const openHistory = useStudioStore((s) => s.openHistory);
  const markState = useStudioStore((s) => s.setReviewState);
  const [disputeItem, setDisputeItem] = useState(null);
  const [resolveItem, setResolveItem] = useState(null);
  const disputeOpener = useRef(null);
  const resolveOpener = useRef(null);
  const tiers = useMemo(() => [
    { state: 'disputed', title: 'Disputed', description: 'Highest priority · requires resolution', items: Object.values(items).filter((item) => item.review_state === 'disputed').sort((a, b) => (b.lastDisputedAt || 0) - (a.lastDisputedAt || 0)) },
    { state: 'labeled', title: 'Labeled', description: 'Awaiting review', items: Object.values(items).filter((item) => item.review_state === 'labeled') },
    { state: 'reviewed', title: 'Reviewed', description: 'Quality checked', items: Object.values(items).filter((item) => item.review_state === 'reviewed') },
  ], [items]);
  return <div className="view-shell review-view"><header className="view-heading"><div><p className="eyebrow">Priority queue</p><h1>Review queue</h1><p>Disputed work stays ahead of labeled and reviewed annotations.</p></div></header>
    <div className="review-tiers">{tiers.map((tier) => <section key={tier.state} className={`review-tier tier-${tier.state}`}><header><div><h2>{tier.title}</h2><p>{tier.description}</p></div><Tag type={tier.state === 'disputed' ? 'red' : tier.state === 'reviewed' ? 'green' : 'blue'}>{tier.items.length}</Tag></header>
      <div>{tier.items.map((item) => <article key={item.id} className="review-item"><button className="review-main" onClick={() => openHistory(item.id)}><span><strong>{item.title}</strong><small className="clamp-2">{item.response}</small></span><StateChip state={item.review_state} /><b className={`rating-dot ${item.annotation?.rating}`}>{item.annotation?.rating === 'up' ? '↑' : '↓'}</b></button><div className="review-actions">
        {tier.state === 'disputed' ? <Button size="sm" renderIcon={Checkmark} onClick={(event) => { resolveOpener.current = event.currentTarget; setResolveItem(item); }}>Resolve</Button> : <><Button size="sm" kind="ghost" renderIcon={Flag} onClick={(event) => { disputeOpener.current = event.currentTarget; setDisputeItem(item); }}>Dispute</Button>{tier.state === 'labeled' && <Button size="sm" kind="tertiary" onClick={() => markState(item.id, 'reviewed')}>Mark reviewed</Button>}</>}
      </div></article>)}</div>{!tier.items.length && <p className="tier-empty">{tierEmptyCopy[tier.state]}</p>}</section>)}</div>
    {disputeItem && <DisputeForm item={disputeItem} openerRef={disputeOpener} onClose={() => setDisputeItem(null)} />}{resolveItem && <ResolveForm item={resolveItem} openerRef={resolveOpener} onClose={() => setResolveItem(null)} />}
  </div>;
}
