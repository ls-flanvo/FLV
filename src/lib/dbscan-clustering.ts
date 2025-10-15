/**
 * DBSCAN Clustering Implementation for Flanvo
 * Density-Based Spatial Clustering of Applications with Noise
 * 
 * @module dbscan-clustering
 */

export interface Point {
  id: string;
  lat: number;
  lng: number;
  bookingId: string;
  metadata?: Record<string, any>;
}

export interface Cluster {
  id: number;
  points: Point[];
  centroid: { lat: number; lng: number };
}

export interface DBSCANResult {
  clusters: Cluster[];
  noise: Point[];
  stats: {
    totalPoints: number;
    clustersFound: number;
    noisePoints: number;
    averageClusterSize: number;
  };
}

enum PointStatus {
  UNVISITED = 'UNVISITED',
  VISITED = 'VISITED',
  NOISE = 'NOISE',
  CLUSTERED = 'CLUSTERED'
}

/**
 * Calcola la distanza haversine tra due coordinate geografiche
 * Formula: haversine distance in km
 * 
 * @param lat1 - Latitudine punto 1 (gradi)
 * @param lng1 - Longitudine punto 1 (gradi)
 * @param lat2 - Latitudine punto 2 (gradi)
 * @param lng2 - Longitudine punto 2 (gradi)
 * @returns Distanza in chilometri
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raggio della Terra in km
  
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Trova tutti i vicini di un punto entro il raggio eps
 * 
 * @param point - Punto di riferimento
 * @param points - Array di tutti i punti
 * @param eps - Raggio di ricerca in km (default 8.5)
 * @returns Array di indici dei punti vicini
 */
export function findNeighbors(
  pointIndex: number,
  points: Point[],
  eps: number
): number[] {
  const neighbors: number[] = [];
  const targetPoint = points[pointIndex];
  
  for (let i = 0; i < points.length; i++) {
    if (i === pointIndex) continue;
    
    const distance = haversineDistance(
      targetPoint.lat,
      targetPoint.lng,
      points[i].lat,
      points[i].lng
    );
    
    if (distance <= eps) {
      neighbors.push(i);
    }
  }
  
  return neighbors;
}

/**
 * Espande un cluster aggiungendo punti raggiungibili density-reachable
 * 
 * @param pointIndex - Indice del punto core
 * @param neighbors - Vicini del punto core
 * @param points - Array di tutti i punti
 * @param clusterId - ID del cluster corrente
 * @param eps - Raggio di ricerca
 * @param minSamples - Minimo numero di punti per essere core
 * @param visited - Array di status dei punti
 * @param clusterMap - Mappa punto -> cluster
 * @returns void (modifica visited e clusterMap in place)
 */
function expandCluster(
  pointIndex: number,
  neighbors: number[],
  points: Point[],
  clusterId: number,
  eps: number,
  minSamples: number,
  visited: PointStatus[],
  clusterMap: Map<number, number>
): void {
  clusterMap.set(pointIndex, clusterId);
  visited[pointIndex] = PointStatus.CLUSTERED;
  
  // Queue per BFS
  const queue = [...neighbors];
  
  while (queue.length > 0) {
    const currentIndex = queue.shift()!;
    
    // Se già visitato ma non clusterizzato, aggiungilo al cluster
    if (visited[currentIndex] === PointStatus.NOISE) {
      clusterMap.set(currentIndex, clusterId);
      visited[currentIndex] = PointStatus.CLUSTERED;
      continue;
    }
    
    // Se già clusterizzato, skip
    if (visited[currentIndex] !== PointStatus.UNVISITED) {
      continue;
    }
    
    visited[currentIndex] = PointStatus.VISITED;
    clusterMap.set(currentIndex, clusterId);
    visited[currentIndex] = PointStatus.CLUSTERED;
    
    // Trova i vicini di questo punto
    const currentNeighbors = findNeighbors(currentIndex, points, eps);
    
    // Se è un core point, aggiungi i suoi vicini alla queue
    if (currentNeighbors.length >= minSamples - 1) {
      for (const neighborIndex of currentNeighbors) {
        if (visited[neighborIndex] === PointStatus.UNVISITED || 
            visited[neighborIndex] === PointStatus.NOISE) {
          queue.push(neighborIndex);
        }
      }
    }
  }
}

/**
 * Calcola il centroide di un cluster
 * 
 * @param points - Punti del cluster
 * @returns Coordinate del centroide
 */
function calculateCentroid(points: Point[]): { lat: number; lng: number } {
  if (points.length === 0) {
    return { lat: 0, lng: 0 };
  }
  
  const sum = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng
    }),
    { lat: 0, lng: 0 }
  );
  
  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length
  };
}

