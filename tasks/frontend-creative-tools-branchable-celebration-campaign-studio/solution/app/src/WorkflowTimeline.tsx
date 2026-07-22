import React from 'react';
import { WorkflowStep } from './types';

const STEPS: { id: WorkflowStep, label: string }[] = [
  { id: 'brief', label: 'Brief' },
  { id: 'source_review', label: 'Source Review' },
  { id: 'copy_variants', label: 'Copy Variants' },
  { id: 'artwork_variants', label: 'Artwork Variants' },
  { id: 'accessibility_review', label: 'Accessibility Review' },
  { id: 'host_approval', label: 'Host Approval' },
  { id: 'personalization', label: 'Personalization' },
  { id: 'delivery_rehearsal', label: 'Delivery Rehearsal' },
  { id: 'rsvp_tracking', label: 'RSVP Tracking' },
  { id: 'package', label: 'Package' }
];

export default function WorkflowTimeline({ step, setStep }: { step: WorkflowStep, setStep: React.Dispatch<React.SetStateAction<WorkflowStep>> }) {
  const currentIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="flex-1 flex flex-col h-full bg-white border-t border-gray-200">
      <div className="p-2 border-b flex justify-between items-center bg-gray-50">
        <span className="font-medium text-gray-700">Workflow Timeline</span>
        <div className="flex gap-1">
          <button onClick={() => currentIndex > 0 && setStep(STEPS[currentIndex - 1].id)} disabled={currentIndex === 0} className="px-2 py-0.5 text-xs bg-gray-200 rounded disabled:opacity-50">Prev</button>
          <button onClick={() => currentIndex < STEPS.length - 1 && setStep(STEPS[currentIndex + 1].id)} disabled={currentIndex === STEPS.length - 1} className="px-2 py-0.5 text-xs bg-gray-200 rounded disabled:opacity-50">Next</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 relative">
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200"></div>
        <div className="space-y-4">
          {STEPS.map((s, idx) => {
            const isPast = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={s.id} className="relative flex items-center group cursor-pointer" onClick={() => setStep(s.id)}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 mr-3 transition-colors ${
                  isPast ? 'bg-green-500 text-white' :
                  isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-100' : 'bg-gray-300'
                }`}>
                  {isPast && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className={`text-sm ${isCurrent ? 'font-bold text-blue-700' : isPast ? 'text-gray-600' : 'text-gray-400'}`}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
