// =========================================================================================
// ROUTE TYPES
// PURPOSE: TYPESCRIPT INTERFACES FOR MULTI-MODAL ROUTING SYSTEM
// =========================================================================================

import type { VehicleType } from "./types";

// ROUTE SEGMENT: REPRESENTS ONE PART OF A MULTI-MODAL ROUTE (WALK OR RIDE)
export interface RouteSegment {
  type: "walk" | "ride";
  vehicleType?: VehicleType; // ONLY FOR "ride" SEGMENTS
  start: {
    lat: number;
    lng: number;
    name: string;
  };
  end: {
    lat: number;
    lng: number;
    name: string;
  };
  distance_km: number; // DISTANCE FOR THIS SEGMENT
  duration_mins: number; // ESTIMATED DURATION FOR THIS SEGMENT
  fare?: number; // FARE FOR THIS SEGMENT (ONLY FOR RIDE SEGMENTS)
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [lng, lat] PAIRS FOR MAPBOX
  };
  instructions?: string[]; // STEP-BY-STEP INSTRUCTIONS FOR THIS SEGMENT
}

// CALCULATED ROUTE: COMPLETE MULTI-MODAL ROUTE FROM ORIGIN TO DESTINATION
export interface CalculatedRoute {
  id: string;
  tag: "FASTEST" | "CHEAPEST" | "SHORTEST"; // ROUTE OPTIMIZATION TAG
  segments: RouteSegment[]; // ARRAY OF SEGMENTS (WALK -> RIDE -> WALK)
  
  // AGGREGATED TOTALS
  totalDistance_km: number;
  totalDuration_mins: number;
  totalFare: number;
  totalFareDiscounted?: number; // FOR SENIOR/PWD DISCOUNTS
  
  // SUMMARY INFO
  vehicleTypes: VehicleType[]; // VEHICLE TYPES USED IN THIS ROUTE
  transferCount: number; // NUMBER OF TRANSFERS BETWEEN VEHICLES
}

// ROUTE CALCULATION INPUT
export interface RouteCalculationInput {
  origin: {
    lat: number;
    lng: number;
    name?: string;
  };
  destination: {
    lat: number;
    lng: number;
    name?: string;
  };
}

// ROUTE CALCULATION RESULT
export interface RouteCalculationResult {
  routes: CalculatedRoute[]; // ARRAY OF 3 ROUTES (FASTEST, CHEAPEST, SHORTEST)
  error?: string; // ERROR MESSAGE IF CALCULATION FAILED
}

// ACTIVE NAVIGATION STATE
export interface ActiveNavigationState {
  route: CalculatedRoute | null; // CURRENTLY ACTIVE ROUTE
  currentSegmentIndex: number; // INDEX OF CURRENT SEGMENT BEING NAVIGATED
  currentStepIndex: number; // INDEX OF CURRENT STEP WITHIN SEGMENT
  traveledPath: {
    type: "LineString";
    coordinates: [number, number][];
  } | null; // PATH ALREADY TRAVELED (FOR GRAY DISPLAY)
  remainingPath: CalculatedRoute | null; // REMAINING PATH TO TRAVEL
  isActive: boolean; // WHETHER NAVIGATION IS CURRENTLY ACTIVE
}

// ROUTE STEP: INDIVIDUAL INSTRUCTION WITHIN A ROUTE
export interface RouteStep {
  type: "walk" | "ride" | "arrive";
  instruction: string; // "Walk 200m to Terminal", "Ride Jeep to Stop X"
  distance_m?: number;
  duration_mins?: number;
  fare?: number;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
}

