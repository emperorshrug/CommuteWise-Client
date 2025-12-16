// =========================================================================================
// DATA: MOCK SEARCH DATABASE
// FIXES: REPLACED 'any' WITH PROPER TYPESCRIPT TYPES.
// =========================================================================================

import type { ElementType } from "react";
import { MapPin, Warehouse, Route } from "lucide-react";

export type SearchResultType = "terminal" | "route" | "place";

export interface SearchResult {
  id: string | number;
  type: SearchResultType;
  title: string;
  subtitle: string;
  icon: ElementType; // Fixed: Was 'any'
  lat?: number;
  lng?: number;
  data?: Record<string, unknown>; // Fixed: Was 'any'
}

export const SEARCH_DATABASE: SearchResult[] = [
  // --- TERMINALS ---
  {
    id: "t1",
    type: "terminal",
    title: "Tandang Sora Terminal",
    subtitle: "Tricycle & Jeepney Hub • Visayas Ave",
    icon: Warehouse,
    lat: 14.676,
    lng: 121.0437,
    data: { id: 1, name: "Tandang Sora Terminal" },
  },
  {
    id: "t2",
    type: "terminal",
    title: "Philcoa Jeepney Stand",
    subtitle: "Major Transport Hub • Commonwealth",
    icon: Warehouse,
    lat: 14.6549,
    lng: 121.0553,
    data: { id: 2, name: "Philcoa Jeepney Stand" },
  },
  {
    id: "t3",
    type: "terminal",
    title: "SM North EDSA Terminal",
    subtitle: "Bus, UV, & Jeepney • EDSA",
    icon: Warehouse,
    lat: 14.6563,
    lng: 121.0286,
    data: { id: 3, name: "SM North EDSA Terminal" },
  },

  // --- ROUTES ---
  {
    id: "r1",
    type: "route",
    title: "Tandang Sora - QC Hall",
    subtitle: "Jeepney Route • Via Visayas Ave",
    icon: Route,
    lat: 14.676,
    lng: 121.0437,
    data: { terminalId: 1, routeId: 101 },
  },
  {
    id: "r2",
    type: "route",
    title: "Philcoa - UP Campus",
    subtitle: "Ikot Jeepney • UP Diliman",
    icon: Route,
    lat: 14.6549,
    lng: 121.0553,
    data: { terminalId: 2, routeId: 201 },
  },

  // --- PLACES (LANDMARKS) ---
  {
    id: "p1",
    type: "place",
    title: "Quezon City Hall",
    subtitle: "Government Building • Elliptical Road",
    icon: MapPin,
    lat: 14.6474,
    lng: 121.0519,
  },
  {
    id: "p2",
    type: "place",
    title: "UP Town Center",
    subtitle: "Shopping Mall • Katipunan",
    icon: MapPin,
    lat: 14.6496,
    lng: 121.076,
  },
  {
    id: "p3",
    type: "place",
    title: "Culiat High School",
    subtitle: "School • Tandang Sora",
    icon: MapPin,
    lat: 14.668,
    lng: 121.05,
  },
];
