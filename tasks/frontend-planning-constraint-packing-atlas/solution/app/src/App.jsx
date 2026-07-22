import React, { useState, useEffect, useRef } from 'react';
import { Download, Play, Upload, Hash } from 'lucide-react';

const generateChecksum = (obj) => {
    let str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
};

const generateSVG = (bag, placements, items) => {
  return `<svg width="${bag.w*30}" height="${bag.h*30}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f9fafb" stroke="#d1d5db" stroke-width="2"/>
    ${bag.compartments.map(comp => {
       const compPlacements = placements.filter(p => p.compartmentId === comp.id);
       return `
          <rect x="${comp.offsetX*30}" y="${comp.offsetY*30}" width="${comp.w*30}" height="${comp.h*30}" fill="none" stroke="#9ca3af" stroke-width="1" stroke-dasharray="4"/>
          ${compPlacements.filter(p => !p.containerId).map(p => {
             const item = items.find(i => i.id === p.itemId);
             const w = p.rotation === 90 ? item.h : item.w;
             const h = p.rotation === 90 ? item.w : item.h;
             const absX = comp.offsetX + p.x;
             const absY = comp.offsetY + p.y;
             return `<rect x="${absX*30}" y="${absY*30}" width="${w*30}" height="${h*30}" fill="${p.layer === 0 ? '#3b82f6' : '#22c55e'}" stroke="white" />
             <text x="${absX*30 + 5}" y="${absY*30 + 15}" fill="white" font-size="10">${item.name}</text>`;
          }).join('')}
       `;
    }).join('')}
  </svg>`;
};

const generateCSV = (placements, items) => {
  let csv = "Item,Bag ID,Compartment ID,Layer,X,Y,Rotation\n";
  placements.forEach(p => {
    const item = items.find(i => i.id === p.itemId);
    csv += `${item.name},${p.bagId},${p.compartmentId},${p.layer},${p.x},${p.y},${p.rotation}\n`;
  });
  return csv;
};

const generateMD = (checkpointLogs) => {
  return "# Checkpoint Checklist\n\n" + checkpointLogs.map(log => `- [${log.passed ? 'x' : ' '}] ${log.name}`).join('\n');
};

const FIXTURE = {
  items: Array.from({ length: 34 }, (_, i) => ({
    id: `i${i+1}`,
    name: `Item ${i+1}`,
    w: (i % 3) + 1,
    h: (i % 2) + 1,
    mass: (i * 100) + 100,
    kits: i % 4 === 0 ? ['shelter'] : i % 3 === 0 ? ['cooking'] : i % 5 === 0 ? ['first_aid'] : [],
    fragile: i === 12 || i === 24,
    incompatibleWith: i === 5 ? ['i10'] : i === 10 ? ['i5'] : i === 8 ? ['i18'] : i === 18 ? ['i8'] : i === 2 ? ['i22'] : i === 22 ? ['i2'] : [],
    isPouch: i === 30 || i === 31 || i === 32,
    isLiquid: i === 15 || i === 25,
    checkpointReqs: i === 4 ? ['Security'] : i === 7 ? ['Trailhead'] : i === 14 ? ['Camp'] : i === 20 ? ['Return'] : []
  })),
  bags: [
    {
      id: 'b1', name: 'Main Pack', maxMass: 25000, w: 16, h: 14, owner: 'Alice',
      compartments: [
          { id: 'c1', name: 'Main', w: 12, h: 14, offsetX: 0, offsetY: 0, isSealed: false, capacity: 15000 },
          { id: 'c2', name: 'Side', w: 4, h: 6, offsetX: 12, offsetY: 0, isSealed: true, capacity: 5000 }
      ]
    },
    {
      id: 'b2', name: 'Day Pack', maxMass: 10000, w: 8, h: 10, owner: 'Bob',
      compartments: [
          { id: 'c3', name: 'Main', w: 8, h: 10, offsetX: 0, offsetY: 0, isSealed: false, capacity: 8000 }
      ]
    },
    {
      id: 'b3', name: 'Utility Pack', maxMass: 15000, w: 10, h: 8, owner: 'Charlie',
      compartments: [
          { id: 'c4', name: 'Top', w: 10, h: 4, offsetX: 0, offsetY: 0, isSealed: true, capacity: 5000 },
          { id: 'c5', name: 'Bottom', w: 10, h: 4, offsetX: 0, offsetY: 4, isSealed: false, capacity: 5000 }
      ]
    }
  ],
  owners: {
    'Alice': { maxLoad: 25000 },
    'Bob': { maxLoad: 12000 },
    'Charlie': { maxLoad: 20000 },
    'Dave': { maxLoad: 18000 }
  }
};

