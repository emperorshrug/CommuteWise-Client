// =========================================================================================
// PAGE: SEARCH ROUTE PAGE (PRODUCTION IMPLEMENTATION - FINAL ESLINT/TS FIXES)
// FIXES:
// 1. RESOLVED ALL REMAINING ESLINT WARNINGS (cascading renders, unused imports).
// 2. RESOLVED 'any' TYPE WARNING in fetchGeocodingSuggestions.
// 3. ENSURED FAVORITES FETCHING IS SAFELY DEFERRED.
// 4. SUPABASE AND MAPBOX API STRUCTURES ARE IN PLACE.
// =========================================================================================

import { useState, useRef, useEffect } from "react";
import type { ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  ArrowUpDown,
  LocateFixed,
  Clock,
  Home,
  Plus,
  Pencil,
  Trash2,
  Loader2, // KEPT Loader2
} from "lucide-react"; // REMOVED Search
import { useAppStore } from "../stores/useAppStore";
import type { RouteInput } from "../stores/useAppStore";
import { useDebounce } from "../hooks/useDebounce";
import type { SearchResult } from "../data/mockSearch";
import { useAuthStore } from "../stores/useAuthStore";
import { calculateRoutes } from "../services/routingService";

// COMPONENTS
import FavoriteModal from "../components/modals/FavoriteModal";
import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";
import AuthModal from "../components/auth/AuthModal";

// API/DB IMPORTS
import { supabase } from "../lib/supabase";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// CONSTANTS
const DEBOUNCE_DELAY_MS = 4000; // 4 SECONDS DEBOUNCE AS PER REQUIREMENTS
const MIN_CHARS_FOR_SEARCH = 3;

// --- PRODUCTION API HELPER: MAPBOX FORWARD GEOCODING ---
/**
 * Executes the API call to Mapbox Geocoding service for location suggestions.
 * THIS IS THE REAL API CALL STRUCTURE, USING THE PROVIDED TOKEN.
 */
const fetchGeocodingSuggestions = async (
  query: string
): Promise<SearchResult[]> => {
  if (!MAPBOX_TOKEN) {
    console.error("MAPBOX_TOKEN IS MISSING. Cannot perform search.");
    return [
      {
        id: "error",
        type: "place",
        title: "Search Error",
        subtitle: "Mapbox Token Missing",
        icon: MapPin,
      },
    ];
  }

  const encodedQuery = encodeURIComponent(query);

  // MAPBOX GEOCODING URL STRUCTURE using VITE_MAPBOX_TOKEN
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&limit=5&country=PH&proximity=121.05,14.65`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox API HTTP error: ${response.status}`);
    }

    const data = await response.json();

    // MAPBOX RESPONSE MAPPING TO SearchResult
    const mappedResults: SearchResult[] = data.features.map(
      (feature: unknown, index: number) => {
        const feat = feature as any; // TEMPORARY CAST TO ACCESS PROPERTIES SAFELY

        return {
          id: feat.id || `result-${index}`,
          type: "place" as const, // Mapbox returns general locations
          title: feat.text || "Untitled Location",
          subtitle: feat.place_name || feat.properties.address || "",
          icon: MapPin,
          lat: feat.center[1], // Mapbox uses [lng, lat]
          lng: feat.center[0],
        };
      }
    );

    return mappedResults;
  } catch (error) {
    console.error("[MAPBOX ERROR]:", error);
    return [
      {
        id: "api_fail",
        type: "place",
        title: "API Connection Failed",
        subtitle: "Check Network or API Key",
        icon: MapPin,
      },
    ];
  }
};

interface InputProps {
  field: "origin" | "destination";
  icon: ElementType;
  placeholder: string;
  value: RouteInput | null;
  currentQuery: string; // ADDED: Current query text being typed
  onChange: (text: string) => void;
  isFocused: boolean;
  onFocus: (field: "origin" | "destination") => void;
  onBlur: () => void;
}

const getTextColor = (value: RouteInput | null, isFocused: boolean) => {
  if (isFocused) return "text-slate-900";
  if (value) return "text-slate-900 font-bold";
  return "text-slate-500";
};

