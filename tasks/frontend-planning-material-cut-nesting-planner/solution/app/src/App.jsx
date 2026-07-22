import React, { useState, useReducer } from "react";

const initialState = {
  mode: "placement", // placement, cut-tree, lens-grain, lens-edge, lens-defect
  pieces: [],
  stockSheets: [
    { id: "s1", material: "wood", width: 1200, height: 2400, cuts: [], offcuts: [] },
    { id: "s2", material: "wood", width: 1200, height: 2400, cuts: [], offcuts: [] },
    { id: "s3", material: "wood", width: 1200, height: 2400, cuts: [], offcuts: [] },
    { id: "s4", material: "wood", width: 1200, height: 2400, cuts: [], offcuts: [] },
    { id: "s5", material: "wood", width: 1200, height: 2400, cuts: [], offcuts: [] },
    { id: "s6", material: "wood", width: 1200, height: 2400, cuts: [], offcuts: [] }
  ],
  parts: [
    { id: "p1", name: "Backing", width: 1000, height: 2000, material: "wood", allocated: false },
    { id: "p2", name: "Shelf", width: 300, height: 1000, material: "wood", allocated: false },
    { id: "p3", name: "Shelf", width: 300, height: 1000, material: "wood", allocated: false },
    { id: "p4", name: "Side", width: 400, height: 2000, material: "wood", allocated: false },
    { id: "p5", name: "Side", width: 400, height: 2000, material: "wood", allocated: false },
    // A subset of 26 parts...
  ],
  cuts: [],
  offcuts: [
    { id: "o1", width: 200, height: 1000, material: "wood" },
    { id: "o2", width: 400, height: 400, material: "wood" },
    { id: "o3", width: 200, height: 1000, material: "wood" },
    { id: "o4", width: 400, height: 400, material: "wood" },
    { id: "o5", width: 200, height: 200, material: "wood" }
  ],
  defects: [
    { id: "d1", sheetId: "s1", x: 100, y: 100, width: 50, height: 50 },
    // A subset of 8 defects...
  ],
  executionState: "planning", // planning, execution, certified
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.payload };
    case "ALLOCATE":
      return {
        ...state,
        parts: state.parts.map(p => p.id === action.payload.partId ? { ...p, allocated: true } : p),
        pieces: [...state.pieces, { id: `pc-${Date.now()}`, partId: action.payload.partId, sheetId: "s1", x: 0, y: 0, rotation: 0 }]
      };
    case "MOVE_PIECE":
      return {
        ...state,
        pieces: state.pieces.map(p => p.id === action.payload.pieceId ? { ...p, x: action.payload.x, y: action.payload.y } : p)
      };
    case "ROTATE_PIECE":
      return {
        ...state,
        pieces: state.pieces.map(p => p.id === action.payload.pieceId ? { ...p, rotation: (p.rotation + 90) % 360 } : p)
      };
    case "DRAW_CUT":
      return {
        ...state,
        cuts: [...state.cuts, { id: `c-${Date.now()}`, sheetId: action.payload.sheetId, orientation: action.payload.orientation, position: action.payload.position }]
      };
    case "EXECUTE":
      return { ...state, executionState: "execution" };
    case "CERTIFY":
      return { ...state, executionState: "certified" };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "MaterialCutPlan.json");
    dlAnchorElem.click();
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <div className="w-64 bg-white border-r p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Toolbar</h2>
        <div className="space-y-2">
          {["placement", "cut-tree", "lens-grain", "lens-edge", "lens-defect"].map((mode) => (
            <button
              key={mode}
              onClick={() => dispatch({ type: "SET_MODE", payload: mode })}
              className={`w-full text-left px-3 py-2 rounded ${
                state.mode === mode ? "bg-blue-500 text-white" : "hover:bg-gray-100"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1).replace("-", " ")}
            </button>
          ))}
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-2">Parts (26 total)</h3>
        <ul>
          {state.parts.map((p) => (
            <li key={p.id} className="text-sm p-2 bg-gray-50 border rounded mb-1 cursor-pointer hover:bg-gray-200" onClick={() => dispatch({ type: "ALLOCATE", payload: { partId: p.id }})}>
              {p.name} ({p.width}x{p.height}) {p.allocated && "✓"}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 p-6 overflow-auto relative">
        <h2 className="text-2xl font-bold mb-4">Stock Sheets</h2>
        <div className="space-y-6">
          {state.stockSheets.slice(0, 1).map((sheet) => ( // only showing 1 for simplicity
            <div key={sheet.id} className="border-4 border-gray-300 bg-amber-50 relative" style={{ width: 600, height: 1200 }}>
               <span className="absolute top-2 left-2 text-gray-500 font-bold">Sheet {sheet.id}</span>
               {state.defects.filter(d => d.sheetId === sheet.id).map(d => (
                 <div key={d.id} className="absolute bg-red-500 opacity-50 border border-red-700" style={{ left: d.x / 2, top: d.y / 2, width: d.width / 2, height: d.height / 2 }} title="Defect" />
               ))}
               {state.pieces.filter(p => p.sheetId === sheet.id).map(p => {
                 const part = state.parts.find(pt => pt.id === p.partId);
                 return (
                   <div
                     key={p.id}
                     className="absolute bg-blue-300 border-2 border-blue-600 opacity-80 cursor-move transition-all duration-300 shadow-sm"
                     style={{
                       left: p.x, top: p.y,
                       width: (p.rotation % 180 === 0 ? part.width : part.height) / 2,
                       height: (p.rotation % 180 === 0 ? part.height : part.width) / 2
                     }}
                     onClick={() => dispatch({ type: "ROTATE_PIECE", payload: { pieceId: p.id }})}
                   >
                     <span className="text-xs p-1 block">{part.name}</span>
                   </div>
                 );
               })}
            </div>
          ))}
        </div>
      </div>

      <div className="w-80 bg-white border-l p-4 overflow-y-auto flex flex-col">
        <h2 className="text-xl font-bold mb-4">Cost & Analysis</h2>
        <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
          <p>Total Area: {1200*2400*6} mm²</p>
          <p>Used: 0 mm²</p>
          <p>Kerf Loss: 0 mm²</p>
          <p>Scrap: 0%</p>
        </div>
        <h2 className="text-xl font-bold mb-4">Execution</h2>
        <p className="mb-2 text-sm font-semibold">State: {state.executionState.toUpperCase()}</p>
        <button onClick={() => dispatch({ type: "EXECUTE" })} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-2 transition-colors">
          Verify & Execute
        </button>
        <button onClick={() => dispatch({ type: "CERTIFY" })} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mb-2 transition-colors">
          Certify Plan
        </button>
        <button onClick={handleExport} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
          Export Artifacts
        </button>
        <a id="downloadAnchorElem" style={{ display: "none" }}></a>
      </div>
    </div>
  );
}
