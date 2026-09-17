import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, ChevronDown } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { SkeletonGrid } from '../components/Skeleton';
import { BottomSheet } from '../components/BottomSheet';
import {
  searchMovies,
  searchTV,
  fetchDiscoverMovies,
  fetchDiscoverTV,
  MOVIE_GENRES,
  TV_GENRES,
  INDUSTRIES,
  CATALOGS,
} from '../services/tmdb';
import type { Movie } from '../types/tmdb';
import type { CatalogId } from '../services/tmdb';

type MediaType = 'movie' | 'tv';
type SheetKind = 'type' | 'catalog' | 'genre' | 'industry' | null;

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Discover filters
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [catalog, setCatalog] = useState<CatalogId>('popular');
  const [genreId, setGenreId] = useState<number | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<SheetKind>(null);

  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searched, setSearched] = useState(false);
  const [fadeKey, setFadeKey] = useState(0); // bumps to retrigger the grid fade-in on filter change

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isSearchMode = query.trim().length > 0;

  const genreList = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;
  const selectedGenreName = genreId ? genreList.find(g => g.id === genreId)?.name : 'All Genres';
  const selectedCatalogLabel = CATALOGS.find(c => c.id === catalog)?.label ?? 'Popular';
  const selectedIndustryLabel = industry ? INDUSTRIES.find(i => i.code === industry)?.label : 'All Regions';

  // --- Search mode (query typed) ---
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const movies = mediaType === 'movie'
        ? await searchMovies(searchQuery, genreId ?? undefined)
        : await searchTV(searchQuery, genreId ?? undefined);
      setResults(movies);
      setFadeKey(k => k + 1);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [mediaType, genreId]);

  // --- Discover mode (no query — browsing by filters) ---
  const performDiscover = useCallback(async (targetPage: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const fetchFn = mediaType === 'movie' ? fetchDiscoverMovies : fetchDiscoverTV;
      const res = await fetchFn({
        genreId: genreId ?? undefined,
        catalog,
        language: industry ?? undefined,
        page: targetPage,
      });
      setResults(prev => (append ? [...prev, ...res.results] : res.results));
      setTotalPages(res.totalPages);
      setPage(res.page);
      if (!append) setFadeKey(k => k + 1);
    } catch (error) {
      console.error('Discover failed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [mediaType, genreId, catalog, industry]);

  // Initial query from URL
  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search-mode trigger
  useEffect(() => {
    if (!isSearchMode) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
      setSearchParams({ q: query.trim() });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mediaType, genreId]);

  // Discover-mode trigger — runs whenever filters change and there's no active query
  useEffect(() => {
    if (isSearchMode) return;
    setSearchParams({});
    performDiscover(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, catalog, genreId, industry, isSearchMode]);

  const handleClearQuery = () => {
    setQuery('');
    setSearchParams({});
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      performDiscover(page + 1, true);
    }
  };

  const FilterChip = ({
    label,
    value,
    onClick,
  }: { label: string; value: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-synema-card border border-synema-border text-sm font-medium text-gray-200 active:scale-95 active:bg-white/5 transition-all duration-150"
    >
      <span className="text-gray-500">{label}:</span>
      <span className="text-white">{value}</span>
      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
    </button>
  );

  return (
    <main className="pt-4 md:pt-8 min-h-screen pb-24 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">

        {/* Search bar */}
        <div className="relative max-w-2xl mx-auto mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search movies, shows..."
            className="w-full pl-12 pr-10 py-4 bg-synema-card border border-synema-border rounded-2xl text-lg text-white placeholder-gray-500 focus:outline-none focus:border-synema-violet focus:ring-2 focus:ring-synema-violet/20 transition-all duration-200"
          />
          {query && (
            <button
              onClick={handleClearQuery}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white active:scale-90 transition-all duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Discover filter row — hidden while actively typing a search query */}
        {!isSearchMode && (
          <>
            <h2 className="text-2xl font-bold text-white mb-3">Discover</h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              <FilterChip
                label="Type"
                value={mediaType === 'movie' ? 'Movies' : 'Series'}
                onClick={() => setActiveSheet('type')}
              />
              <FilterChip label="Catalog" value={selectedCatalogLabel} onClick={() => setActiveSheet('catalog')} />
              <FilterChip label="Genre" value={selectedGenreName ?? 'All Genres'} onClick={() => setActiveSheet('genre')} />
              <FilterChip label="Industry" value={selectedIndustryLabel ?? 'All Regions'} onClick={() => setActiveSheet('industry')} />
            </div>
          </>
        )}

        {/* Results */}
        {loading ? (
          <SkeletonGrid />
        ) : isSearchMode ? (
          searched && results.length > 0 ? (
            <>
              <p className="text-sm text-gray-400 mb-4">
                Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </p>
              <div
                key={fadeKey}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 animate-fade-in"
              >
                {results.map(movie => (
                  <MovieCard key={movie.id} movie={movie} variant="grid" />
                ))}
              </div>
            </>
          ) : searched ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 mb-6 rounded-full bg-synema-card flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-600" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No results found</h2>
              <p className="text-gray-400 text-center max-w-md">
                We couldn't find anything matching "{query}". Try a different search term or browse Discover below.
              </p>
            </div>
          ) : null
        ) : (
          <>
            <div
              key={fadeKey}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 animate-fade-in"
            >
              {results.map(movie => (
                <MovieCard key={movie.id} movie={movie} variant="grid" />
              ))}
            </div>
            {page < totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-full bg-synema-card border border-synema-border text-white font-semibold text-sm active:scale-95 transition-all duration-150 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom sheets */}
      <BottomSheet
        isOpen={activeSheet === 'type'}
        onClose={() => setActiveSheet(null)}
        title="Content Type"
        options={[
          { id: 'movie', label: 'Movies' },
          { id: 'tv', label: 'Series' },
        ]}
        selectedId={mediaType}
        onSelect={id => {
          setMediaType(id as MediaType);
          setGenreId(null); // movie/TV genre IDs differ — reset to avoid an invalid combo
        }}
      />

      <BottomSheet
        isOpen={activeSheet === 'catalog'}
        onClose={() => setActiveSheet(null)}
        title="Catalog"
        options={CATALOGS.map(c => ({ id: c.id, label: c.label }))}
        selectedId={catalog}
        onSelect={id => setCatalog(id as CatalogId)}
      />

      <BottomSheet
        isOpen={activeSheet === 'genre'}
        onClose={() => setActiveSheet(null)}
        title="Select Genre"
        options={[{ id: 'all', label: 'All Genres' }, ...genreList.map(g => ({ id: String(g.id), label: g.name }))]}
        selectedId={genreId ? String(genreId) : 'all'}
        onSelect={id => setGenreId(id === 'all' ? null : Number(id))}
      />

      <BottomSheet
        isOpen={activeSheet === 'industry'}
        onClose={() => setActiveSheet(null)}
        title="Industry"
        options={[{ id: 'all', label: 'All Regions' }, ...INDUSTRIES.map(i => ({ id: i.code, label: i.label }))]}
        selectedId={industry ?? 'all'}
        onSelect={id => setIndustry(id === 'all' ? null : id)}
      />
    </main>
  );
}
