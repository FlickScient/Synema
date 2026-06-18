import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, Star } from 'lucide-react';
import type { Movie } from '../types/tmdb';
import { getImageUrl, POSTER_SIZE } from '../services/tmdb';
import { useMyList } from '../context/MyListContext';
import { GENRE_MAP } from '../types/tmdb';

interface MovieCardProps {
  movie: Movie;
  variant?: 'default' | 'featured' | 'grid';
}

export function MovieCard({ movie, variant = 'default' }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);
  const { addToList, removeFromList, isInList } = useMyList();
  const inList = isInList(movie.id);
  const posterUrl = getImageUrl(movie.poster_path, POSTER_SIZE);
  const genres = movie.genre_ids?.slice(0, 2).map(id => GENRE_MAP[id]).filter(Boolean);
  const displayTitle = movie.name || movie.title;

  const handleListAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inList) {
      removeFromList(movie.id);
    } else {
      addToList(movie);
    }
  };

  const isTV = movie.media_type === 'tv';
  const detailPath = isTV ? `/series/${movie.id}` : `/movie/${movie.id}`;
  const playerPath = isTV
    ? `/player/${movie.id}?season=1&episode=1&type=tv`
    : `/player/${movie.id}`;

  return (
    <Link
      to={detailPath}
      className={`group relative flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
        variant === 'featured'
          ? 'w-48 md:w-56'
          : variant === 'grid'
          ? 'w-full'
          : 'w-32 md:w-40'
      }`}
    >
      <div className="relative aspect-[2/3] bg-synema-card">
        {!imageError && posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-synema-card">
            <span className="text-4xl text-synema-muted">?</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Link
            to={playerPath}
            onClick={e => e.stopPropagation()}
            className="w-12 h-12 rounded-full bg-synema-violet flex items-center justify-center shadow-lg shadow-synema-violet/30 hover:bg-synema-violet-dark hover:scale-110 transition-all duration-200"
          >
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </Link>

          <button
            onClick={handleListAction}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              inList
                ? 'bg-synema-crimson/80 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {inList ? (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" /> In List
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add to List
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-synema-violet transition-colors">
          {displayTitle}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            {movie.vote_average.toFixed(1)}
          </span>
          {genres?.length > 0 && (
            <>
              <span>•</span>
              <span className="truncate">{genres.join(', ')}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
