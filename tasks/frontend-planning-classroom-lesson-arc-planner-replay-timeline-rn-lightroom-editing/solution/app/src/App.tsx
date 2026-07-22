import { useEffect, useState } from 'react';
import { useAppState } from './useAppState';
import { LessonBlockList } from './LessonBlockList';
import { ReplayTimeline } from './ReplayTimeline';
import { ArtifactPanel } from './ArtifactPanel';
import type { LessonBlock } from './types';

function App() {
  const {
    records,
    derived,
    history,
    selectedRecordId,
    setSelectedRecordId,
    addRecord,
    updateRecord,
    deleteRecord,
    undo,
    exportSession,
    importSession,
    clearSession,

  } = useAppState();

  const [isWebMCPLoaded, setIsWebMCPLoaded] = useState(false);

  useEffect(() => {
    // Register WebMCP handlers
    (window as any).webmcp_session_info = {
      task: 'eval-intelligence/frontend-planning-classroom-lesson-arc-planner-replay-timeline-rn-lightroom-editing',
    };

    (window as any).webmcp_list_tools = () => {
      return [
        {
          name: 'entity_create_record',
          description: 'Create a new lesson block',
          parameters: {
             type: 'object',
             properties: {
               title: { type: 'string' },
               status: { type: 'string', enum: ['empty', 'draft', 'ready', 'changed', 'archived'] },
               duration: { type: 'number' }
             },
             required: ['title', 'duration']
          }
        },
        {
          name: 'entity_select_record',
          description: 'Select a lesson block',
          parameters: {
             type: 'object',
             properties: {
               id: { type: 'string' }
             },
             required: ['id']
          }
        },
        {
          name: 'entity_update_record',
          description: 'Update a lesson block',
          parameters: {
             type: 'object',
             properties: {
               id: { type: 'string' },
               title: { type: 'string' },
               status: { type: 'string' },
               duration: { type: 'number' }
             },
             required: ['id']
          }
        },
        {
          name: 'entity_delete_record',
          description: 'Delete a lesson block',
          parameters: {
             type: 'object',
             properties: {
               id: { type: 'string' },
               confirm: { type: 'boolean' }
             },
             required: ['id', 'confirm']
          }
        },
        {
          name: 'artifact_export_session_json',
          description: 'Export current session',
          parameters: { type: 'object', properties: {} }
        },
        {
          name: 'artifact_import_session_json',
          description: 'Import session',
          parameters: {
             type: 'object',
             properties: {
               session: { type: 'object' }
             },
             required: ['session']
          }
        }
      ];
    };

    setIsWebMCPLoaded(true);
  }, []);

  useEffect(() => {
    if (!isWebMCPLoaded) return;

    (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
      switch (name) {
        case 'entity_create_record':
          const newBlock: LessonBlock = {
            id: Math.random().toString(36).substring(2, 9),
            title: args.title,
            duration: args.duration,
            status: args.status || 'draft'
          };
          addRecord(newBlock);
          return { success: true, record: newBlock };

        case 'entity_select_record':
          setSelectedRecordId(args.id);
          return { success: true };

        case 'entity_update_record':
          const { id, ...updates } = args;
          updateRecord(id, updates);
          return { success: true };

        case 'entity_delete_record':
          if (!args.confirm) throw new Error("Delete requires explicit confirm=true.");
          deleteRecord(args.id);
          return { success: true };

        case 'artifact_export_session_json':
          return { success: true, session: exportSession() };

        case 'artifact_import_session_json':
          importSession(args.session);
          return { success: true };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    };
  }, [isWebMCPLoaded, addRecord, updateRecord, deleteRecord, exportSession, importSession, setSelectedRecordId]);


  const selectedBlock = records.find(r => r.id === selectedRecordId) || null;

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-end border-b pb-4">
           <div>
             <h1 className="text-2xl font-bold tracking-tight">Classroom Lesson Arc Planner</h1>
             <p className="text-sm text-gray-500 mt-1">Manage and sync lesson blocks in a unified frontend workflow.</p>
           </div>
           <div className="text-right">
             <div className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
               Derived Summary: {derived.summary}
             </div>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Collection</h2>
            <LessonBlockList
              records={records}
              selectedId={selectedRecordId}
              onSelect={setSelectedRecordId}
              onAdd={addRecord}
              onUpdate={updateRecord}
              onDelete={deleteRecord}
            />
          </div>

          <div className="md:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold mb-4 text-transparent select-none">.</h2>
            <ReplayTimeline
               selectedRecord={selectedBlock}
               history={history}
               onUpdate={updateRecord}
               onUndo={undo}
            />

            <ArtifactPanel
               onExport={exportSession}
               onImport={importSession}
               onClear={clearSession}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
