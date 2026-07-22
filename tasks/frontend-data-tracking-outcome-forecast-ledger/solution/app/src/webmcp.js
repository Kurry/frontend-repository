import { useStore } from './store.js';
import { exportSession } from './exportUtils.js';

window.webmcp_session_info = {
  name: "outcome-forecast-ledger",
  version: "1.0.0"
};

window.webmcp_list_tools = () => {
  return [
    {
      name: "get_state",
      description: "Gets the full ledger state.",
      parameters: { type: "object", properties: {} }
    },
    {
      name: "commit_forecast",
      description: "Commits a new forecast draft.",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string" },
          probability: { type: "number" }
        },
        required: ["question", "probability"]
      }
    },
    {
      name: "amend_forecast",
      description: "Amends a forecast probability.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          probability: { type: "number" },
          cause: { type: "string" }
        },
        required: ["id", "probability", "cause"]
      }
    },
    {
      name: "adjudicate_outcome",
      description: "Resolves a forecast.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          outcomeId: { type: "string" }
        },
        required: ["id", "outcomeId"]
      }
    },
    {
      name: "export_ledger",
      description: "Exports the session artifact JSON.",
      parameters: { type: "object", properties: {} }
    }
  ];
};

window.webmcp_invoke_tool = (tool_name, params) => {
  const store = useStore.getState();

  try {
    switch (tool_name) {
      case "get_state":
        return JSON.stringify(exportSession(store));

      case "commit_forecast":
        store.addForecast({
          question: params.question,
          probability: params.probability,
          resolutionDate: "2025-12-31",
          type: "binary",
          outcomes: [{ id: "yes", label: "Yes", prob: params.probability }, { id: "no", label: "No", prob: 10000 - params.probability }],
          status: "open",
          resolver: "Admin",
          resolutionRule: "Standard",
          invalidationCondition: "None"
        });
        return JSON.stringify({ success: true });

      case "amend_forecast":
        store.amendForecast(params.id, { probability: params.probability }, params.cause);
        return JSON.stringify({ success: true });

      case "adjudicate_outcome":
        store.adjudicateOutcome(params.id, params.outcomeId, "resolved", "WebMCP adjudication");
        return JSON.stringify({ success: true });

      case "export_ledger":
        return JSON.stringify(exportSession(store));

      default:
        throw new Error(`Unknown tool: ${tool_name}`);
    }
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
};