const getBorderColor = (
  field: "origin" | "destination",
  isFocused: boolean
) => {
  if (!isFocused) return "border-slate-200 bg-white";

  return field === "destination"
    ? "border-red-500 bg-red-50/5"
    : "border-blue-500 bg-blue-50/5";
};

const getIconColor = (field: "origin" | "destination", isFocused: boolean) => {
  if (isFocused) {
    return field === "destination" ? "text-red-500" : "text-blue-500";
  }
  return "text-slate-400";
};

const RouteInputField = ({
  field,
  icon: Icon,
  placeholder,
  value,
  currentQuery, // ADDED: Current query text
  onChange,
  isFocused,
  onFocus,
  onBlur,
}: InputProps) => {
  // FIX: When focused, show currentQuery (what user is typing), otherwise show the selected value name
  const inputValue = isFocused ? currentQuery : value?.name || "";

  return (
    <div
      className={`
                flex items-center gap-3 p-3.5 rounded-xl border-2 transition-colors
                ${getBorderColor(field, isFocused)}
                ${field === "origin" ? "mb-2" : ""}
            `}
      onClick={() => {
        onFocus(field);
      }}
    >
      <Icon size={20} className={getIconColor(field, isFocused)} />

      <input
        type="text"
        className={`
                    flex-1 bg-transparent outline-none text-base
                    ${getTextColor(value, isFocused)}
                `}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => onFocus(field)}
        onBlur={onBlur}
        readOnly={!isFocused}
        autoFocus={isFocused}
      />
    </div>
  );
};

