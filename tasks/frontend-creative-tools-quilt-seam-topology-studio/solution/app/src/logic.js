export const initialFixture = () => {
    const lots = Array.from({ length: 8 }, (_, i) => ({
        id: `lot-${i}`, name: `Fabric Lot ${i}`, area: 10000, used: 0, grain: i % 4,
        substitute: null
    }));
    lots[7].used = 10000; // one exhausted lot event

    const pieces = Array.from({ length: 286 }, (_, i) => {
        const row = Math.floor(i / 20);
        const col = i % 20;
        const x = col * 30;
        const y = row * 30;
        return {
            id: `piece-${i}`,
            blockId: `block-${i % 48}`,
            type: `type-${i % 14}`,
            finishedVertices: [{x:0, y:0}, {x:15, y:0}, {x:15, y:15}, {x:0, y:15}],
            cutVertices: [{x:-3, y:-3}, {x:18, y:-3}, {x:18, y:18}, {x:-3, y:18}],
            transform: { x, y, r: 0 },
            lotId: `lot-${i % 8}`,
            grain: i % 4,
            mismatch: i < 3 // 3 seeded mismatches
        };
    });

    const seams = Array.from({ length: 19 }, (_, i) => ({
        id: `seam-${i}`,
        family: `family-${i % 5}`,
        p1: `piece-${i}`, e1: 1,
        p2: `piece-${i+1}`, e2: 3,
        completed: false
    }));

    const assemblyGroups = Array.from({ length: 31 }, (_, i) => ({
        id: `group-${i}`,
        step: i,
        seams: [seams[i % 19].id],
        dependencies: i > 0 ? [`group-${i - 1}`] : [],
        completed: false
    }));

    return {
        lots, pieces, seams, assemblyGroups,
        clock: 0, events: [],
        branches: { main: { id: 'main', name: 'Main Branch' }, alt: { id: 'alt', name: 'Variant Branch' } },
        activeBranch: 'main',
        proofs: [],
        revisions: 0,
        isStale: false
    };
};

export function reducer(state, action) {
    let newState = { ...state };
    switch (action.type) {
        case 'JOIN_SEAM':
            newState.seams = [...state.seams, {
                id: `seam-${Date.now()}`,
                p1: action.p1, e1: action.e1, p2: action.p2, e2: action.e2,
                family: action.family, completed: false
            }];
            newState.revisions++;
            newState.isStale = true;
            break;
        case 'DETACH_SEAM':
            newState.seams = state.seams.filter(s => s.id !== action.seamId);
            newState.revisions++;
            newState.isStale = true;
            break;
        case 'ASSIGN_LOT':
            newState.pieces = state.pieces.map(p => p.id === action.pieceId ? { ...p, lotId: action.lotId } : p);
            newState.revisions++;
            newState.isStale = true;
            break;
        case 'TRANSFORM_PIECE':
            newState.pieces = state.pieces.map(p => p.id === action.pieceId ? { ...p, transform: { ...p.transform, ...action.transform } } : p);
            newState.revisions++;
            newState.isStale = true;
            break;
        case 'COMPLETE_JOIN':
            newState.seams = state.seams.map(s => s.id === action.seamId ? { ...s, completed: true } : s);
            newState.clock++;
            newState.events = [...state.events, { time: newState.clock, type: 'JOIN_COMPLETED', seamId: action.seamId }];
            newState.revisions++;
            newState.isStale = true;
            break;
        case 'UNPICK_JOIN':
            newState.seams = state.seams.map(s => s.id === action.seamId ? { ...s, completed: false } : s);
            newState.clock++;
            newState.events = [...state.events, { time: newState.clock, type: 'JOIN_UNPICKED', seamId: action.seamId }];
            newState.revisions++;
            newState.isStale = true;
            break;
        case 'PROOF':
            newState.proofs = [...state.proofs, { rev: state.revisions, date: new Date().toISOString(), hash: 'hash-' + state.revisions }];
            newState.isStale = false;
            break;
        case 'IMPORT':
            newState = action.payload;
            break;
        default:
            return state;
    }

    // Derived values computation
    newState.lots = newState.lots.map(l => ({ ...l, used: 0 }));
    newState.pieces.forEach(p => {
        const lot = newState.lots.find(l => l.id === p.lotId);
        if (lot) lot.used += 144;
    });

    return newState;
}
