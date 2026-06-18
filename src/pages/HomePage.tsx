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
    <main className="pt-16 mb-16 md:mb-0">
     {isAdmin && (
        <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 50 }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              background: 'rgba(124,58,237,0.85)',
              border: '1px solid rgba(124,58,237,0.5)',
              borderRadius: 20,
              padding: '6px 14px',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            ⚡ Admin
          </button>
        </div>
      )}
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