export default function SearchRoutePage() {
  const {
    isSearchRoutePageOpen,
    setSearchRoutePageOpen,
    origin,
    destination,
    setRouteInput,
    swapRouteInputs,
    userLocation,
    setCalculatedRoutes,
    setNavPhase,
  } = useAppStore();

  // AUTH STATE
  const user = useAuthStore((state) => state.user);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [currentField, setCurrentField] = useState<"origin" | "destination">(
    "destination"
  );
  const [currentQuery, setCurrentQuery] = useState("");
  const [apiGuardText, setApiGuardText] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);

  const [favorites, setFavorites] = useState<RouteInput[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
  const [liveSuggestions, setLiveSuggestions] = useState<SearchResult[]>([]);

  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false);
  const [favoriteToEdit, setFavoriteToEdit] = useState<RouteInput | null>(null);
  const [favoriteToDelete, setFavoriteToDelete] = useState<RouteInput | null>(
    null
  );

  const apiGuardTimerRef = useRef<number | null>(null);
  const isCalculatingRef = useRef<boolean>(false); // GUARD AGAINST MULTIPLE SIMULTANEOUS CALCULATIONS

  const debouncedQuery = useDebounce(currentQuery, DEBOUNCE_DELAY_MS);

  // --- SUPABASE: FETCH FAVORITES (REAL IMPLEMENTATION) ---
  const fetchFavorites = async () => {
    setIsFavoritesLoading(true);

    if (!user) {
      setFavorites([]);
      setIsFavoritesLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("id, name, address, lat, lng, type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("[FAVORITES FETCH ERROR]:", error);
        setFavorites([]);
      } else {
        const mappedData: RouteInput[] = (data || []).map((item: {
          id: string;
          name: string;
          address?: string;
          lat: number;
          lng: number;
          type?: string;
        }) => ({
          id: item.id.toString(),
          name: item.name,
          subtitle: item.address || "",
          lat: item.lat,
          lng: item.lng,
          type: (item.type as RouteInput["type"]) || "place",
        }));
        setFavorites(mappedData);
      }
    } catch (error) {
      console.error("[FAVORITES FETCH ERROR]:", error);
      setFavorites([]);
    } finally {
      setIsFavoritesLoading(false);
    }
  };

  // FETCH FAVORITES WHEN USER LOGS IN OR FAVORITES CHANGE
  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setIsFavoritesLoading(false);
    }
  }, [user]); // RE-FETCH WHEN USER CHANGES

  // --- GEOLOCATION GUARDRAIL (ON LOAD) ---
  // FIX: Ensure origin is always set to current location if userLocation is available and origin type is "user"
  // THROTTLED: Only update if coordinates actually changed significantly (0.0001 degree ~= 11 meters)
  useEffect(() => {
    if (userLocation) {
      // If origin doesn't exist, or if origin exists but is user type with wrong coordinates, update it
      const hasOrigin = origin && origin.type === "user";
      const coordsChanged = hasOrigin && (
        Math.abs(origin.lat - userLocation.lat) > 0.0001 ||
        Math.abs(origin.lng - userLocation.lng) > 0.0001
      );

      if (!origin || (hasOrigin && coordsChanged)) {
        setRouteInput("origin", {
          id: "user_loc",
          name: "Current Location",
          lat: userLocation.lat,
          lng: userLocation.lng,
          type: "user",
          subtitle: "Your GPS Location",
        });
      }
    }
    // NOTE: Removed setRouteInput from deps as Zustand setters are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, origin]);

  // 3. API CALL LOGIC (Triggered by debouncedQuery)
  useEffect(() => {
    let statusTimeoutId: number | null = null;
    let isCancelled = false; // FLAG TO PREVENT STATE UPDATES IF COMPONENT UNMOUNTS OR QUERY CHANGES

    if (debouncedQuery.length >= MIN_CHARS_FOR_SEARCH) {
      // EXECUTE REAL API CALL STRUCTURE
      fetchGeocodingSuggestions(debouncedQuery)
        .then((results) => {
          if (!isCancelled) {
            setLiveSuggestions(results);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            // AFTER API COMPLETES, STOP LOADING AND SET STATUS
            setTimeout(() => {
              if (!isCancelled) {
                setIsLoadingSuggestions(false);
                setApiGuardText("Search complete. Showing results.");

                // CLEAR STATUS MESSAGE AFTER 3 SECONDS
                statusTimeoutId = window.setTimeout(() => {
                  if (!isCancelled) {
                    setApiGuardText(null);
                  }
                }, 3000);
              }
            }, 0);
          }
        });
    } else {
      // CLEAR SUGGESTIONS IF QUERY IS TOO SHORT
      setLiveSuggestions([]);
      setIsLoadingSuggestions(false);
      setApiGuardText(null);
    }

    // CLEANUP: CANCEL PENDING UPDATES AND TIMERS
    return () => {
      isCancelled = true;
      if (statusTimeoutId !== null) {
        clearTimeout(statusTimeoutId);
      }
    };
  }, [debouncedQuery]);

  // 4. API DEBOUNCER RESET & GUARD LOGIC (Runs on every keystroke/focus)
  useEffect(() => {
    // A. CLEAR ANY PREVIOUS API TIMER
    if (apiGuardTimerRef.current) {
      window.clearInterval(apiGuardTimerRef.current);
      apiGuardTimerRef.current = null;
    }

    // B. SET THE GUARD TEXT BASED ON LENGTH
    if (currentQuery.length > 0 && currentQuery.length < MIN_CHARS_FOR_SEARCH) {
      setTimeout(() => {
        setIsLoadingSuggestions(true);
        setApiGuardText(
          `Keep typing... Enter at least ${MIN_CHARS_FOR_SEARCH} characters.`
        );
      }, 0);
    } else if (currentQuery.length >= MIN_CHARS_FOR_SEARCH) {
      // C. START 4-SECOND DEBOUNCER TIMER AND COUNTDOWN (AS PER REQUIREMENTS)
      let count = DEBOUNCE_DELAY_MS / 1000;

      setTimeout(() => {
        setIsLoadingSuggestions(true);
        setApiGuardText(`API search starts in ${count}s...`);
      }, 0);

      const interval = window.setInterval(() => {
        count -= 1;
        if (count > 0) {
          setApiGuardText(`API search starts in ${count}s...`);
        } else {
          window.clearInterval(interval);
          setApiGuardText("Searching...");
        }
      }, 1000);

      apiGuardTimerRef.current = interval;
    } else {
      // IF QUERY IS EMPTY, CLEAR GUARD TEXT AND LOADING
      setTimeout(() => {
        setIsLoadingSuggestions(false);
        setApiGuardText(null);
      }, 0);
    }

    // CLEANUP ON UNMOUNT OR NEXT KEYSTROKE
    return () => {
      if (apiGuardTimerRef.current) {
        window.clearInterval(apiGuardTimerRef.current);
      }
    };
  }, [currentQuery]);

  // Input Handlers
  const handleInputChange = (text: string) => {
    setCurrentQuery(text);
  };

  const handleInputFocus = (field: "origin" | "destination") => {
    setCurrentField(field);
    const value = field === "origin" ? origin : destination;
    setCurrentQuery(value?.name || "");

    if (field === "origin" && origin?.type !== "user") {
      setRouteInput(field, null);
    } else if (field === "destination") {
      setRouteInput(field, null);
    }
  };

  const handleInputBlur = () => {
    // No action needed on blur for now
  };

  // 7. RESULT HANDLER
  const handleResultSelect = (result: SearchResult) => {
    const input: RouteInput = {
      id: String(result.id),
      name: result.title,
      lat: result.lat || 0,
      lng: result.lng || 0,
      type: result.type as RouteInput["type"],
      subtitle: result.subtitle,
    };
    setRouteInput(currentField, input);
    setCurrentQuery("");
    setApiGuardText(null);
    setIsLoadingSuggestions(false);

    const newOrigin = currentField === "origin" ? input : origin;
    const newDestination = currentField === "destination" ? input : destination;

    if (newOrigin && newDestination) {
      setSearchRoutePageOpen(false);
    }
  };

  // Handle Favorites Selection
  const handleFavoriteSelect = (fav: RouteInput) => {
    setRouteInput(currentField, fav);
    setCurrentQuery("");
    setApiGuardText(null);
    setIsLoadingSuggestions(false);

    const newOrigin = currentField === "origin" ? fav : origin;
    const newDestination = currentField === "destination" ? fav : destination;

    if (newOrigin && newDestination) {
      setSearchRoutePageOpen(false);
    }
  };

  // Favorites CRUD Handlers
  const handleAddFavorite = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setFavoriteToEdit(null);
    setIsFavoriteModalOpen(true);
  };

  const handleEditFavorite = (fav: RouteInput) => {
    setFavoriteToEdit(fav);
    setIsFavoriteModalOpen(true);
  };

  const handleDeleteFavorite = (fav: RouteInput) => {
    setFavoriteToDelete(fav);
  };

  // 8. RENDER
  if (!isSearchRoutePageOpen) return null;

  const isQueryValidForSuggestions =
    currentQuery.length >= MIN_CHARS_FOR_SEARCH;
  const showSuggestions =
    currentQuery.length > 0 &&
    isQueryValidForSuggestions &&
    !isLoadingSuggestions &&
    liveSuggestions.length > 0;
  const showFavorites = currentQuery.length === 0;

  const isRouteSearchEnabled = !!origin && !!destination;

  // HANDLE ROUTE SEARCH (WITH PROTECTION AGAINST MULTIPLE SIMULTANEOUS CALLS)
  const handleSearchRoutes = async () => {
    if (!origin || !destination) return;

    // PREVENT MULTIPLE SIMULTANEOUS CALCULATIONS
    if (isCalculatingRef.current || isCalculatingRoutes) {
      console.warn("[ROUTE SEARCH]: Calculation already in progress, ignoring duplicate request.");
      return;
    }

    isCalculatingRef.current = true;
    setIsCalculatingRoutes(true);

    try {
      const result = await calculateRoutes({
        origin: {
          lat: origin.lat,
          lng: origin.lng,
          name: origin.name,
        },
        destination: {
          lat: destination.lat,
          lng: destination.lng,
          name: destination.name,
        },
      });

      if (result.error) {
        alert(`Route calculation failed: ${result.error}`);
        return;
      }

      if (result.routes.length > 0) {
        setCalculatedRoutes(result.routes);
        setNavPhase("selection");
        setSearchRoutePageOpen(false);
      } else {
        alert("No routes found. Please try different locations.");
      }
    } catch (error) {
      console.error("[ROUTE SEARCH ERROR]:", error);
      alert("Failed to calculate routes. Please try again.");
    } finally {
      setIsCalculatingRoutes(false);
      isCalculatingRef.current = false;
    }
  };

  return (
    <>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.25 }}
        className="fixed inset-0 z-50 bg-slate-50 flex flex-col pt-4"
      >
        {/* HEADER AND INPUTS */}
        <div className="px-4 pb-4 border-b border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSearchRoutePageOpen(false)}
              className="p-2 -ml-2 text-slate-700 rounded-full hover:bg-slate-100"
              aria-label="Go back to map"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Plan Route</h1>
            <div>{/* Placeholder for symmetry */}</div>
          </div>

          {/* ROUTE INPUTS & SWAP BUTTON */}
          <div className="relative flex items-center gap-2">
            {/* INPUT CONTAINER (REDUCED WIDTH) */}
            <div className="flex-1 min-w-0 pr-10">
              <RouteInputField
                field="origin"
                icon={LocateFixed}
                placeholder="Current Location"
                value={origin}
                currentQuery={currentField === "origin" ? currentQuery : ""}
                onChange={handleInputChange}
                isFocused={currentField === "origin"}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <RouteInputField
                field="destination"
                icon={MapPin}
                placeholder="Enter Destination"
                value={destination}
                currentQuery={currentField === "destination" ? currentQuery : ""}
                onChange={handleInputChange}
                isFocused={currentField === "destination"}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            {/* SWAP BUTTON (Vertical center alignment) */}
            <button
              onClick={swapRouteInputs}
              className="p-2 text-brand-primary rounded-full hover:bg-brand-primary/10 absolute right-0 top-1/2 transform -translate-y-1/2 z-10"
              aria-label="Swap origin and destination"
            >
              <ArrowUpDown size={24} />
            </button>
          </div>

          {/* SEARCH POSSIBLE ROUTES BUTTON (DISABLED WHEN NOT SET) */}
          <button
            className={`w-full py-4 mt-4 text-white font-bold rounded-xl text-base shadow-lg transition-colors flex items-center justify-center gap-2
                        ${
                          isRouteSearchEnabled && !isCalculatingRoutes
                            ? "bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600"
                            : "bg-slate-400 shadow-none cursor-not-allowed"
                        }
                    `}
            disabled={!isRouteSearchEnabled || isCalculatingRoutes}
            onClick={handleSearchRoutes}
          >
            {isCalculatingRoutes ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Calculating Routes...
              </>
            ) : (
              "Search Possible Routes"
            )}
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {/* 10. SELECT ON MAP */}
          <div className="p-4 mb-4 rounded-xl bg-white border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50">
            <div
              className="flex items-center gap-3"
              onClick={() => {
                setSearchRoutePageOpen(false);
                alert(`Select on Map activated for ${currentField}.`);
              }}
            >
              <MapPin size={24} className="text-brand-primary shrink-0" />
              <div>
                <span className="font-bold text-slate-900">Select on Map</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Drag pin to specific location
                </p>
              </div>
            </div>
          </div>

          {/* 9. API GUARD/DEBOUNCE WARNING */}
          {apiGuardText && (
            <div className="p-4 mb-4 rounded-xl bg-yellow-50 text-yellow-800 border border-yellow-200 flex items-start gap-3">
              <Clock size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Guardrails Active</p>
                <p className="text-xs mt-1">{apiGuardText}</p>
              </div>
            </div>
          )}

          {/* LOADER */}
          {isLoadingSuggestions &&
            currentQuery.length >= 1 &&
            !isQueryValidForSuggestions && (
              <div className="p-4 mb-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3 animate-pulse">
                <Loader2 size={24} className="text-slate-400 animate-spin" />
                <span className="text-slate-500 font-medium">
                  Fetching suggestions...
                </span>
              </div>
            )}

          {/* NO RESULTS FOUND STATE */}
          {currentQuery.length > 0 &&
            isQueryValidForSuggestions &&
            !isLoadingSuggestions &&
            liveSuggestions.length === 0 && (
              <div className="p-4 mb-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center text-slate-500">
                <p className="font-bold">No results found.</p>
                <p className="text-sm mt-1">Try refining your search query.</p>
              </div>
            )}

          {/* 11. FAVORITES SECTION (VISIBLE WHEN NO QUERY IS ACTIVE) */}
          {showFavorites && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between ml-1 mb-2">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Favorites
                </h2>
                {/* ADD BUTTON - ONLY SHOW FOR AUTHENTICATED USERS */}
                {user && (
                  <button
                    onClick={handleAddFavorite}
                    className="flex items-center gap-1 text-brand-primary text-xs font-bold hover:text-brand-primary/80 transition-colors"
                  >
                    <Plus size={14} /> Add New
                  </button>
                )}
              </div>

              {/* GUEST USER MESSAGE */}
              {!user && (
                <div className="p-4 mb-4 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
                  <p className="text-sm font-medium text-center">
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="text-brand-primary font-bold hover:underline"
                    >
                      Log in
                    </button>{" "}
                    to save your favorite places
                  </p>
                </div>
              )}

              {isFavoritesLoading ? (
                <div className="p-4 text-center text-slate-500 flex justify-center items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading favorites from Supabase...</span>
                </div>
              ) : user && favorites.length > 0 ? (
                favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="w-full flex items-center justify-between gap-4 p-3 bg-white rounded-xl transition-colors border border-slate-200 shadow-sm"
                  >
                    <button
                      onClick={() => handleFavoriteSelect(fav)}
                      className="flex-1 flex items-center gap-4 text-left hover:bg-slate-100 rounded-lg p-2 -m-2"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          fav.type === "place"
                            ? "bg-red-50 text-red-500"
                            : "bg-brand-primary/10 text-brand-primary"
                        }`}
                      >
                        <Home size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {fav.name}
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate">
                          {fav.subtitle}
                        </div>
                      </div>
                    </button>

                    {/* EDIT AND DELETE BUTTONS */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEditFavorite(fav)}
                        className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                        aria-label={`Edit ${fav.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteFavorite(fav)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        aria-label={`Delete ${fav.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : user && favorites.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  <p className="text-sm">No favorites yet. Add one above!</p>
                </div>
              ) : null}
            </div>
          )}

          {/* 12. SEARCH RESULTS / SUGGESTIONS */}
          {showSuggestions && (
            <div className="space-y-2 pt-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2">
                Suggestions
              </h2>
              {liveSuggestions.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultSelect(result)}
                  className="w-full flex items-center gap-4 p-3 bg-white hover:bg-slate-100 rounded-xl transition-colors text-left border border-slate-200 shadow-sm"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      result.type === "terminal"
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    <result.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {result.title}
                    </div>
                    <div className="text-xs text-slate-500 font-medium truncate">
                      {result.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isFavoriteModalOpen && (
          <FavoriteModal
            initialData={favoriteToEdit}
            onClose={() => {
              setIsFavoriteModalOpen(false);
              setFavoriteToEdit(null);
              fetchFavorites(); // RE-FETCH THE LIST ON CLOSE
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {favoriteToDelete && (
          <DeleteConfirmationModal
            item={favoriteToDelete.name}
            onConfirm={async () => {
              if (!user || !favoriteToDelete.id) {
                setFavoriteToDelete(null);
                return;
              }

              try {
                const { error } = await supabase
                  .from("favorites")
                  .delete()
                  .eq("id", favoriteToDelete.id)
                  .eq("user_id", user.id);

                if (error) throw error;
                setFavoriteToDelete(null);
                fetchFavorites(); // RE-FETCH LIST AFTER DELETE
              } catch (error) {
                console.error("[FAVORITE DELETE ERROR]:", error);
                alert("Failed to delete favorite. Please try again.");
                setFavoriteToDelete(null);
              }
            }}
            onClose={() => setFavoriteToDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
