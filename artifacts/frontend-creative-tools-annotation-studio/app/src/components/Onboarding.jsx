import { useEffect, useRef } from 'react';
import { Button } from '@carbon/react';
import { ArrowRight, ArrowLeft, Tag, DocumentExport, Catalog } from '@carbon/icons-react';
import { useStudioStore } from '../store';
import { useDialogDismiss } from './dialogs';

const steps = [
  {
    icon: Catalog,
    title: 'Welcome to the Corvid annotation studio',
    body: 'You are the final reviewer in the Kestrel × Juniper evaluation pipeline. Three suites of model outputs are queued on the left — each badge shows how many still need a first-pass annotation, and everything you do compiles live into the Labels JSON artifact.',
  },
  {
    icon: ArrowRight,
    title: 'Work the queue, one card at a time',
    body: 'Pick a suite, choose thumbs up or down, drag each rubric slider, and press Submit & Next. Need to come back later? Skip moves the item to the end of the queue. Bulk-select to skip or mark reviewed in one pass — and Ctrl+Z undoes any of it.',
  },
  {
    icon: Tag,
    title: 'Draw regions on image outputs',
    body: 'Some outputs carry a warehouse scene. Arm a taxonomy class with its number shortcut or the class picker, then drag a box over the evidence. Each region lands in the region list with its class color and attribute values.',
  },
  {
    icon: DocumentExport,
    title: 'Ship the Labels JSON',
    body: 'The Export center compiles schemaVersion annotation-studio-labels-v1 with your taxonomy, metadata fields, and every submitted annotation — download it, copy it, or round-trip it back through Import. Press ⌘K or Ctrl+K anytime to jump between views.',
  },
];

export default function Onboarding() {
  const step = useStudioStore((s) => s.onboardingStep);
  const setStep = useStudioStore((s) => s.setOnboardingStep);
  const close = useStudioStore((s) => s.closeOnboarding);
  const panelRef = useRef(null);
  const open = step !== null && step >= 0 && step < steps.length;
  useDialogDismiss(open, close, panelRef);

  useEffect(() => {
    if (open) window.setTimeout(() => panelRef.current?.querySelector('button, [href], input')?.focus(), 60);
  }, [open, step]);

  if (!open) return null;
  const current = steps[step];
  const last = step === steps.length - 1;
  const StepIcon = current.icon;
  return <div className="tour-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <div className="tour-panel" ref={panelRef} role="dialog" aria-modal="true" aria-label="Getting started tour">
      <p className="eyebrow">Getting started · {step + 1} of {steps.length}</p>
      <div className="tour-icon"><StepIcon size={26} /></div>
      <h2>{current.title}</h2>
      <p className="tour-body">{current.body}</p>
      <div className="tour-dots" aria-hidden="true">{steps.map((entry, index) => <i key={entry.title} className={index === step ? 'on' : ''} />)}</div>
      <div className="tour-actions">
        <Button kind="ghost" size="sm" onClick={close}>Skip tour</Button>
        <div className="tour-nav">
          {step > 0 && <Button kind="secondary" size="sm" renderIcon={ArrowLeft} onClick={() => setStep(step - 1)}>Back</Button>}
          <Button size="sm" renderIcon={last ? ArrowRight : ArrowRight} onClick={() => (last ? close() : setStep(step + 1))}>{last ? 'Start annotating' : 'Next'}</Button>
        </div>
      </div>
    </div>
  </div>;
}
