import { useState, useEffect } from 'react';
import { ComposedModal, ModalHeader, ModalBody, ModalFooter, Button } from '@carbon/react';

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('corvid-onboarding-seen')) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('corvid-onboarding-seen', 'true');
    setOpen(false);
  };

  return <ComposedModal open={open} onClose={handleClose} size="sm">
    <ModalHeader title="Welcome to Corvid Annotation Studio" label="Onboarding" closeModal={handleClose} />
    <ModalBody>
      <p style={{ marginBottom: '1rem' }}>Get started by reviewing the unannotated items in the queue on the left. Corvid tracks everything live: review tiers, taxonomy adjustments, and assist runs all feed directly into your Labels JSON payload.</p>
      <p>Use <kbd>⌘K</kbd> or <kbd>Ctrl+K</kbd> to open the Command Palette to navigate efficiently.</p>
    </ModalBody>
    <ModalFooter><Button onClick={handleClose}>Get started</Button></ModalFooter>
  </ComposedModal>;
}