/**
 * Implementazione algoritmo DBSCAN
 * 
 * @param points - Array di punti con coordinate
 * @param eps - Raggio massimo neighborhood in km (default: 8.5)
 * @param minSamples - Minimo punti per formare cluster (default: 2)
 * @returns Oggetto con clusters e noise points
 */
export function dbscan(
  points: Point[],
  eps: number = 8.5,
  minSamples: number = 2
): DBSCANResult {
  if (points.length === 0) {
    return {
      clusters: [],
      noise: [],
      stats: {
        totalPoints: 0,
        clustersFound: 0,
        noisePoints: 0,
        averageClusterSize: 0
      }
    };
  }
  
  // Inizializza strutture dati
  const visited: PointStatus[] = new Array(points.length).fill(PointStatus.UNVISITED);
  const clusterMap = new Map<number, number>();
  let clusterId = 0;
  
  // Main DBSCAN loop
  for (let i = 0; i < points.length; i++) {
    if (visited[i] !== PointStatus.UNVISITED) {
      continue;
    }
    
    visited[i] = PointStatus.VISITED;
    
    // Trova vicini
    const neighbors = findNeighbors(i, points, eps);
    
    // Se non ha abbastanza vicini, è noise
    if (neighbors.length < minSamples - 1) {
      visited[i] = PointStatus.NOISE;
      continue;
    }
    
    // È un core point, espandi il cluster
    expandCluster(i, neighbors, points, clusterId, eps, minSamples, visited, clusterMap);
    clusterId++;
  }
  
  // Organizza risultati
  const clusterArrays: Point[][] = Array.from({ length: clusterId }, () => []);
  const noise: Point[] = [];
  
  for (let i = 0; i < points.length; i++) {
    if (clusterMap.has(i)) {
      const cId = clusterMap.get(i)!;
      clusterArrays[cId].push(points[i]);
    } else {
      noise.push(points[i]);
    }
  }
  
  // Crea oggetti cluster con centroidi
  const clusters: Cluster[] = clusterArrays
    .filter(arr => arr.length > 0)
    .map((clusterPoints, idx) => ({
      id: idx,
      points: clusterPoints,
      centroid: calculateCentroid(clusterPoints)
    }));
  
  // Calcola statistiche
  const totalClusterPoints = clusters.reduce((sum, c) => sum + c.points.length, 0);
  const averageClusterSize = clusters.length > 0 
    ? totalClusterPoints / clusters.length 
    : 0;
  
  return {
    clusters,
    noise,
    stats: {
      totalPoints: points.length,
      clustersFound: clusters.length,
      noisePoints: noise.length,
      averageClusterSize: Math.round(averageClusterSize * 100) / 100
    }
  };
}

/**
 * Filtra clusters in base a vincoli business
 * - Rimuove clusters < 2 passeggeri
 * - Splitta clusters > 7 passeggeri
 * 
 * @param clusters - Clusters da filtrare
 * @returns Clusters validi
 */
export function filterClustersByBusinessRules(clusters: Cluster[]): Cluster[] {
  const validClusters: Cluster[] = [];
  let nextClusterId = clusters.length;
  
  for (const cluster of clusters) {
    const size = cluster.points.length;
    
    // Scarta cluster troppo piccoli
    if (size < 2) {
      continue;
    }
    
    // Cluster validi (2-7 pax)
    if (size <= 7) {
      validClusters.push(cluster);
      continue;
    }
    
    // Split cluster troppo grandi
    // Strategia: divide in gruppi da max 4 persone
    const maxGroupSize = 4;
    const numGroups = Math.ceil(size / maxGroupSize);
    const sortedPoints = [...cluster.points].sort((a, b) => a.lat - b.lat);
    
    for (let i = 0; i < numGroups; i++) {
      const start = i * maxGroupSize;
      const end = Math.min(start + maxGroupSize, size);
      const groupPoints = sortedPoints.slice(start, end);
      
      if (groupPoints.length >= 2) {
        validClusters.push({
          id: nextClusterId++,
          points: groupPoints,
          centroid: calculateCentroid(groupPoints)
        });
      }
    }
  }
  
  return validClusters;
}

/**
 * Test data generator per debugging
 */
export function generateTestData(): Point[] {
  return [
    // Cluster 1: Milano Centro (3 bookings)
    { id: '1', bookingId: 'BK001', lat: 45.4642, lng: 9.1900 },
    { id: '2', bookingId: 'BK002', lat: 45.4650, lng: 9.1910 },
    { id: '3', bookingId: 'BK003', lat: 45.4635, lng: 9.1895 },
    
    // Cluster 2: Milano Navigli (2 bookings)
    { id: '4', bookingId: 'BK004', lat: 45.4511, lng: 9.1753 },
    { id: '5', bookingId: 'BK005', lat: 45.4520, lng: 9.1760 },
    
    // Noise: Monza (troppo lontano)
    { id: '6', bookingId: 'BK006', lat: 45.5845, lng: 9.2744 },
  ];
}