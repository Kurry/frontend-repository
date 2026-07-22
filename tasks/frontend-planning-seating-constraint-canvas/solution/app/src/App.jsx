import React, { useEffect, useRef, useState } from 'react';
import { useSeatingStore, ROOM_WIDTH, ROOM_HEIGHT, GRID_SIZE, OBSTACLES, getTableSeats } from './store/store';
import { RotateCcw, RotateCw, RefreshCw, Hand, Settings2, Share2, Compass, Layers, MousePointer2, MoveDiagonal, Download } from 'lucide-react';
import { setupWebMCP } from './webmcp';
import { LensRenderer } from './LensRenderer';

const px = (val) => `${val * 32}px`; // 32px per unit

function Canvas({ state, dispatch, drawAisleMode }) {
  const [draggedTable, setDraggedTable] = useState(null);
  const [aislePoints, setAislePoints] = useState([]);

  const handleDragStart = (e, table) => {
    e.dataTransfer.setData('tableId', table.id);
    const rect = e.target.getBoundingClientRect();
    e.dataTransfer.setData('offsetX', (e.clientX - rect.left) / 32);
    e.dataTransfer.setData('offsetY', (e.clientY - rect.top) / 32);
    setDraggedTable(table);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const tableId = e.dataTransfer.getData('tableId');
    if (!tableId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / 32 / GRID_SIZE) * GRID_SIZE - parseFloat(e.dataTransfer.getData('offsetX'));
    const y = Math.round((e.clientY - rect.top) / 32 / GRID_SIZE) * GRID_SIZE - parseFloat(e.dataTransfer.getData('offsetY'));

    const snapX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const snapY = Math.round(y / GRID_SIZE) * GRID_SIZE;

    dispatch({
      type: 'UPDATE_TABLE',
      payload: { id: tableId, updates: { x: snapX, y: snapY } }
    });
    setDraggedTable(null);
  };

  const handleCanvasClick = (e) => {
    if (!drawAisleMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / 32 / GRID_SIZE) * GRID_SIZE;
    const y = Math.round((e.clientY - rect.top) / 32 / GRID_SIZE) * GRID_SIZE;

    const newPoints = [...aislePoints, { x, y }];
    setAislePoints(newPoints);
  };

  const finishAisle = (e) => {
    e.stopPropagation();
    if (aislePoints.length >= 2) {
      dispatch({ type: 'DRAW_AISLE', payload: { id: `aisle-${Date.now()}`, points: aislePoints, width: 1.2 } });
    }
    setAislePoints([]);
  };

  return (
    <div
      className={`relative bg-slate-100 border border-slate-300 mx-auto overflow-hidden ${drawAisleMode ? 'cursor-crosshair' : ''}`}
      style={{ width: px(ROOM_WIDTH), height: px(ROOM_HEIGHT) }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
      data-testid="canvas"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundSize: `${32 * GRID_SIZE}px ${32 * GRID_SIZE}px`, backgroundImage: 'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)' }}
      />

      {OBSTACLES.map(obs => (
        <div
          key={obs.id}
          className={`absolute flex items-center justify-center font-bold text-xs ${obs.type === 'stage' ? 'bg-amber-200' : obs.type === 'column' ? 'bg-slate-800 rounded-full text-white' : obs.type === 'door' || obs.type === 'accessible-entrance' ? 'bg-blue-300' : 'bg-red-200 opacity-50'}`}
          style={{ left: px(obs.x), top: px(obs.y), width: px(obs.width), height: px(obs.height) }}
        >
          {obs.type}
        </div>
      ))}

      {state.aisles.map(aisle => (
        <svg key={aisle.id} className="absolute inset-0 pointer-events-none" width="100%" height="100%">
          <polyline
            points={aisle.points.map(p => `${p.x * 32},${p.y * 32}`).join(' ')}
            fill="none"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth={aisle.width * 32}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={aisle.points.map(p => `${p.x * 32},${p.y * 32}`).join(' ')}
            fill="none"
            stroke="blue"
            strokeWidth="2"
          />
        </svg>
      ))}

      {drawAisleMode && aislePoints.length > 0 && (
         <svg className="absolute inset-0 pointer-events-none z-10" width="100%" height="100%">
         <polyline
           points={aislePoints.map(p => `${p.x * 32},${p.y * 32}`).join(' ')}
           fill="none"
           stroke="rgba(0, 0, 0, 0.5)"
           strokeWidth="2"
           strokeDasharray="4"
         />
       </svg>
      )}

      {drawAisleMode && aislePoints.length >= 2 && (
        <button
          onClick={finishAisle}
          className="absolute z-20 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow"
          style={{ left: px(aislePoints[aislePoints.length - 1].x) + 10, top: px(aislePoints[aislePoints.length - 1].y) + 10 }}
        >
          Finish Aisle
        </button>
      )}

      <LensRenderer state={state} />
      {state.tables.map(table => {
        const seats = getTableSeats(table);
        return (
          <div key={table.id}>
            <div
              draggable={!drawAisleMode}
              onDragStart={(e) => handleDragStart(e, table)}
              className="absolute bg-white border-2 border-indigo-600 shadow-sm flex items-center justify-center font-bold text-xs"
              style={{
                left: px(table.x), top: px(table.y), width: px(table.width), height: px(table.height),
                borderRadius: table.type === 'round' ? '50%' : '8px',
                transform: `rotate(${table.rotation}deg)`,
                opacity: draggedTable?.id === table.id ? 0.5 : 1,
                cursor: drawAisleMode ? 'crosshair' : 'grab'
              }}
              data-testid={`table-${table.id}`}
            >
              <div className="absolute top-0 right-0 p-1 flex gap-1 z-30">
                 <button className="bg-slate-200 rounded p-1 hover:bg-slate-300" onMouseDown={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_TABLE', payload: { id: table.id, updates: { rotation: (table.rotation + 15) % 360 } } }); }}><RotateCw size={10} /></button>
                 <button className="bg-red-200 rounded p-1 hover:bg-red-300" onMouseDown={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_TABLE', payload: table.id }); }}>x</button>
              </div>
              {table.capacity}
            </div>
            {seats.map(seat => {
              const assignment = state.assignments.find(a => a.seatId === seat.id);
              const guest = assignment ? state.guests.find(g => g.id === assignment.guestId) : null;
              return (
                <div
                  key={seat.id}
                  className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 flex items-center justify-center text-[8px] z-10 ${guest ? 'bg-green-500 text-white border-green-700' : 'bg-slate-200 border-slate-400'}`}
                  style={{ left: px(seat.x), top: px(seat.y) }}
                  data-testid={`seat-${seat.id}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const guestId = e.dataTransfer.getData('guestId');
                    if (guestId) {
                      dispatch({ type: 'ASSIGN_GUEST', payload: { guestId, seatId: seat.id } });
                    }
                  }}
                  onClick={() => {
                      if (guest) dispatch({ type: 'UNASSIGN_GUEST', payload: { guestId: guest.id }});
                  }}
                >
                  {guest ? guest.id.replace('guest-', '') : ''}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Toolbar({ dispatch, drawAisleMode, setDrawAisleMode }) {
  const addTable = (type, capacity, width, height) => {
    dispatch({ type: 'ADD_TABLE', payload: { id: `table-${Date.now()}`, type, capacity, x: 2, y: 2, width, height, rotation: 0 } });
  };

  return (
    <div className="flex gap-2 p-4 bg-white border-b items-center shadow-sm z-20 relative text-sm">
      <h1 className="font-bold text-lg mr-4">Seating Canvas</h1>

      <div className="flex gap-1 border-r pr-4">
        <button className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-semibold" onClick={() => addTable('round', 8, 2.5, 2.5)}>Round 8</button>
        <button className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-semibold" onClick={() => addTable('round', 6, 2, 2)}>Round 6</button>
        <button className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-semibold" onClick={() => addTable('rectangle', 10, 4, 1.5)}>Rect 10</button>
        <button className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 font-semibold" onClick={() => addTable('rectangle', 6, 2.5, 1.5)}>Acc Rect 6</button>
      </div>

      <div className="flex gap-1 border-r pr-4 pl-4">
         <button className={`p-2 rounded flex items-center gap-1 ${drawAisleMode ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 hover:bg-slate-200'}`} onClick={() => setDrawAisleMode(!drawAisleMode)}>
            <MoveDiagonal size={16} /> Draw Aisle
         </button>
      </div>

      <div className="flex gap-1 border-r pr-4 pl-4">
         <button className="p-2 bg-slate-100 rounded hover:bg-slate-200" onClick={() => dispatch({ type: 'TOGGLE_LENS', payload: 'accessibility' })}><Hand size={16} title="Accessibility Lens"/></button>
         <button className="p-2 bg-slate-100 rounded hover:bg-slate-200" onClick={() => dispatch({ type: 'TOGGLE_LENS', payload: 'sightline' })}><Compass size={16} title="Sightline Lens" /></button>
      </div>

      <div className="flex-1" />

      <button className="p-2 bg-slate-100 rounded hover:bg-slate-200" onClick={() => dispatch({ type: 'UNDO' })}><RotateCcw size={16} /></button>
      <button className="p-2 bg-slate-100 rounded hover:bg-slate-200" onClick={() => dispatch({ type: 'REDO' })}><RotateCw size={16} /></button>
      <button className="p-2 bg-slate-100 rounded hover:bg-slate-200 ml-2" onClick={() => dispatch({ type: 'INIT' })}><RefreshCw size={16} /></button>
      <button className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 ml-4 flex items-center gap-1"
        onClick={() => {
            const plan = {
                 schemaVersion: 'seating-constraint-plan/v1',
                 tables: state.tables,
                 assignments: state.assignments,
                 relationships: state.relationships,
                 aisles: state.aisles,
                 exportedAt: new Date().toISOString()
             };
             const blob = new Blob([JSON.stringify(plan, null, 2)], {type: 'application/json'});
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a'); a.href = url; a.download = 'plan.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }}><Download size={16} /> Export JSON</button>
    </div>
  );
}

function Sidebar({ state, dispatch }) {
  const [rel1, setRel1] = useState('');
  const [rel2, setRel2] = useState('');
  const [relType, setRelType] = useState('together');

  return (
    <div className="w-80 bg-white border-l h-full flex flex-col overflow-y-auto">
      <div className="p-4 border-b">
         <h2 className="font-bold mb-2">Metrics & Lenses</h2>
         <div className="text-xs space-y-1">
             <div>Confirmed: {state.guests.filter(g => g.rsvp === 'confirmed').length}</div>
             <div>Assigned: {state.assignments.length} / {state.guests.filter(g => g.rsvp !== 'declined').length}</div>
             <div className="flex gap-2 mt-2">
                <span className={`px-2 py-1 rounded ${state.lenses.accessibility ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>Acc Lens</span>
                <span className={`px-2 py-1 rounded ${state.lenses.sightline ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>Sight Lens</span>
             </div>
         </div>
      </div>

      <div className="p-4 border-b bg-slate-50">
        <h2 className="font-bold mb-2 text-sm">Add Relationship</h2>
        <div className="flex flex-col gap-2 text-xs">
           <select className="border p-1 rounded" value={rel1} onChange={e => setRel1(e.target.value)}>
               <option value="">Select Guest 1</option>
               {state.guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
           </select>
           <select className="border p-1 rounded" value={rel2} onChange={e => setRel2(e.target.value)}>
               <option value="">Select Guest 2</option>
               {state.guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
           </select>
           <div className="flex gap-2">
              <select className="border p-1 rounded flex-1" value={relType} onChange={e => setRelType(e.target.value)}>
                  <option value="together">Together (same table)</option>
                  <option value="near">Near (≤ 4m)</option>
                  <option value="apart">Apart (different, ≥ 6m)</option>
              </select>
              <button
                 className="bg-indigo-600 text-white px-2 rounded disabled:opacity-50"
                 disabled={!rel1 || !rel2 || rel1 === rel2}
                 onClick={() => {
                     dispatch({ type: 'ADD_RELATIONSHIP', payload: { guest1: rel1, guest2: rel2, type: relType }});
                     setRel1(''); setRel2('');
                 }}
              >
                 Add
              </button>
           </div>
        </div>
      </div>

      <div className="p-4">
        <h2 className="font-bold mb-4">Guests</h2>
        <div className="flex flex-col gap-2">
            {state.guests.map(guest => {
            const isAssigned = state.assignments.some(a => a.guestId === guest.id);
            const relationships = state.relationships.filter(r => r.guest1 === guest.id || r.guest2 === guest.id);

            return (
                <div
                key={guest.id}
                draggable={!isAssigned && guest.rsvp !== 'declined'}
                onDragStart={(e) => e.dataTransfer.setData('guestId', guest.id)}
                className={`p-2 border rounded shadow-sm text-sm ${isAssigned ? 'opacity-50 bg-slate-50 cursor-not-allowed' : guest.rsvp === 'declined' ? 'bg-red-50 text-red-500 cursor-not-allowed' : 'bg-white cursor-grab active:cursor-grabbing hover:border-indigo-400'}`}
                >
                <div className="font-semibold flex justify-between">
                    {guest.name}
                    {relationships.length > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1 rounded">{relationships.length} rel</span>}
                </div>
                <div className="text-xs text-slate-500">
                    {guest.rsvp} | {guest.mobility !== 'none' ? '♿' : ''} {guest.dietary !== 'none' ? `🍽️ ${guest.dietary}` : ''}
                </div>
                </div>
            )
            })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useSeatingStore();
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const [drawAisleMode, setDrawAisleMode] = useState(false);

  useEffect(() => {
    setupWebMCP(stateRef, dispatch);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Toolbar dispatch={dispatch} drawAisleMode={drawAisleMode} setDrawAisleMode={setDrawAisleMode} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
          <Canvas state={state} dispatch={dispatch} drawAisleMode={drawAisleMode} />
        </div>
        <Sidebar state={state} dispatch={dispatch} />
      </div>
    </div>
  );
}
