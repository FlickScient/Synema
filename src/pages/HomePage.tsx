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
  getAnimeSeries,
  fetchByGenre,
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
  const [anime, setAnime] = useState<Movie[]>([]);
  const [comedy, setComedy] = useState<Movie[]>([]);
  const [horror, setHorror] = useState<Movie[]>([]);
  const [scifi, setScifi] = useState<Movie[]>([]);
  const [thriller, setThriller] = useState<Movie[]>([]);
  const [romance, setRomance] = useState<Movie[]>([]);
  const [family, setFamily] = useState<Movie[]>([]);
  const [documentary, setDocumentary] = useState<Movie[]>([]);
  const [animation, setAnimation] = useState<Movie[]>([]);
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
          animeData,
          comedyData,
          horrorData,
          scifiData,
          thrillerData,
          romanceData,
          familyData,
          documentaryData,
          animationData,
        ] = await Promise.all([
          fetchTrending(),
          fetchNewReleases(),
          fetchTopRated(),
          fetchAction(),
          fetchDrama(),
          getAnimeSeries(),
          fetchByGenre(35),   // Comedy
          fetchByGenre(27),   // Horror
          fetchByGenre(878),  // Science Fiction
          fetchByGenre(53),   // Thriller
          fetchByGenre(10749),// Romance
          fetchByGenre(10751),// Family
          fetchByGenre(99),   // Documentary
          fetchByGenre(16),   // Animation
        ]);
        setFeatured(trendingData.slice(0, 7).filter(m => m.backdrop_path));
        setTrending(trendingData);
        setNewReleases(newReleasesData);
        setTopRated(topRatedData);
        setAction(actionData);
        setDrama(dramaData);
        setAnime(animeData);
        setComedy(comedyData);
        setHorror(horrorData);
        setScifi(scifiData);
        setThriller(thrillerData);
        setRomance(romanceData);
        setFamily(familyData);
        setDocumentary(documentaryData);
        setAnimation(animationData);
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
        <MovieRow title="Trending Now" movies={trending} loading={loading} seeAllPath="/category/trending" />
        <MovieRow title="New Releases" movies={newReleases} loading={loading} seeAllPath="/category/new-releases" />
        <MovieRow title="Top Rated" movies={topRated} loading={loading} seeAllPath="/category/top-rated" />
        <MovieRow title="Action & Adventure" movies={action} loading={loading} seeAllPath="/category/action" />
        <MovieRow title="Drama" movies={drama} loading={loading} seeAllPath="/category/drama" />
        <MovieRow title="Anime" movies={anime} loading={loading} seeAllPath="/category/anime" />
        <MovieRow title="Comedy" movies={comedy} loading={loading} seeAllPath="/category/comedy" />
        <MovieRow title="Horror" movies={horror} loading={loading} seeAllPath="/category/horror" />
        <MovieRow title="Science Fiction" movies={scifi} loading={loading} seeAllPath="/category/scifi" />
        <MovieRow title="Thriller" movies={thriller} loading={loading} seeAllPath="/category/thriller" />
        <MovieRow title="Romance" movies={romance} loading={loading} seeAllPath="/category/romance" />
        <MovieRow title="Family" movies={family} loading={loading} seeAllPath="/category/family" />
        <MovieRow title="Documentary" movies={documentary} loading={loading} seeAllPath="/category/documentary" />
        <MovieRow title="Animation" movies={animation} loading={loading} seeAllPath="/category/animation" />
      </div>
    </main>
  );
}
