// =========================================================================================
// PAGE: COMMUNITY
// ANIMATION RESET: REMOVED ALL SCALE/GROW EFFECTS.
// =========================================================================================

import { useState } from "react";
import {
  MessageCircle,
  Heart,
  Share2,
  MapPin,
  Lock,
  AlertTriangle,
  Users,
  Info,
  Plus,
} from "lucide-react";

// MOCK DATA
const COMMUNITY_POSTS = [
  {
    id: 1,
    author: "Juan Dela Cruz",
    avatar: "JC",
    color: "bg-green-100 text-green-700",
    time: "10 mins ago",
    content:
      "Heavy traffic near Tandang Sora Palengke due to road repairs. Avoid if possible!",
    image:
      "https://images.unsplash.com/photo-1625126596964-8975a611c084?auto=format&fit=crop&w=800&q=80",
    location: "Tandang Sora",
    tag: "Heavy Traffic",
    tagColor: "bg-orange-50 text-orange-600 border-orange-100",
    tagIcon: AlertTriangle,
    likes: 24,
    comments: 5,
  },
  {
    id: 2,
    author: "Pedro Penduko",
    avatar: "PP",
    color: "bg-indigo-100 text-indigo-700",
    time: "2 hours ago",
    content:
      "Does anyone know if the tricycle line at Culiat is long right now?",
    image: null,
    location: "Tandang Sora",
    tag: "Question",
    tagColor: "bg-blue-50 text-blue-600 border-blue-100",
    tagIcon: Info,
    likes: 8,
    comments: 15,
  },
  {
    id: 3,
    author: "Maria Clara",
    avatar: "MC",
    color: "bg-pink-100 text-pink-700",
    time: "1 hour ago",
    content:
      "Just wanted to share that the new E-Jeep terminal is very organized! Kudos to the dispatchers.",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    location: "Culiat",
    tag: "Terminal Update",
    tagColor: "bg-purple-50 text-purple-600 border-purple-100",
    tagIcon: Users,
    likes: 45,
    comments: 2,
  },
];

// =========================================================================================
// PAGE: COMMUNITY PAGE
// UPDATES: CONNECTED TO REAL AUTH STATE
// =========================================================================================

import { useState } from "react";
import { useAuthStore } from "../stores/useAuthStore";
import AuthModal from "../components/auth/AuthModal";

export default function CommunityPage() {
  const user = useAuthStore((state) => state.user);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // DERIVE GUEST STATE FROM AUTH
  const isGuest = !user;

  return (
    <div className="w-full h-full absolute inset-0 bg-slate-50 flex flex-col">
      {/* GUEST BANNER */}
      {isGuest && (
        <div className="bg-blue-600 text-white p-4 shadow-md z-30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Lock size={20} />
            </div>
            <div>
              <div className="font-bold text-sm uppercase tracking-wide">
                Guest Mode
              </div>
              <div className="text-xs text-blue-100">
                Log in to create posts and interact.
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2 bg-white text-blue-600 text-xs font-bold rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
          >
            Login
          </button>
        </div>
      )}

      {/* FEED AREA */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 scroll-smooth">
        <div className="mt-4 mb-6 px-2 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 leading-none mb-1">
              Community
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Updates from fellow commuters
            </p>
          </div>

          {/* NEW POST BUTTON (NO ANIMATION) */}
          <button
            onClick={() =>
              isGuest ? alert("Login required") : alert("New Post Modal")
            }
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border transition-colors
              ${
                isGuest
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/30 hover:bg-brand-primary/90"
              }
            `}
          >
            {isGuest ? <Lock size={14} /> : <Plus size={14} />}
            <span>New Post</span>
          </button>
        </div>

        <div className="space-y-4">
          {COMMUNITY_POSTS.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${post.color}`}
                >
                  {post.avatar}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm leading-tight">
                    {post.author}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {post.time}
                  </div>
                </div>
              </div>

              <p className="text-slate-700 text-sm leading-relaxed mb-3">
                {post.content}
              </p>

              {/* IMAGE (NO ZOOM) */}
              {post.image && (
                <div className="mb-4 rounded-2xl overflow-hidden h-48 w-full relative">
                  <img
                    src={post.image}
                    alt="Post attachment"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/5"></div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-slate-200">
                  <MapPin size={10} />
                  {post.location}
                </div>
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${post.tagColor}`}
                >
                  <post.tagIcon size={10} />
                  {post.tag}
                </div>
              </div>

              <div
                className={`flex items-center justify-between pt-3 border-t border-slate-50 ${
                  isGuest ? "opacity-60" : ""
                }`}
              >
                <div className="flex gap-6">
                  <button
                    disabled={isGuest}
                    className={`flex items-center gap-1.5 transition-colors ${
                      isGuest
                        ? "cursor-not-allowed text-slate-400"
                        : "text-slate-400 hover:text-red-500"
                    }`}
                  >
                    <Heart size={18} />
                    <span className="text-xs font-bold">{post.likes}</span>
                  </button>
                  <button
                    disabled={isGuest}
                    className={`flex items-center gap-1.5 transition-colors ${
                      isGuest
                        ? "cursor-not-allowed text-slate-400"
                        : "text-slate-400 hover:text-blue-500"
                    }`}
                  >
                    <MessageCircle size={18} />
                    <span className="text-xs font-bold">{post.comments}</span>
                  </button>
                </div>
                <button
                  disabled={isGuest}
                  className={`transition-colors ${
                    isGuest
                      ? "cursor-not-allowed text-slate-400"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Share Post"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
