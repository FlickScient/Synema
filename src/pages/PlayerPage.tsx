import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  ArrowLeft,
  Subtitles,
  Minimize,
} from 'lucide-react';
import { getMovieDetails, getImageUrl, POSTER_SIZE, BACKDROP_SIZE } from '../services/tmdb';
import type { MovieDetails } from '../types/tmdb';

const QUALITY_OPTIONS = ['480p', '720p', '1080p', '4K'];

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered] = useState(35);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration] = useState('2:18:32');
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMovie = async () => {
      if (!id) return;
      try {
        const details = await getMovieDetails(parseInt(id));
        setMovie(details);
      } catch (error) {
        console.error('Failed to load movie:', error);
      }
    };
    loadMovie();
  }, [id]);

  useEffect(() => {
    if (playing) {
      const interval = setInterval(() => {
        setProgress(prev => (prev < 100 ? prev + 0.05 : prev));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [playing]);

  useEffect(() => {
    const minutes = Math.floor((progress / 100) * 180);
    const seconds = Math.floor(((progress / 100) * 180 * 60) % 60);
    setCurrentTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }, [progress]);

  const hideControls = useCallback(() => {
    setShowControls(false);
    setShowSettings(false);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(hideControls, 3000);
  }, [hideControls]);

  const handleMouseMove = () => {
    showControlsTemporarily();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    setProgress(Math.max(0, Math.min(100, percent)));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
    if (parseFloat(e.target.value) > 0) {
      setMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            navigate(-1);
          }
          break;
        case ' ':
          e.preventDefault();
          setPlaying(prev => !prev);
          break;
        case 'ArrowLeft':
          setProgress(prev => Math.max(0, prev - 0.5));
          break;
        case 'ArrowRight':
          setProgress(prev => Math.min(100, prev + 0.5));
          break;
        case 'm':
          setMuted(prev => !prev);
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, exitFullscreen, navigate]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[100] group"
      onMouseMove={handleMouseMove}
      onMouseLeave={hideControls}
    >
      <div className="absolute inset-0">
        {movie?.backdrop_path && (
          <div className={`absolute inset-0 transition-opacity duration-500 ${playing ? 'opacity-0' : 'opacity-100'}`}>
            <img
              src={getImageUrl(movie.backdrop_path, BACKDROP_SIZE)}
              alt={movie.title}
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.3)' }}
            />
          </div>
        )}

        <div className={`absolute inset-0 flex items-center justify-center ${playing ? 'hidden' : 'block'}`}>
          <button
            onClick={() => setPlaying(true)}
            className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-300 group"
          >
            <Play className="w-12 h-12 text-white fill-white ml-2" />
          </button>
        </div>

        {playing && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />
        )}
      </div>

      <div
        className={`absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent px-6 py-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            {movie?.poster_path && (
              <img
                src={getImageUrl(movie.poster_path, POSTER_SIZE)}
                alt={movie.title}
                className="w-10 h-auto rounded"
              />
            )}
            <span className="text-white font-medium text-lg">{movie?.title}</span>
          </div>
        </div>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 px-6 pb-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="mb-4">
          <div className="relative h-1.5 group/seek">
            <div className="absolute inset-y-0 left-0 w-full bg-white/20 rounded-full" />
            <div
              className="absolute inset-y-0 left-0 bg-synema-violet rounded-full"
              style={{ width: `${buffered}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-white rounded-full"
              style={{ width: `${progress}%` }}
            />
            <button
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: 'translateX(-50%) translateY(-50%)' }}
            />
            <div
              className="absolute inset-y-0 -top-2 bottom-2 cursor-pointer"
              onClick={handleSeek}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPlaying(prev => !prev)}
              className="p-2 text-white hover:text-synema-violet transition-colors"
            >
              {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-white" />}
            </button>

            <button
              onClick={() => setProgress(prev => Math.max(0, prev - 2))}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={() => setProgress(prev => Math.min(100, prev + 2))}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={() => setMuted(prev => !prev)}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-synema-violet"
              />
            </div>

            <span className="text-sm text-white/70">
              {currentTime} / {duration}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowSettings(prev => !prev)}
                className={`p-2 transition-colors ${
                  showSettings ? 'text-synema-violet' : 'text-white/70 hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-synema-card border border-synema-border rounded-xl overflow-hidden shadow-xl animate-scale-in">
                  <div className="p-3 border-b border-synema-border">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Quality</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {QUALITY_OPTIONS.map(q => (
                        <button
                          key={q}
                          onClick={() => setSelectedQuality(q)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            selectedQuality === q
                              ? 'bg-synema-violet text-white'
                              : 'bg-synema-surface text-gray-400 hover:text-white'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setSubtitlesEnabled(prev => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-synema-surface transition-colors"
                  >
                    <span className="text-sm text-gray-300">Subtitles</span>
                    <span className={`text-xs ${subtitlesEnabled ? 'text-synema-violet' : 'text-gray-500'}`}>
                      {subtitlesEnabled ? 'On' : 'Off'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setSubtitlesEnabled(prev => !prev)}
              className={`p-2 transition-colors ${
                subtitlesEnabled ? 'text-synema-violet' : 'text-white/70 hover:text-white'
              }`}
            >
              <Subtitles className="w-5 h-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {showControls && (
        <Link
          to={`/movie/${id}`}
          className="absolute top-4 right-4 px-4 py-2 bg-synema-card/80 backdrop-blur-sm rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
        >
          View Details
        </Link>
      )}
    </div>
  );
}
