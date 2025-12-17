import { create } from "zustand";
import type { Terminal, TransportStop, UserLocation } from "../types/types";
import type { CalculatedRoute, ActiveNavigationState } from "../types/route";

export type MapFeature = Terminal | TransportStop;

// --- EXPORTED ROUTE INPUT TYPE ---
export interface RouteInput {
  id: string | null;
  name: string;
  lat: number;
  lng: number;
  // FIX: Added 'route' to the possible types
  type: "terminal" | "place" | "custom" | "user" | "route";
  subtitle?: string; // ADDED: Optional subtitle/address for favorites
}

interface AppState {
  userLocation: UserLocation | null;
  setUserLocation: (loc: UserLocation) => void;

  navPhase: "exploration" | "selection" | "navigation";
  setNavPhase: (phase: "exploration" | "selection" | "navigation") => void;

  selectedFeature: MapFeature | null;
  selectFeature: (feature: MapFeature | null) => void;

  isTerminalPageOpen: boolean;
  openTerminalPage: (isOpen: boolean) => void;

  isSuggestRouteModalOpen: boolean;
  setSuggestRouteModalOpen: (isOpen: boolean) => void;

  // NEW: ROUTE SEARCH STATES
  isSearchRoutePageOpen: boolean;
  setSearchRoutePageOpen: (isOpen: boolean) => void;

  origin: RouteInput | null;
  destination: RouteInput | null;
  setRouteInput: (
    field: "origin" | "destination",
    input: RouteInput | null
  ) => void;
  swapRouteInputs: () => void;

  // ROUTE CALCULATION STATES
  calculatedRoutes: CalculatedRoute[];
  setCalculatedRoutes: (routes: CalculatedRoute[]) => void;
  selectedRoute: CalculatedRoute | null;
  setSelectedRoute: (route: CalculatedRoute | null) => void;

  // ACTIVE NAVIGATION STATE
  activeNavigation: ActiveNavigationState;
  setActiveNavigation: (state: Partial<ActiveNavigationState>) => void;
  resetNavigation: () => void;

  // NEW: MAP PICKER STATES (for Select on Map feature)
  isMapPickerActive: boolean;
  mapPickerPinLocation: { lat: number; lng: number } | null;
  mapPickerTargetField: "origin" | "destination" | null;
  // Stores origin/destination before going to map, to restore on "Go Back"
  savedRouteForm: {
    origin: RouteInput | null;
    destination: RouteInput | null;
  } | null;

  setMapPickerActive: (
    isActive: boolean,
    targetField: "origin" | "destination" | null
  ) => void;
  setMapPickerPinLocation: (loc: { lat: number; lng: number } | null) => void;
  saveRouteForm: (
    origin: RouteInput | null,
    destination: RouteInput | null
  ) => void;
}

export const useAppStore = create<AppState>((set) => ({
  userLocation: null,
  navPhase: "exploration",
  selectedFeature: null,
  isTerminalPageOpen: false,
  isSuggestRouteModalOpen: false,
  isSearchRoutePageOpen: false,

  origin: {
    id: "user_loc", // Added ID
    name: "Current Location",
    lat: 0,
    lng: 0,
    type: "user",
    subtitle: "Your GPS Location (Auto-detected)", // Added subtitle
  },
  destination: null,

  // NEW MAP PICKER STATES
  isMapPickerActive: false,
  mapPickerPinLocation: null,
  mapPickerTargetField: null,
  savedRouteForm: null,

  setUserLocation: (loc) =>
    set({
      userLocation: loc,
      origin: {
        id: "user_loc",
        name: "Current Location",
        lat: loc.lat,
        lng: loc.lng,
        type: "user",
        subtitle: "Your GPS Location (Auto-detected)",
      },
    }),
  setNavPhase: (phase) => set({ navPhase: phase }),

  selectFeature: (feature) =>
    set({
      selectedFeature: feature,
      navPhase: feature ? "selection" : "exploration",
    }),

  openTerminalPage: (isOpen) => set({ isTerminalPageOpen: isOpen }),
  setSuggestRouteModalOpen: (isOpen) =>
    set({ isSuggestRouteModalOpen: isOpen }),
  setSearchRoutePageOpen: (isOpen) => set({ isSearchRoutePageOpen: isOpen }),

  // NEW MAP PICKER ACTIONS
  setMapPickerActive: (isActive, targetField) =>
    set({
      isMapPickerActive: isActive,
      mapPickerTargetField: isActive ? targetField : null,
    }),
  setMapPickerPinLocation: (loc) => set({ mapPickerPinLocation: loc }),
  saveRouteForm: (origin, destination) =>
    set({ savedRouteForm: { origin, destination } }),

  setRouteInput: (field, input) =>
    set(() => ({
      [field]: input,
    })),

  swapRouteInputs: () =>
    set((state) => ({
      origin: state.destination,
      destination: state.origin,
    })),

  // ROUTE CALCULATION STATES
  calculatedRoutes: [],
  setCalculatedRoutes: (routes) => set({ calculatedRoutes: routes }),
  selectedRoute: null,
  setSelectedRoute: (route) => set({ selectedRoute: route }),

  // ACTIVE NAVIGATION STATE
  activeNavigation: {
    route: null,
    currentSegmentIndex: 0,
    currentStepIndex: 0,
    traveledPath: null,
    remainingPath: null,
    isActive: false,
  },
  setActiveNavigation: (state) =>
    set((prev) => ({
      activeNavigation: { ...prev.activeNavigation, ...state },
    })),
  resetNavigation: () =>
    set({
      activeNavigation: {
        route: null,
        currentSegmentIndex: 0,
        currentStepIndex: 0,
        traveledPath: null,
        remainingPath: null,
        isActive: false,
      },
    }),
}));
