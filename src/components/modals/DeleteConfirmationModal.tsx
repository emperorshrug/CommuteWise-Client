// =========================================================================================
// MODAL: DELETE CONFIRMATION
// PURPOSE: Generic modal to confirm deletion of any item.
// =========================================================================================

import { motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  item: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteConfirmationModal({
  item,
  onConfirm,
  onClose,
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
      >
        <div className="flex items-start gap-4 mb-4">
          <AlertTriangle size={36} className="text-red-600 shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Confirm Deletion
            </h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete **{item}**? This action cannot be
              undone.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 text-slate-500 font-bold text-base hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 bg-red-600 text-white font-bold text-base rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-colors"
          >
            Delete Permanently
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          aria-label="Close confirmation"
        >
          <X size={16} />
        </button>
      </motion.div>
    </div>
  );
}
