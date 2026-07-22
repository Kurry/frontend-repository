import React, { useState } from 'react';
import { useGlobalState, updateProjectState, generateChecksum } from '../store';

const runValidation = (project) => {
  const { cues, shots, mediaDuration } = project;
  const findings = [];

  // First render batch deterministically fails one cue font check and one export timestamp
  if (project.validatorRuns.length === 0) {
     findings.push({ id: 'f-init-1', type: 'error', message: 'Font render check failed (synthetic)', cueId: 'cue1' });
     findings.push({ id: 'f-init-2', type: 'error', message: 'Export timestamp out of bounds (synthetic)', cueId: null });
  }

  cues.forEach(cue => {
    // 1. Duration constraints
    const duration = cue.end - cue.start;
    if (duration < 500) findings.push({ id: `f-dur-${cue.id}`, type: 'error', message: `Cue duration < 500ms (${duration}ms)`, cueId: cue.id });
    if (duration > 7000) findings.push({ id: `f-dur2-${cue.id}`, type: 'error', message: `Cue duration > 7000ms (${duration}ms)`, cueId: cue.id });
    if (cue.end > mediaDuration) findings.push({ id: `f-bounds-${cue.id}`, type: 'error', message: `Cue exceeds media duration`, cueId: cue.id });

    // 2. Reading speed (> 21 chars per second = ~warning)
    const cps = cue.text.length / (duration / 1000);
    if (cps > 21) {
       findings.push({ id: `f-spd-${cue.id}`, type: 'warning', message: `High reading speed: ${Math.round(cps)} chars/sec`, cueId: cue.id });
    }

    // 3. Safe area / Line limits (max 2 lines, 42 chars per line)
    const lines = cue.text.split('\n');
    if (lines.length > 2) findings.push({ id: `f-lines-${cue.id}`, type: 'error', message: `Exceeds 2 lines`, cueId: cue.id });
    if (lines.some(l => l.length > 42)) findings.push({ id: `f-len-${cue.id}`, type: 'error', message: `Line exceeds 42 characters`, cueId: cue.id });

    // 4. Overlap & lane semantics
    const overlapping = cues.filter(c => c.id !== cue.id && c.lane === cue.lane &&
        ((c.start >= cue.start && c.start < cue.end) || (c.end > cue.start && c.end <= cue.end) || (c.start <= cue.start && c.end >= cue.end))
    );
    if (overlapping.length > 0) {
       findings.push({ id: `f-ovl-${cue.id}`, type: 'error', message: `Overlap in lane ${cue.lane}`, cueId: cue.id });
    }

    // 5. Shot boundaries
    const crossingShot = shots.find(s => cue.start < s.end && cue.end > s.end && (cue.end - s.end > 200) && (s.end - cue.start > 200));
    if (crossingShot) {
       findings.push({ id: `f-shot-${cue.id}`, type: 'warning', message: `Crosses shot boundary at ${crossingShot.end}ms`, cueId: cue.id });
    }
  });

  return findings;
};

const Review = () => {
  const [project] = useGlobalState('project');
  const { cues, validatorRuns, masterApproved, currentChecksum, validationChecksum } = project;
  const isStale = currentChecksum !== validationChecksum;

  const currentRun = validatorRuns[validatorRuns.length - 1] || { findings: [] };
  const errors = currentRun.findings.filter(f => f.type === 'error');
  const warnings = currentRun.findings.filter(f => f.type === 'warning');

  const handleRunValidation = () => {
    const findings = runValidation(project);
    updateProjectState(p => ({
      validatorRuns: [...p.validatorRuns, { id: Date.now(), findings, checksum: currentChecksum }],
      validationChecksum: currentChecksum
    }));
  };

  const handleApprove = () => {
    if (errors.length > 0) return alert("Cannot approve with validation errors.");
    if (isStale) return alert("Cannot approve stale validation. Please run validation again.");
    updateProjectState({ masterApproved: true });
  };

  return (
    <div className="p-4 bg-gray-900 border-t border-gray-700 h-64 flex flex-col">
      <div className="flex justify-between items-center mb-4">
         <h2 className="font-bold">Validation & Review</h2>
         <div className="space-x-2">
            {isStale && <span className="text-yellow-500 text-sm font-bold bg-yellow-900/30 px-2 py-1 rounded">Stale</span>}
            <button onClick={handleRunValidation} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm">
               Run Validation
            </button>
            <button
              onClick={handleApprove}
              disabled={masterApproved || isStale || errors.length > 0}
              className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 px-3 py-1 rounded text-sm"
            >
               {masterApproved ? 'Master Approved' : 'Approve Master'}
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
         {currentRun.findings.length === 0 && validatorRuns.length > 0 && !isStale && (
            <div className="text-green-400">All checks passed!</div>
         )}
         {currentRun.findings.map(f => (
            <div key={f.id} className={`p-2 rounded text-sm border-l-4 ${f.type === 'error' ? 'bg-red-900/20 border-red-500 text-red-200' : 'bg-yellow-900/20 border-yellow-500 text-yellow-200'}`}>
               <div className="flex justify-between">
                  <span className="font-bold uppercase text-xs">{f.type}</span>
                  {f.cueId && <span className="text-gray-500 text-xs">Cue: {f.cueId}</span>}
               </div>
               <div>{f.message}</div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default Review;
