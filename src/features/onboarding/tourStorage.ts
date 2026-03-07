const TOUR_KEY = "convex-db-chat.tour.v1";

type TourMap = Record<string, "pending" | "done" | "skipped">;

function loadTourMap(): TourMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TOUR_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TourMap;
  } catch {
    return {};
  }
}

function saveTourMap(value: TourMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOUR_KEY, JSON.stringify(value));
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

export function markTourPending(name: string) {
  const map = loadTourMap();
  map[normalizeName(name)] = "pending";
  saveTourMap(map);
}

export function getTourState(name: string): "pending" | "done" | "skipped" | null {
  const value = loadTourMap()[normalizeName(name)];
  return value ?? null;
}

export function markTourDone(name: string) {
  const map = loadTourMap();
  map[normalizeName(name)] = "done";
  saveTourMap(map);
}

export function markTourSkipped(name: string) {
  const map = loadTourMap();
  map[normalizeName(name)] = "skipped";
  saveTourMap(map);
}
