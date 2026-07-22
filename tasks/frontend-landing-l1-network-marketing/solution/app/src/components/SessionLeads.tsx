import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $leads, $theme, undoLastLead, announce } from '../store';
import { Download, Copy, ArrowUUpLeft } from 'phosphor-react';
import { buildLeadsJson } from '../artifacts';

export default function SessionLeads() {
  const leads = useStore($leads);
  const theme = useStore($theme);
  const [copied, setCopied] = useState(false);

  const getExportData = () => buildLeadsJson(leads, theme);

  const handleDownload = () => {
    const blob = new Blob([getExportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ridge-session-leads.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    announce('Downloaded ridge-session-leads.json.');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getExportData());
      setCopied(true);
      announce('Copied leads JSON to clipboard.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
      announce('Leads JSON copy was blocked by the browser.');
    }
  };

  const handleUndo = () => {
    if (leads.length === 0) return;
    const removed = leads[0];
    undoLastLead();
    announce(`Undo last lead removed ${removed.payload.name}.`);
  };

  return (
    <section className="session-leads surface-copy py-12 bg-surface border-t border-current/10" id="session-leads-section" aria-label="Session Leads">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold display-font">Session Leads</h2>
            <p className="text-sm opacity-70 mt-1" aria-live="polite">Total: {leads.length}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
             <button
               aria-label="Undo last lead"
               className="btn btn-sm btn-ghost notch-br gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
               disabled={leads.length === 0}
               onClick={handleUndo}
             >
               <ArrowUUpLeft size={16} /> Undo last lead
             </button>
             <button
               aria-label="Copy leads JSON"
               className="btn btn-sm btn-outline notch-br gap-2 text-current border-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
               onClick={handleCopy}
             >
               <Copy size={16} /> {copied ? 'Copied' : 'Copy leads JSON'}
             </button>
             <button
               aria-label="Download leads JSON"
               className="btn btn-sm btn-primary notch-br gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
               onClick={handleDownload}
             >
               <Download size={16} /> Download leads JSON
             </button>
          </div>
        </div>

        <div className="void-copy bg-void notch-br border border-white/10 p-6 min-h-[200px]">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <p className="opacity-70">Contact submissions will appear here. Submit the contact form above to capture a session lead.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map(lead => (
                <div key={lead.id} className="surface-copy p-4 bg-surface border border-current/10 rounded flex justify-between items-center gap-3 row-enter">
                  <div className="min-w-0">
                    <span className="badge badge-sm badge-accent mr-3">{lead.kind}</span>
                    <span className="font-medium">{lead.payload.name} — {lead.payload.interest}</span>
                    <span className="block text-sm opacity-70 mt-1">{lead.payload.email}</span>
                  </div>
                  <div className="text-xs opacity-60 shrink-0">
                    {new Date(lead.submittedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div aria-live="polite" className="sr-only">
          {copied ? 'Copied leads JSON to clipboard.' : ''}
        </div>
      </div>
    </section>
  );
}
