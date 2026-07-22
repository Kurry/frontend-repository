import { useStore } from './store';
import { motion, AnimatePresence } from 'motion/react';
import { Network_3, Checkmark, Close, Warning, Undo } from '@carbon/icons-react';
import { useState, useEffect } from 'react';

export default function ScenarioWeaver() {
  const { activeScenarioRecordId, records, resolveScenario, updateRecord, undo, pastStates } = useStore();
  const [errorMsg, setErrorMsg] = useState(null);

  const activeRecord = records.find(r => r.id === activeScenarioRecordId);
  const originalRecord = activeRecord ? records.find(r => r.id === activeRecord.originalId) : null;

  // Clear error on record change
  useEffect(() => {
      setErrorMsg(null);
  }, [activeScenarioRecordId]);

  if (!activeRecord) {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 border border-gray-200 rounded-lg p-6 text-center">
              <Network_3 size={48} className="mb-4 opacity-30" />
              <p>Select a record and <strong>Branch Scenario</strong> to begin weaving.</p>
              <p className="text-sm mt-2 opacity-70">Compare outcomes and resolve decisions.</p>

              {pastStates.length > 0 && (
                  <button onClick={undo} className="mt-6 flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <Undo size={16} /> Undo last action
                  </button>
              )}
          </div>
      )
  }

  const handleUpdate = (field, value) => {
      // Validate boundaries before applying
      if (field === 'firingTemp') {
          const num = Number(value);
          if (isNaN(num) || num < 0 || num > 3000) {
              setErrorMsg('Firing temperature must be between 0 and 3000 (Cone approx). Restored prior valid state.');
              return;
          }
      }
      if (field === 'name' && value.trim().length === 0) {
          setErrorMsg('Name is required. Restored prior valid state.');
          return;
      }

      setErrorMsg(null);
      updateRecord(activeRecord.id, { [field]: value });
  };

  const handleMaterialChange = (index, field, value) => {
      const mats = [...activeRecord.materials];

      if (field === 'amount') {
          const num = Number(value);
          if (isNaN(num) || num < 0 || num > 100) {
              setErrorMsg('Amount must be between 0 and 100. Restored prior valid state.');
              return;
          }
          mats[index].amount = num;
      } else {
          mats[index][field] = value;
      }

      setErrorMsg(null);
      updateRecord(activeRecord.id, { materials: mats });
  }

  const addMaterial = () => {
      updateRecord(activeRecord.id, {
          materials: [...activeRecord.materials, { id: Math.random().toString(), name: 'New Material', amount: 10 }]
      });
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-purple-200 overflow-hidden" aria-live="polite">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <Network_3 size={20} /> Scenario Weaver
            </h2>
            <div className="flex gap-2">
                <button
                   onClick={() => resolveScenario(activeRecord.id, 'keep')}
                   className="flex items-center gap-1 text-sm bg-purple-700 hover:bg-purple-800 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-white"
                   aria-label="Keep scenario as independent record"
                >
                    Keep New <Checkmark size={16} />
                </button>
                <button
                   onClick={() => resolveScenario(activeRecord.id, 'merge')}
                   className="flex items-center gap-1 text-sm bg-white text-purple-700 hover:bg-gray-100 px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-white"
                   aria-label="Merge scenario into original record"
                >
                    Merge <Close size={16} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
            {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex items-start gap-2" role="alert">
                    <Warning size={16} className="mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 h-full">
                {/* Original Record Read-only */}
                <div className="border-r border-gray-100 pr-4 opacity-60">
                    <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Original Base</h3>
                    {originalRecord ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500">Name</label>
                                <div className="p-2 bg-gray-50 rounded text-sm">{originalRecord.name}</div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500">Firing Temp (Cone)</label>
                                <div className="p-2 bg-gray-50 rounded text-sm">{originalRecord.firingTemp}</div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500">Status</label>
                                <div className="p-2 bg-gray-50 rounded text-sm">{originalRecord.status}</div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Materials</label>
                                {originalRecord.materials.length === 0 ? <span className="text-xs text-gray-400">None</span> : (
                                    <ul className="text-sm space-y-1">
                                        {originalRecord.materials.map(m => (
                                            <li key={m.id} className="flex justify-between bg-gray-50 p-2 rounded">
                                                <span>{m.name}</span><span>{m.amount}g</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ) : <p className="text-sm">Original missing.</p>}
                </div>

                {/* Scenario Editable */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="pl-2"
                >
                    <h3 className="text-sm font-semibold text-purple-700 mb-4 uppercase tracking-wider flex items-center justify-between">
                        Branch Editor
                        <span className="text-xs font-normal px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">State: {activeRecord.scenarioState}</span>
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1 font-medium">Name</label>
                            <input
                                type="text"
                                value={activeRecord.name}
                                onChange={(e) => handleUpdate('name', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1 font-medium">Firing Temp (Cone approx, 0-3000)</label>
                            <input
                                type="number"
                                value={activeRecord.firingTemp}
                                onChange={(e) => handleUpdate('firingTemp', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1 font-medium">Status</label>
                            <select
                                value={activeRecord.status}
                                onChange={(e) => handleUpdate('status', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                            >
                                <option value="draft">Draft</option>
                                <option value="ready">Ready</option>
                                <option value="changed">Changed</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div>
                             <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs text-gray-600 font-medium">Materials</label>
                                <button onClick={addMaterial} className="text-xs text-purple-600 hover:underline">+ Add</button>
                             </div>
                             {activeRecord.materials.length === 0 ? <div className="text-xs text-gray-400 p-2 text-center border border-dashed rounded">No materials</div> : (
                                <ul className="space-y-2">
                                    <AnimatePresence>
                                        {activeRecord.materials.map((m, i) => (
                                            <motion.li
                                                layout
                                                key={m.id}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="flex gap-2"
                                            >
                                                <input
                                                    value={m.name}
                                                    onChange={(e) => handleMaterialChange(i, 'name', e.target.value)}
                                                    className="w-2/3 p-1.5 border border-gray-300 rounded text-sm"
                                                    placeholder="Name"
                                                />
                                                <input
                                                    type="number"
                                                    value={m.amount}
                                                    onChange={(e) => handleMaterialChange(i, 'amount', e.target.value)}
                                                    className="w-1/3 p-1.5 border border-gray-300 rounded text-sm"
                                                    placeholder="Amt (0-100)"
                                                />
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                             )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    </div>
  );
}
