import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';

const MOVIE_CHIPS = [
  { label: 'All',        path: '/',       genre: null },
  { label: 'Movies',     path: '/movies', genre: null },
  { label: 'Series',     path: '/series', genre: null },
  { label: 'Animation',  path: '/movies', genre: 'Animation' },
  { label: 'Action',     path: '/movies', genre: 'Action' },
  { label: 'Drama',      path: '/movies', genre: 'Drama' },
  { label: 'Comedy',     path: '/movies', genre: 'Comedy' },
  { label: 'Horror',     path: '/movies', genre: 'Horror' },
  { label: 'Sci-Fi',     path: '/movies', genre: 'Sci-Fi' },
  { label: 'Thriller',   path: '/movies', genre: 'Thriller' },
  { label: 'Adventure',  path: '/movies', genre: 'Adventure' },
  { label: 'Romance',    path: '/movies', genre: 'Romance' },
  { label: 'Crime',      path: '/movies', genre: 'Crime' },
  { label: 'Fantasy',    path: '/movies', genre: 'Fantasy' },
  { label: 'My List',    path: '/my-list', genre: null },
];

const TV_CHIPS = [
  { label: 'All',         path: '/series', genre: null },
  { label: 'Movies',      path: '/movies', genre: null },
  { label: 'Action',      path: '/series', genre: 'Action' },
  { label: 'Drama',       path: '/series', genre: 'Drama' },
  { label: 'Comedy',      path: '/series', genre: 'Comedy' },
  { label: 'Crime',       path: '/series', genre: 'Crime' },
  { label: 'Sci-Fi',      path: '/series', genre: 'Sci-Fi' },
  { label: 'Animation',   path: '/series', genre: 'Animation' },
  { label: 'Mystery',     path: '/series', genre: 'Mystery' },
  { label: 'Family',      path: '/series', genre: 'Family' },
  { label: 'Reality',     path: '/series', genre: 'Reality' },
  { label: 'Documentary', path: '/series', genre: 'Documentary' },
  { label: 'My List',     path: '/my-list', genre: null },
];

export function DesktopTopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isSeriesSection = location.pathname === '/series' || location.pathname.startsWith('/series/');
  const chips = isSeriesSection ? TV_CHIPS : MOVIE_CHIPS;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const getChipActive = (chip: typeof MOVIE_CHIPS[0]) => {
    const params = new URLSearchParams(location.search);
    const currentGenre = params.get('genre');
    if (chip.genre) {
      return location.pathname === chip.path && currentGenre === chip.genre;
    }
    if (chip.label === 'All') {
      return isSeriesSection
        ? location.pathname === '/series'
        : location.pathname === '/';
    }
    return location.pathname === chip.path && !currentGenre;
  };

  const handleChipClick = (chip: typeof MOVIE_CHIPS[0]) => {
    if (chip.genre) {
      navigate(`${chip.path}?genre=${encodeURIComponent(chip.genre)}`);
    } else {
      navigate(chip.path);
    }
  };

  return (
    <div className="hidden md:flex items-center gap-4 sticky top-0 z-30 px-6 py-3 bg-synema-surface/95 border-b border-synema-border backdrop-blur-md">

      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-shrink-0 w-56 lg:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies & series..."
          className="w-full pl-9 pr-8 py-2 bg-synema-card border border-synema-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-synema-violet/60 focus:bg-synema-card-hover text-sm transition-all duration-200"
        />
        {query && (
          <button type="button" onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Divider */}
      <div className="w-px h-6 bg-synema-border flex-shrink-0" />

      {/* Section label */}
      <span className="flex-shrink-0 text-[10px] font-bold tracking-widest uppercase text-gray-600">
        {isSeriesSection ? 'TV Series' : 'Browse'}
      </span>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 pb-0.5">
        {chips.map(chip => {
          const isActive = getChipActive(chip);
          return (
            <button
              key={chip.label + (chip.path) + (chip.genre ?? '')}
              onClick={() => handleChipClick(chip)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-synema-violet text-white shadow-md shadow-synema-violet/30'
                  : 'bg-synema-card border border-synema-border text-gray-400 hover:text-white hover:border-synema-violet/40 hover:bg-synema-card-hover'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
