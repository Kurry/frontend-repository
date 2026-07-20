import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, ComposedModal, ModalBody, ModalFooter, ModalHeader, Select, SelectItem, TextInput, Tag } from '@carbon/react';
import { Checkmark, Flag } from '@carbon/icons-react';
import { DisputeCreateSchema, ResolveCreateSchema } from '../schemas';
import { useStudioStore } from '../store';
import { StateChip } from './Sidebar';

function DisputeForm({ item, onClose }) {
  const changeState = useStudioStore((s) => s.setReviewState);
  const { register, handleSubmit, formState: { errors, isValid } } = useForm({ resolver: zodResolver(DisputeCreateSchema), mode: 'onChange', defaultValues: { reason: '' } });
  const submit = ({ reason }) => { changeState(item.id, 'disputed', { disputeReason: reason }); onClose(); };
  return <ComposedModal open={Boolean(item)} onClose={onClose} size="sm" preventCloseOnClickOutside><ModalHeader title="Dispute annotation" label="DisputeCreate" closeModal={onClose} /><ModalBody hasForm><form id="dispute-form" onSubmit={handleSubmit(submit)} className="modal-form"><TextInput id="dispute-reason" labelText="Reason" maxLength={201} invalid={Boolean(errors.reason)} invalidText={errors.reason?.message} {...register('reason')} /><p className="form-hint">One line, 1–200 characters. The reason field is required.</p></form></ModalBody><ModalFooter><Button kind="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="dispute-form" disabled={!isValid}>Dispute</Button></ModalFooter></ComposedModal>;
}

function ResolveForm({ item, onClose }) {
  const resolve = useStudioStore((s) => s.resolveDispute);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm({ resolver: zodResolver(ResolveCreateSchema), mode: 'onChange', defaultValues: { rating: '' } });
  const submit = ({ rating }) => { resolve(item.id, rating); onClose(); };
  return <ComposedModal open={Boolean(item)} onClose={onClose} size="xs" preventCloseOnClickOutside><ModalHeader title="Resolve dispute" label="ResolveCreate" closeModal={onClose} /><ModalBody hasForm><form id="resolve-form" onSubmit={handleSubmit(submit)} className="modal-form"><Controller name="rating" control={control} render={({ field }) => <Select id="resolved-rating" labelText="Corrected rating" value={field.value} onChange={(e) => field.onChange(e.target.value)} invalid={Boolean(errors.rating)} invalidText={errors.rating?.message}><SelectItem value="" text="Choose a rating" disabled /><SelectItem value="up" text="Up" /><SelectItem value="down" text="Down" /></Select>} /></form></ModalBody><ModalFooter><Button kind="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="resolve-form" disabled={!isValid}>Resolve</Button></ModalFooter></ComposedModal>;
}

export default function ReviewView() {
  const items = useStudioStore((s) => s.items);
  const openHistory = useStudioStore((s) => s.openHistory);
  const markState = useStudioStore((s) => s.setReviewState);
  const [disputeItem, setDisputeItem] = useState(null);
  const [resolveItem, setResolveItem] = useState(null);
  const tiers = useMemo(() => [
    { state: 'disputed', title: 'Disputed', description: 'Highest priority · requires resolution', items: Object.values(items).filter((item) => item.review_state === 'disputed').sort((a, b) => (b.lastDisputedAt || 0) - (a.lastDisputedAt || 0)) },
    { state: 'labeled', title: 'Labeled', description: 'Awaiting review', items: Object.values(items).filter((item) => item.review_state === 'labeled') },
    { state: 'reviewed', title: 'Reviewed', description: 'Quality checked', items: Object.values(items).filter((item) => item.review_state === 'reviewed') },
  ], [items]);
  return <div className="view-shell review-view"><header className="view-heading"><div><p className="eyebrow">Priority queue</p><h1>Review queue</h1><p>Disputed work stays ahead of labeled and reviewed annotations.</p></div></header>
    <div className="review-tiers">{tiers.map((tier) => <section key={tier.state} className={`review-tier tier-${tier.state}`}><header><div><h2>{tier.title}</h2><p>{tier.description}</p></div><Tag type={tier.state === 'disputed' ? 'red' : tier.state === 'reviewed' ? 'green' : 'blue'}>{tier.items.length}</Tag></header>
      <div>{tier.items.map((item) => <article key={item.id} className="review-item"><button className="review-main" onClick={() => openHistory(item.id)}><span><strong>{item.title}</strong><small>{item.response.length > 105 ? item.response.slice(0, 105) + '…' : item.response}</small></span><StateChip state={item.review_state} /><b className={`rating-dot ${item.annotation?.rating}`}>{item.annotation?.rating === 'up' ? '↑' : '↓'}</b></button><div className="review-actions">
        {tier.state === 'disputed' ? <Button size="sm" renderIcon={Checkmark} onClick={() => setResolveItem(item)}>Resolve</Button> : <><Button size="sm" kind="ghost" renderIcon={Flag} onClick={() => setDisputeItem(item)}>Dispute</Button>{tier.state === 'labeled' && <Button size="sm" kind="tertiary" onClick={() => markState(item.id, 'reviewed')}>Mark reviewed</Button>}</>}
      </div></article>)}</div>{!tier.items.length && <p className="tier-empty">
        {tier.state === 'disputed' ? 'No disputed items. Disagreeing labels from the Agreement view or manually flagged items appear here.' : `No ${tier.title.toLowerCase()} items.`}
      </p>}
    </section>)}</div>
    {disputeItem && <DisputeForm item={disputeItem} onClose={() => setDisputeItem(null)} />}{resolveItem && <ResolveForm item={resolveItem} onClose={() => setResolveItem(null)} />}
  </div>;
}
