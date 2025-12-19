// src/stores/useAppStore.ts
import { create } from "zustand";
import type { Terminal, TransportStop, UserLocation } from "../types/types";
import type { CalculatedRoute, ActiveNavigationState } from "../types/route";

export type MapFeature = Terminal | TransportStop;

export interface RouteInput {
  id: string | null;
  name: string;
  lat: number;
  lng: number;
  type: "terminal" | "place" | "custom" | "user" | "route";
  subtitle?: string;
}

interface AppState {
  // ADD: Terminals data
  terminals: Terminal[];
  setTerminals: (terminals: Terminal[]) => void;
  isLoadingTerminals: boolean;
  setLoadingTerminals: (loading: boolean) => void;

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

  isSearchRoutePageOpen: boolean;
  setSearchRoutePageOpen: (isOpen: boolean) => void;

  origin: RouteInput | null;
  destination: RouteInput | null;
  setRouteInput: (
    field: "origin" | "destination",
    input: RouteInput | null
  ) => void;
  swapRouteInputs: () => void;
  resetRouteInputs: () => void;

  // ROUTE CALCULATION STATES
  calculatedRoutes: CalculatedRoute[];
  setCalculatedRoutes: (routes: CalculatedRoute[]) => void;
  selectedRoute: CalculatedRoute | null;
  setSelectedRoute: (route: CalculatedRoute | null) => void;

  // ACTIVE NAVIGATION STATE
  activeNavigation: ActiveNavigationState;
  setActiveNavigation: (state: Partial<ActiveNavigationState>) => void;
  resetNavigation: () => void;

  // MAP PICKER STATES
  isMapPickerActive: boolean;
  mapPickerPinLocation: { lat: number; lng: number } | null;
  mapPickerTargetField: "origin" | "destination" | null;
  mapCenter: { lat: number; lng: number } | null;
  setMapCenter: (c: { lat: number; lng: number } | null) => void;
  mapNeedsRefresh: boolean;
  setMapNeedsRefresh: (needs: boolean) => void;
  savedRouteForm: {
    origin: RouteInput | null;
    destination: RouteInput | null;
  } | null;

  setMapPickerActive: (
    isActive: boolean,
    targetField?: "origin" | "destination" | null
  ) => void;
  setMapPickerPinLocation: (loc: { lat: number; lng: number } | null) => void;
  saveRouteForm: (
    origin: RouteInput | null,
    destination: RouteInput | null
  ) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // ADD: Initial terminals state
  terminals: [],
  setTerminals: (terminals) => set({ terminals }),
  isLoadingTerminals: false,
  setLoadingTerminals: (loading) => set({ isLoadingTerminals: loading }),

  userLocation: null,
  navPhase: "exploration",
  selectedFeature: null,
  isTerminalPageOpen: false,
  isSuggestRouteModalOpen: false,
  isSearchRoutePageOpen: false,

  origin: {
    id: "user_loc",
    name: "Current Location",
    lat: 0,
    lng: 0,
    type: "user",
    subtitle: "Your GPS Location (Auto-detected)",
  },
  destination: null,

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

  setMapPickerActive: (isActive, targetField) =>
    set((state) => ({
      isMapPickerActive: isActive,
      mapPickerTargetField: isActive
        ? targetField ?? state.mapPickerTargetField
        : targetField === undefined
        ? state.mapPickerTargetField
        : targetField,
    })),
  setMapPickerPinLocation: (loc) => set({ mapPickerPinLocation: loc }),
  mapCenter: null,
  setMapCenter: (c) => set({ mapCenter: c }),
  mapNeedsRefresh: false,
  setMapNeedsRefresh: (needs) => set({ mapNeedsRefresh: needs }),
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

  resetRouteInputs: () =>
    set((state) => ({
      origin: state.userLocation
        ? {
            id: "user_loc",
            name: "Current Location",
            lat: state.userLocation.lat,
            lng: state.userLocation.lng,
            type: "user",
            subtitle: "Your GPS Location (Auto-detected)",
          }
        : {
            id: "user_loc",
            name: "Current Location",
            lat: 0,
            lng: 0,
            type: "user",
            subtitle: "Your GPS Location (Auto-detected)",
          },
      destination: null,
      isMapPickerActive: false,
      mapPickerPinLocation: null,
      mapPickerTargetField: null,
      savedRouteForm: null,
    })),

  calculatedRoutes: [],
  setCalculatedRoutes: (routes) => set({ calculatedRoutes: routes }),
  selectedRoute: null,
  setSelectedRoute: (route) => set({ selectedRoute: route }),

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
