import { useState, useEffect } from 'react';
import { MovieCard } from '../components/MovieCard';
import { SkeletonGrid } from '../components/Skeleton';
import { fetchTrending, fetchTopRated, fetchNewReleases, fetchByGenre } from '../services/tmdb';
import type { Movie } from '../types/tmdb';
import { GENRE_ID_MAP } from '../types/tmdb';

const GENRE_FILTERS = ['All', 'Action', 'Thriller', 'Horror', 'Sci-Fi', 'Drama', 'Comedy'];

type SortBy = 'trending' | 'top_rated' | 'new' | 'popular';

export function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState<SortBy>('trending');
  const [page] = useState(1);

  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      try {
        let results: Movie[];

        if (selectedGenre === 'All') {
          switch (sortBy) {
            case 'top_rated':
              results = await fetchTopRated();
              break;
            case 'new':
              results = await fetchNewReleases();
              break;
            default:
              results = await fetchTrending();
          }
        } else {
          const genreId = GENRE_ID_MAP[selectedGenre];
          results = await fetchByGenre(genreId, page);
        }

        setMovies(results);
      } catch (error) {
        console.error('Failed to load movies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, [selectedGenre, sortBy, page]);

  return (
    <main className="pt-4 md:pt-8 min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Movies</h1>

          <div className="flex flex-wrap gap-2">
            {['trending', 'top_rated', 'new', 'popular'].map(sort => (
              <button
                key={sort}
                onClick={() => setSortBy(sort as SortBy)}
                className={`p-2 px-3 rounded-lg text-xs font-medium uppercase tracking-wide transition-all ${
                  sortBy === sort
                    ? 'bg-synema-violet text-white'
                    : 'bg-synema-card border border-synema-border text-gray-400 hover:text-white hover:border-synema-violet'
                }`}
              >
                {sort === 'top_rated' ? 'Top Rated' : sort === 'new' ? 'New Releases' : sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {GENRE_FILTERS.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedGenre === genre
                  ? 'bg-gradient-brand text-white shadow-lg shadow-synema-violet/20'
                  : 'bg-synema-card border border-synema-border text-gray-400 hover:text-white hover:border-synema-violet'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-gray-400">No movies found</p>
          </div>
        )}
      </div>
    </main>
  );
}
