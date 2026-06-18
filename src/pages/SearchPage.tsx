import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { SkeletonGrid } from '../components/Skeleton';
import { searchMovies } from '../services/tmdb';
import { GENRE_ID_MAP } from '../types/tmdb';
import type { Movie } from '../types/tmdb';

const GENRE_FILTERS = ['All', 'Action', 'Thriller', 'Horror', 'Sci-Fi', 'Drama', 'Comedy'];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (searchQuery: string, genre: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const genreId = genre === 'All' ? undefined : GENRE_ID_MAP[genre];
      const movies = await searchMovies(searchQuery, genreId);
      setResults(movies);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery, 'All');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query, selectedGenre);
      if (query.trim()) {
        setSearchParams({ q: query.trim() });
      } else {
        setSearchParams({});
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, selectedGenre, performSearch, setSearchParams]);

  return (
    <main className="pt-4 md:pt-8 min-h-screen pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="relative max-w-2xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for movies..."
            className="w-full pl-12 pr-10 py-4 bg-synema-card border border-synema-border rounded-2xl text-lg text-white placeholder-gray-500 focus:outline-none focus:border-synema-violet focus:ring-2 focus:ring-synema-violet/20 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
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
        ) : searched ? (
          results.length > 0 ? (
            <>
              <p className="text-sm text-gray-400 mb-4">
                Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {results.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 mb-6 rounded-full bg-synema-card flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-600" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No results found</h2>
              <p className="text-gray-400 text-center max-w-md">
                We couldn't find any movies matching "{query}". Try a different search term or browse our collections.
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 mb-6 rounded-full bg-gradient-brand opacity-30 flex items-center justify-center">
              <Search className="w-16 h-16 text-synema-violet" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Find your next favorite movie</h2>
            <p className="text-gray-400 text-center max-w-md">
              Search through thousands of movies to find exactly what you're looking for
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
