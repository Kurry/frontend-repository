import React from 'react';
import { useStore } from '../store';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export const HandoffExport = () => {
  const state = useStore(state => state);

  const handleExport = async () => {
    const zip = new JSZip();

    // JSON turnaround.json
    const exportState = {
      schema: "1.0.0",
      exportedAt: new Date().toISOString(),
      fixtureHash: "deterministic-fixture-hash",
      clock: state.clock,
      spatialLoci: {
        rooms: state.rooms,
        fixtures: state.fixtures
      },
      observations: state.observations,
      evidence: state.evidence,
      tasks: state.tasks,
      edges: state.edges,
      inventory: state.inventoryLots,
      custodyEvents: state.custodyEvents,
      branches: state.branches,
      approvals: state.approvals,
      handoffs: state.handoffs
    };
    zip.file("turnaround.json", JSON.stringify(exportState, null, 2));

    // CSV work-order.csv
    const csvHeader = "id,locus,name,status,workerId,start,duration\n";
    const csvContent = csvHeader + state.tasks.map(t => `${t.id},${t.locus || ''},"${t.name}",${t.status},${t.workerId},${t.start || 0},${t.duration || 0}`).join("\n");
    zip.file("work-order.csv", csvContent);

    // ICS turnaround.ics
    const icsHeader = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Rental Turnaround//EN\n";
    const icsEvents = state.tasks.filter(t => t.status !== 'preview').map(t => {
      const dtStart = new Date();
      dtStart.setHours(dtStart.getHours() + (t.start || 0) / 10);
      const dtEnd = new Date(dtStart);
      dtEnd.setHours(dtEnd.getHours() + (t.duration || 100) / 10);

      const formatDT = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      return `BEGIN:VEVENT\nUID:${t.id}\nDTSTAMP:${formatDT(new Date())}\nDTSTART:${formatDT(dtStart)}\nDTEND:${formatDT(dtEnd)}\nSUMMARY:${t.name} (${t.locus || 'No Locus'})\nSTATUS:${t.status.toUpperCase()}\nEND:VEVENT`;
    }).join("\n");
    const icsContent = icsHeader + (icsEvents ? icsEvents + "\n" : "") + "END:VCALENDAR";
    zip.file("turnaround.ics", icsContent);

    // Markdown handoff-packet.md
    let mdContent = `# Handoff Packet\n\n## Overview\n- Clock Day: ${state.clock}\n- Total Tasks: ${state.tasks.length}\n- Active Handoffs: ${state.handoffs.length}\n\n## Room Readiness\n`;
    state.rooms.forEach(r => {
      const roomFixtures = state.fixtures.filter(f => f.roomId === r.id);
      const ready = roomFixtures.every(f => f.status === 'verified' || f.status === 'uninspected');
      mdContent += `- **${r.name}**: ${ready ? 'Ready' : 'Pending Work'}\n`;
    });
    mdContent += `\n## Evidence\n${state.evidence.length} evidence hashes recorded.\n`;
    zip.file("handoff-packet.md", mdContent);

    // SVG unit-status.svg
    // We clone the actual floorplan SVG from the DOM to preserve current state visualization
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">Unit Status Export Error</text></svg>`;
    const floorplanEl = document.querySelector('div[aria-label="Floorplan"] svg');
    if (floorplanEl) {
      const cloned = floorplanEl.cloneNode(true);
      // Clean up UI specific artifacts like the lasso
      const lassoRect = Array.from(cloned.querySelectorAll('rect')).find(r => r.getAttribute('strokeDasharray') === "4");
      if (lassoRect) lassoRect.remove();
      svgContent = cloned.outerHTML;
    }
    zip.file("unit-status.svg", svgContent);

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "turnaround-packet.zip");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const imported = JSON.parse(evt.target.result);
          // basic validation
          if (!imported.spatialLoci || !imported.tasks || !imported.clock) throw new Error("Invalid structure");

          useStore.getState().importState({
            rooms: imported.spatialLoci.rooms,
            fixtures: imported.spatialLoci.fixtures,
            observations: imported.observations,
            evidence: imported.evidence,
            inventoryLots: imported.inventory,
            keys: imported.keys || state.keys,
            workers: state.workers,
            tasks: imported.tasks,
            edges: imported.edges,
            custodyEvents: imported.custodyEvents,
            branches: imported.branches,
            approvals: imported.approvals,
            handoffs: imported.handoffs,
            clock: imported.clock,
            selection: [],
            activeBranchId: null,
            activeEvidenceId: null
          });
        } catch (e) {
          console.error("Invalid JSON import", e);
          alert("Import failed: Invalid turnaround state JSON.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="mt-4 border p-4 bg-white rounded shadow-sm flex flex-col gap-2">
      <h3 className="font-bold mb-2">Artifact Contract (Export / Import)</h3>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-black hover:bg-gray-800 transition-colors text-white rounded font-bold flex-1"
          onClick={handleExport}
        >
          Export Packet (.zip)
        </button>
        <label className="px-4 py-2 bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800 rounded font-bold flex-1 cursor-pointer text-center">
          Import JSON
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>
      </div>
    </div>
  );
};
