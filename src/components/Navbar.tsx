import { NavLink, useNavigate } from 'react-router-dom';
import { Film, Search, Home, Clapperboard, Heart } from 'lucide-react';
import { useState } from 'react';
import { ProfileMenu } from './ProfileMenu';

export function Navbar() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <>
      {/* ── Mobile top bar (hidden on desktop) ── */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-synema-surface/95 border-b border-synema-border backdrop-blur-sm">
        <div className="flex items-center justify-between h-14 px-4">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight">
              <span className="text-white">Syn</span>
              <span className="text-synema-violet">ema</span>
            </span>
          </NavLink>

          {/* Right: search + profile */}
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="relative animate-scale-in">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  autoFocus
                  className="w-44 px-3 py-1.5 bg-synema-card border border-synema-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-synema-violet text-sm"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-base leading-none"
                >
                  ×
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            <ProfileMenu />
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar (hidden on desktop) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-synema-surface/95 border-t border-synema-border backdrop-blur-sm">
        <div className="flex items-center justify-around py-2 px-4">
          {[
            { to: '/', label: 'Home', icon: Home, exact: true },
            { to: '/movies', label: 'Movies', icon: Clapperboard, exact: false },
            { to: '/series', label: 'Series', icon: Film, exact: false },
            { to: '/my-list', label: 'My List', icon: Heart, exact: false },
            { to: '/search', label: 'Search', icon: Search, exact: false },
          ].map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-synema-violet' : 'text-gray-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-synema-violet/15' : ''}`}>
                    <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                  </span>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
