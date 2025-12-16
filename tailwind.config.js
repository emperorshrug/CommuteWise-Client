/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // BRAND COLORS - UI & INTERACTION [cite: 12]
        brand: {
          primary: "#059669", // Emerald-600 (Buttons, Active Tabs)
          surface: "#ffffff", // White (Backgrounds)
          accent: "#ecfdf5", // Emerald-50 (Hover States)
          text: "#0f172a", // Slate-900 (Headings)
          subtext: "#64748b", // Slate-500 (Subtext)
        },
        // FUNCTIONAL PALETTE - MAP & ROUTING [cite: 15]
        map: {
          user: "#3b82f6", // Blue-500 (Pulse)
          bus: "#1d4ed8", // Blue-700
          jeep: "#eab308", // Yellow-500
          trike: "#22c55e", // Green-500
          ejeep: "#a855f7", // Purple-500
          walk: "#38bdf8", // Sky-400
          trace: "#cbd5e1", // Gray-300 (Travelled)
        },
      },
    },
  },
  plugins: [],
};
