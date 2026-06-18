import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MovieCard } from '../components/MovieCard';
import { fetchDiscoverTV } from '../services/tmdb';
import type { Movie } from '../types/tmdb';
import { Loader2 } from 'lucide-react';

const TV_GENRE_FILTERS = [
  { label: 'All',            id: undefined },
  { label: 'Action',         id: 10759 },
  { label: 'Drama',          id: 18 },
  { label: 'Comedy',         id: 35 },
  { label: 'Crime',          id: 80 },
  { label: 'Sci-Fi',         id: 10765 },
  { label: 'Animation',      id: 16 },
  { label: 'Mystery',        id: 9648 },
  { label: 'Family',         id: 10751 },
  { label: 'Reality',        id: 10764 },
  { label: 'Documentary',    id: 99 },
];

export function SeriesPage() {
  const [searchParams] = useSearchParams();
  const urlGenre = searchParams.get('genre');

  const initialFilter = TV_GENRE_FILTERS.find(f => f.label === urlGenre) ?? TV_GENRE_FILTERS[0];

  const [series, setSeries] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync from URL param
  useEffect(() => {
    const f = TV_GENRE_FILTERS.find(f => f.label === urlGenre) ?? TV_GENRE_FILTERS[0];
    setSelectedFilter(f);
    setSeries([]);
    setPage(1);
  }, [urlGenre]);

  const handleFilterChange = (filter: typeof TV_GENRE_FILTERS[0]) => {
    setSelectedFilter(filter);
    setSeries([]);
    setPage(1);
  };

  // Fetch TV shows
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const result = await fetchDiscoverTV(selectedFilter.id, page);
        if (cancelled) return;
        setSeries(prev =>
          page === 1
            ? result.results.map(s => ({ ...s, media_type: 'tv' as const }))
            : [...prev, ...result.results.map(s => ({ ...s, media_type: 'tv' as const }))]
        );
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error('Failed to load series:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [page, selectedFilter]);

  // Infinite scroll
  useEffect(() => {
    if (loadingMore || loading || page >= totalPages) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setPage(prev => prev + 1);
        }
      },
      { rootMargin: '200px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [loading, loadingMore, page, totalPages]);

  return (
    <main className="pt-4 md:pt-8 min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">TV Series</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedFilter.label !== 'All' ? `${selectedFilter.label} · ` : ''}Stream the latest shows
            </p>
          </div>
        </div>

        {/* Genre filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
          {TV_GENRE_FILTERS.map(filter => (
            <button
              key={filter.label}
              onClick={() => handleFilterChange(filter)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                selectedFilter.label === filter.label
                  ? 'bg-synema-violet text-white shadow-md shadow-synema-violet/30'
                  : 'bg-synema-card border border-synema-border text-gray-400 hover:text-white hover:border-synema-violet/40'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-full aspect-[2/3] bg-synema-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : series.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500">
            <p className="text-lg">No series found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {series.map(show => (
                <MovieCard key={`${show.id}-${show.name}`} movie={show} variant="grid" />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4 mt-4" />

            {/* Loading more spinner */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-synema-violet animate-spin" />
              </div>
            )}

            {/* End of results */}
            {!loadingMore && page >= totalPages && series.length > 0 && (
              <p className="text-center text-gray-600 text-sm py-8">
                You've seen it all ✓
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
