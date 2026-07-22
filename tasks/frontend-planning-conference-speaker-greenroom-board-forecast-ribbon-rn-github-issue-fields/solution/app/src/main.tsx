import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppWrapper from './AppWrapper';
import './index.css';
import {
  compileModules,
  createContractRuntime,
  validateAssignmentEntry,
} from "@zto/webmcp-contracts";
import { mountReactWebMcp } from '@zto/webmcp-contracts/adapters/react';
import React from 'react';
import { useEffect } from 'react';

declare global {
  interface Window {
    webmcp_session_info?: () => Promise<{ task_id: string; contract_version: string }>;
    __exportedArtifact?: any;
  }
}

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

function WebMCPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const assignmentEntry = {
      task: "frontend-planning-conference-speaker-greenroom-board-forecast-ribbon-rn-github-issue-fields",
      mechanics_exclusions: [],
      modules: ["entity-collection-v1" as const, "artifact-transfer-v1" as const],
      bindings: {
        entity: "record",
        entity_operations: ["create", "select", "update", "delete"],
        entity_fields: ["id", "status", "title", "speaker", "time", "forecastScore"],
        artifact_operations: ["export", "import"],
        export_formats: ["speaker-greenroom-v1"],
        import_modes: ["speaker-greenroom-v1"]
      },
    };

    validateAssignmentEntry(assignmentEntry as any);

    const handlers = {
      "entity-collection-v1": {
        create: async (args: any) => {
          const dispatch = window.__dispatch;
          if (!dispatch) throw new Error("App not ready");
          const newRecord = {
            id: crypto.randomUUID(),
            status: args.entity?.status || 'draft',
            title: args.entity?.title || 'New Record',
            speaker: args.entity?.speaker || '',
            time: args.entity?.time || '',
            forecastScore: args.entity?.forecastScore ?? 50,
          };
          dispatch({ type: 'CREATE_RECORD', payload: newRecord });
          return { ok: true, status: 'created', public_ids: [newRecord.id] };
        },
        update: async (args: any) => {
          const dispatch = window.__dispatch;
          const getState = window.__getState;
          if (!dispatch || !getState) throw new Error("App not ready");

          const id = args.id || args.entity_id;
          const state = getState();
          const existing = state.records.find(r => r.id === id);
          if (!existing) throw new Error("Record not found");

          const updated = { ...existing, ...args.updates, ...(args.entity || {}) };
          dispatch({ type: 'UPDATE_RECORD', payload: updated });
          return { ok: true, status: 'updated' };
        },
        delete: async (args: any) => {
          const dispatch = window.__dispatch;
          if (!dispatch) throw new Error("App not ready");
          if (args.confirm !== true) throw new Error("Delete requires confirm=true");
          const id = args.id || args.entity_id;
          dispatch({ type: 'DELETE_RECORD', payload: id });
          return { ok: true, status: 'deleted' };
        },
        select: async (args: any) => {
          const dispatch = window.__dispatch;
          if (!dispatch) throw new Error("App not ready");
          const id = args.id || args.entity_id;
          dispatch({ type: 'SELECT_RECORD', payload: id });
          return { ok: true, status: 'selected' };
        }
      },
      "artifact-transfer-v1": {
        export: async (args: any) => {
          if (args.format !== 'speaker-greenroom-v1') {
            throw new Error("Unsupported format");
          }
          const getState = window.__getState;
          if (!getState) throw new Error("App not ready");
          const state = getState();

          const derived = state.records.length > 0 ? {
            totalRecords: state.records.length,
            averageScore: state.records.reduce((s, r) => s + r.forecastScore, 0) / state.records.length,
            statusCounts: state.records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {} as any)
          } : { totalRecords: 0, averageScore: 0, statusCounts: {} };

          const artifact = {
            schemaVersion: 'v1',
            exportedAt: new Date().toISOString(),
            records: state.records,
            derived,
            history: state.history,
          };

          return { ok: true, status: 'exported', artifact };
        },
        import: async (args: any) => {
          if (args.mode !== 'speaker-greenroom-v1') {
            throw new Error("Unsupported import mode");
          }
          const dispatch = window.__dispatch;
          if (!dispatch) throw new Error("App not ready");

          const data = args.artifact;
          if (!data || data.schemaVersion !== 'v1' || !Array.isArray(data.records)) {
            throw new Error("Invalid artifact format");
          }

          dispatch({ type: 'SET_RECORDS', payload: { records: data.records, history: data.history || [] } });
          return { ok: true, status: 'imported' };
        }
      }
    };

    const tools = compileModules(assignmentEntry.modules, assignmentEntry.bindings as any, handlers as any);
    const runtime = createContractRuntime();
    const unmount = mountReactWebMcp({
      runtime,
      scopeId: "global",
      tools
    });

    window.webmcp_session_info = async () => ({
      task_id: "frontend-planning-conference-speaker-greenroom-board-forecast-ribbon-rn-github-issue-fields",
      contract_version: "zto-webmcp-v1",
    });

    return () => {
      unmount();
      delete window.webmcp_session_info;
    };
  }, []);

  return <>{children}</>;
}

root.render(
  <StrictMode>
    <WebMCPProvider>
      <AppWrapper />
    </WebMCPProvider>
  </StrictMode>,
);
