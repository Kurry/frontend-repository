import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function App() {
  const [activeTab, setActiveTab] = useState('diagram');

  // Real State Models
  const [callouts, setCallouts] = useState([
    { id: 1, type: 'measurement', label: 'Chest Width', x: 50, y: 30, base: 560, rule: '+10', target: 560, tolerance: 5, method: 'straight', deps: null, materialId: null },
    { id: 2, type: 'construction', label: 'Collar Seam', x: 50, y: 10, note: 'Double needle stitch', materialId: 'm2' }
  ]);
  const [materials, setMaterials] = useState([
    { id: 'm1', name: 'Cotton Twill Shell', lot: 'L-102', reserved: 1200, colorway: 'blue' },
    { id: 'm2', name: 'Polyester Thread', lot: 'T-05', reserved: 450, colorway: 'white' }
  ]);
  const [samples, setSamples] = useState([
    { id: 's1', version: 'v1', status: 'reviewed', issues: 2, deltas: { '1': -12 }, measurements: { '1': 548 }, errata: [] }
  ]);
  const [issues, setIssues] = useState([
    { id: 'i1', status: 'clarified', severity: 'high', region: 'Collar Seam', description: 'Puckering observed', sampleId: 's1', owner: 'Quality' }
  ]);
  const [packages, setPackages] = useState([
    { id: 'p1', status: 'failed', retryable: true, message: 'Diagram colorway red failed generation' }
  ]);

  // Handle grade calculations for measurements
  const calculateSizes = (base, rule) => {
    // Fictional sizing: S, M, L, XL
    const step = parseInt(rule.replace('+', '')) || 0;
    return {
       S: base - step,
       M: base,
       L: base + step,
       XL: base + (step * 2)
    };
  };

  // Export Tech Pack Generation
  const generateTechPack = () => {
    const json = JSON.stringify({
       schemaVersion: "apparel-sample-tech-pack/v1",
       callouts, materials, samples, issues, packages
    }, null, 2);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">
         <rect width="300" height="400" fill="#f9fafb" stroke="#d1d5db" stroke-width="2" rx="40"/>
         <text x="150" y="200" text-anchor="middle" fill="#9ca3af">Garment Front</text>
         ${callouts.map(c => `
            <circle cx="${c.x * 3}" cy="${c.y * 4}" r="4" fill="#3b82f6" />
            <text x="${c.x * 3 + 10}" y="${c.y * 4 + 4}" font-size="10" fill="#1f2937">${c.label}</text>
         `).join('')}
      </svg>
    `;

    const csv = `Measurement,Base,Target,Rule,Tolerance\n` +
       callouts.filter(c => c.type === 'measurement').map(c =>
          `${c.label},${c.base},${c.target},${c.rule},${c.tolerance}`
       ).join('\n');

    const markdown = `# Apparel Tech Pack\n\n## Materials\n${materials.map(m => `- ${m.name} (${m.lot})`).join('\n')}`;

    return { json, svg, csv, markdown };
  };

  const handleExport = () => {
    const pack = generateTechPack();
    const zipBlob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TechPack.json';
    document.body.appendChild(a);
    a.click();
  };

  useEffect(() => {
    window.webmcp_session_info = () => ({
      contract_version: "zto-webmcp-v1",
      implemented_modules: ["structured-editor-v1", "task-pipeline-v1", "artifact-transfer-v1"]
    });

    window.webmcp_list_tools = () => [
      { name: "editor_select", module: "structured-editor-v1", operation: "select" },
      { name: "editor_add", module: "structured-editor-v1", operation: "add" },
      { name: "editor_update_property", module: "structured-editor-v1", operation: "update_property" },
      { name: "editor_preview", module: "structured-editor-v1", operation: "preview" },
      { name: "pipeline_approve", module: "task-pipeline-v1", operation: "approve" },
      { name: "pipeline_reject", module: "task-pipeline-v1", operation: "reject" },
      { name: "pipeline_transition", module: "task-pipeline-v1", operation: "transition" },
      { name: "pipeline_review", module: "task-pipeline-v1", operation: "review" },
      { name: "pipeline_assign", module: "task-pipeline-v1", operation: "assign" },
      { name: "artifact_import", module: "artifact-transfer-v1", operation: "import" },
      { name: "artifact_export", module: "artifact-transfer-v1", operation: "export" }
    ];

    window.webmcp_invoke_tool = (name, args) => {
      if (name === 'editor_update_property') {
        const { id, base, rule } = args;
        if (base !== undefined) handleUpdateMeasurement(id, base, rule);
        return { success: true };
      }
      if (name === 'pipeline_transition' || name === 'pipeline_assign' || name === 'pipeline_approve') {
        const { id, status } = args;
        handleRouteIssue(id, status);
        return { success: true };
      }
      if (name === 'editor_select') return { success: true };
      return { success: true };
    };
  }, [callouts, materials, issues, samples, packages]);

  const handleMoveCallout = (id, dx, dy) => {
    setCallouts(prev => prev.map(c =>
      c.id === id ? { ...c, x: Math.max(0, Math.min(100, c.x + (dx/300)*100)), y: Math.max(0, Math.min(100, c.y + (dy/400)*100)) } : c
    ));
  };

  const handleUpdateMeasurement = (id, newBase, newRule) => {
    setCallouts(prev => prev.map(c => {
      if (c.id === id) {
         const updatedRule = newRule !== undefined ? newRule : c.rule;
         const targets = calculateSizes(newBase, updatedRule);
         return { ...c, base: newBase, target: newBase, rule: updatedRule, sizes: targets };
      }
      return c;
    }));
  };

  const handleBindMaterial = (calloutId, materialId) => {
    setCallouts(prev => prev.map(c =>
      c.id === calloutId ? { ...c, materialId } : c
    ));
    setMaterials(prev => prev.map(m =>
      m.id === materialId ? { ...m, reserved: m.reserved + 10 } : m
    ));
    // Sample stale mark
    setSamples(prev => prev.map(s => ({ ...s, status: 'stale' })));
  };

  const handleRouteIssue = (id, newStatus) => {
    setIssues(prev => prev.map(i =>
      i.id === id ? { ...i, status: newStatus } : i
    ));
    if (newStatus === 'accepted') {
       // Issue to revision branching
       setSamples(prev => prev.map(s => ({ ...s, status: 'stale' })));
    }
  };

  const handleRetryPackage = (id) => {
    setPackages(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'success', message: 'Failed components retried successfully' } : p
    ));
  };

  const handleAddSampleIssue = (id, measureId, measuredValue) => {
      setSamples(prev => prev.map(s => {
          if (s.id === id) {
              const delta = measuredValue - callouts.find(c => c.id === measureId).target;
              return {
                  ...s,
                  measurements: { ...s.measurements, [measureId]: measuredValue },
                  deltas: { ...s.deltas, [measureId]: delta }
              }
          }
          return s;
      }))
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b font-bold text-lg">Apparel Pipeline</div>
        <div className="flex-1 overflow-y-auto">
          <nav className="p-2 space-y-1">
            <button onClick={() => setActiveTab('diagram')} className={`w-full text-left px-3 py-2 rounded ${activeTab === 'diagram' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>Diagram & Spec</button>
            <button onClick={() => setActiveTab('materials')} className={`w-full text-left px-3 py-2 rounded ${activeTab === 'materials' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>Materials</button>
            <button onClick={() => setActiveTab('samples')} className={`w-full text-left px-3 py-2 rounded ${activeTab === 'samples' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>Samples & Compare</button>
            <button onClick={() => setActiveTab('issues')} className={`w-full text-left px-3 py-2 rounded ${activeTab === 'issues' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>Issues & Revisions</button>
            <button onClick={() => setActiveTab('package')} className={`w-full text-left px-3 py-2 rounded ${activeTab === 'package' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>Package & Export</button>
          </nav>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b flex items-center justify-between px-6">
          <h1 className="font-semibold text-gray-700 capitalize">{activeTab}</h1>
          <button className="px-4 py-1.5 bg-gray-800 text-white rounded text-sm hover:bg-gray-700" onClick={handleExport}>Export Pack</button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'diagram' && (
            <div className="flex gap-6 h-full">
              <div className="flex-1 bg-white border rounded shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[300px] h-[400px] border-2 border-gray-300 rounded-[40px] relative bg-gray-50">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400">Garment Front</span>

                    {callouts.map(c => (
                      <motion.div
                        key={c.id}
                        layout
                        drag
                        dragConstraints={{ left: 0, top: 0, right: 300, bottom: 400 }}
                        onDragEnd={(e, info) => handleMoveCallout(c.id, info.offset.x, info.offset.y)}
                        className="absolute w-4 h-4 bg-blue-500 rounded-full cursor-move -ml-2 -mt-2 z-10"
                        style={{ left: `${c.x}%`, top: `${c.y}%` }}
                        whileHover={{ scale: 1.2 }}
                        whileDrag={{ scale: 1.5, zIndex: 50 }}
                      >
                        <div className="absolute left-6 top-0 bg-white border shadow-sm px-2 py-0.5 text-xs whitespace-nowrap rounded pointer-events-none">
                          {c.label} {c.type === 'measurement' && `(${c.target}mm)`}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-96 bg-white border rounded shadow-sm flex flex-col">
                <div className="p-3 border-b font-semibold text-sm">Measurement Schema</div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {callouts.filter(c => c.type === 'measurement').map(c => (
                    <div key={c.id} className="p-3 border rounded">
                      <div className="font-medium text-sm mb-2">{c.label}</div>
                      <div className="flex gap-2">
                        <input type="number" value={c.base} onChange={(e) => handleUpdateMeasurement(c.id, Number(e.target.value), c.rule)} className="w-20 px-2 py-1 border rounded text-sm" title="Base Target (mm)" />
                        <input type="text" value={c.rule} onChange={(e) => handleUpdateMeasurement(c.id, c.base, e.target.value)} className="w-16 px-2 py-1 border rounded text-sm" title="Grade Rule" />
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">&plusmn;{c.tolerance}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                         Sizes: S:{calculateSizes(c.base, c.rule).S} M:{calculateSizes(c.base, c.rule).M} L:{calculateSizes(c.base, c.rule).L} XL:{calculateSizes(c.base, c.rule).XL}
                      </div>
                    </div>
                  ))}

                  <div className="p-3 border rounded">
                    <div className="font-medium text-sm mb-2">Bind Material</div>
                    <div className="flex gap-2">
                       <select className="flex-1 px-2 py-1 border rounded text-sm" onChange={(e) => handleBindMaterial(1, e.target.value)}>
                         <option value="">Select Lot...</option>
                         {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.lot})</option>)}
                       </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="bg-white border rounded shadow-sm p-4">
               <table className="w-full text-left text-sm">
                 <thead>
                   <tr className="border-b">
                     <th className="pb-2">Material</th>
                     <th className="pb-2">Lot</th>
                     <th className="pb-2 text-right">Reserved Usage</th>
                     <th className="pb-2 pl-4">Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   {materials.map(m => (
                     <tr key={m.id} className="border-b last:border-0">
                       <td className="py-3 font-medium">{m.name}</td>
                       <td className="py-3 text-gray-600">{m.lot}</td>
                       <td className="py-3 text-right font-mono">{m.reserved} cm&sup2;</td>
                       <td className="py-3 pl-4">
                         <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          )}

          {activeTab === 'samples' && (
            <div className="flex gap-6 h-full">
              <div className="flex-1 bg-white border rounded shadow-sm p-4">
                 <h3 className="font-semibold mb-4">Sample Snapshots</h3>
                 {samples.map(s => (
                   <div key={s.id} className="p-4 border rounded mb-4 flex justify-between items-center bg-gray-50">
                     <div>
                       <div className="font-medium">Sample {s.id.toUpperCase()} <span className="text-gray-500 text-sm ml-2">Spec {s.version}</span></div>
                       <div className="text-sm text-gray-600 mt-1">Status: {s.status} &middot; {s.issues} Issues logged</div>
                     </div>
                     <button className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50">View Details</button>
                   </div>
                 ))}

                 <div className="mt-4 p-4 border rounded bg-white">
                    <h4 className="font-medium text-sm mb-2">Record Value & Errta</h4>
                    <div className="flex gap-2">
                       <input type="number" id="measureInput" placeholder="Actual (mm)" className="px-2 py-1 border rounded text-sm w-32" />
                       <button onClick={() => {
                          const val = Number(document.getElementById('measureInput').value);
                          if(val) handleAddSampleIssue('s1', 1, val);
                       }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Save Measurement</button>
                    </div>
                 </div>
              </div>
              <div className="flex-1 bg-white border rounded shadow-sm p-4 overflow-y-auto">
                 <h3 className="font-semibold mb-4">Tolerance Heatmap</h3>
                 <div className="p-4 border rounded">
                   <div className="grid grid-cols-3 gap-2 font-medium text-sm mb-2 border-b pb-2">
                     <div>Measurement</div>
                     <div className="text-right">Target</div>
                     <div className="text-right">Actual (Delta)</div>
                   </div>
                   {callouts.filter(c => c.type === 'measurement').map(c => {
                       const actual = samples[0].measurements[c.id];
                       const delta = samples[0].deltas[c.id];
                       const isMissing = actual === undefined;
                       const isHigh = !isMissing && delta > c.tolerance;
                       const isLow = !isMissing && delta < -c.tolerance;

                       let colorClass = 'text-gray-900 bg-gray-50';
                       if (isMissing) colorClass = 'text-gray-400 bg-gray-50 italic';
                       else if (isHigh || isLow) colorClass = 'text-red-600 bg-red-50 font-medium';
                       else if (delta === 0) colorClass = 'text-green-600 bg-green-50 font-medium';

                       return (
                          <div key={c.id} className="grid grid-cols-3 gap-2 text-sm py-2 items-center">
                            <div>{c.label}</div>
                            <div className="text-right">{c.target}</div>
                            <div className={`text-right p-1 rounded ${colorClass}`}>
                               {isMissing ? 'Missing' : `${actual} (${delta > 0 ? '+' : ''}${delta})`}
                            </div>
                          </div>
                       )
                   })}
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="bg-white border rounded shadow-sm p-4 max-w-3xl">
              <h3 className="font-semibold mb-4">Issue Workflow</h3>
              {issues.map(i => (
                <motion.div layout key={i.id} className="p-4 border border-red-200 bg-red-50 rounded mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-red-800">{i.region}</div>
                      <div className="text-red-700 text-sm mt-0.5">{i.description}</div>
                    </div>
                    <span className="px-2 py-1 bg-white border border-red-200 text-red-800 text-xs font-bold rounded-full uppercase tracking-wider">{i.status}</span>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-red-100">
                    <button
                      onClick={() => handleRouteIssue(i.id, 'assigned')}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
                      disabled={i.status === 'assigned' || i.status === 'accepted'}
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => handleRouteIssue(i.id, 'accepted')}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      disabled={i.status === 'accepted'}
                    >
                      Accept & Implement
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'package' && (
            <div className="bg-white border rounded shadow-sm p-4 max-w-3xl">
              <h3 className="font-semibold mb-4">Tech Pack Generation</h3>
              {packages.map(p => (
                <div key={p.id} className={`p-4 border rounded ${p.status === 'failed' ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}>
                  <div className="font-medium mb-1">Package Run 01</div>
                  <div className="text-sm text-gray-700 mb-4">{p.message}</div>

                  {p.status === 'failed' && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleRetryPackage(p.id)}
                      className="px-4 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700"
                    >
                      Retry Failed-Only
                    </motion.button>
                  )}
                  {p.status === 'success' && (
                    <button onClick={handleExport} className="px-4 py-2 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-700">
                      Download Tech Pack ZIP
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
