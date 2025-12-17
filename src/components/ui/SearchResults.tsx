// =========================================================================================
// COMPONENT: SEARCH RESULTS
// PURPOSE: Displays live suggestions from API and handles selection
// =========================================================================================

import type { SearchResult } from "../../data/mockSearch";

interface SearchResultsProps {
  liveSuggestions: SearchResult[];
  isLoadingSuggestions: boolean;
  apiGuardText: string | null;
  onResultSelect: (result: SearchResult) => void;
}

export default function SearchResults({
  liveSuggestions,
  isLoadingSuggestions,
  apiGuardText,
  onResultSelect,
}: SearchResultsProps) {
  if (apiGuardText) {
    return (
      <div className="p-4 mb-4 rounded-xl bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-blue-700 font-medium">{apiGuardText}</p>
        </div>
      </div>
    );
  }

  if (isLoadingSuggestions) {
    return (
      <div className="p-4 mb-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Searching...</p>
        </div>
      </div>
    );
  }

  if (liveSuggestions.length === 0) {
    return (
      <div className="p-4 mb-4 rounded-xl bg-slate-50 border border-slate-200">
        <p className="text-sm text-slate-500 text-center">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2">
        Suggestions
      </h2>
      {liveSuggestions.map((result) => (
        <button
          key={result.id}
          onClick={() => onResultSelect(result)}
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
  );
}
