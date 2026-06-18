import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MovieCard } from '../components/MovieCard';
import { fetchDiscoverMovies } from '../services/tmdb';
import { GENRE_ID_MAP } from '../types/tmdb';
import type { Movie } from '../types/tmdb';
import { Loader2 } from 'lucide-react';

const GENRE_FILTERS = [
  'All', 'Action', 'Drama', 'Horror', 'Comedy', 'Sci-Fi',
  'Animation', 'Thriller', 'Adventure', 'Romance', 'Crime', 'Fantasy',
];

export function MoviesPage() {
  const [searchParams] = useSearchParams();
  const urlGenre = searchParams.get('genre');

  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(
    urlGenre && GENRE_ID_MAP[urlGenre] ? urlGenre : 'All'
  );

  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Sync genre from URL param
  useEffect(() => {
    const g = urlGenre && GENRE_ID_MAP[urlGenre] ? urlGenre : 'All';
    setSelectedGenre(g);
    setMovies([]);
    setPage(1);
    isFirstLoad.current = true;
  }, [urlGenre]);

  // Reset on genre tab click
  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setMovies([]);
    setPage(1);
    isFirstLoad.current = true;
  };

  // Fetch movies when page or genre changes
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const genreId = selectedGenre !== 'All' ? GENRE_ID_MAP[selectedGenre] : undefined;
        const result = await fetchDiscoverMovies(genreId, page);
        if (cancelled) return;
        setMovies(prev => page === 1 ? result.results : [...prev, ...result.results]);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
          isFirstLoad.current = false;
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [page, selectedGenre]);

  // Infinite scroll — observe sentinel div
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
            <h1 className="text-2xl md:text-3xl font-black text-white">Movies</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedGenre !== 'All' ? `${selectedGenre} · ` : ''}Discover &amp; explore
            </p>
          </div>
        </div>

        {/* Genre filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
          {GENRE_FILTERS.map(genre => (
            <button
              key={genre}
              onClick={() => handleGenreChange(genre)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                selectedGenre === genre
                  ? 'bg-synema-violet text-white shadow-md shadow-synema-violet/30'
                  : 'bg-synema-card border border-synema-border text-gray-400 hover:text-white hover:border-synema-violet/40'
              }`}
            >
              {genre}
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
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500">
            <p className="text-lg">No movies found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {movies.map(movie => (
                <MovieCard key={`${movie.id}-${movie.title}`} movie={movie} variant="grid" />
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
            {!loadingMore && page >= totalPages && movies.length > 0 && (
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
