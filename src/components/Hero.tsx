import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Info, Star } from 'lucide-react';
import type { Movie } from '../types/tmdb';
import { getImageUrl, BACKDROP_SIZE } from '../services/tmdb';
import { useMyList } from '../context/MyListContext';
import { GENRE_MAP } from '../types/tmdb';

interface HeroProps {
  movies: Movie[];
}

export function Hero({ movies }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const { addToList, removeFromList, isInList } = useMyList();

  const currentMovie = movies[currentIndex];
  const inList = currentMovie ? isInList(currentMovie.id) : false;
  const backdropUrl = getImageUrl(currentMovie?.backdrop_path, BACKDROP_SIZE);

  useEffect(() => {
    if (movies.length <= 1) return;

    const interval = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % movies.length);
        setTransitioning(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [movies.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [movies]);

  if (!currentMovie) return null;

  const genres = currentMovie.genre_ids?.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 4);
  const year = currentMovie.release_date?.split('-')[0];

  const handleListAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inList) {
      removeFromList(currentMovie.id);
    } else {
      addToList(currentMovie);
    }
  };

  return (
    <div className="relative h-[70vh] md:h-[85vh] overflow-hidden">
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-synema-bg via-synema-bg/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-synema-bg via-transparent to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-end pb-16 md:pb-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 w-full">
          <div
            className={`max-w-2xl transition-all duration-500 ${transitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
          >
            {year && (
              <span className="inline-block px-3 py-1 bg-synema-violet/20 border border-synema-violet/30 rounded-full text-sm text-synema-violet font-medium mb-3">
                {year}
              </span>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {currentMovie.title}
            </h1>

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-lg font-semibold text-white">
                  {currentMovie.vote_average.toFixed(1)}
                </span>
              </span>

              {genres?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {genres.map(genre => (
                    <span
                      key={genre}
                      className="px-2.5 py-1 bg-synema-card border border-synema-border rounded-full text-xs text-gray-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="text-base md:text-lg text-gray-300 mb-6 line-clamp-3 max-w-xl">
              {currentMovie.overview}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link
                to={`/player/${currentMovie.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-brand hover:bg-gradient-brand-hover rounded-lg font-semibold text-white transition-all duration-200 shadow-lg shadow-synema-violet/20 hover:shadow-synema-violet/30 hover:scale-105"
              >
                <Play className="w-5 h-5 fill-white" />
                Stream Now
              </Link>

              <button
                onClick={handleListAction}
                className={`inline-flex items-center gap-2 px-6 py-3 border rounded-lg font-semibold transition-all duration-200 hover:scale-105 ${
                  inList
                    ? 'border-synema-crimson bg-synema-crimson/20 text-white'
                    : 'border-synema-border bg-synema-card/50 text-white hover:bg-synema-card'
                }`}
              >
                {inList ? (
                  <>
                    <Plus className="w-5 h-5 rotate-45" />
                    Remove
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add to List
                  </>
                )}
              </button>

              <Link
                to={`/movie/${currentMovie.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-synema-card/50 border border-synema-border rounded-lg font-semibold text-white hover:bg-synema-card transition-colors"
              >
                <Info className="w-5 h-5" />
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>

      {movies.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {movies.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setTransitioning(true);
                setTimeout(() => {
                  setCurrentIndex(index);
                  setTransitioning(false);
                }, 250);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-synema-violet'
                  : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
