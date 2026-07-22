import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useStore } from './store.js';

const MCPContext = createContext();

export function WebMCPContext({ children }) {
  const store = useStore();

  useEffect(() => {
    window.webmcp_session_info = () => ({
      contract_version: "zto-webmcp-v1",
      modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
    });

    window.webmcp_list_tools = () => {
      return [
        {
          name: "editor_select",
          description: "Selects a record in the constraint canvas.",
          inputSchema: {
            type: "object",
            properties: {
              object_type: { type: "string", enum: ["pattern-record"] },
              id: { type: "string" }
            },
            required: ["object_type", "id"]
          }
        },
        {
          name: "editor_update_property",
          description: "Updates a property of a selected record.",
          inputSchema: {
            type: "object",
            properties: {
              object_type: { type: "string", enum: ["pattern-record"] },
              id: { type: "string" },
              property: { type: "string", enum: ["lane", "conflict"] },
              value: { type: "string" }
            },
            required: ["object_type", "id", "property", "value"]
          }
        },
        {
          name: "entity_create",
          description: "Creates a new record.",
          inputSchema: {
            type: "object",
            properties: {
              entity: { type: "string", enum: ["record"] },
              fields: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] }
                },
                required: ["name"]
              }
            },
            required: ["entity", "fields"]
          }
        },
        {
          name: "entity_update",
          description: "Updates a record.",
          inputSchema: {
            type: "object",
            properties: {
              entity: { type: "string", enum: ["record"] },
              id: { type: "string" },
              fields: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
                  lane: { type: "string", enum: ["Unconstrained", "Timing", "Velocity", "Polyphony"] }
                }
              }
            },
            required: ["entity", "id", "fields"]
          }
        },
        {
          name: "entity_delete",
          description: "Deletes a record.",
          inputSchema: {
            type: "object",
            properties: {
              entity: { type: "string", enum: ["record"] },
              id: { type: "string" },
              confirm: { type: "boolean" }
            },
            required: ["entity", "id", "confirm"]
          }
        },
        {
          name: "entity_select",
          description: "Selects a record in the collection.",
          inputSchema: {
            type: "object",
            properties: {
              entity: { type: "string", enum: ["record"] },
              id: { type: "string" }
            },
            required: ["entity", "id"]
          }
        },
        {
          name: "artifact_export",
          description: "Exports the session artifact.",
          inputSchema: {
            type: "object",
            properties: {
              format: { type: "string", enum: ["session-json"] }
            },
            required: ["format"]
          }
        },
        {
          name: "artifact_import",
          description: "Imports a session artifact.",
          inputSchema: {
            type: "object",
            properties: {
              mode: { type: "string", enum: ["session-json"] },
              data: { type: "string" }
            },
            required: ["mode", "data"]
          }
        },
        {
          name: "artifact_copy",
          description: "Copies the session artifact to clipboard.",
          inputSchema: {
            type: "object",
            properties: {
              format: { type: "string", enum: ["session-json"] }
            },
            required: ["format"]
          }
        }
      ];
    };

    window.webmcp_invoke_tool = async (name, args) => {
      const { getState, dispatch, exportSession, importSession } = window._store;

      switch (name) {
        case "editor_select":
          dispatch({ type: 'SELECT_RECORD', payload: args.id });
          return { success: true };

        case "editor_update_property":
          if (args.property === 'lane') {
            dispatch({ type: 'MOVE_RECORD', payload: { id: args.id, lane: args.value, requiresResolution: true } });
          } else if (args.property === 'conflict' && args.value === 'resolved') {
            dispatch({ type: 'RESOLVE_CONFLICT', payload: args.id });
          }
          return { success: true };

        case "entity_create":
          if (!args.fields.name || args.fields.name.trim() === '') {
            return { success: false, error: "Name is required" };
          }
          dispatch({
            type: 'CREATE_RECORD',
            payload: {
              name: args.fields.name,
              status: args.fields.status || 'empty'
            }
          });
          return { success: true };

        case "entity_update":
          dispatch({ type: 'UPDATE_RECORD', payload: { id: args.id, updates: args.fields } });
          return { success: true };

        case "entity_delete":
          if (!args.confirm) return { success: false, error: "Confirmation required" };
          dispatch({ type: 'DELETE_RECORD', payload: args.id });
          return { success: true };

        case "entity_select":
          dispatch({ type: 'SELECT_RECORD', payload: args.id });
          return { success: true };

        case "artifact_export":
          const data = exportSession();
          return { success: true, result: JSON.stringify(data) };

        case "artifact_import":
          try {
            const parsed = JSON.parse(args.data);
            const success = importSession(parsed);
            if (success) {
                return { success: true };
            } else {
                return { success: false, error: "Invalid import" }
            }
          } catch (e) {
            return { success: false, error: "Invalid JSON" };
          }

        case "artifact_copy":
           return { success: true, result: JSON.stringify(exportSession()) };

        default:
          return { success: false, error: `Tool ${name} not found` };
      }
    };
  }, []);

  return <MCPContext.Provider value={null}>{children}</MCPContext.Provider>;
}
