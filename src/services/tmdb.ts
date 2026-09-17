import axios from 'axios';
import type { Movie, MovieDetails, Credits, TMDBResponse, MovieVideos, TVShow, TVSeason } from '../types/tmdb';

const API_KEY = '77d781c1d868f9a8c2c79a0e38924d84';
const BASE_URL = 'https://api.themoviedb.org/3';

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
export const POSTER_SIZE = '/w500';
export const BACKDROP_SIZE = '/original';
export const PROFILE_SIZE = '/w185';

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

export const getImageUrl = (path: string | null, size: string = POSTER_SIZE): string | undefined => {
  if (!path) return undefined;
  return `${IMAGE_BASE_URL}${size}${path}`;
};

export const fetchTrending = async (): Promise<Movie[]> => {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/trending/movie/week');
  return data.results;
};

export const fetchNewReleases = async (): Promise<Movie[]> => {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/movie/now_playing');
  return data.results;
};

export const fetchTopRated = async (): Promise<Movie[]> => {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/movie/top_rated');
  return data.results;
};

export const fetchByGenre = async (genreId: number, page: number = 1): Promise<Movie[]> => {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/discover/movie', {
    params: {
      with_genres: genreId,
      page,
      sort_by: 'popularity.desc',
    },
  });
  return data.results;
};

export const fetchAction = async (): Promise<Movie[]> => fetchByGenre(28);
export const fetchDrama = async (): Promise<Movie[]> => fetchByGenre(18);

export const getAnimeMovies = async (): Promise<Movie[]> => {
  const pages = await Promise.all(
    [1, 2, 3, 4, 5].map(page =>
      tmdb.get<TMDBResponse<Movie>>('/discover/movie', {
        params: {
          with_genres: 16,
          with_origin_country: 'JP',
          sort_by: 'vote_count.desc',
          page,
        },
      })
    )
  );
  const results = pages.flatMap(p => p.data.results);
  return results.map(movie => ({ ...movie, media_type: 'movie' as const }));
};

export const getAnimeSeries = async (): Promise<Movie[]> => {
  const pages = await Promise.all(
    [1, 2, 3, 4, 5].map(page =>
      tmdb.get<TMDBResponse<Movie>>('/discover/tv', {
        params: {
          with_genres: 16,
          with_origin_country: 'JP',
          sort_by: 'vote_count.desc',
          page,
        },
      })
    )
  );
  const results = pages.flatMap(p => p.data.results);
  return results.map(series => ({ ...series, media_type: 'tv' as const }));
};

// ============================================================
// Discover system — Type / Catalog / Genre / Industry filters
// ============================================================

export interface PagedResult {
  results: Movie[];
  totalPages: number;
  page: number;
}

export type CatalogId = 'popular' | 'top_rated' | 'newest' | 'most_voted';

const CATALOG_SORT: Record<CatalogId, string> = {
  popular: 'popularity.desc',
  top_rated: 'vote_average.desc',
  newest: 'primary_release_date.desc',
  most_voted: 'vote_count.desc',
};

export const CATALOGS: { id: CatalogId; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'top_rated', label: 'Top Rated' },
  { id: 'newest', label: 'Newest' },
  { id: 'most_voted', label: 'Most Voted' },
];

export const MOVIE_GENRES: { id: number; name: string }[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

export const TV_GENRES: { id: number; name: string }[] = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
];

export const INDUSTRIES: { code: string; label: string }[] = [
  { code: 'en', label: 'Hollywood' },
  { code: 'hi', label: 'Bollywood' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'th', label: 'Thai' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'ms', label: 'Malay' },
  { code: 'id', label: 'Indonesian' },
];

export interface DiscoverOptions {
  genreId?: number;
  catalog?: CatalogId;
  language?: string;
  page?: number;
}

export const fetchDiscoverMovies = async (options: DiscoverOptions = {}): Promise<PagedResult> => {
  const { genreId, catalog = 'popular', language, page = 1 } = options;
  const params: Record<string, unknown> = {
    page,
    sort_by: CATALOG_SORT[catalog],
  };
  if (genreId) params.with_genres = genreId;
  if (language) params.with_original_language = language;
  if (catalog === 'top_rated' || catalog === 'most_voted') {
    params['vote_count.gte'] = 50;
  }
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/discover/movie', { params });
  return { results: data.results, totalPages: data.total_pages, page: data.page };
};

export const fetchDiscoverTV = async (options: DiscoverOptions = {}): Promise<PagedResult> => {
  const { genreId, catalog = 'popular', language, page = 1 } = options;
  const sortBy = catalog === 'newest' ? 'first_air_date.desc' : CATALOG_SORT[catalog];
  const params: Record<string, unknown> = {
    page,
    sort_by: sortBy,
  };
  if (genreId) params.with_genres = genreId;
  if (language) params.with_original_language = language;
  if (catalog === 'top_rated' || catalog === 'most_voted') {
    params['vote_count.gte'] = 50;
  }
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/discover/tv', { params });
  return { results: data.results, totalPages: data.total_pages, page: data.page };
};

export const searchMovies = async (query: string, genreId?: number): Promise<Movie[]> => {
  if (!query.trim()) return [];
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/search/movie', {
    params: {
      query,
      with_genres: genreId,
    },
  });
  return data.results;
};

export const searchTV = async (query: string, genreId?: number): Promise<Movie[]> => {
  if (!query.trim()) return [];
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/search/tv', {
    params: { query, with_genres: genreId },
  });
  return data.results;
};

export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
  const { data } = await tmdb.get<MovieDetails>(`/movie/${movieId}`);
  return data;
};

export const getMovieCredits = async (movieId: number): Promise<Credits> => {
  const { data } = await tmdb.get<Credits>(`/movie/${movieId}/credits`);
  return data;
};

export const getSimilarMovies = async (movieId: number): Promise<Movie[]> => {
  const { data } = await tmdb.get<TMDBResponse<Movie>>(`/movie/${movieId}/similar`);
  return data.results;
};

export const getMovieVideos = async (movieId: number): Promise<MovieVideos> => {
  const { data } = await tmdb.get<MovieVideos>(`/movie/${movieId}/videos`);
  return data;
};

export const getTVShowDetails = async (tvId: number): Promise<TVShow> => {
  const { data } = await tmdb.get<TVShow>(`/tv/${tvId}`);
  return data;
};

export const getTVSeasonDetails = async (tvId: number, seasonNumber: number): Promise<TVSeason> => {
  const { data } = await tmdb.get<TVSeason>(`/tv/${tvId}/season/${seasonNumber}`);
  return data;
};

export const getSimilarTV = async (tvId: number): Promise<Movie[]> => {
  const { data } = await tmdb.get<TMDBResponse<Movie>>(`/tv/${tvId}/similar`);
  return data.results;
};

export const getFeaturedMovies = async (): Promise<Movie[]> => {
  const trending = await fetchTrending();
  return trending.slice(0, 5).filter(movie => movie.backdrop_path);
};
