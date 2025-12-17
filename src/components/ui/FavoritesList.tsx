// =========================================================================================
// COMPONENT: FAVORITES LIST
// PURPOSE: Displays user's favorite locations and handles CRUD operations
// =========================================================================================

import { Home, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import type { RouteInput } from "../../stores/useAppStore";

interface FavoritesListProps {
  favorites: RouteInput[];
  isFavoritesLoading: boolean;
  onFavoriteSelect: (fav: RouteInput) => void;
  onAddFavorite: () => void;
  onEditFavorite: (fav: RouteInput) => void;
  onDeleteFavorite: (fav: RouteInput) => void;
}

export default function FavoritesList({
  favorites,
  isFavoritesLoading,
  onFavoriteSelect,
  onAddFavorite,
  onEditFavorite,
  onDeleteFavorite,
}: FavoritesListProps) {
  const { user } = useAuthStore();

  if (isFavoritesLoading) {
    return (
      <div className="p-4 mb-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-slate-500" />
          <p className="text-sm text-slate-500 font-medium">
            Loading favorites...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 mb-4 rounded-xl bg-slate-50 border border-slate-200">
        <p className="text-sm text-slate-500 text-center">
          Login to view favorites
        </p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-4 mb-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-sm text-slate-500 text-center">No favorites yet</p>
        </div>
        <button
          onClick={onAddFavorite}
          className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
        >
          <Plus size={16} className="text-slate-600" />
          <span className="text-sm font-medium text-slate-700">
            Add Favorite
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
          Favorites
        </h2>
        <button
          onClick={onAddFavorite}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          aria-label="Add favorite"
        >
          <Plus size={16} />
        </button>
      </div>
      {favorites.map((fav) => (
        <div
          key={fav.id}
          className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 shadow-sm"
        >
          <button
            onClick={() => onFavoriteSelect(fav)}
            className="flex items-center gap-3 flex-1 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <Home size={16} className="text-slate-600" />
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
          <div className="flex gap-1">
            <button
              onClick={() => onEditFavorite(fav)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Edit favorite"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDeleteFavorite(fav)}
              className="p-1 text-red-400 hover:text-red-600 rounded"
              aria-label="Delete favorite"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
