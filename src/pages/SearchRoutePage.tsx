// =========================================================================================
// PAGE: SEARCH ROUTE PAGE (PRODUCTION IMPLEMENTATION - FINAL ESLINT/TS FIXES)
// FIXES:
// 1. CLEARS 'Current Location' on origin focus.
// 2. Implements modern GuardRail loading UI and refined 3-character logic.
// 3. Implements logic for 'Select on Map' feature using LocationIQ. (COMPLETED)
// 4. Corrected swap logic to prevent 'Current Location' from auto-reverting to origin if it is now in destination.
// 5. Automatically swaps the focused input field (currentField) on button click.
// 6. Back button fully resets the state to default. (Feature 2)
// =========================================================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
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
import RouteInputFields from "../components/ui/RouteInputFields";
import SearchResults from "../components/ui/SearchResults";
import FavoritesList from "../components/ui/FavoritesList";

// API/DB IMPORTS
import { supabase } from "../lib/supabase";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
// NOTE: LOCATIONIQ_TOKEN is assumed to be available in environment variables for Feature 5
const LOCATIONIQ_TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN;

// CONSTANTS
// Debounce delay for search input
// (Also used for API guardrail timing)
const DEBOUNCE_DELAY_MS = 4000; // 4 SECONDS DEBOUNCE AS PER REQUIREMENTS
const MIN_CHARS_FOR_SEARCH = 3;

// TYPE DEFINITIONS
// SearchResult already defined in mockSearch.ts
// ROUTE INPUT TYPE DEFINED IN useAppStore.ts
// Minimal interface for Mapbox Feature used in mapping (Replaces 'any' type in fetchGeocodingSuggestions)
interface MapboxFeature {
  id: string;
  type: string;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  properties: {
    address?: string;
    [key: string]: unknown;
  };
}

