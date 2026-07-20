import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $leads, $theme, undoLastLead } from '../store';
import { Download, Copy, ArrowUUpLeft } from 'phosphor-react';
import { buildLeadsJson, copyArtifactText } from '../artifacts';

export default function SessionLeads() {
  const leads = useStore($leads);
  const theme = useStore($theme);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const getExportData = () => buildLeadsJson(leads, theme);

  const handleDownload = () => {
    const blob = new Blob([getExportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ridge-session-leads.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await copyArtifactText(getExportData());
      setCopyStatus('idle');
      requestAnimationFrame(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 3000);
      });
    } catch {
      setCopyStatus('idle');
      requestAnimationFrame(() => {
        setCopyStatus('error');
        setTimeout(() => setCopyStatus('idle'), 3000);
      });
    }
  };

  return (
    <section className="session-leads py-12 bg-surface/30 border-t border-white/10" id="session-leads-section" aria-label="Session Leads">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold display-font">Session Leads</h2>
            <p className="text-sm text-gray-400 mt-1">Total: {leads.length}</p>
          </div>
          <div className="flex gap-2">
             <button
               className="btn btn-sm btn-ghost notch-br gap-2"
               disabled={leads.length === 0}
               onClick={undoLastLead}
             >
               <ArrowUUpLeft size={16} /> Undo last lead
             </button>
             <button
               className="btn btn-sm btn-outline notch-br gap-2 text-current border-current"
               onClick={handleCopy}
             >
               <Copy size={16} /> {copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Copy failed' : 'Copy leads JSON'}
             </button>
             <button
               className="btn btn-sm btn-primary notch-br gap-2"
               onClick={handleDownload}
             >
               <Download size={16} /> Download leads JSON
             </button>
          </div>
        </div>

        <div className="bg-void notch-br border border-white/10 p-6 min-h-[200px]">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <p className="text-gray-400">Contact submissions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map(lead => (
                <div key={lead.id} className="p-4 bg-surface/50 border border-white/5 rounded flex justify-between items-center">
                  <div>
                    <span className="badge badge-sm badge-accent mr-3">{lead.kind}</span>
                    <span className="font-medium">{lead.payload.name} — {lead.payload.interest}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(lead.submittedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ARIA live region for copied announcement */}
        <div aria-live="polite" className="sr-only">
          {copyStatus === 'copied' ? 'Copied leads JSON' : copyStatus === 'error' ? 'Unable to copy leads JSON' : ''}
        </div>
      </div>
    </section>
  );
}