export default function App() {
  const [layout, setLayout] = useState({
    placements: [], // {itemId, bagId, compartmentId, layer, x, y, rotation, containerId: null}
    branch: 'main',
    certified: false,
    checksums: null,
    ownerAssignments: { 'b1': 'Alice', 'b2': 'Bob', 'b3': 'Charlie' }
  });
  const [branches, setBranches] = useState({'main': layout});

  const [draggingItem, setDraggingItem] = useState(null);
  const [conflictMessage, setConflictMessage] = useState(null);

  // Rehearsal state
  const checkpoints = ['Departure', 'Security', 'Trailhead', 'Camp', 'Return'];
  const [checkpointIdx, setCheckpointIdx] = useState(0);
  const [rehearsalLogs, setRehearsalLogs] = useState([]); // { action, itemId, msg }
  const [itemsTakenOut, setItemsTakenOut] = useState([]); // Array of itemIds currently out of their bags

  const [importError, setImportError] = useState("");
  const fileInputRef = useRef(null);

  // Responsive mode
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState('bags'); // 'bags', 'rail', 'kits'

  useEffect(() => {
     const checkMobile = () => setIsMobile(window.innerWidth < 768);
     checkMobile();
     window.addEventListener('resize', checkMobile);
     return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getCompartmentMass = (placements, bagId, compId) => {
      let mass = 0;
      placements.forEach(p => {
          if (p.bagId === bagId && p.compartmentId === compId) {
             mass += FIXTURE.items.find(i => i.id === p.itemId).mass;
          }
      });
      return mass;
  };

  const checkOverlap = (placements, item, bagId, compartmentId, layer, x, y, rotation) => {
    const itemW = rotation === 90 ? item.h : item.w;
    const itemH = rotation === 90 ? item.w : item.h;

    const bag = FIXTURE.bags.find(b => b.id === bagId);
    const compartment = bag.compartments.find(c => c.id === compartmentId);

    if (x < 0 || y < 0 || x + itemW > compartment.w || y + itemH > compartment.h) return "Out of compartment bounds";

    if (item.isLiquid && !compartment.isSealed) return "Liquids require sealed compartments";

    const compMass = getCompartmentMass(placements, bagId, compartmentId);
    if (compMass + item.mass > compartment.capacity) return `Compartment capacity exceeded (${compMass + item.mass}g / ${compartment.capacity}g)`;

    for (let p of placements) {
      if (p.bagId === bagId && p.compartmentId === compartmentId && p.layer === layer && p.itemId !== item.id) {
        const pItem = FIXTURE.items.find(i => i.id === p.itemId);
        const pW = p.rotation === 90 ? pItem.h : pItem.w;
        const pH = p.rotation === 90 ? pItem.w : pItem.h;
        if (x < p.x + pW && x + itemW > p.x && y < p.y + pH && y + itemH > p.y) return "Overlap detected";
      }
    }

    if (layer === 1) {
      for (let p of placements) {
        if (p.bagId === bagId && p.compartmentId === compartmentId && p.layer === 0 && p.itemId !== item.id) {
          const pItem = FIXTURE.items.find(i => i.id === p.itemId);
          if (pItem.fragile) {
            const pW = p.rotation === 90 ? pItem.h : pItem.w;
            const pH = p.rotation === 90 ? pItem.w : pItem.h;
            if (x < p.x + pW && x + itemW > p.x && y < p.y + pH && y + itemH > p.y) return "Cannot place above fragile item";
          }
        }
      }
    }

    const bagItems = placements.filter(p => p.bagId === bagId);
    for (let p of bagItems) {
      if (item.incompatibleWith.includes(p.itemId)) return `Incompatible with ${FIXTURE.items.find(i => i.id === p.itemId).name}`;
    }

    return null;
  };

  const syncPouchContents = (placements, pouchId, bagId, compId) => {
      // Find items inside this pouch and update their bag/comp location recursively
      const newPlacements = [...placements];
      const children = newPlacements.filter(p => p.containerId === pouchId);
      children.forEach(child => {
          child.bagId = bagId;
          child.compartmentId = compId;
          syncPouchContents(newPlacements, child.itemId, bagId, compId); // deep sync
      });
      return newPlacements;
  };

  const handleDrop = (e, bag, compartment, layer) => {
    e.preventDefault();
    if (!draggingItem) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 20);
    const y = Math.floor((e.clientY - rect.top) / 20);
    const rotation = 0;

    setLayout(prev => {
      let placements = prev.placements.filter(p => p.itemId !== draggingItem.id);
      const conflict = checkOverlap(placements, draggingItem, bag.id, compartment.id, layer, x, y, rotation);
      if (conflict) {
        setConflictMessage(`Snapback: ${conflict}`);
        return prev;
      }
      setConflictMessage(null);
      placements.push({ itemId: draggingItem.id, bagId: bag.id, compartmentId: compartment.id, layer, x, y, rotation, containerId: null });

      if (draggingItem.isPouch) {
          placements = syncPouchContents(placements, draggingItem.id, bag.id, compartment.id);
      }

      const newState = { ...prev, placements, certified: false, checksums: null };
      setBranches(b => ({...b, [newState.branch]: newState}));
      return newState;
    });
    setDraggingItem(null);
  };

  const handlePouchDrop = (e, pouchId, bag, compartment, layer) => {
     e.preventDefault();
     e.stopPropagation();
     if (!draggingItem) return;
     if (draggingItem.id === pouchId || draggingItem.isPouch) {
         setConflictMessage("Cannot nest pouch in pouch (max depth 2)");
         return;
     }

     setLayout(prev => {
        let placements = prev.placements.filter(p => p.itemId !== draggingItem.id);
        const pouchPlacement = prev.placements.find(p => p.itemId === pouchId);

        placements.push({
           itemId: draggingItem.id,
           bagId: bag.id,
           compartmentId: compartment.id,
           layer,
           x: pouchPlacement.x,
           y: pouchPlacement.y,
           rotation: 0,
           containerId: pouchId
        });
        const newState = { ...prev, placements, certified: false, checksums: null };
        setBranches(b => ({...b, [newState.branch]: newState}));
        return newState;
     });
     setDraggingItem(null);
  };

  const certifyLayout = () => {
      setLayout(prev => {
          const checksums = {
              fixture: generateChecksum(FIXTURE),
              layout: generateChecksum(prev.placements),
              run: generateChecksum(prev.ownerAssignments)
          };
          const newState = { ...prev, certified: true, checksums };
          setBranches(b => ({...b, [newState.branch]: newState}));
          return newState;
      });
  };

  const handleExport = (format) => {
    let data, type, name;
    if (format === 'json') {
      data = JSON.stringify({ schemaVersion: "constraint-packing-plan/v1", ...layout, exportedAt: new Date().toISOString() }, null, 2);
      type = 'application/json'; name = 'plan.json';
    } else if (format === 'csv') {
      data = generateCSV(layout.placements, FIXTURE.items);
      type = 'text/csv'; name = 'manifest.csv';
    } else if (format === 'svg') {
      data = FIXTURE.bags.map(b => generateSVG(b, layout.placements, FIXTURE.items)).join('\n\n');
      type = 'image/svg+xml'; name = 'bags.svg';
    } else if (format === 'markdown') {
      const logs = checkpoints.map((cp, idx) => ({ name: cp, passed: idx < checkpointIdx }));
      data = generateMD(logs);
      type = 'text/markdown'; name = 'checkpoint.md';
    }

    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
  };

  const handleImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const imported = JSON.parse(event.target.result);
              if (imported.schemaVersion !== "constraint-packing-plan/v1") throw new Error("Invalid schema version");
              if (!imported.placements || !Array.isArray(imported.placements)) throw new Error("Missing placements array");

              for (const p of imported.placements) {
                  if (!FIXTURE.items.find(i => i.id === p.itemId)) throw new Error(`Unknown item: ${p.itemId}`);
                  const bag = FIXTURE.bags.find(b => b.id === p.bagId);
                  if (!bag) throw new Error(`Unknown bag: ${p.bagId}`);
                  if (!bag.compartments.find(c => c.id === p.compartmentId)) throw new Error(`Unknown compartment: ${p.compartmentId}`);
              }

              setLayout(imported);
              setBranches(b => ({...b, [imported.branch]: imported}));
              setImportError("");
          } catch (err) {
              setImportError(`Import failed: ${err.message}`);
          }
      };
      reader.readAsText(file);
      e.target.value = null; // reset
  };

  const createBranch = (name) => {
      if (!branches[name]) {
          const newLayout = {...layout, branch: name, certified: false, checksums: null};
          setBranches(prev => ({...prev, [name]: newLayout}));
          setLayout(newLayout);
      } else {
          setLayout(branches[name]);
      }
  };

  const [compareMode, setCompareMode] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');

  const mergeItem = (itemId, fromBranch) => {
      const p = branches[fromBranch].placements.find(x => x.itemId === itemId);
      if (!p) return;

      setLayout(prev => {
          const placements = prev.placements.filter(x => x.itemId !== itemId);
          const item = FIXTURE.items.find(i => i.id === itemId);
          const conflict = checkOverlap(placements, item, p.bagId, p.compartmentId, p.layer, p.x, p.y, p.rotation);
          if (conflict) {
              setConflictMessage(`Merge Conflict for ${item.name}: ${conflict}`);
              return prev;
          }
          placements.push(p);
          const newState = { ...prev, placements, certified: false, checksums: null };
          setBranches(b => ({...b, [newState.branch]: newState}));
          return newState;
      });
  };

  // Checkpoint Rehearsal Logic (Take out, use, repack)
  const performTakeOut = (itemId) => {
      const p = layout.placements.find(x => x.itemId === itemId);
      if (!p) return;
      const item = FIXTURE.items.find(i => i.id === itemId);

      // Check blockers
      if (p.layer === 0 && !p.containerId) {
          const blockers = layout.placements.filter(other =>
              other.bagId === p.bagId &&
              other.compartmentId === p.compartmentId &&
              other.layer === 1 && !other.containerId &&
              !(other.x >= p.x + item.w || other.x + FIXTURE.items.find(i=>i.id===other.itemId).w <= p.x || other.y >= p.y + item.h || other.y + FIXTURE.items.find(i=>i.id===other.itemId).h <= p.y)
          );
          if (blockers.length > 0) {
              setConflictMessage(`Takeout Failed: ${item.name} blocked by ${blockers.map(b => FIXTURE.items.find(i=>i.id===b.itemId).name).join(', ')}`);
              setRehearsalLogs(prev => [...prev, `[FAIL] Blocked: ${item.name}`]);
              return;
          }
      }

      setItemsTakenOut(prev => [...prev, itemId]);
      setRehearsalLogs(prev => [...prev, `Taken out: ${item.name}`]);
  };

  const performRepack = (itemId) => {
      setItemsTakenOut(prev => prev.filter(x => x !== itemId));
      setRehearsalLogs(prev => [...prev, `Repacked: ${FIXTURE.items.find(i=>i.id===itemId).name}`]);
  };

  const advanceCheckpoint = () => {
     setConflictMessage(null);

     if (itemsTakenOut.length > 0) {
         setConflictMessage("Must repack all items before advancing");
         return;
     }

     const cpName = checkpoints[checkpointIdx];
     const reqItems = FIXTURE.items.filter(i => i.checkpointReqs.includes(cpName));

     for (let reqItem of reqItems) {
         const p = layout.placements.find(x => x.itemId === reqItem.id);
         if (!p) {
             setConflictMessage(`Checkpoint Failed: Missing ${reqItem.name}`);
             setRehearsalLogs(prev => [...prev, `[FAIL] Missing: ${reqItem.name}`]);
             return;
         }
     }

     setRehearsalLogs(prev => [...prev, `--- Advanced past ${cpName} ---`]);
     setCheckpointIdx(prev => Math.min(prev + 1, checkpoints.length));
  };

  const retryRehearsal = () => {
      setCheckpointIdx(0);
      setItemsTakenOut([]);
      setRehearsalLogs([]);
      setConflictMessage("Rehearsal Reset");
  };

  const [selectedForKeyboard, setSelectedForKeyboard] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
        if (!selectedForKeyboard) return;

        const currentP = layout.placements.find(p => p.itemId === selectedForKeyboard.id);
        if (!currentP) return;

        let { x, y, layer, rotation, bagId, compartmentId } = currentP;
        let moved = false;

        if (e.key === 'ArrowRight') { x += 1; moved = true; }
        if (e.key === 'ArrowLeft') { x -= 1; moved = true; }
        if (e.key === 'ArrowDown') { y += 1; moved = true; }
        if (e.key === 'ArrowUp') { y -= 1; moved = true; }
        if (e.key === 'r') { rotation = rotation === 0 ? 90 : 0; moved = true; }
        if (e.key === 'l') { layer = layer === 0 ? 1 : 0; moved = true; }

        if (moved) {
            setLayout(prev => {
                const placements = prev.placements.filter(p => p.itemId !== selectedForKeyboard.id);
                const conflict = checkOverlap(placements, selectedForKeyboard, bagId, compartmentId, layer, x, y, rotation);
                if (conflict) {
                    setConflictMessage(`Keyboard Snapback: ${conflict}`);
                    return prev;
                }
                setConflictMessage(null);
                placements.push({ ...currentP, x, y, layer, rotation });
                const newState = { ...prev, placements, certified: false, checksums: null };
                setBranches(b => ({...b, [newState.branch]: newState}));
                return newState;
            });
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedForKeyboard, layout]);

  useEffect(() => {
    window.webmcp_session_info = () => ({
      modules: ['structured-editor-v1', 'entity-collection-v1', 'command-session-v1', 'artifact-transfer-v1'],
      bindings: {
        editor_object_types: ['item', 'bag', 'compartment'],
        editor_operations: ['select', 'add', 'delete', 'update_property'],
        editor_properties: ['layer', 'rotation', 'pouch'],
        entity: 'layout-branch',
        entity_operations: ['create', 'select'],
        entity_fields: ['name', 'certified'],
        session_operations: ['start', 'advance', 'restart'],
        demos: ['checkpoint-rehearsal'],
        artifact_operations: ['export', 'import', 'copy'],
        export_formats: ['constraint-packing-plan-json', 'svg', 'csv', 'markdown'],
        import_modes: ['constraint-packing-plan'],
        visible_postconditions: ['bag-canvases', 'item-rail', 'conflict-matrix', 'checkpoint-timeline']
      }
    });

    window.webmcp_list_tools = () => [
      { name: 'editor_select', description: 'Select an object' },
      { name: 'editor_add', description: 'Add object' },
      { name: 'editor_delete', description: 'Delete object' },
      { name: 'editor_update_property', description: 'Update object property' },
      { name: 'entity_create', description: 'Create branch' },
      { name: 'entity_select', description: 'Select branch' },
      { name: 'session_advance', description: 'Advance session' },
      { name: 'session_restart', description: 'Restart session' },
      { name: 'artifact_export', description: 'Export plan' },
      { name: 'artifact_import', description: 'Import plan (simulated)' }
    ];

    window.webmcp_invoke_tool = async (tool, args) => {
      if (tool === 'editor_update_property') {
         setLayout(prev => {
             const placements = [...prev.placements];
             const idx = placements.findIndex(p => p.itemId === args.object_id);
             if (idx >= 0) placements[idx] = { ...placements[idx], [args.property]: args.value };
             return { ...prev, placements, certified: false, checksums: null };
         });
      }
      if (tool === 'editor_add') {
         setLayout(prev => {
            const item = FIXTURE.items.find(i => i.id === args.object_id);
            if (!item) return prev;
            const placements = [...prev.placements];
            if (!checkOverlap(placements, item, FIXTURE.bags[0].id, FIXTURE.bags[0].compartments[0].id, 0, 0, 0, 0)) {
                placements.push({ itemId: item.id, bagId: FIXTURE.bags[0].id, compartmentId: FIXTURE.bags[0].compartments[0].id, layer: 0, x: 0, y: 0, rotation: 0, containerId: null });
            }
            return { ...prev, placements, certified: false, checksums: null };
         });
      }
      if (tool === 'editor_delete') {
         setLayout(prev => {
            const placements = prev.placements.filter(p => p.itemId !== args.object_id && p.containerId !== args.object_id);
            return { ...prev, placements, certified: false, checksums: null };
         });
      }
      if (tool === 'entity_create') createBranch(args.name);
      if (tool === 'entity_select') setLayout(branches[args.name]);
      if (tool === 'session_advance') advanceCheckpoint();
      if (tool === 'session_restart') retryRehearsal();
      if (tool === 'artifact_export') handleExport(args.format || 'json');
      if (tool === 'artifact_import') {
          return { success: true, message: "Import tool invoked. Use File input for real bytes."};
      }
      return { success: true };
    };
  }, [branches, layout, itemsTakenOut, checkpointIdx]);

  const computeEquity = () => {
     return Object.keys(FIXTURE.owners).map(owner => {
         const bagIds = FIXTURE.bags.filter(b => layout.ownerAssignments[b.id] === owner).map(b => b.id);
         let totalLoad = 0;
         bagIds.forEach(bId => {
             layout.placements.filter(p => p.bagId === bId).forEach(p => {
                 totalLoad += FIXTURE.items.find(i => i.id === p.itemId).mass;
             });
         });
         const max = FIXTURE.owners[owner].maxLoad;
         const pct = ((totalLoad / max) * 100).toFixed(1);
         return { owner, pct, totalLoad, max };
     });
  };

  const renderItemRail = () => (
     <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {FIXTURE.items.filter(i => !layout.placements.find(p => p.itemId === i.id)).map(item => (
          <div
            key={item.id} draggable onDragStart={(e) => setDraggingItem(item)}
            tabIndex={0}
            onClick={() => {
               if (!selectedForKeyboard) {
                   setLayout(prev => {
                       const placements = [...prev.placements];
                       if (!checkOverlap(placements, item, 'b1', 'c1', 0, 0, 0, 0)) {
                           placements.push({ itemId: item.id, bagId: 'b1', compartmentId: 'c1', layer: 0, x: 0, y: 0, rotation: 0, containerId: null });
                       }
                       return { ...prev, placements, certified: false, checksums: null };
                   });
               }
            }}
            className="p-2 border rounded shadow-sm bg-blue-50 cursor-move border-blue-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all group"
          >
            <div className="font-semibold text-sm flex justify-between text-blue-900">
                <span>{item.name} {item.isPouch && "📦"}</span>
                <span className="text-blue-500">{item.w}x{item.h}</span>
            </div>
            <div className="text-xs text-blue-700/70 mt-1 flex justify-between flex-wrap gap-1">
              <span>{item.mass}g</span>
              <div className="flex gap-1">
                 {item.fragile && <span className="bg-red-500 text-white px-1 rounded text-[10px]">Fragile</span>}
                 {item.isLiquid && <span className="bg-cyan-600 text-white px-1 rounded text-[10px]">Liquid</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
  );

  const renderBags = () => (
     <div className="flex flex-col gap-8 items-center pb-20">
        {FIXTURE.bags.map(bag => {
          const bagPlacements = layout.placements.filter(p => p.bagId === bag.id);
          const totalMass = bagPlacements.reduce((acc, p) => acc + FIXTURE.items.find(i => i.id === p.itemId).mass, 0);

          let massSum = 0, momentSum = 0;
          bagPlacements.forEach(p => {
              const i = FIXTURE.items.find(it => it.id === p.itemId);
              const w = p.rotation === 90 ? i.h : i.w;
              const compartment = bag.compartments.find(c => c.id === p.compartmentId);
              const absoluteX = p.x + compartment.offsetX;
              massSum += i.mass; momentSum += i.mass * (absoluteX + w/2);
          });
          const cmX = massSum === 0 ? bag.w / 2 : momentSum / massSum;
          const isImbalanced = Math.abs(cmX - (bag.w / 2)) > (bag.w * 0.1);

          const ownerMax = FIXTURE.owners[layout.ownerAssignments[bag.id]].maxLoad;
          const overWeight = totalMass > ownerMax || totalMass > bag.maxMass;

          return (
            <div key={bag.id} className="bg-white p-4 border border-gray-200 rounded shadow-md w-full max-w-5xl relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-2">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                      {bag.name}
                      <select
                         value={layout.ownerAssignments[bag.id]}
                         onChange={(e) => setLayout(l => ({ ...l, ownerAssignments: { ...l.ownerAssignments, [bag.id]: e.target.value }, certified: false, checksums: null }))}
                         className="text-xs font-normal border p-1 rounded bg-gray-50 text-gray-700"
                      >
                          {Object.keys(FIXTURE.owners).map(o => <option key={o} value={o}>Assign: {o}</option>)}
                      </select>
                  </h3>
                  <div className="text-xs text-gray-500 mt-1">CM: {cmX.toFixed(2)} {isImbalanced && <span className="text-red-500 ml-1 font-bold">Imbalanced &gt;10%</span>}</div>
                </div>
                <div className="text-sm text-right bg-gray-50 p-2 rounded border">
                  <div className={overWeight ? "text-red-600 font-bold" : "text-gray-700 font-medium"}>{totalMass}g / {bag.maxMass}g (Bag limit)</div>
                  <div className={totalMass > ownerMax ? "text-red-600 font-bold text-xs mt-1" : "text-gray-500 text-xs mt-1"}>Owner limit: {ownerMax}g</div>
                </div>
              </div>

              <div className="relative overflow-x-auto" style={{ margin: '0 auto', maxWidth: '100%' }}>
                <div style={{ width: bag.w * 20, height: bag.h * 20, position: 'relative', minWidth: bag.w * 20 }}>
                  <div className="absolute top-0 bottom-0 border-l-2 border-red-500 border-dashed pointer-events-none opacity-50 z-20" style={{left: `${(cmX/bag.w)*100}%`}}></div>

                  {bag.compartments.map(comp => {
                      const compPlacements = bagPlacements.filter(p => p.compartmentId === comp.id);
                      return (
                         <div key={comp.id} className="absolute border border-gray-400 bg-gray-100 flex flex-col sm:flex-row gap-4 p-2 shadow-inner" style={{ left: comp.offsetX * 20, top: comp.offsetY * 20, width: (comp.w * 20) * 2 + 32 + 16, height: comp.h * 20 + 32 }}>
                            <div className="absolute -top-3 left-2 bg-white px-1 text-[10px] text-gray-500 font-bold border rounded shadow-sm z-10">{comp.name} {comp.isSealed && "(Sealed)"}</div>
                            {[0, 1].map(layer => (
                              <div key={layer} className="flex-1 min-w-max">
                                <div className="text-[10px] text-center text-gray-400 font-semibold mb-1 uppercase tracking-wider">Layer {layer}</div>
                                <div
                                  className="relative border border-dashed border-gray-300 bg-white"
                                  style={{ width: comp.w * 20, height: comp.h * 20 }}
                                  onDrop={(e) => handleDrop(e, bag, comp, layer)} onDragOver={e => e.preventDefault()}
                                >
                                  <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${comp.w}, 20px)`, gridTemplateRows: `repeat(${comp.h}, 20px)` }}>
                                     {Array.from({length: comp.w * comp.h}).map((_, i) => <div key={i} className="border border-gray-100/50"></div>)}
                                  </div>

                                  {compPlacements.filter(p => p.layer === layer && !p.containerId).map(p => {
                                    const item = FIXTURE.items.find(i => i.id === p.itemId);
                                    const isOut = itemsTakenOut.includes(item.id);
                                    if (isOut) return null; // Don't render if it's currently "taken out"

                                    const w = p.rotation === 90 ? item.h : item.w;
                                    const h = p.rotation === 90 ? item.w : item.h;

                                    return (
                                      <div
                                        key={p.itemId}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (selectedForKeyboard && selectedForKeyboard.id === p.itemId) {
                                                setSelectedForKeyboard(null);
                                            } else {
                                                setSelectedForKeyboard(item);
                                            }
                                        }}
                                        onDrop={item.isPouch ? (e) => handlePouchDrop(e, item.id, bag, comp, layer) : undefined}
                                        className={`absolute border-2 border-gray-800/20 opacity-95 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-all shadow-sm hover:shadow-md ${layer === 0 ? 'bg-blue-500' : 'bg-green-500'} ${selectedForKeyboard?.id === p.itemId ? 'ring-4 ring-yellow-400 z-10 scale-105' : 'hover:brightness-110'}`}
                                        style={{ left: p.x * 20, top: p.y * 20, width: w * 20, height: h * 20 }}
                                      >
                                        <span className="text-center leading-tight truncate px-1 w-full drop-shadow">{item.name}</span>
                                        {item.isPouch && <span className="text-[8px] bg-white/20 text-white px-1 rounded mt-0.5 backdrop-blur-sm">Pouch</span>}

                                        {item.isPouch && compPlacements.filter(np => np.containerId === item.id).map(np => {
                                           const nestedItem = FIXTURE.items.find(i => i.id === np.itemId);
                                           return !itemsTakenOut.includes(nestedItem.id) && (
                                             <div key={np.itemId} className="absolute inset-1 bg-yellow-400 text-black text-[8px] flex items-center justify-center opacity-90 rounded border border-yellow-600 shadow-inner overflow-hidden truncate px-0.5 mt-2">
                                                {nestedItem.name}
                                             </div>
                                           )
                                        })}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                         </div>
                      )
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
  );

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col font-sans text-gray-800 overflow-hidden">
      <header className="bg-white border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">Constraint Packing Atlas</h1>
        <div className="flex gap-2 md:gap-4 flex-wrap items-center">
          <div className="text-xs md:text-sm flex items-center gap-2">
            <span className="hidden md:inline">Branch:</span>
            <select value={layout.branch} onChange={e => createBranch(e.target.value)} className="border rounded px-2 py-1 bg-white max-w-[100px] md:max-w-none">
                {Object.keys(branches).map(b => <option key={b} value={b}>{b}</option>)}
                <option value={"branch_" + Date.now()}>+ New</option>
            </select>

            <button onClick={() => setCompareMode(!compareMode)} className={`px-2 py-1 border rounded text-xs hidden md:block ${compareMode ? 'bg-indigo-100 border-indigo-400' : 'bg-white'}`}>Compare</button>
            {compareMode && (
                <>
                <span className="text-xs hidden md:inline">with</span>
                <select value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} className="border rounded px-2 py-1 text-xs hidden md:block">
                    <option value="">Select...</option>
                    {Object.keys(branches).filter(b => b !== layout.branch).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                </>
            )}

            <span className={`ml-1 text-[10px] md:text-xs px-2 py-1 rounded ${layout.certified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {layout.certified ? 'Certified' : 'Draft'}
            </span>
          </div>
          <button onClick={certifyLayout} className="px-2 py-1 bg-blue-600 text-white text-xs md:text-sm rounded hover:bg-blue-700 shadow-sm transition">
            Certify
          </button>
          <div className="hidden md:flex bg-gray-200 rounded overflow-hidden shadow-sm">
            <button onClick={() => handleExport('json')} className="px-3 py-1 text-gray-800 text-xs hover:bg-gray-300 border-r border-gray-300">JSON</button>
            <button onClick={() => handleExport('svg')} className="px-3 py-1 text-gray-800 text-xs hover:bg-gray-300 border-r border-gray-300">SVG</button>
            <button onClick={() => handleExport('csv')} className="px-3 py-1 text-gray-800 text-xs hover:bg-gray-300 border-r border-gray-300">CSV</button>
            <button onClick={() => handleExport('markdown')} className="px-3 py-1 text-gray-800 text-xs hover:bg-gray-300">MD</button>
          </div>
          <div className="relative">
             <input type="file" accept=".json" onChange={handleImport} ref={fileInputRef} className="hidden" />
             <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs md:text-sm rounded hover:bg-purple-700 shadow-sm transition">
               <Upload size={14} /> <span className="hidden md:inline">Import</span>
             </button>
          </div>
        </div>
      </header>

      {conflictMessage && (
        <div className="bg-red-100 text-red-800 p-2 text-center text-xs md:text-sm font-semibold shadow-inner shrink-0">{conflictMessage}</div>
      )}
      {importError && (
        <div className="bg-red-100 text-red-800 p-2 text-center text-xs md:text-sm font-semibold shadow-inner shrink-0">{importError}</div>
      )}
      {layout.certified && layout.checksums && (
        <div className="bg-green-50 border-b border-green-200 p-1 text-center text-[10px] text-green-800 font-mono flex justify-center gap-4 shrink-0">
            <span>Fix: {layout.checksums.fixture}</span>
            <span>Lay: {layout.checksums.layout}</span>
            <span>Run: {layout.checksums.run}</span>
        </div>
      )}

      {isMobile && (
          <div className="flex bg-white border-b shrink-0 text-sm">
              <button onClick={() => setMobileTab('rail')} className={`flex-1 py-2 text-center ${mobileTab === 'rail' ? 'border-b-2 border-blue-500 font-bold' : ''}`}>Items</button>
              <button onClick={() => setMobileTab('bags')} className={`flex-1 py-2 text-center ${mobileTab === 'bags' ? 'border-b-2 border-blue-500 font-bold' : ''}`}>Bags</button>
              <button onClick={() => setMobileTab('kits')} className={`flex-1 py-2 text-center ${mobileTab === 'kits' ? 'border-b-2 border-blue-500 font-bold' : ''}`}>Kits/Run</button>
          </div>
      )}

      <main className="flex-1 flex overflow-hidden relative">
        {/* Compare Overlay */}
        {compareMode && mergeTarget && branches[mergeTarget] && !isMobile && (
            <div className="absolute top-0 bottom-0 left-0 w-80 bg-white/95 border-r border-indigo-200 z-50 p-4 overflow-y-auto shadow-2xl backdrop-blur-sm">
                <h3 className="font-bold text-indigo-900 mb-4 border-b border-indigo-200 pb-2">Merge from: {mergeTarget}</h3>
                {branches[mergeTarget].placements.map(p => {
                    const item = FIXTURE.items.find(i => i.id === p.itemId);
                    const isInCurrent = layout.placements.find(x => x.itemId === p.itemId);
                    const diff = !isInCurrent || isInCurrent.bagId !== p.bagId || isInCurrent.compartmentId !== p.compartmentId || isInCurrent.x !== p.x || isInCurrent.y !== p.y || isInCurrent.layer !== p.layer || isInCurrent.rotation !== p.rotation;
                    return (
                        <div key={p.itemId} className={`p-2 mb-2 border rounded text-xs flex justify-between items-center ${diff ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 opacity-50'}`}>
                            <div>
                                <span className="font-semibold">{item.name}</span>
                                <div className="text-gray-500">[{p.bagId}:{p.compartmentId}] L{p.layer} ({p.x},{p.y}) R{p.rotation}</div>
                            </div>
                            {diff && (
                                <button onClick={() => mergeItem(p.itemId, mergeTarget)} className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition">Merge</button>
                            )}
                        </div>
                    )
                })}
            </div>
        )}

        {/* Desktop or Mobile Rail */}
        {(!isMobile || mobileTab === 'rail') && (
            <aside className="w-full md:w-64 bg-white border-r flex flex-col shrink-0" id="item-rail">
              {!isMobile && <div className="p-4 border-b font-semibold bg-gray-50">Inventory ({FIXTURE.items.filter(i => !layout.placements.find(p => p.itemId === i.id)).length} left)</div>}
              {renderItemRail()}
            </aside>
        )}

        {/* Canvases */}
        {(!isMobile || mobileTab === 'bags') && (
            <div className="flex-1 overflow-auto bg-gray-100 p-2 md:p-6" id="bag-canvases">
              {renderBags()}
            </div>
        )}

        {/* Analytics & Checkpoints */}
        {(!isMobile || mobileTab === 'kits') && (
            <aside className="w-full md:w-72 bg-white border-l flex flex-col shrink-0 overflow-y-auto">
              {!isMobile && <div className="p-4 border-b font-semibold bg-gray-50 text-gray-800">Analytics</div>}

              <div className="p-4 border-b text-xs text-gray-600 bg-indigo-50/30">
                  <div className="font-semibold text-indigo-900 mb-2">Carrier Shared Equity</div>
                  <div className="space-y-1">
                      {computeEquity().map(eq => (
                         <div key={eq.owner} className="flex justify-between">
                             <span>{eq.owner}</span>
                             <span className={eq.totalLoad > eq.max ? "text-red-500 font-bold" : ""}>{eq.pct}% ({eq.totalLoad}g)</span>
                         </div>
                      ))}
                  </div>
              </div>

              <div className="p-4 border-b">
                <h4 className="text-sm font-semibold mb-2 text-gray-800">Kits Readiness</h4>
                <div className="space-y-2">
                  {['shelter', 'cooking', 'first_aid'].map(kit => {
                    const req = FIXTURE.items.filter(i => i.kits.includes(kit));
                    const pk = req.filter(i => layout.placements.find(p => p.itemId === i.id));
                    const ready = req.length > 0 && req.length === pk.length;
                    return (
                      <div key={kit} className="flex justify-between text-xs md:text-sm bg-gray-50 border border-gray-100 p-2 rounded items-center">
                        <span className="capitalize text-gray-700">{kit.replace('_', ' ')}</span>
                        <span className={ready ? "text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded" : "text-gray-500"}>{pk.length} / {req.length}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-4 flex-1 border-b" id="checkpoint-timeline">
                <h4 className="text-sm font-semibold mb-4 flex justify-between items-center text-gray-800">
                    Checkpoints
                    <div className="flex gap-1">
                        <button onClick={retryRehearsal} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] hover:bg-gray-300">Retry</button>
                        <button onClick={advanceCheckpoint} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 shadow-sm transition" disabled={checkpointIdx >= checkpoints.length}>Advance</button>
                    </div>
                </h4>

                <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                  {checkpoints.map((cp, idx) => {
                      let statusText = "";
                      if (idx === checkpointIdx && itemsTakenOut.length === 0) {
                          const reqs = FIXTURE.items.filter(i => i.checkpointReqs.includes(cp));
                          const missing = reqs.filter(r => !layout.placements.find(p => p.itemId === r.id));
                          if (missing.length > 0) statusText = `Missing: ${missing.map(m=>m.name).join(', ')}`;
                      }

                      return (
                        <div key={cp} className="pl-6 relative text-sm">
                          <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-white ${idx < checkpointIdx ? 'bg-green-500' : idx === checkpointIdx ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                          <div className={idx <= checkpointIdx ? 'font-semibold text-gray-900' : 'text-gray-500'}>{cp}</div>
                          {statusText && <div className="text-[10px] text-red-600 font-semibold mt-1 bg-red-50 p-1 rounded inline-block">{statusText}</div>}

                          {idx === checkpointIdx && !statusText && (
                              <div className="mt-2 space-y-1">
                                  {FIXTURE.items.filter(i => i.checkpointReqs.includes(cp)).map(reqItem => (
                                      <div key={reqItem.id} className="text-xs flex gap-2">
                                          <span>{reqItem.name}</span>
                                          {!itemsTakenOut.includes(reqItem.id) ?
                                              <button onClick={() => performTakeOut(reqItem.id)} className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded hover:bg-indigo-200">Take Out</button> :
                                              <button onClick={() => performRepack(reqItem.id)} className="text-[10px] bg-green-100 text-green-700 px-1 rounded hover:bg-green-200">Repack</button>
                                          }
                                      </div>
                                  ))}
                              </div>
                          )}
                        </div>
                      )
                  })}
                </div>

                {rehearsalLogs.length > 0 && (
                    <div className="mt-6 bg-gray-900 text-green-400 font-mono text-[10px] p-2 rounded h-32 overflow-y-auto">
                        {rehearsalLogs.map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                )}
              </div>
              {selectedForKeyboard && !isMobile && (
                  <div className="p-4 bg-yellow-50 border-t border-yellow-200 text-xs shadow-inner shrink-0">
                      <div className="font-bold text-yellow-800 mb-1 flex items-center gap-1">Keyboard Mode: {selectedForKeyboard.name}</div>
                      <ul className="text-yellow-700/80 space-y-1 mt-2">
                          <li>• Arrows to move</li>
                          <li>• R to Rotate 90°</li>
                          <li>• L to Swap Layer</li>
                          <li>• Click empty space to exit</li>
                      </ul>
                  </div>
              )}
            </aside>
        )}
      </main>
    </div>
  );
}
