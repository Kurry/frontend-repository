import { useState, useEffect } from 'react';
import Canvas from './Canvas';
import BranchGraph from './BranchGraph';
import WorkflowTimeline from './WorkflowTimeline';
import RecipientMatrix from './RecipientMatrix';
import EvidencePanel from './EvidencePanel';
import { exportData } from './export';
import { CanvasLayer, BranchNode, Recipient, WorkflowStep, QueueItem } from './types';

function App() {
  const [layers, setLayers] = useState<CanvasLayer[]>([
    { id: 'l1', type: 'text', position: { x: 40, y: 40 }, rotation: 0, dimensions: { width: 200, height: 40 }, content: "Lantern Supper 2027", locked: false, hidden: false, zIndex: 1 },
    { id: 'l2', type: 'image', position: { x: 0, y: 0 }, rotation: 0, dimensions: { width: 480, height: 672 }, content: "", src: "https://via.placeholder.com/480x672.png?text=Background", locked: true, hidden: false, zIndex: 0 },
    { id: 'l3', type: 'rsvp-code', position: { x: 300, y: 550 }, rotation: -5, dimensions: { width: 120, height: 30 }, content: "AB12C", locked: false, hidden: false, zIndex: 2 }
  ]);
  const [nodes, setNodes] = useState<BranchNode[]>([
    { id: 'b1', parentId: null, status: 'accepted', changes: [], name: 'Initial Brief', lineage: 0 },
    { id: 'b2', parentId: 'b1', status: 'active', changes: [], name: 'Main Copy', lineage: 1 }
  ]);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: 'r1', name: 'Alice Smith', household: 'Smith Family', salutation: 'Alice', channel: 'email', consent: true, rsvp_state: 'accepted' },
    { id: 'r2', name: 'Bob Jones', household: 'Jones Family', salutation: 'Bob & Family', channel: 'print', consent: true, rsvp_state: 'pending' },
    { id: 'r3', name: 'Charlie', household: 'Charlie', salutation: 'Charlie', channel: 'sms', consent: false, rsvp_state: 'declined' }
  ]);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('artwork_variants');
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).webmcp_session_info = () => ({
        status: 'ready',
        task: "frontend-creative-tools-branchable-celebration-campaign-studio"
      });
      (window as any).webmcp_list_tools = () => {
        return [
          { name: "structured-editor-v1_get_object", description: "Get a canvas-layer or branch-node", inputSchema: { type: "object", properties: { type: { type: "string" }, id: { type: "string" } }, required: ["type", "id"] } },
          { name: "structured-editor-v1_list_objects", description: "List canvas-layers or branch-nodes", inputSchema: { type: "object", properties: { type: { type: "string" } }, required: ["type"] } },
          { name: "structured-editor-v1_update_object", description: "Update a canvas-layer or branch-node", inputSchema: { type: "object", properties: { type: { type: "string" }, id: { type: "string" }, update: { type: "object" } }, required: ["type", "id", "update"] } },
          { name: "entity-collection-v1_get_entity", description: "Get a recipient", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
          { name: "entity-collection-v1_list_entities", description: "List recipients", inputSchema: { type: "object", properties: {}, required: [] } },
          { name: "entity-collection-v1_select_entity", description: "Select a recipient", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
          { name: "entity-collection-v1_update_entity", description: "Update a recipient", inputSchema: { type: "object", properties: { id: { type: "string" }, update: { type: "object" } }, required: ["id", "update"] } },
          { name: "entity-collection-v1_bind_entity", description: "Bind a recipient to a variant", inputSchema: { type: "object", properties: { id: { type: "string" }, variant_id: { type: "string" } }, required: ["id", "variant_id"] } },
          { name: "command-session-v1_get_state", description: "Get session state", inputSchema: { type: "object", properties: {}, required: [] } },
          { name: "command-session-v1_pause", description: "Pause session", inputSchema: { type: "object", properties: {}, required: [] } },
          { name: "command-session-v1_resume", description: "Resume session", inputSchema: { type: "object", properties: {}, required: [] } },
          { name: "command-session-v1_retry", description: "Retry session", inputSchema: { type: "object", properties: {}, required: [] } },
          { name: "command-session-v1_rewind", description: "Rewind session", inputSchema: { type: "object", properties: {}, required: [] } },
          { name: "command-session-v1_rehearse", description: "Rehearse delivery", inputSchema: { type: "object", properties: {}, required: [] } },
          { name: "artifact-transfer-v1_export", description: "Export campaign bundle", inputSchema: { type: "object", properties: { format: { type: "string" } }, required: ["format"] } },
          { name: "artifact-transfer-v1_import", description: "Import campaign bundle", inputSchema: { type: "object", properties: { data: { type: "string" } }, required: ["data"] } }
        ];
      };
      (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
        return { success: true, result: { invoked: name, args } };
      };
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-gray-100 overflow-hidden text-sm">
      <header className="bg-indigo-900 border-b border-indigo-950 px-4 py-2.5 flex justify-between items-center shadow-md z-20 text-white">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M14 14h-4m4 0v5m-4-0v-5m4 0h-4"/></svg>
          <h1 className="text-lg font-bold tracking-wide">Branchable Celebration Campaign Studio</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportData({ layers, nodes, recipients, workflowStep, queue })} className="px-4 py-1.5 bg-indigo-500 text-white rounded font-medium hover:bg-indigo-400 transition-colors shadow-sm">Export ZIP Bundle</button>
          <button className="px-4 py-1.5 bg-white text-indigo-900 rounded font-medium hover:bg-indigo-50 transition-colors shadow-sm">Import JSON</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Col: Canvas */}
        <div className="flex-1 bg-gray-200 flex flex-col relative min-w-[400px]">
          <div className="flex-1 overflow-auto p-8 flex justify-center items-center">
             <Canvas layers={layers} setLayers={setLayers} />
          </div>
        </div>

        {/* Middle Col: Branches & Workflow */}
        <div className="w-72 flex flex-col border-l border-gray-300 bg-white shadow-lg z-10 shrink-0">
          <BranchGraph nodes={nodes} setNodes={setNodes} />
          <WorkflowTimeline step={workflowStep} setStep={setWorkflowStep} />
        </div>

        {/* Right Col: Personalization & Evidence */}
        <div className="flex-1 flex flex-col bg-white border-l border-gray-300 min-w-[350px]">
          <div className="flex-[3] flex flex-col border-b border-gray-300 overflow-hidden">
             <RecipientMatrix recipients={recipients} setRecipients={setRecipients} />
          </div>
          <div className="flex-[2] flex flex-col overflow-hidden">
             <EvidencePanel queue={queue} setQueue={setQueue} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
