// =========================================================================================
// COMPONENT: ROUTE INPUT FIELDS
// PURPOSE: Handles the origin/destination input fields and swap functionality
// =========================================================================================

import type { ElementType } from "react";
import { LocateFixed, MapPin, ArrowUpDown } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import type { RouteInput } from "../../stores/useAppStore";

interface InputProps {
  field: "origin" | "destination";
  icon: ElementType;
  placeholder: string;
  value: RouteInput | null;
  currentQuery: string;
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
  currentQuery,
  onChange,
  isFocused,
  onFocus,
  onBlur,
}: InputProps) => {
  const inputValue = isFocused ? currentQuery : value?.name || "";

  return (
    <div
      className={`
                flex items-center gap-3 p-3.5 rounded-xl border-2 transition-colors
                ${getBorderColor(field, isFocused)}
                ${field === "origin" ? "mb-2" : ""}
            `}
      onClick={() => {
        if (!isFocused) onFocus(field);
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

interface RouteInputFieldsProps {
  currentField: "origin" | "destination";
  currentQuery: string;
  onInputChange: (text: string) => void;
  onInputFocus: (field: "origin" | "destination") => void;
  onInputBlur: () => void;
  onSwapInputs: () => void;
}

export default function RouteInputFields({
  currentField,
  currentQuery,
  onInputChange,
  onInputFocus,
  onInputBlur,
  onSwapInputs,
}: RouteInputFieldsProps) {
  const { origin, destination } = useAppStore();

  return (
    <div className="relative flex items-center gap-2">
      <div className="flex-1 min-w-0 pr-10">
        <RouteInputField
          field="origin"
          icon={LocateFixed}
          placeholder="Current Location"
          value={origin}
          currentQuery={currentField === "origin" ? currentQuery : ""}
          onChange={onInputChange}
          isFocused={currentField === "origin"}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
        />
        <RouteInputField
          field="destination"
          icon={MapPin}
          placeholder="Enter Destination"
          value={destination}
          currentQuery={currentField === "destination" ? currentQuery : ""}
          onChange={onInputChange}
          isFocused={currentField === "destination"}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
        />
      </div>

      <button
        onClick={onSwapInputs}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-colors"
        aria-label="Swap origin and destination"
      >
        <ArrowUpDown size={16} className="text-slate-600" />
      </button>
    </div>
  );
}
