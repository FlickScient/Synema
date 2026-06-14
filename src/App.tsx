import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { MyListProvider } from './context/MyListContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { FlickScientOrb } from './components/FlickScient';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { PlayerPage } from './pages/PlayerPage';
import { MyListPage } from './pages/MyListPage';
import { MoviesPage } from './pages/MoviesPage';
import { SeriesPage } from './pages/SeriesPage';
import { AuthPage } from './pages/AuthPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppLayout() {
  const { pathname } = useLocation();
  const isPlayerPage = pathname.startsWith('/player');
  const isAuthPage = pathname.startsWith('/auth');

  return (
    <>
      {!isPlayerPage && !isAuthPage && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/player/:id" element={<PlayerPage />} />
        <Route path="/my-list" element={<MyListPage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="*"
          element={
            <main className="pt-20 min-h-screen flex flex-col items-center justify-center">
              <h1 className="text-6xl font-bold text-synema-violet mb-4">404</h1>
              <p className="text-xl text-gray-400 mb-8">Page not found</p>
              <a href="/" className="px-6 py-3 bg-gradient-brand rounded-lg font-semibold text-white">
                Go Home
              </a>
            </main>
          }
        />
      </Routes>
      {isPlayerPage && <FlickScientOrb />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MyListProvider>
          <ScrollToTop />
          <AppLayout />
        </MyListProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
