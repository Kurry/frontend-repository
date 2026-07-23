import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { Icon, Modal } from './primitives';

const STEPS = [
  { title: 'Welcome to the Theme Creator', body: 'Design a Material UI theme by editing the palette, typography, and shape, then export a re-importable package.', icon: 'palette' },
  { title: 'Preview and Components', body: 'The Preview tab shows a device-framed sample site; the Components tab renders themed MUI demos. Both reflect the live theme instantly.', icon: 'preview' },
  { title: 'Export and Save', body: 'Open Theme Files to copy or download the JSON and CSS artifacts, and use New Theme to save your work under Saved Themes.', icon: 'folder_zip' }
];

export function Tutorial() {
  const open = useStore((s) => s.tutorialOpen);
  const setOpen = useStore((s) => s.setTutorialOpen);
  const [step, setStep] = useState(0);
  React.useEffect(() => {
    if (open) setStep(0);
  }, [open]);
  const s = STEPS[step];
  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="tutorial-title" width={480}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon name={s.icon} className="text-accent" style={{ fontSize: 22 }} />
          <h2 id="tutorial-title" className="text-lg font-semibold">
            {s.title}
          </h2>
        </div>
        <motion.p key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="text-sm text-shell-muted min-h-[64px]">
          {s.body}
        </motion.p>
        <div className="flex items-center gap-1.5 mt-4">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-accent' : 'w-1.5 bg-shell-3'}`} />
          ))}
          <div className="ml-auto flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep((x) => x - 1)} className="lift bg-shell-2 text-shell-text px-3 py-1.5 rounded text-sm">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep((x) => x + 1)} className="lift bg-accent text-white px-4 py-1.5 rounded text-sm">
                Next
              </button>
            ) : (
              <button type="button" onClick={() => setOpen(false)} className="lift bg-accent text-white px-4 py-1.5 rounded text-sm">
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
