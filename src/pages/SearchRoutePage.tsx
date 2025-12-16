// =========================================================================================
// PAGE: SEARCH ROUTE PAGE (FINAL FIXES: IMPORTS, ESLINT)
// FIXES:
// 1. ADDED MISSING 'Search' icon import.
// 2. Resolved remaining ESLint warnings by improving state transition logic.
// =========================================================================================

import { useState, useRef, useEffect, useMemo } from "react";
import type { ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion"; // ADDED AnimatePresence
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
  Search, // ADDED Search ICON
} from "lucide-react";
import { useAppStore } from "../stores/useAppStore";
import type { RouteInput } from "../stores/useAppStore";
import { useDebounce } from "../hooks/useDebounce";
import { SEARCH_DATABASE } from "../data/mockSearch";
import type { SearchResult } from "../data/mockSearch";

// COMPONENTS (ADDED MISSING MODAL IMPORTS)
import FavoriteModal from "../components/modals/FavoriteModal";
import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";

// CONSTANTS
const DEBOUNCE_DELAY_MS = 5000;
const MIN_CHARS_FOR_SEARCH = 3;

// MOCK DATA: FAVORITES
const MOCK_FAVORITES: RouteInput[] = [
  {
    id: "fav1",
    name: "Home",
    lat: 14.68,
    lng: 121.05,
    type: "place",
    subtitle: "Makati, Metro Manila",
  },
  {
    id: "fav2",
    name: "Work Office",
    lat: 14.65,
    lng: 121.04,
    type: "place",
    subtitle: "QC Circle, Quezon City",
  },
  {
    id: "fav3",
    name: "SM North EDSA",
    lat: 14.6563,
    lng: 121.0286,
    type: "terminal",
    subtitle: "EDSA, Quezon City",
  },
];

