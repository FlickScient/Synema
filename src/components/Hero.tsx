import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie } from '../types/tmdb';
import { getImageUrl, BACKDROP_SIZE, POSTER_SIZE } from '../services/tmdb';
import { useMyList } from '../context/MyListContext';
import { GENRE_MAP } from '../types/tmdb';

interface HeroProps {
  movies: Movie[];
}

export function Hero({ movies }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const transitioningRef = useRef(false);
  const { addToList, removeFromList, isInList } = useMyList();

  const currentMovie = movies[currentIndex];
  const inList = currentMovie ? isInList(currentMovie.id) : false;
  const backdropUrl = getImageUrl(currentMovie?.backdrop_path, BACKDROP_SIZE);
  const posterUrl = getImageUrl(currentMovie?.poster_path, POSTER_SIZE);

  const goTo = (index: number) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setTransitioning(false);
      transitioningRef.current = false;
    }, 450);
  };

  const goNext = () => goTo((currentIndex + 1) % movies.length);
  const goPrev = () => goTo((currentIndex - 1 + movies.length) % movies.length);

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      if (transitioningRef.current) return;
      transitioningRef.current = true;
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % movies.length);
        setTransitioning(false);
        transitioningRef.current = false;
      }, 450);
    }, 6000);
    return () => clearInterval(interval);
  }, [movies.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [movies]);

  if (!currentMovie) return null;

  const genres = currentMovie.genre_ids?.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 4) ?? [];
  const year = currentMovie.release_date?.split('-')[0];

  const handleListAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inList) removeFromList(currentMovie.id);
    else addToList(currentMovie);
  };

  return (
    <div className="relative w-full overflow-hidden hero-height">

      {/* ── Backdrop ── */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-synema-bg via-synema-bg/85 md:via-synema-bg/70 to-synema-bg/20 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-synema-bg via-synema-bg/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-synema-bg/50 via-transparent to-transparent" />
      </div>

      {/* ── Main content ── */}
      <div className="relative h-full flex items-end md:items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 pb-24 md:pb-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-12">

            {/* Left – Movie Info */}
            <div
              className={`w-full md:w-[48%] transition-all duration-500 ${
                transitioning ? 'opacity-0 translate-y-5' : 'opacity-100 translate-y-0'
              }`}
            >
              {year && (
                <span className="inline-flex items-center px-3 py-1 bg-synema-violet/15 border border-synema-violet/35 rounded-full text-xs font-semibold text-synema-violet tracking-widest uppercase mb-4">
                  {year}
                </span>
              )}

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-white leading-tight tracking-tight mb-4">
                {currentMovie.title}
              </h1>

              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/25 rounded-full">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold text-yellow-400">{currentMovie.vote_average.toFixed(1)}</span>
                </span>
                {genres.map(genre => (
                  <span
                    key={genre}
                    className="px-2.5 py-1 bg-synema-card/70 border border-synema-border rounded-full text-xs text-gray-300 font-medium backdrop-blur-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <p className="text-sm md:text-base text-gray-400 leading-relaxed mb-7 line-clamp-2 md:line-clamp-3 max-w-lg">
                {currentMovie.overview}
              </p>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  to={`/player/${currentMovie.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-brand hover:bg-gradient-brand-hover rounded-xl font-bold text-white text-sm shadow-lg shadow-synema-violet/30 hover:shadow-synema-violet/50 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Stream Now
                </Link>

                <button
                  onClick={handleListAction}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm ${
                    inList
                      ? 'border-synema-crimson/60 bg-synema-crimson/20 text-white'
                      : 'border-synema-border bg-synema-card/60 text-white hover:bg-synema-card'
                  }`}
                >
                  <Plus className={`w-4 h-4 transition-transform ${inList ? 'rotate-45' : ''}`} />
                  {inList ? 'Remove' : 'Add to List'}
                </button>

                <Link
                  to={`/movie/${currentMovie.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-synema-card/60 border border-synema-border rounded-xl font-semibold text-sm text-white hover:bg-synema-card transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
                >
                  <Info className="w-4 h-4" />
                  Details
                </Link>
              </div>
            </div>

            {/* Right – Poster Card (desktop only) */}
            <div
              className={`hidden md:flex md:w-[44%] justify-center items-center transition-all duration-700 ${
                transitioning ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              <div className="relative">
                {/* Outer ambient glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-brand opacity-25 blur-3xl scale-110 pointer-events-none" />

                {/* Floating poster card */}
                <div className="relative animate-float">
                  <div
                    className="w-52 lg:w-64 xl:w-72 rounded-2xl overflow-hidden border border-synema-violet/30 shadow-2xl"
                    style={{ backdropFilter: 'blur(16px)' }}
                  >
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={currentMovie.title}
                        className="w-full h-auto object-cover"
                        loading="eager"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-synema-card flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Poster</span>
                      </div>
                    )}
                    {/* Glass strip */}
                    <div className="absolute bottom-0 inset-x-0 px-3 py-2.5 bg-gradient-to-t from-synema-bg/95 via-synema-bg/60 to-transparent backdrop-blur-sm">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-white">{currentMovie.vote_average.toFixed(1)}</span>
                        {year && <span className="text-xs text-gray-400 ml-1">· {year}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge – top right */}
                <div className="absolute -top-3 -right-4 animate-float-delayed">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-synema-card/80 border border-synema-violet/40 rounded-xl shadow-lg text-xs font-bold text-synema-violet"
                    style={{ backdropFilter: 'blur(12px)' }}
                  >
                    🎬 Trending
                  </div>
                </div>

                {/* Floating badge – bottom left */}
                <div className="absolute -bottom-3 -left-4 animate-float-slow">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-synema-card/80 border border-synema-crimson/30 rounded-xl shadow-lg text-xs font-bold text-white"
                    style={{ backdropFilter: 'blur(12px)' }}
                  >
                    ▶ Watch Now
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Arrow navigation (desktop) ── */}
      {movies.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous"
            className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-synema-card/60 border border-synema-border rounded-full text-white hover:bg-synema-violet/20 hover:border-synema-violet/50 transition-all duration-200 backdrop-blur-sm z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            aria-label="Next"
            className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-synema-card/60 border border-synema-border rounded-full text-white hover:bg-synema-violet/20 hover:border-synema-violet/50 transition-all duration-200 backdrop-blur-sm z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {movies.length > 1 && (
        <div className="absolute bottom-8 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {movies.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-synema-violet shadow-sm shadow-synema-violet/60'
                  : 'w-1.5 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
