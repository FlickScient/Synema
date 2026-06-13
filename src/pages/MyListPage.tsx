import { Link } from 'react-router-dom';
import { List, Film, Trash2 } from 'lucide-react';
import { useMyList } from '../context/MyListContext';
import { getImageUrl, POSTER_SIZE } from '../services/tmdb';
import { GENRE_MAP } from '../types/tmdb';
import { useState } from 'react';

export function MyListPage() {
  const { myList, removeFromList } = useMyList();
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <main className="pt-20 min-h-screen pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="flex items-center gap-3 mb-8">
          <List className="w-8 h-8 text-synema-violet" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">My List</h1>
            <p className="text-gray-400">
              {myList.length} movie{myList.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        {myList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {myList.map(movie => {
              const posterUrl = getImageUrl(movie.poster_path, POSTER_SIZE);
              const year = movie.release_date?.split('-')[0];
              const genres = movie.genre_ids?.slice(0, 1).map(id => GENRE_MAP[id]).filter(Boolean);

              return (
                <div
                  key={movie.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredId(movie.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <Link
                    to={`/movie/${movie.id}`}
                    className="block"
                  >
                    <div className="relative aspect-[2/3] bg-synema-card rounded-xl overflow-hidden">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-12 h-12 text-gray-600" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <Link
                        to={`/player/${movie.id}`}
                        onClick={e => e.stopPropagation()}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-14 h-14 rounded-full bg-synema-violet flex items-center justify-center shadow-lg shadow-synema-violet/30 hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 text-white fill-white ml-1" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </Link>
                    </div>
                  </Link>

                  <div className="mt-2 space-y-1">
                    <Link
                      to={`/movie/${movie.id}`}
                      className="block text-sm font-semibold text-white truncate group-hover:text-synema-violet transition-colors"
                    >
                      {movie.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {year && <span>{year}</span>}
                      {genres?.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{genres.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromList(movie.id)}
                    className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
                      hoveredId === movie.id
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-75'
                    } bg-synema-crimson hover:bg-synema-crimson-dark shadow-lg`}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-32 h-32 mb-8 rounded-full bg-synema-card flex items-center justify-center">
              <List className="w-16 h-16 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Your list is empty</h2>
            <p className="text-gray-400 text-center max-w-md mb-8">
              Start adding movies to your list by clicking the &quot;Add to List&quot; button on any movie
            </p>
            <Link
              to="/"
              className="px-6 py-3 bg-gradient-brand rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-synema-violet/30 transition-shadow"
            >
              Browse Movies
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
