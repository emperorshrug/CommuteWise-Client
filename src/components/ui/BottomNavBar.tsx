import { NavLink } from "react-router-dom";
import { Map, Users, UserCircle, ScrollText } from "lucide-react";

export default function BottomNavBar() {
  const navClass = ({ isActive }: { isActive: boolean }) => `
    flex flex-col items-center justify-center w-full h-full gap-1
    transition-all duration-200
    ${
      isActive
        ? "text-brand-primary scale-110 font-bold"
        : "text-slate-400 hover:text-slate-600"
    }
  `;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] px-2">
      <NavLink to="/" className={navClass}>
        <Map size={24} strokeWidth={2.5} />
        <span className="text-[10px] uppercase tracking-wider">Map</span>
      </NavLink>
      <NavLink to="/community" className={navClass}>
        <Users size={24} strokeWidth={2.5} />
        <span className="text-[10px] uppercase tracking-wider">Community</span>
      </NavLink>
      {/* NEW ACTIVITY TAB */}
      <NavLink to="/activity" className={navClass}>
        <ScrollText size={24} strokeWidth={2.5} />
        <span className="text-[10px] uppercase tracking-wider">Activity</span>
      </NavLink>
      <NavLink to="/profile" className={navClass}>
        <UserCircle size={24} strokeWidth={2.5} />
        <span className="text-[10px] uppercase tracking-wider">Profile</span>
      </NavLink>
    </div>
  );
}
