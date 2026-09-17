import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { SkeletonGrid } from '../components/Skeleton';
import {
  fetchTrending,
  fetchNewReleases,
  fetchTopRated,
  fetchDiscoverMovies,
  getAnimeSeriesPage,
} from '../services/tmdb';
import type { Movie } from '../types/tmdb';

// One entry per HomePage row / "See all" destination.
// simpleFetch: for endpoints that just take a page number (trending, new releases, top rated, anime)
// genreId: for genre-based rows — routed through fetchDiscoverMovies with a fixed catalog sort
const CATEGORY_CONFIG: Record<
  string,
  { title: string; simpleFetch?: (page: number) => Promise<Movie[]>; genreId?: number }
> = {
  trending: { title: 'Trending Now', simpleFetch: fetchTrending },
  'new-releases': { title: 'New Releases', simpleFetch: fetchNewReleases },
  'top-rated': { title: 'Top Rated', simpleFetch: fetchTopRated },
  anime: { title: 'Anime', simpleFetch: getAnimeSeriesPage },
  action: { title: 'Action & Adventure', genreId: 28 },
  drama: { title: 'Drama', genreId: 18 },
  comedy: { title: 'Comedy', genreId: 35 },
  horror: { title: 'Horror', genreId: 27 },
  scifi: { title: 'Science Fiction', genreId: 878 },
  thriller: { title: 'Thriller', genreId: 53 },
  romance: { title: 'Romance', genreId: 10749 },
  family: { title: 'Family', genreId: 10751 },
  documentary: { title: 'Documentary', genreId: 99 },
  animation: { title: 'Animation', genreId: 16 },
};

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const config = slug ? CATEGORY_CONFIG[slug] : undefined;

  const [results, setResults] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

  const load = useCallback(async (targetPage: number, append: boolean) => {
    if (!config) return;
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      if (config.simpleFetch) {
        const movies = await config.simpleFetch(targetPage);
        setResults(prev => (append ? [...prev, ...movies] : movies));
        // These endpoints don't return total_pages here — TMDB caps most lists
        // around 500 pages; we just keep "Load More" available and let an
        // empty response naturally stop it.
        setTotalPages(movies.length > 0 ? targetPage + 1 : targetPage);
      } else if (config.genreId) {
        const res = await fetchDiscoverMovies({ genreId: config.genreId, catalog: 'popular', page: targetPage });
        setResults(prev => (append ? [...prev, ...res.results] : res.results));
        setTotalPages(res.totalPages);
      }
      setPage(targetPage);
      if (!append) setFadeKey(k => k + 1);
    } catch (error) {
      console.error('Category load failed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [config]);

  useEffect(() => {
    setResults([]);
    setPage(1);
    load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!config) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-white mb-2">Category not found</h1>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-3 bg-gradient-brand rounded-full font-semibold text-white active:scale-95 transition-transform duration-150"
        >
          Go Home
        </button>
      </main>
    );
  }

  return (
    <main className="pt-4 md:pt-8 min-h-screen pb-24 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="w-9 h-9 rounded-full bg-synema-card border border-synema-border flex items-center justify-center active:scale-90 transition-transform duration-150"
          >
            <ArrowLeft className="w-4.5 h-4.5 text-white" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{config.title}</h1>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : (
          <>
            <div
              key={fadeKey}
              className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6 animate-fade-in"
            >
              {results.map((movie, idx) => (
                <MovieCard key={`${movie.id}-${idx}`} movie={movie} variant="grid" />
              ))}
            </div>

            {results.length > 0 && page < totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => load(page + 1, true)}
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
    </main>
  );
}
