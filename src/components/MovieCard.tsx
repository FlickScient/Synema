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
  const displayTitle = movie.title || movie.name;

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
      className={`relative flex-shrink-0 block overflow-hidden rounded-xl select-none
        transition-transform duration-150 ease-out
        active:scale-[0.96]
        ${
          variant === 'featured'
            ? 'w-48 md:w-56'
            : variant === 'grid'
            ? 'w-full'
            : 'w-32 md:w-40'
        }`}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-synema-card rounded-xl overflow-hidden">
        {!imageError && posterUrl ? (
          <img
            src={posterUrl}
            alt={displayTitle}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-synema-card">
            <span className="text-4xl text-synema-muted">?</span>
          </div>
        )}

        {/* Rating badge — always visible, no hover required to see it */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm">
          <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
          <span className="text-[11px] font-bold text-white">{movie.vote_average.toFixed(1)}</span>
        </div>

        {/* Quick-actions — appear on tap-and-hold via focus-within/active, not hover.
            Desktop still gets the hover polish via peer-hover-style group class,
            but the primary trigger on touch devices is now the tap itself
            (single tap navigates immediately; these are secondary affordances
            reachable via long-press or pointer devices only). */}
        <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 items-center justify-center gap-2">
          <Link
            to={playerPath}
            onClick={e => e.stopPropagation()}
            className="w-11 h-11 rounded-full bg-synema-violet flex items-center justify-center shadow-lg shadow-synema-violet/30 hover:scale-110 active:scale-95 transition-transform duration-150"
          >
            <Play className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
          </Link>
          <button
            onClick={handleListAction}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ${
              inList ? 'bg-synema-crimson/80 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {inList ? (
              <span className="flex items-center gap-1"><Check className="w-3 h-3" /> In list</span>
            ) : (
              <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> Add</span>
            )}
          </button>
        </div>

        {/* Mobile: a small persistent add-to-list button, thumb-reachable,
            no hover/long-press needed — this replaces the hidden overlay
            button as the mobile-primary way to add to list. */}
        <button
          onClick={handleListAction}
          className={`md:hidden absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform duration-150 active:scale-90 ${
            inList ? 'bg-synema-crimson/85' : 'bg-black/55'
          }`}
        >
          {inList ? <Check className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-white" />}
        </button>
      </div>

      <div className="mt-2 space-y-1">
        <h3 className="text-sm font-semibold text-white truncate leading-snug">
          {displayTitle}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {genres?.length > 0 && <span className="truncate">{genres.join(', ')}</span>}
        </div>
      </div>
    </Link>
  );
}
