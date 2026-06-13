import axios from 'axios';
import type { Movie, MovieDetails, Credits, TMDBResponse, MovieVideos } from '../types/tmdb';

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

export const getFeaturedMovies = async (): Promise<Movie[]> => {
  const trending = await fetchTrending();
  return trending.slice(0, 5).filter(movie => movie.backdrop_path);
};
