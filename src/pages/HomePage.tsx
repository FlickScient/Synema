import { useState, useEffect } from 'react';
import { Hero } from '../components/Hero';
import { MovieRow } from '../components/MovieRow';
import { SkeletonHero } from '../components/Skeleton';
import type { Movie } from '../types/tmdb';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchTrending,
  fetchNewReleases,
  fetchTopRated,
  fetchAction,
  fetchDrama,
} from '../services/tmdb';

export function HomePage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [featured, setFeatured] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [action, setAction] = useState<Movie[]>([]);
  const [drama, setDrama] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        const [
          trendingData,
          newReleasesData,
          topRatedData,
          actionData,
          dramaData,
        ] = await Promise.all([
          fetchTrending(),
          fetchNewReleases(),
          fetchTopRated(),
          fetchAction(),
          fetchDrama(),
        ]);

        setFeatured(trendingData.slice(0, 7).filter(m => m.backdrop_path));
        setTrending(trendingData);
        setNewReleases(newReleasesData);
        setTopRated(topRatedData);
        setAction(actionData);
        setDrama(dramaData);
      } catch (error) {
        console.error('Failed to load movies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
   }, []);

  return (
    <main className="min-h-screen">
      {loading ? (
        <SkeletonHero />
      ) : featured.length > 0 ? (
        <Hero movies={featured} />
      ) : null}

      <div className="space-y-6 mt-8">
        <MovieRow title="Trending Now" movies={trending} loading={loading} />
        <MovieRow title="New Releases" movies={newReleases} loading={loading} />
        <MovieRow title="Top Rated" movies={topRated} loading={loading} />
        <MovieRow title="Action & Adventure" movies={action} loading={loading} />
        <MovieRow title="Drama" movies={drama} loading={loading} />
      </div>
    </main>
  );
}
