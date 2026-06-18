import { NavLink, useNavigate } from 'react-router-dom';
import { Film, Home, Clapperboard, Tv, Heart, Search, Shield, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/movies', label: 'Movies', icon: Clapperboard, exact: false },
  { to: '/series', label: 'Series', icon: Tv, exact: false },
  { to: '/my-list', label: 'My List', icon: Heart, exact: false },
  { to: '/search', label: 'Search', icon: Search, exact: false },
];

export function Sidebar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = user ? (profile?.email || user.email || '?')[0].toUpperCase() : null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 z-40 border-r border-synema-border bg-synema-surface">

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-synema-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-synema-violet/20 flex-shrink-0">
          <Film className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-black tracking-tight">
          <span className="text-white">Syn</span>
          <span className="text-synema-violet">ema</span>
        </span>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-hide">
        <p className="px-3 mb-3 text-[10px] font-bold tracking-widest uppercase text-gray-600">
          Navigation
        </p>

        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-synema-violet/15 text-synema-violet border border-synema-violet/25'
                  : 'text-gray-400 hover:text-white hover:bg-synema-card'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  isActive
                    ? 'bg-synema-violet/20'
                    : 'bg-synema-card/60 group-hover:bg-synema-card'
                }`}>
                  <Icon className="w-4 h-4" />
                </span>
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-synema-violet" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Admin link — only for admins */}
        {isAdmin && (
          <>
            <p className="px-3 pt-4 mb-3 text-[10px] font-bold tracking-widest uppercase text-gray-600">
              Admin
            </p>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-synema-crimson/15 text-red-400 border border-synema-crimson/25'
                    : 'text-gray-400 hover:text-white hover:bg-synema-card'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isActive ? 'bg-synema-crimson/20' : 'bg-synema-card/60 group-hover:bg-synema-card'
                  }`}>
                    <Shield className="w-4 h-4" />
                  </span>
                  Admin Panel
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* ── User profile ── */}
      <div className="px-3 py-4 border-t border-synema-border">
        {user ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-synema-card/60 border border-synema-border">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {profile?.email || user.email}
              </p>
              {isAdmin && (
                <p className="text-[10px] text-synema-violet font-semibold">Admin</p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-synema-card/60 border border-synema-border hover:border-synema-violet/40 hover:bg-synema-violet/10 transition-all duration-200 text-gray-400 hover:text-white text-sm font-medium"
          >
            <span className="w-8 h-8 rounded-full bg-synema-card flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4" />
            </span>
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
}
