import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Star, Plus, Check, Play, Tv, Calendar, Clock
} from 'lucide-react';
import type { TVShow, TVSeason, TVEpisode, Movie } from '../types/tmdb';
import {
  getTVShowDetails, getTVSeasonDetails, getSimilarTV,
  getImageUrl, POSTER_SIZE, BACKDROP_SIZE, PROFILE_SIZE
} from '../services/tmdb';
import { useMyList } from '../context/MyListContext';
import { MovieCard } from '../components/MovieCard';

function EpisodeStill({ path }: { path: string | null }) {
  const url = path ? getImageUrl(path, '/w300') : null;
  return (
    <div className="w-28 h-16 sm:w-36 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-synema-card">
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Tv className="w-6 h-6 text-gray-600" />
        </div>
      )}
    </div>
  );
}

export function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToList, removeFromList, isInList } = useMyList();

  const [show, setShow] = useState<TVShow | null>(null);
  const [season, setSeason] = useState<TVSeason | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeasonNum, setSelectedSeasonNum] = useState(1);
  const [selectedEp, setSelectedEp] = useState<number | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  // Derived
  const tvId = parseInt(id ?? '0');
  const inList = show ? isInList(show.id) : false;
  const backdropUrl = show ? getImageUrl(show.backdrop_path, BACKDROP_SIZE) : null;
  const posterUrl = show ? getImageUrl(show.poster_path, POSTER_SIZE) : null;
  const year = show?.first_air_date?.split('-')[0];

  // Real seasons (skip season 0 = Specials if exists, but keep it if the user wants)
  const realSeasons = show?.seasons.filter(s => s.season_number > 0) ?? [];

  // Load show + first season + similar
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getTVShowDetails(tvId),
      getTVSeasonDetails(tvId, 1),
      getSimilarTV(tvId),
    ]).then(([showData, seasonData, similarData]) => {
      setShow(showData);
      setSeason(seasonData);
      setSimilar(similarData.slice(0, 12).map(s => ({ ...s, media_type: 'tv' as const })));
      setSelectedSeasonNum(1);
      setSelectedEp(null);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Load season when it changes
  useEffect(() => {
    if (!id || loading) return;
    setLoadingSeason(true);
    setSelectedEp(null);
    getTVSeasonDetails(tvId, selectedSeasonNum)
      .then(setSeason)
      .catch(console.error)
      .finally(() => setLoadingSeason(false));
  }, [selectedSeasonNum]);

  const handleListAction = () => {
    if (!show) return;
    const asMovie: Movie = {
      id: show.id,
      title: show.name,
      original_title: show.name,
      overview: show.overview,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      release_date: show.first_air_date,
      vote_average: show.vote_average,
      vote_count: show.vote_count,
      popularity: 0,
      adult: false,
      genre_ids: show.genres.map(g => g.id),
      original_language: '',
      video: false,
      name: show.name,
      media_type: 'tv',
    };
    if (inList) removeFromList(show.id);
    else addToList(asMovie);
  };

  const handleWatch = (ep: TVEpisode) => {
    navigate(`/player/${tvId}?season=${ep.season_number}&episode=${ep.episode_number}&type=tv`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-synema-violet border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Series not found.
      </div>
    );
  }

  const episodes = season?.episodes ?? [];
  const displayedEpisodes = selectedEp !== null
    ? episodes.filter(e => e.episode_number === selectedEp)
    : episodes;

  return (
    <main className="min-h-screen pb-24 md:pb-8">

      {/* ── Backdrop hero ── */}
      <div className="relative h-64 sm:h-80 md:h-[55vh] overflow-hidden">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={show.name}
            className="w-full h-full object-cover object-top"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-synema-bg via-synema-bg/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-synema-bg/60 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-synema-card/70 border border-synema-border rounded-xl text-white text-sm font-medium backdrop-blur-sm hover:bg-synema-card transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-24 md:-mt-32 relative z-10">

        {/* ── Show info ── */}
        <div className="flex gap-4 md:gap-6 mb-6">
          {/* Poster */}
          {posterUrl && (
            <div className="flex-shrink-0 w-28 md:w-40 rounded-xl overflow-hidden border border-synema-border shadow-2xl">
              <img src={posterUrl} alt={show.name} className="w-full h-auto" />
            </div>
          )}

          {/* Meta */}
          <div className="flex-1 min-w-0 pt-6 md:pt-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2 leading-tight">
              {show.name}
            </h1>

            <div className="flex items-center gap-3 flex-wrap mb-3 text-sm text-gray-400">
              <span className="flex items-center gap-1 text-yellow-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                {show.vote_average.toFixed(1)}
              </span>
              {year && <span>{year}</span>}
              {show.origin_country[0] && <span>{show.origin_country[0]}</span>}
              {show.genres.slice(0, 3).map(g => (
                <span key={g.id} className="px-2 py-0.5 bg-synema-card border border-synema-border rounded-full text-xs">
                  {g.name}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Tv className="w-3.5 h-3.5" />
                {show.number_of_seasons} season{show.number_of_seasons !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {show.number_of_episodes} episodes
              </span>
              <span className="px-2 py-0.5 bg-synema-card border border-synema-border rounded text-xs">
                {show.status}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleListAction}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                  inList
                    ? 'bg-synema-crimson/20 border-synema-crimson/50 text-white'
                    : 'bg-synema-card border-synema-border text-gray-300 hover:border-synema-violet/50 hover:text-white'
                }`}
              >
                {inList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {inList ? 'In My List' : 'Add to List'}
              </button>
            </div>
          </div>
        </div>

        {/* Overview */}
        {show.overview && (
          <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-2xl">
            {show.overview}
          </p>
        )}

        {/* ── Season selector ── */}
        {realSeasons.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold tracking-widest uppercase text-gray-600 mb-3">Season</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {realSeasons.map(s => (
                <button
                  key={s.season_number}
                  onClick={() => setSelectedSeasonNum(s.season_number)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    selectedSeasonNum === s.season_number
                      ? 'bg-synema-violet text-white border-transparent shadow-md shadow-synema-violet/30'
                      : 'bg-synema-card border-synema-border text-gray-400 hover:text-white hover:border-synema-violet/40'
                  }`}
                >
                  Season {s.season_number}
                  <span className="ml-1.5 opacity-60 font-normal">{s.episode_count}ep</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Episode number tabs ── */}
        {episodes.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold tracking-widest uppercase text-gray-600 mb-3">Episodes</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => setSelectedEp(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 min-w-[40px] text-center ${
                  selectedEp === null
                    ? 'bg-synema-violet text-white border-transparent'
                    : 'bg-synema-card border-synema-border text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              {episodes.map(ep => (
                <button
                  key={ep.episode_number}
                  onClick={() => setSelectedEp(
                    selectedEp === ep.episode_number ? null : ep.episode_number
                  )}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 min-w-[40px] text-center ${
                    selectedEp === ep.episode_number
                      ? 'bg-synema-violet text-white border-transparent'
                      : 'bg-synema-card border-synema-border text-gray-400 hover:text-white'
                  }`}
                >
                  {String(ep.episode_number).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Episode list ── */}
        {loadingSeason ? (
          <div className="space-y-3 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-synema-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 mb-10">
            {displayedEpisodes.map(ep => (
              <div
                key={ep.id}
                className="flex items-start gap-3 p-3 bg-synema-card/60 border border-synema-border rounded-xl hover:border-synema-violet/30 hover:bg-synema-card transition-all duration-200 group"
              >
                <EpisodeStill path={ep.still_path} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs text-synema-violet font-bold">
                        E{String(ep.episode_number).padStart(2, '0')}
                      </span>
                      <h3 className="text-sm font-semibold text-white truncate leading-tight">
                        {ep.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ep.runtime && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {ep.runtime}m
                          </span>
                        )}
                        {ep.vote_average > 0 && (
                          <span className="flex items-center gap-1 text-xs text-yellow-500">
                            <Star className="w-3 h-3 fill-yellow-500" />
                            {ep.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleWatch(ep)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-brand hover:bg-gradient-brand-hover rounded-lg text-xs font-bold text-white shadow-sm shadow-synema-violet/20 hover:shadow-synema-violet/40 hover:scale-105 transition-all duration-200"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Watch
                    </button>
                  </div>

                  {ep.overview && (
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {ep.overview}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Related shows ── */}
        {similar.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Tv className="w-4 h-4 text-synema-violet" />
              You Might Also Like
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {similar.map(s => (
                <MovieCard key={s.id} movie={s} variant="grid" />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