interface InputProps {
  field: "origin" | "destination";
  icon: ElementType;
  placeholder: string;
  value: RouteInput | null;
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
  onChange,
  isFocused,
  onFocus,
  onBlur,
}: InputProps) => {
  const inputValue = isFocused ? value?.name || "" : value?.name || "";

  return (
    <div
      className={`
                flex items-center gap-3 p-3.5 rounded-xl border-2 transition-colors
                ${getBorderColor(field, isFocused)}
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
  } = useAppStore();

  const [currentField, setCurrentField] = useState<"origin" | "destination">(
    "destination"
  );
  const [currentQuery, setCurrentQuery] = useState("");
  const [apiGuardText, setApiGuardText] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false);
  const [favoriteToEdit, setFavoriteToEdit] = useState<RouteInput | null>(null);
  const [favoriteToDelete, setFavoriteToDelete] = useState<RouteInput | null>(
    null
  );

  const apiGuardTimerRef = useRef<number | null>(null);

  const debouncedQuery = useDebounce(currentQuery, DEBOUNCE_DELAY_MS);

  // --- GEOLOCATION GUARDRAIL (ON LOAD) ---
  useEffect(() => {
    if (!origin && userLocation) {
      setRouteInput("origin", {
        id: "user_loc",
        name: "Current Location",
        lat: userLocation.lat,
        lng: userLocation.lng,
        type: "user",
        subtitle: "Your GPS Location",
      });
    }
  }, [userLocation, origin, setRouteInput]);

  // 3. API CALL LOGIC (Triggered when debouncedQuery changes)
  useEffect(() => {
    if (debouncedQuery.length >= MIN_CHARS_FOR_SEARCH) {
      console.log(`[API CALL MOCK] Searching for: ${debouncedQuery}`);

      // FIX: Use setTimeout(0) to defer state changes, resolving synchronous update warning
      setTimeout(() => {
        setIsLoadingSuggestions(false); // SEARCH COMPLETE
        setApiGuardText("Search complete. Showing results.");
      }, 0);

      const statusTimeout = setTimeout(() => {
        setApiGuardText(null);
      }, 3000);

      return () => clearTimeout(statusTimeout);
    }
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
      // FIX: Use setTimeout(0) for synchronous update
      setTimeout(() => {
        setIsLoadingSuggestions(true); // START LOADING/THROTTLING
        setApiGuardText(
          `Keep typing... Enter at least ${MIN_CHARS_FOR_SEARCH} characters.`
        );
      }, 0);
    } else if (currentQuery.length >= MIN_CHARS_FOR_SEARCH) {
      // C. START 5-SECOND DEBOUNCER TIMER AND COUNTDOWN
      let count = DEBOUNCE_DELAY_MS / 1000;

      // FIX: Use setTimeout(0) for initial countdown status
      setTimeout(() => {
        setIsLoadingSuggestions(true); // Ensure loading is true while counting down
        setApiGuardText(`API search starts in ${count}s...`);
      }, 0);

      const interval = window.setInterval(() => {
        count -= 1;
        if (count > 0) {
          setApiGuardText(`API search starts in ${count}s...`);
        } else {
          window.clearInterval(interval);
          // The debouncedQuery effect will take over, this is the final countdown status
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

  // 5. LOCAL SEARCH RESULTS (Simulated API Results)
  const searchResults = useMemo(() => {
    if (debouncedQuery.length < MIN_CHARS_FOR_SEARCH) return [];
    const lowerQuery = debouncedQuery.toLowerCase();
    return SEARCH_DATABASE.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.subtitle.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  }, [debouncedQuery]);

  // Input Handlers
  const handleInputChange = (text: string) => {
    setCurrentQuery(text);
  };

  const handleInputFocus = (field: "origin" | "destination") => {
    setCurrentField(field);
    const value = field === "origin" ? origin : destination;
    setCurrentQuery(value?.name || "");

    // Clear the actual input value only if it's not the default 'Current Location'
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

  // Favorites CRUD Handlers (MOCK)
  const handleAddFavorite = () => {
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

  // Determine if we should show suggestions/favorites based on query state
  const showSuggestions =
    currentQuery.length > 0 &&
    currentQuery.length >= MIN_CHARS_FOR_SEARCH &&
    !isLoadingSuggestions;
  const showFavorites = currentQuery.length === 0;

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
            <div className="flex-1 min-w-0">
              <RouteInputField
                field="origin"
                icon={LocateFixed}
                placeholder="Current Location"
                value={origin}
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

          {/* SEARCH POSSIBLE ROUTES BUTTON (MOVED HERE) */}
          <button
            className="w-full py-4 mt-4 bg-emerald-500 text-white font-bold rounded-xl text-base shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors"
            disabled={!origin || !destination}
          >
            Search Possible Routes
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

          {/* 9. API GUARD/DEBOUNCE WARNING (MOVED HERE) */}
          {apiGuardText && (
            <div className="p-4 mb-4 rounded-xl bg-yellow-50 text-yellow-800 border border-yellow-200 flex items-start gap-3">
              <Clock size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Guardrails Active</p>
                <p className="text-xs mt-1">{apiGuardText}</p>
              </div>
            </div>
          )}

          {/* LOADER (NEW) */}
          {isLoadingSuggestions && currentQuery.length >= 1 && (
            <div className="p-4 mb-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3 animate-pulse">
              <Search size={24} className="text-slate-400" />
              <span className="text-slate-500 font-medium">
                Fetching suggestions...
              </span>
            </div>
          )}

          {/* 11. FAVORITES SECTION (VISIBLE WHEN NO QUERY IS ACTIVE) */}
          {showFavorites && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between ml-1 mb-2">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Favorites
                </h2>
                {/* ADD BUTTON */}
                <button
                  onClick={handleAddFavorite}
                  className="flex items-center gap-1 text-brand-primary text-xs font-bold hover:text-brand-primary/80 transition-colors"
                >
                  <Plus size={14} /> Add New
                </button>
              </div>

              {MOCK_FAVORITES.map((fav) => (
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
              ))}
            </div>
          )}

          {/* 12. SEARCH RESULTS / SUGGESTIONS (MOVED HERE) */}
          {showSuggestions && (
            <div className="space-y-2 pt-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2">
                Suggestions
              </h2>
              {searchResults.map((result) => (
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

      {/* MODALS */}
      <AnimatePresence>
        {isFavoriteModalOpen && (
          <FavoriteModal
            initialData={favoriteToEdit}
            onClose={() => {
              setIsFavoriteModalOpen(false);
              setFavoriteToEdit(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {favoriteToDelete && (
          <DeleteConfirmationModal
            item={favoriteToDelete.name}
            onConfirm={() => {
              alert(
                `[SUPABASE MOCK] Deleting ${favoriteToDelete.name} (ID: ${favoriteToDelete.id})`
              );
              setFavoriteToDelete(null);
            }}
            onClose={() => setFavoriteToDelete(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
