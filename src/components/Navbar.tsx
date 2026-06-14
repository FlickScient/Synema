import { NavLink, useNavigate } from 'react-router-dom';
import { Film, Search } from 'lucide-react';
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-synema-bg via-synema-bg/95 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2 group">
              <Film className="w-8 h-8 text-synema-violet" />
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-white">Syn</span>
                <span className="text-synema-violet">ema</span>
              </span>
            </NavLink>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { to: '/', label: 'Home' },
                { to: '/movies', label: 'Movies' },
                { to: '/series', label: 'Series' },
                { to: '/my-list', label: 'My List' },
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? 'text-synema-violet bg-synema-violet/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="relative animate-scale-in">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search movies..."
                  autoFocus
                  className="w-64 px-4 py-2 bg-synema-card border border-synema-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-synema-violet text-sm"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Profile menu — replaces the old broken avatar */}
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-synema-surface border-t border-synema-border">
        <div className="flex items-center justify-around py-2">
          {[
            { to: '/', label: 'Home' },
            { to: '/movies', label: 'Movies' },
            { to: '/my-list', label: 'My List' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'text-synema-violet' : 'text-gray-400'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
