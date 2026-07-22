import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './store/Store';
import { SoundLayersList } from './components/SoundLayersList';
import { ReplayTimeline } from './components/ReplayTimeline';
import { Inspector } from './components/Inspector';
import type { SoundLayer } from './types';

function WebMCPConnector() {
  const store = useStore();


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        store.undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  useEffect(() => {
    const w = window as any;
    w.webmcp_session_info = () => ({
      task: 'eval-intelligence/frontend-creative-tools-soundscape-scene-composer-replay-timeline-rn-lightroom-editing',
      status: 'active'
    });

    w.webmcp_list_tools = () => [
      { name: 'editor_select', description: 'Select a timeline checkpoint', inputSchema: { type: 'object', properties: { checkpoint_id: { type: 'string' } }, required: ['checkpoint_id'] } },
      { name: 'entity_create', description: 'Create a sound layer', inputSchema: { type: 'object', properties: { name: { type: 'string' }, status: { type: 'string' } }, required: ['name', 'status'] } },
      { name: 'entity_select', description: 'Select a sound layer', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
      { name: 'entity_update', description: 'Update a sound layer', inputSchema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, status: { type: 'string' } }, required: ['id', 'name', 'status'] } },
      { name: 'entity_delete', description: 'Delete a sound layer', inputSchema: { type: 'object', properties: { id: { type: 'string' }, confirm: { type: 'boolean' } }, required: ['id', 'confirm'] } },
      { name: 'artifact_export', description: 'Export session', inputSchema: { type: 'object', properties: {} } },
      { name: 'artifact_import', description: 'Import session', inputSchema: { type: 'object', properties: { session: { type: 'object' } }, required: ['session'] } },
      { name: 'editor_update_property', description: 'Update timeline property', inputSchema: { type: 'object', properties: { id: { type: 'string' }, property: { type: 'string' }, value: { type: 'string' } }, required: ['id', 'property', 'value'] } },
      { name: 'editor_set_content', description: 'Set timeline content', inputSchema: { type: 'object', properties: { id: { type: 'string' }, content: { type: 'object' } }, required: ['id', 'content'] } },
      { name: 'artifact_copy', description: 'Copy session artifact', inputSchema: { type: 'object', properties: {} } }
    ];

    w.webmcp_invoke_tool = (name: string, args: any) => {
      try {
        switch (name) {
          case 'editor_select':
            if (!store.state.selectedRecordId) throw new Error('No record selected');
            store.scrubTimeline(store.state.selectedRecordId, args.checkpoint_id);
            return { success: true };



          case 'editor_update_property':
            if (args.property === 'status') {
               store.updateTimelineProperty(args.id, args.value as SoundLayerStatus);
            }
            return { success: true };
          case 'editor_set_content':
            store.setTimelineContent(args.id, args.content.description);
            return { success: true };
          case 'artifact_copy':
            return store.exportSession();

          case 'entity_create':
            store.createRecord(args.name, args.status);
            return { success: true };

          case 'entity_select':
            store.selectRecord(args.id);
            return { success: true };

          case 'entity_update':
            store.updateRecord(args.id, args.name, args.status);
            return { success: true };

          case 'entity_delete':
            if (args.confirm) {
              store.deleteRecord(args.id);
              return { success: true };
            }
            throw new Error('confirm must be true');

          case 'artifact_export':
            return store.exportSession();

          case 'artifact_import':
            store.importSession(args.session);
            return { success: true };

          default:
            throw new Error(`Tool ${name} not found`);
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    };
  }, [store]);

  return null;
}

const generateInitialRecords = (): SoundLayer[] => {
  const statuses = ['empty', 'draft', 'ready', 'changed', 'archived'] as const;
  const records: SoundLayer[] = [];

  for (let i = 0; i < 105; i++) {
    const id = `layer-${i}`;
    const status = statuses[i % statuses.length];

    records.push({
      id,
      name: `Seeded Layer ${i + 1}`,
      status,
      checkpoints: [
        { id: `${id}-cp-1`, timestamp: 0, status: 'empty', description: 'Initial state' },
        { id: `${id}-cp-2`, timestamp: 10, status: 'draft', description: 'Updated to draft' },
        { id: `${id}-cp-3`, timestamp: 20, status, description: `Updated to ${status}` }
      ],
      currentCheckpointId: `${id}-cp-3`
    });
  }

  return records;
};

const initialRecords = generateInitialRecords();

function MainApp() {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-stone-950 text-stone-200 overflow-hidden md:overflow-hidden font-sans">
      <WebMCPConnector />
      <SoundLayersList />
      <ReplayTimeline />
      <Inspector />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider initialRecords={initialRecords}>
      <MainApp />
    </StoreProvider>
  );
}
