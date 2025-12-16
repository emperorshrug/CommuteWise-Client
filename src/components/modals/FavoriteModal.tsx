// =========================================================================================
// MODAL: FAVORITE LOCATION BUILDER (ADD/EDIT)
// FIX: REVERTED STATE DECLARATION TO INCLUDE AND USE 'setLocation'.
// CONTEXT: The 'Set Location on Map' button now calls 'setLocation' to simulate
//          receiving new map coordinates, proving the state setter is functional.
// =========================================================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Home, MapPin, Trash2 } from "lucide-react";
import type { RouteInput } from "../../stores/useAppStore";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface FavoriteModalProps {
  initialData: RouteInput | null;
  onClose: () => void;
}

export default function FavoriteModal({
  initialData,
  onClose,
}: FavoriteModalProps) {
  const isEditMode = !!initialData;

  const [name, setName] = useState(initialData?.name || "");
  const [address, setAddress] = useState(initialData?.subtitle || "");

  // FIX: Reverted state declaration to include 'setLocation'
  const [location, setLocation] = useState<[number, number]>(
    initialData ? [initialData.lat, initialData.lng] : [0, 0] // [lat, lng]
  );

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const title = isEditMode ? `Edit ${initialData?.name}` : "Add New Favorite";
  const actionButtonText = isEditMode ? "Update Location" : "Save Location";
  const canSave = name.length > 0 && location[0] !== 0;

  const handleSubmit = () => {
    if (!canSave) return;

    const data: RouteInput = {
      id: initialData?.id || Date.now().toString(),
      name,
      subtitle: address,
      lat: location[0],
      lng: location[1],
      type: "place",
    };

    if (isEditMode) {
      console.log(
        `[SUPABASE MOCK] UPDATING FAVORITE: ${data.name} (ID: ${data.id})`
      );
    } else {
      console.log(`[SUPABASE MOCK] CREATING NEW FAVORITE: ${data.name}`);
    }
    onClose();
  };

  // MOCK DELETE HANDLER
  const handleDelete = () => {
    setIsDeleteConfirmOpen(false);
    console.log(
      `[SUPABASE MOCK] DELETING FAVORITE: ${initialData?.name} (ID: ${initialData?.id})`
    );
    onClose();
  };

  // MOCK MAP SELECTION HANDLER
  const handleSetLocationOnMap = () => {
    // SIMULATE OPENING MAP AND RECEIVING NEW, VALID COORDINATES
    const newLat = 14.65 + Math.random() * 0.05; // Quezon City Area
    const newLng = 121.05 + Math.random() * 0.05;

    // USE 'setLocation' TO UPDATE STATE
    setLocation([newLat, newLng]);

    alert(
      `[MAP MOCK] Location updated! Lat: ${newLat.toFixed(
        4
      )}, Lng: ${newLng.toFixed(4)}`
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-full">
              <Home size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-4">
          {/* NAME */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
              Nickname
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Home, Grandparents' House"
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
              maxLength={30}
            />
          </div>

          {/* ADDRESS/SUBTITLE (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
              Address/Barangay (Optional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Culiat, Quezon City"
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* LOCATION PICKER (MOCK) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
              Location Coordinates
            </label>
            <button
              // CALLS THE MOCKED HANDLER WHICH USES 'setLocation'
              onClick={handleSetLocationOnMap}
              className={`w-full p-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-3 transition-colors ${
                location[0] === 0
                  ? "bg-slate-100 text-slate-500 border-slate-200"
                  : "bg-brand-primary/10 text-brand-primary border-brand-primary/50"
              }`}
            >
              <MapPin size={20} />
              {location[0] === 0
                ? "Set Location on Map"
                : `Location Set (${location[0].toFixed(
                    2
                  )}, ${location[1].toFixed(2)})`}
            </button>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div
          className={`flex gap-3 pt-6 ${
            isEditMode ? "justify-between" : "justify-end"
          }`}
        >
          {isEditMode && (
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="p-3.5 bg-red-100 text-red-600 font-bold text-base rounded-xl shadow-sm hover:bg-red-200 transition-colors flex items-center gap-2"
              aria-label="Delete favorite"
            >
              <Trash2 size={20} />
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSave}
            className={`flex-1 py-3.5 text-white font-bold text-base rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2
                           ${
                             canSave
                               ? "bg-brand-primary shadow-brand-primary/30 hover:bg-brand-primary/90"
                               : "bg-slate-400 cursor-not-allowed shadow-none"
                           }
                        `}
          >
            <Save size={20} />
            {actionButtonText}
          </button>
        </div>
      </motion.div>

      {/* DELETE CONFIRMATION MODAL (Nested) */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <DeleteConfirmationModal
            item={name}
            onConfirm={handleDelete}
            onClose={() => setIsDeleteConfirmOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
