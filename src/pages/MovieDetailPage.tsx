import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  Download,
  Youtube,
  Star,
  Clock,
  Calendar,
  User,
  ChevronDown,
  Plus,
  Check,
} from 'lucide-react';
import { SkeletonDetail } from '../components/Skeleton';
import { MovieRow } from '../components/MovieRow';
import type { MovieDetails, Cast, Movie } from '../types/tmdb';
import {
  getMovieDetails,
  getMovieCredits,
  getSimilarMovies,
  getMovieVideos,
  getImageUrl,
  POSTER_SIZE,
  BACKDROP_SIZE,
  PROFILE_SIZE,
} from '../services/tmdb';
import { useMyList } from '../context/MyListContext';

const QUALITY_OPTIONS = [
  { label: '480p', size: '700 MB' },
  { label: '720p', size: '1.4 GB' },
  { label: '1080p', size: '2.8 GB' },
  { label: '4K', size: '8.5 GB' },
];

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [similar, setSimilar] = useState<MovieDetails[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDownload, setShowDownload] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const { addToList, removeFromList, isInList } = useMyList();

  useEffect(() => {
    const loadMovie = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const [details, credits, similarMovies, videos] = await Promise.all([
          getMovieDetails(parseInt(id)),
          getMovieCredits(parseInt(id)),
          getSimilarMovies(parseInt(id)),
          getMovieVideos(parseInt(id)),
        ]);

        setMovie(details);
        setCast(credits.cast.slice(0, 12));
        setSimilar(similarMovies as MovieDetails[]);

        const officialTrailer = videos.results.find(
          v => v.type === 'Trailer' && v.site === 'YouTube' && v.official
        );
        setTrailerKey(officialTrailer?.key || videos.results[0]?.key || null);
      } catch (error) {
        console.error('Failed to load movie details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [id]);

  if (loading) return <SkeletonDetail />;
  if (!movie) return null;

  const backdropUrl = getImageUrl(movie.backdrop_path, BACKDROP_SIZE);
  const posterUrl = getImageUrl(movie.poster_path, POSTER_SIZE);
  const year = movie.release_date?.split('-')[0];
  const inList = isInList(movie.id);

  const handleListAction = () => {
    if (inList) {
      removeFromList(movie.id);
    } else {
      addToList(movie as Movie);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="relative">
        <div className="absolute inset-0 h-[50vh] md:h-[60vh]">
          {backdropUrl && (
            <img
              src={backdropUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-synema-bg via-synema-bg/80 to-synema-bg/40" />
          <div className="absolute inset-0 bg-synema-bg/50 backdrop-blur-sm" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 lg:px-16 pt-32 pb-12">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              {posterUrl && (
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-48 md:w-64 aspect-[2/3] object-cover rounded-xl shadow-2xl shadow-black/50"
                />
              )}
            </div>

            <div className="flex-1 pt-4 md:pt-16">
              {movie.tagline && (
                <p className="text-synema-violet italic mb-2">&ldquo;{movie.tagline}&rdquo;</p>
              )}

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-300">
                <span className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-white">
                    {movie.vote_average.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({movie.vote_count.toLocaleString()} votes)
                  </span>
                </span>

                {movie.runtime > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </span>
                )}

                {year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {year}
                  </span>
                )}
              </div>

              {movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genres.map(genre => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 bg-synema-card border border-synema-border rounded-full text-sm text-gray-300"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-gray-300 mb-8 max-w-2xl leading-relaxed">
                {movie.overview}
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  to={`/player/${movie.id}`}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-brand rounded-lg font-semibold text-white transition-all hover:shadow-lg hover:shadow-synema-violet/30 hover:scale-105"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Stream Now
                </Link>

                <button
                  onClick={handleListAction}
                  className={`inline-flex items-center gap-2 px-6 py-3 border rounded-lg font-semibold transition-all hover:scale-105 ${
                    inList
                      ? 'border-synema-crimson bg-synema-crimson/20 text-white'
                      : 'border-synema-border bg-synema-card text-white hover:bg-synema-card-hover'
                  }`}
                >
                  {inList ? (
                    <>
                      <Check className="w-5 h-5" />
                      In My List
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add to List
                    </>
                  )}
                </button>

                {trailerKey && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white transition-colors"
                  >
                    <Youtube className="w-5 h-5" />
                    Trailer
                  </button>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowDownload(!showDownload)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-synema-card border border-synema-border rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showDownload ? 'rotate-180' : ''}`}
                  />
                </button>

                {showDownload && (
                  <div className="absolute top-full mt-2 left-0 w-64 bg-synema-card border border-synema-border rounded-xl overflow-hidden shadow-xl z-20 animate-scale-in">
                    {QUALITY_OPTIONS.map(option => (
                      <button
                        key={option.label}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-synema-surface transition-colors"
                      >
                        <span className="font-medium text-white">{option.label}</span>
                        <span className="text-sm text-gray-400">{option.size}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {cast.length > 0 && (
        <section className="py-8 border-t border-synema-border">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
            <h2 className="text-xl font-bold text-white mb-6">Cast</h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {cast.map(person => (
                <div key={person.id} className="flex-shrink-0 text-center">
                  <div className="w-20 h-20 rounded-full bg-synema-card overflow-hidden mb-2 border-2 border-synema-border">
                    {person.profile_path ? (
                      <img
                        src={getImageUrl(person.profile_path, PROFILE_SIZE)}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white font-medium max-w-[80px] truncate">
                    {person.name}
                  </p>
                  <p className="text-xs text-gray-500 max-w-[80px] truncate">
                    {person.character}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <div className="pb-16">
          <MovieRow title="Similar Movies" movies={similar as unknown as Movie[]} />
        </div>
      )}

      {showTrailer && trailerKey && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowTrailer(false)}
        >
          <button
            onClick={() => setShowTrailer(false)}
            className="absolute top-4 right-4 text-white hover:text-synema-violet transition-colors"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-full max-w-4xl aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}
