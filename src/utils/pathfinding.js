import { campusLocations, campusEdges } from "../data/campusData";

// Helper to calculate Euclidean distance between two locations
export const calculateDistance = (locA, locB) => {
  if (!locA || !locB) return 0;
  const dx = locA.coordinates.x - locB.coordinates.x;
  const dy = locA.coordinates.y - locB.coordinates.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Build graph representation
const buildGraph = () => {
  const graph = {};

  // Initialize adjacency list for all locations
  campusLocations.forEach((loc) => {
    graph[loc.id] = [];
  });

  // Add bidirectional edges
  campusEdges.forEach(({ from, to }) => {
    const locA = campusLocations.find((l) => l.id === from);
    const locB = campusLocations.find((l) => l.id === to);

    if (locA && locB) {
      const weight = calculateDistance(locA, locB);
      // Ensure key exists (precaution)
      if (!graph[from]) graph[from] = [];
      if (!graph[to]) graph[to] = [];
      
      graph[from].push({ node: to, weight });
      graph[to].push({ node: from, weight });
    }
  });

  return graph;
};

// Dijkstra's algorithm to find shortest path
export const findRoute = (startId, endId) => {
  if (!startId || !endId) return null;
  if (startId === endId) {
    const loc = campusLocations.find((l) => l.id === startId);
    return {
      path: [loc],
      totalDistance: 0,
      estimatedMinutes: 0
    };
  }

  const graph = buildGraph();
  const distances = {};
  const previous = {};
  const queue = [];

  // Initialize distances
  Object.keys(graph).forEach((node) => {
    distances[node] = Infinity;
    previous[node] = null;
  });
  distances[startId] = 0;

  // Simple Priority Queue insertion
  const enqueue = (node, priority) => {
    queue.push({ node, priority });
    queue.sort((a, b) => a.priority - b.priority);
  };

  enqueue(startId, 0);

  while (queue.length > 0) {
    const { node: u } = queue.shift();

    if (u === endId) break; // Reached destination

    const neighbors = graph[u] || [];
    for (let neighbor of neighbors) {
      const { node: v, weight } = neighbor;
      const alt = distances[u] + weight;

      if (alt < distances[v]) {
        distances[v] = alt;
        previous[v] = u;
        enqueue(v, alt);
      }
    }
  }

  // Reconstruct path
  if (distances[endId] === Infinity) {
    return null; // Path not found
  }

  const pathIds = [];
  let curr = endId;
  while (curr !== null) {
    pathIds.unshift(curr);
    curr = previous[curr];
  }

  const pathLocations = pathIds.map((id) =>
    campusLocations.find((l) => l.id === id)
  );

  // Calculate walking time
  // Scale factor: 100 pixels = 1 minute walk (approx 80m)
  const totalDistance = distances[endId];
  const estimatedMinutes = Math.max(1, Math.round(totalDistance / 90));

  return {
    path: pathLocations,
    totalDistance,
    estimatedMinutes
  };
};