// --- PRODUCTION API HELPER: MAPBOX FORWARD GEOCODING ---
// FETCH SUGGESTIONS FROM MAPBOX GEOCODING API
// RETURNS ARRAY OF SearchResult
// USING VITE_MAPBOX_TOKEN FROM ENV VARIABLES
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
        const feat = feature as MapboxFeature;

        return {
          id: feat.id || `result-${index}`,
          type: "place" as const,
          title: feat.text || "Untitled Location",
          subtitle: feat.place_name || feat.properties.address || "",
          icon: MapPin,
          lat: feat.center[1],
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

// --- LOCATIONIQ REVERSE GEOCODING SERVICE (FOR FEATURE 1) ---
const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<RouteInput | null> => {
  if (!LOCATIONIQ_TOKEN) {
    console.error(
      "LOCATIONIQ_TOKEN is missing. Cannot perform reverse geocode."
    );
    return null;
  }

  const url = `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_TOKEN}&lat=${lat}&lon=${lng}&format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("LocationIQ Error:", data.error);
      return null;
    }

    // Map LocationIQ response to RouteInput structure
    return {
      id: `custom_${lat}_${lng}`, // Use custom ID
      name: data.address.road || data.display_name,
      subtitle: data.display_name,
      lat: lat,
      lng: lng,
      type: "custom", // Use 'custom' type for pinned location
    } as RouteInput;
  } catch (error) {
    console.error("Reverse Geocoding Failed:", error);
    return null;
  }
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
    // Store/Action for Feature 2
    resetRouteInputs,
    // Map Picker States/Actions for Feature 1
    setMapPickerActive,
    saveRouteForm,
    mapPickerPinLocation,
    mapPickerTargetField,
    setMapPickerPinLocation,
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
  // NEW: Loading state for reverse geocoding (Feature 1 loading spinner)
  const [isReversingGeocode, setIsReversingGeocode] = useState(false);

  const [favorites, setFavorites] = useState<RouteInput[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
  const [liveSuggestions, setLiveSuggestions] = useState<SearchResult[]>([]);

  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false);
  const [favoriteToEdit, setFavoriteToEdit] = useState<RouteInput | null>(null);
  const [favoriteToDelete, setFavoriteToDelete] = useState<RouteInput | null>(
    null
  );

  const apiGuardTimerRef = useRef<number | null>(null);
  const isCalculatingRef = useRef<boolean>(false);

  const debouncedQuery = useDebounce(currentQuery, DEBOUNCE_DELAY_MS);

  // --- SUPABASE: FETCH FAVORITES (REAL IMPLEMENTATION) ---
  const fetchFavorites = useCallback(async () => {
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
        const mappedData: RouteInput[] = (data || []).map(
          (item: {
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
          })
        );
        setFavorites(mappedData);
      }
    } catch (error) {
      console.error("[FAVORITES FETCH ERROR]:", error);
      setFavorites([]);
    } finally {
      setIsFavoritesLoading(false);
    }
  }, [user]);

  // FETCH FAVORITES WHEN USER LOGS IN OR FAVORITES CHANGE
  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setIsFavoritesLoading(false);
    }
  }, [user, fetchFavorites]);

  // --- GEOLOCATION GUARDRAIL ---
  useEffect(() => {
    if (userLocation) {
      // FIX 4: If user location is in destination (due to swap), do not overwrite origin.
      if (destination && destination.type === "user") {
        return;
      }

      const hasOrigin = origin && origin.type === "user";
      const coordsChanged =
        hasOrigin &&
        (Math.abs(origin.lat - userLocation.lat) > 0.0001 ||
          Math.abs(origin.lng - userLocation.lng) > 0.0001);

      if (!origin || (hasOrigin && coordsChanged)) {
        setRouteInput("origin", {
          id: "user_loc",
          name: "Current Location",
          lat: userLocation.lat,
          lng: userLocation.lng,
          type: "user",
          subtitle: "Your GPS Location (Auto-detected)",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, origin, destination]);

  // 3. API CALL LOGIC (Triggered by debouncedQuery)
  useEffect(() => {
    let statusTimeoutId: number | null = null;
    let isCancelled = false;

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

    // B. SET LOADING STATE & GUARD TEXT
    if (currentQuery.length > 0 && currentQuery.length < MIN_CHARS_FOR_SEARCH) {
      // If typing but too short, show minimum character requirement immediately (loading=true to show spinner)
      setIsLoadingSuggestions(true);
      setApiGuardText(
        `Keep typing... Enter at least ${MIN_CHARS_FOR_SEARCH} characters.`
      );
    } else if (currentQuery.length >= MIN_CHARS_FOR_SEARCH) {
      // C. START 4-SECOND DEBOUNCER TIMER AND COUNTDOWN VISUAL
      let count = DEBOUNCE_DELAY_MS / 1000;

      setIsLoadingSuggestions(true);
      setApiGuardText(`Searching starts in ${count}s...`); // Initial message

      const interval = window.setInterval(() => {
        count -= 1;
        if (count > 0) {
          setApiGuardText(`Searching starts in ${count}s...`);
        } else {
          window.clearInterval(interval);
          // The actual API call in Effect 3 will handle setting the final status
          setApiGuardText("Searching...");
        }
      }, 1000);

      apiGuardTimerRef.current = interval;
    } else {
      // If query is empty, clear everything
      setIsLoadingSuggestions(false);
      setApiGuardText(null);
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
    // If the user clears the input, remove the stored RouteInput so it doesn't
    // reappear when the field regains focus.
    if (text.trim() === "") {
      setRouteInput(currentField, null);
      // also clear any running guard timer
      if (apiGuardTimerRef.current) {
        window.clearInterval(apiGuardTimerRef.current);
        apiGuardTimerRef.current = null;
      }
    }

    setCurrentQuery(text);
  };

  const handleInputFocus = (field: "origin" | "destination") => {
    setCurrentField(field);
    const value = field === "origin" ? origin : destination;

    // Feature 1: Clear "Current Location" on focus for origin field
    if (field === "origin" && value?.type === "user") {
      setCurrentQuery("");
      setRouteInput(field, null);
    }
    // Feature 3: Do not clear destination/non-user origin on focus, but reset the query to its existing value (if any)
    else if (value) {
      setCurrentQuery(value.name || "");
    } else {
      setCurrentQuery("");
    }

    // Reset suggestions/guardrails immediately on focus and cancel any debounce
    setLiveSuggestions([]);
    setApiGuardText(null);
    setIsLoadingSuggestions(false);
    if (apiGuardTimerRef.current) {
      window.clearInterval(apiGuardTimerRef.current);
      apiGuardTimerRef.current = null;
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

  // Map Picker Handlers (Feature 1)
  const handleSelectOnMap = () => {
    saveRouteForm(origin, destination); // Save current form state
    setSearchRoutePageOpen(false); // Close search page (required to render the map)
    setMapPickerActive(true, currentField); // Activate map picker mode
  };

  // UseEffect to process the result from Map Picker after 'Confirm' (Feature 1)
  useEffect(() => {
    // Condition: Pin location is set, target field is known, and we are NOT reversing geocode.
    // This listener runs when MainLayout's MapPickerConfirmationSheet confirms the location.
    if (mapPickerPinLocation && mapPickerTargetField && !isReversingGeocode) {
      setIsReversingGeocode(true);

      const { lat, lng } = mapPickerPinLocation;
      const targetField = mapPickerTargetField;

      // Clear the pin location now that we have the data, preventing re-triggering this effect
      setMapPickerPinLocation(null);
      // Clear the target field after processing
      setMapPickerActive(false, null);

      reverseGeocode(lat, lng)
        .then((result) => {
          if (result) {
            setRouteInput(targetField, result);
            // Populate the visible query and focus the target field so the value
            // appears immediately and is editable by the user.
            setCurrentQuery(result.name || "");
            setCurrentField(targetField);
            // Ensure the input DOM actually receives focus so the new text is visible
            // and editable immediately (autoFocus can be unreliable across remounts).
            setTimeout(() => {
              const el = document.querySelector(
                `input[data-field="${targetField}"]`
              ) as HTMLInputElement | null;
              if (el) {
                el.focus();
                // place caret at the end (not highlighted)
                const len = el.value.length;
                el.setSelectionRange(len, len);
              }
            }, 50);
          } else {
            // Use a generic placeholder if API fails
            setRouteInput(targetField, {
              id: `custom_fail_${lat}_${lng}`,
              name: "Pinned Location (Address Lookup Failed)",
              subtitle: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              lat: lat,
              lng: lng,
              type: "custom",
            });
            alert(
              "Could not determine address for the selected location. Using coordinates as name."
            );
          }
        })
        .finally(() => {
          setIsReversingGeocode(false);
          setSearchRoutePageOpen(true); // Re-open the SearchRoutePage with the new input
          setCurrentField("destination"); // Focus destination field for the next step
        });
    }
  }, [
    mapPickerPinLocation,
    mapPickerTargetField,
    isReversingGeocode,
    setRouteInput,
    setMapPickerPinLocation,
    setMapPickerActive,
    setSearchRoutePageOpen,
    setIsReversingGeocode,
  ]);

  // UseEffect to restore form state if coming back from 'Go Back' on map picker
  useEffect(() => {
    // This effect remains empty as MainLayout handles the state restore on 'Go Back'
  }, [isSearchRoutePageOpen]);

  // 8. RENDER
  if (!isSearchRoutePageOpen && !isReversingGeocode) return null; // Keep rendering while reversing geocoding

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
      console.warn(
        "[ROUTE SEARCH]: Calculation already in progress, ignoring duplicate request."
      );
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
          {/* ... (omitted header) */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                // FIX 6: Reset to default state on back button click
                setSearchRoutePageOpen(false);
                resetRouteInputs(); // Reset global state (origin/destination to default)
                // Reset local state for clean start
                setCurrentField("destination");
                setCurrentQuery("");
                setApiGuardText(null);
                setIsLoadingSuggestions(false);
              }}
              className="p-2 -ml-2 text-slate-700 rounded-full hover:bg-slate-100"
              aria-label="Go back to map"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Plan Route</h1>
            <div>{/* Placeholder for symmetry */}</div>
          </div>

          {/* ROUTE INPUTS & SWAP BUTTON */}
          <RouteInputFields
            currentField={currentField}
            currentQuery={currentQuery}
            onInputChange={handleInputChange}
            onInputFocus={handleInputFocus}
            onInputBlur={handleInputBlur}
            onSwapInputs={() => {
              swapRouteInputs();
              // FIX 5: Swap the focused field (currentField)
              setCurrentField((prev) =>
                prev === "origin" ? "destination" : "origin"
              );
            }}
          />

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
              onClick={handleSelectOnMap} // Updated handler
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

          {/* 9. API GUARD/LOADING UI (Feature 1 loading spinner) */}
          {(isLoadingSuggestions || isReversingGeocode) && (
            <div className="p-4 mb-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start gap-3">
              <Loader2
                size={24}
                className="text-brand-primary animate-spin shrink-0 mt-0.5"
              />
              <div>
                <span className="text-slate-900 font-bold block">
                  {isReversingGeocode
                    ? "Pinning Location..."
                    : "Getting Suggestions..."}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  {isReversingGeocode
                    ? "Fetching address via LocationIQ API."
                    : apiGuardText}
                </p>
              </div>
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

          {/* FAVORITES */}
          {showFavorites && (
            <FavoritesList
              favorites={favorites}
              isFavoritesLoading={isFavoritesLoading}
              onFavoriteSelect={handleFavoriteSelect}
              onAddFavorite={handleAddFavorite}
              onEditFavorite={handleEditFavorite}
              onDeleteFavorite={handleDeleteFavorite}
            />
          )}

          {/* SEARCH RESULTS */}
          {showSuggestions && (
            <SearchResults
              liveSuggestions={liveSuggestions}
              isLoadingSuggestions={isLoadingSuggestions}
              apiGuardText={apiGuardText}
              onResultSelect={handleResultSelect}
            />
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
              fetchFavorites();
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
                fetchFavorites();
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
