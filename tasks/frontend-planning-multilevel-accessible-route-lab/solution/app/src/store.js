import { create } from 'zustand'
import { DESTINATIONS, CAMPUS_NODES, CAMPUS_EDGES, CLOSURES } from './fixture'

// Helper for Dijkstra
const getShortestPath = (startId, endId, profile, startTime) => {
  const nodes = new Set(CAMPUS_NODES.map(n => n.id));
  const distances = new Map();
  const previous = new Map();
  const times = new Map();
  const usedEdges = new Map();

  for (const node of nodes) {
    distances.set(node, Infinity);
    times.set(node, 0);
  }
  distances.set(startId, 0);
  times.set(startId, startTime);

  const unvisited = new Set(nodes);

  while (unvisited.size > 0) {
    let current = null;
    let minDistance = Infinity;

    for (const node of unvisited) {
      if (distances.get(node) < minDistance) {
        minDistance = distances.get(node);
        current = node;
      }
    }

    if (current === null || current === endId) break;
    unvisited.delete(current);

    const currentTime = times.get(current);

    // Find valid neighbors
    const edges = CAMPUS_EDGES.filter(e => e.source === current || e.target === current);

    for (const edge of edges) {
      const neighbor = edge.source === current ? edge.target : edge.source;
      if (!unvisited.has(neighbor)) continue;

      // Check profile constraints
      if (!edge.profileAllowed.includes(profile)) continue;

      // Check closures
      const closure = CLOSURES.find(c => c.edgeId === edge.id);
      if (closure && currentTime >= closure.closedFrom && currentTime < closure.closedTo) {
        continue;
      }

      const weight = edge.distance * (edge.slope > 0 ? 1.5 : 1);
      const duration = edge.distance / 50 + (edge.type === 'elevator' ? 2 : 0); // basic time calculation
      const alt = distances.get(current) + weight;

      if (alt < distances.get(neighbor)) {
        distances.set(neighbor, alt);
        previous.set(neighbor, current);
        times.set(neighbor, currentTime + duration);
        usedEdges.set(neighbor, edge);
      }
    }
  }

  if (distances.get(endId) === Infinity) return null;

  const path = [];
  const segments = [];
  let current = endId;
  let totalDuration = 0;
  let totalDistance = 0;

  while (current !== startId) {
    const prev = previous.get(current);
    const edge = usedEdges.get(current);
    path.unshift(current);

    const segmentDuration = edge.distance / 50 + (edge.type === 'elevator' ? 2 : 0);
    segments.unshift({
      id: edge.id,
      from: prev,
      to: current,
      distance: edge.distance,
      duration: segmentDuration,
      type: edge.type || 'path',
      instruction: `Take ${edge.type || 'path'} from ${CAMPUS_NODES.find(n=>n.id===prev)?.label} to ${CAMPUS_NODES.find(n=>n.id===current)?.label}`
    });

    totalDuration += segmentDuration;
    totalDistance += edge.distance;
    current = prev;
  }
  path.unshift(startId);

  return { path, segments, duration: totalDuration, distance: totalDistance };
};

const computeFullRoute = (stops, profile, departureTime) => {
  if (stops.length < 2) return null;

  let currentDeparture = departureTime;
  const fullSegments = [];
  let fullDistance = 0;
  let fullDuration = 0;
  let allValid = true;

  for (let i = 0; i < stops.length - 1; i++) {
    const start = stops[i];
    const end = stops[i + 1];

    const route = getShortestPath(start.nodeId, end.nodeId, profile, currentDeparture);

    if (!route) {
      allValid = false;
      break;
    }

    fullSegments.push(...route.segments);
    fullDistance += route.distance;
    fullDuration += route.duration;

    // Add dwell time
    currentDeparture += route.duration + (end.dwell || 0);
  }

  if (!allValid) return null;

  return {
    segments: fullSegments,
    distance: Math.round(fullDistance),
    duration: Math.round(fullDuration),
    arrivalTime: currentDeparture
  };
};

export const useStore = create((set, get) => ({
  stops: [],
  profile: 'standard',
  departureTime: 9 * 60,
  waypoints: [],
  route: null,
  activeFloor: 1,
  activeBuilding: null,

  addStop: (destId) => set(state => {
    const dest = DESTINATIONS.find(d => d.id === destId);
    if (!dest) return state;
    const newStops = [...state.stops, {
      id: `stop-${Date.now()}`,
      order: state.stops.length + 1,
      nodeId: dest.nodeId,
      dwell: 0,
      label: dest.label
    }];
    return {
      stops: newStops,
      route: computeFullRoute(newStops, state.profile, state.departureTime)
    }
  }),

  updateStop: (id, updates) => set(state => {
    const newStops = state.stops.map(s => s.id === id ? { ...s, ...updates } : s);
    return {
      stops: newStops,
      route: computeFullRoute(newStops, state.profile, state.departureTime)
    }
  }),

  removeStop: (id) => set(state => {
    const newStops = state.stops.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }));
    return {
      stops: newStops,
      route: computeFullRoute(newStops, state.profile, state.departureTime)
    }
  }),

  setProfile: (profile) => set(state => ({
    profile,
    route: computeFullRoute(state.stops, profile, state.departureTime)
  })),

  setDepartureTime: (time) => set(state => ({
    departureTime: time,
    route: computeFullRoute(state.stops, state.profile, time)
  })),

  reorderStops: (oldIndex, newIndex) => set(state => {
    const newStops = [...state.stops];
    const [removed] = newStops.splice(oldIndex, 1);
    newStops.splice(newIndex, 0, removed);
    const ordered = newStops.map((s, i) => ({ ...s, order: i + 1 }));
    return {
      stops: ordered,
      route: computeFullRoute(ordered, state.profile, state.departureTime)
    }
  }),

  setActiveFloor: (floor, building) => set({ activeFloor: floor, activeBuilding: building }),

  loadSession: (sessionData) => set(state => ({
    ...sessionData,
    route: computeFullRoute(sessionData.stops, sessionData.profile, sessionData.departureTime)
  }))
}))
