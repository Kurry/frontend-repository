import React from 'react';
import { useStore } from '../store';
import { TaskForm } from './TaskForm';

export const ScenarioWeaver: React.FC = () => {
  const { state, updateRecord, branchRecord } = useStore();

  if (!state.selectedTaskId) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-gray-400 bg-gray-50 border-l">
        Select a task to view details or create a scenario branch.
      </div>
    );
  }

  const selectedRecord = state.records.find(r => r.id === state.selectedTaskId);

  if (!selectedRecord) {
    return <div className="p-4">Record not found.</div>;
  }

  const isBase = selectedRecord.scenarioWeaverState?.branchedRecordId !== undefined;
  const isBranch = selectedRecord.scenarioWeaverState?.baseRecordId !== undefined;

  let baseRecord = selectedRecord;
  let branchedRecord = null;

  if (isBase) {
    branchedRecord = state.records.find(r => r.id === selectedRecord.scenarioWeaverState!.branchedRecordId);
  } else if (isBranch) {
    baseRecord = state.records.find(r => r.id === selectedRecord.scenarioWeaverState!.baseRecordId) || selectedRecord;
    branchedRecord = selectedRecord;
  }

  return (
    <div className="flex flex-col h-full bg-white border-l overflow-y-auto">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold">Scenario Weaver</h2>
        {!branchedRecord && (
          <button
            onClick={() => branchRecord(baseRecord.id)}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 shadow"
            title="branch a selected record into a scenario and compare linked outcomes"
          >
            Branch Scenario
          </button>
        )}
      </div>

      <div className="p-4 flex-1">
        {branchedRecord ? (
          <div className="flex flex-col gap-6">
            <div className="bg-purple-50 p-3 rounded border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">Scenario Comparison</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Base Hours:</span> <span className="font-medium">{baseRecord.estimatedHours}h</span>
                </div>
                <div>
                  <span className="text-gray-500">Branch Hours:</span> <span className="font-medium">{branchedRecord.estimatedHours}h</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Net Change:</span>
                  <span className={`font-bold ml-2 ${branchedRecord.estimatedHours > baseRecord.estimatedHours ? 'text-red-600' : 'text-green-600'}`}>
                    {branchedRecord.estimatedHours - baseRecord.estimatedHours > 0 ? '+' : ''}
                    {branchedRecord.estimatedHours - baseRecord.estimatedHours}h
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="opacity-75 pointer-events-none filter grayscale">
                <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Base Record</h4>
                <TaskForm
                  initialData={baseRecord}
                  onSubmit={() => {}}
                  onCancel={() => {}}
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wider">Branched Scenario</h4>
                <TaskForm
                  initialData={branchedRecord}
                  onSubmit={(data) => updateRecord(branchedRecord!.id, data)}
                  onCancel={() => {}}
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <TaskForm
              initialData={baseRecord}
              onSubmit={(data) => updateRecord(baseRecord.id, data)}
              onCancel={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
};
