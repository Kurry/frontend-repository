export const EXHIBITS = [
  { id: 'ex1', name: 'Dinosaur Skeletons', kind: 'exhibit', required: true, dwellRange: [15, 45], floor: 1, capacity: 50, prerequisites: [] },
  { id: 'ex2', name: 'Ancient Egypt', kind: 'exhibit', required: true, dwellRange: [20, 60], floor: 1, capacity: 40, prerequisites: [] },
  { id: 'ex3', name: 'Impressionist Art', kind: 'exhibit', required: false, dwellRange: [10, 30], floor: 2, capacity: 30, prerequisites: [] },
  { id: 'ex4', name: 'Modern Sculpture', kind: 'exhibit', required: false, dwellRange: [15, 40], floor: 2, capacity: 20, prerequisites: [] },
  { id: 'ex5', name: 'Space Exploration', kind: 'exhibit', required: true, dwellRange: [30, 90], floor: 3, capacity: 60, prerequisites: [] },
  { id: 'ex6', name: 'Gemstones', kind: 'exhibit', required: false, dwellRange: [10, 20], floor: 1, capacity: 15, prerequisites: [] },
  { id: 'ex7', name: 'Medieval Armor', kind: 'exhibit', required: false, dwellRange: [15, 35], floor: 2, capacity: 25, prerequisites: [] },
  { id: 'ex8', name: 'Botany Garden', kind: 'exhibit', required: false, dwellRange: [10, 30], floor: 3, capacity: 40, prerequisites: [] },
  { id: 'ex9', name: 'Local History', kind: 'exhibit', required: false, dwellRange: [20, 45], floor: 1, capacity: 35, prerequisites: [] },
  { id: 'ex10', name: 'Photography', kind: 'exhibit', required: false, dwellRange: [15, 30], floor: 2, capacity: 20, prerequisites: [] },
  { id: 'ex11', name: 'Aquarium', kind: 'exhibit', required: true, dwellRange: [30, 60], floor: 1, capacity: 80, prerequisites: [] },
  { id: 'ex12', name: 'Planetarium', kind: 'exhibit', required: true, dwellRange: [45, 45], floor: 3, capacity: 100, prerequisites: [] },
  { id: 'ex13', name: 'Insects', kind: 'exhibit', required: false, dwellRange: [10, 25], floor: 1, capacity: 15, prerequisites: [] },
  { id: 'ex14', name: 'Fossils', kind: 'exhibit', required: false, dwellRange: [15, 35], floor: 1, capacity: 25, prerequisites: ['ex1'] },
  { id: 'ex15', name: 'Interactive Science', kind: 'exhibit', required: true, dwellRange: [20, 60], floor: 2, capacity: 50, prerequisites: [] },
  { id: 'ex16', name: 'Classic Cars', kind: 'exhibit', required: false, dwellRange: [20, 40], floor: 1, capacity: 30, prerequisites: [] },
  { id: 'ex17', name: 'Music History', kind: 'exhibit', required: false, dwellRange: [15, 35], floor: 2, capacity: 25, prerequisites: [] },
  { id: 'ex18', name: 'Robotics', kind: 'exhibit', required: true, dwellRange: [25, 55], floor: 3, capacity: 45, prerequisites: [] },
  { id: 'ex19', name: 'Ocean Life', kind: 'exhibit', required: false, dwellRange: [20, 40], floor: 1, capacity: 35, prerequisites: ['ex11'] },
  { id: 'ex20', name: 'Aviation', kind: 'exhibit', required: false, dwellRange: [20, 50], floor: 3, capacity: 40, prerequisites: [] }
];

export const SPECIAL_NODES = [
  { id: 'entrance', name: 'Entrance', floor: 1, kind: 'entrance' },
  { id: 'exit', name: 'Exit', floor: 1, kind: 'exit' },
  { id: 'rest1', name: 'Rest Area (Floor 1)', floor: 1, kind: 'rest' },
  { id: 'rest2', name: 'Rest Area (Floor 2)', floor: 2, kind: 'rest' },
  { id: 'cafe', name: 'Café', floor: 3, kind: 'cafe' }
];

export const VISITORS = [
  { id: 'v1', name: 'Alice', needsStairs: false, needsElevator: false },
  { id: 'v2', name: 'Bob', needsStairs: false, needsElevator: true },
  { id: 'v3', name: 'Charlie', needsStairs: false, needsElevator: false },
  { id: 'v4', name: 'Dana (Minor)', needsStairs: false, needsElevator: false, protected: true } // Minor must be with an adult
];

export const VISIT_BUDGET = 210; // minutes
export const START_TIME = 9 * 60; // 9:00 AM

// deterministic paths between any two nodes.
export const getDistance = (n1, n2, subgroup = null) => {
    if (n1 === n2) return 0;
    // mock logic that takes subgroups, accessibility, and paths into account
    // For deterministic mock, we will use a naive 5 minutes per floor diff + 5 base
    const ex1 = [...EXHIBITS, ...SPECIAL_NODES].find(e => e.id === n1);
    const ex2 = [...EXHIBITS, ...SPECIAL_NODES].find(e => e.id === n2);
    if (!ex1 || !ex2) return 5;

    let dist = 5;
    dist += Math.abs(ex1.floor - ex2.floor) * 5;
    return dist;
}

export const TIMED_WINDOWS = [
    {id: 'w1', exhibitId: 'ex5', start: 10 * 60, end: 11 * 60, capacity: 10},
    {id: 'w2', exhibitId: 'ex12', start: 11 * 60 + 30, end: 12 * 60 + 30, capacity: 10},
    {id: 'w3', exhibitId: 'ex15', start: 13 * 60, end: 14 * 60, capacity: 10},
    {id: 'w4', exhibitId: 'ex18', start: 14 * 60 + 30, end: 15 * 60, capacity: 10},
];
