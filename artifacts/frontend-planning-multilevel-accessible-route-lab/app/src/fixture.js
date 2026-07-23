export const CAMPUS_NODES = [
  // Outdoor nodes
  { id: 'n-out-1', type: 'outdoor', label: 'Main Gate', lat: 40.8075, lng: -73.9626, elevation: 0 },
  { id: 'n-out-2', type: 'outdoor', label: 'Plaza', lat: 40.8076, lng: -73.9624, elevation: 0 },
  { id: 'n-out-3', type: 'outdoor', label: 'South Lawn', lat: 40.8073, lng: -73.9622, elevation: 0 },
  { id: 'n-out-4', type: 'outdoor', label: 'Library Steps', lat: 40.8078, lng: -73.9625, elevation: 2 },
  { id: 'n-out-5', type: 'outdoor', label: 'Library Ramp', lat: 40.8079, lng: -73.9622, elevation: 2 },

  // Building 1 (Library) - 3 floors
  { id: 'n-b1-f1-1', type: 'indoor', building: 'Library', floor: 1, label: 'Lobby', lat: 40.8079, lng: -73.9625, elevation: 2 },
  { id: 'n-b1-f1-2', type: 'indoor', building: 'Library', floor: 1, label: 'Info Desk', lat: 40.8080, lng: -73.9625, elevation: 2 },
  { id: 'n-b1-f2-1', type: 'indoor', building: 'Library', floor: 2, label: 'Reading Room', lat: 40.8080, lng: -73.9625, elevation: 6 },
  { id: 'n-b1-f3-1', type: 'indoor', building: 'Library', floor: 3, label: 'Stacks', lat: 40.8080, lng: -73.9625, elevation: 10 },

  // Building 2 (Science) - 2 floors
  { id: 'n-b2-f1-1', type: 'indoor', building: 'Science', floor: 1, label: 'Atrium', lat: 40.8072, lng: -73.9615, elevation: 0 },
  { id: 'n-b2-f2-1', type: 'indoor', building: 'Science', floor: 2, label: 'Lab 201', lat: 40.8072, lng: -73.9615, elevation: 4 },

  // Connectors
  { id: 'n-b1-elev-f1', type: 'elevator', building: 'Library', floor: 1, label: 'Library Elev F1', lat: 40.8081, lng: -73.9624, elevation: 2 },
  { id: 'n-b1-elev-f2', type: 'elevator', building: 'Library', floor: 2, label: 'Library Elev F2', lat: 40.8081, lng: -73.9624, elevation: 6 },
  { id: 'n-b1-elev-f3', type: 'elevator', building: 'Library', floor: 3, label: 'Library Elev F3', lat: 40.8081, lng: -73.9624, elevation: 10 },
  { id: 'n-b1-stair-f1', type: 'stair', building: 'Library', floor: 1, label: 'Library Stair F1', lat: 40.8081, lng: -73.9626, elevation: 2 },
  { id: 'n-b1-stair-f2', type: 'stair', building: 'Library', floor: 2, label: 'Library Stair F2', lat: 40.8081, lng: -73.9626, elevation: 6 },

  { id: 'n-b2-elev-f1', type: 'elevator', building: 'Science', floor: 1, label: 'Science Elev F1', lat: 40.8073, lng: -73.9614, elevation: 0 },
  { id: 'n-b2-elev-f2', type: 'elevator', building: 'Science', floor: 2, label: 'Science Elev F2', lat: 40.8073, lng: -73.9614, elevation: 4 },
];

export const DESTINATIONS = [
  { id: 'dest-1', label: 'Main Gate', nodeId: 'n-out-1' },
  { id: 'dest-2', label: 'South Lawn', nodeId: 'n-out-3' },
  { id: 'dest-3', label: 'Library Stacks', nodeId: 'n-b1-f3-1' },
  { id: 'dest-4', label: 'Science Lab 201', nodeId: 'n-b2-f2-1' },
  { id: 'dest-5', label: 'Library Reading Room', nodeId: 'n-b1-f2-1' },
];

export const CAMPUS_EDGES = [
  // Outdoor
  { id: 'e-1', source: 'n-out-1', target: 'n-out-2', distance: 50, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-2', source: 'n-out-2', target: 'n-out-3', distance: 100, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-3', source: 'n-out-2', target: 'n-out-4', distance: 30, slope: 15, profileAllowed: ['standard'] }, // Steps
  { id: 'e-4', source: 'n-out-2', target: 'n-out-5', distance: 60, slope: 4, profileAllowed: ['standard', 'step-free', 'low-slope'] }, // Ramp
  { id: 'e-5', source: 'n-out-5', target: 'n-b1-f1-1', distance: 10, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-6', source: 'n-out-4', target: 'n-b1-f1-1', distance: 10, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-7', source: 'n-out-3', target: 'n-b2-f1-1', distance: 40, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },

  // Indoor
  { id: 'e-8', source: 'n-b1-f1-1', target: 'n-b1-f1-2', distance: 15, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },

  // Elevators & Stairs Connectors to Hallways
  { id: 'e-9', source: 'n-b1-f1-1', target: 'n-b1-elev-f1', distance: 5, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-10', source: 'n-b1-f1-1', target: 'n-b1-stair-f1', distance: 5, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-11', source: 'n-b1-elev-f2', target: 'n-b1-f2-1', distance: 5, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-12', source: 'n-b1-stair-f2', target: 'n-b1-f2-1', distance: 5, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-13', source: 'n-b1-elev-f3', target: 'n-b1-f3-1', distance: 5, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },

  // Vertical transitions
  { id: 'e-14', source: 'n-b1-elev-f1', target: 'n-b1-elev-f2', distance: 4, type: 'elevator', slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-15', source: 'n-b1-elev-f2', target: 'n-b1-elev-f3', distance: 4, type: 'elevator', slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-16', source: 'n-b1-stair-f1', target: 'n-b1-stair-f2', distance: 10, type: 'stair', slope: 30, profileAllowed: ['standard'] },

  { id: 'e-17', source: 'n-b2-f1-1', target: 'n-b2-elev-f1', distance: 5, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-18', source: 'n-b2-elev-f2', target: 'n-b2-f2-1', distance: 5, slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
  { id: 'e-19', source: 'n-b2-elev-f1', target: 'n-b2-elev-f2', distance: 4, type: 'elevator', slope: 0, profileAllowed: ['standard', 'step-free', 'low-slope'] },
];

export const CLOSURES = [
  // Elevators off after 18:00
  { edgeId: 'e-14', closedFrom: 18 * 60, closedTo: 24 * 60 },
  { edgeId: 'e-15', closedFrom: 18 * 60, closedTo: 24 * 60 },
  { edgeId: 'e-19', closedFrom: 18 * 60, closedTo: 24 * 60 },
  // Main gate opens at 09:00
  { edgeId: 'e-1', closedFrom: 0, closedTo: 9 * 60 },
];
