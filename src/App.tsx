import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { MyListProvider } from './context/MyListContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { FlickScientOrb } from './components/FlickScient';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { PlayerPage } from './pages/PlayerPage';
import { MyListPage } from './pages/MyListPage';
import { MoviesPage } from './pages/MoviesPage';
import { SeriesPage } from './pages/SeriesPage';
import { AuthPage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';

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
  const showChrome = !isPlayerPage && !isAuthPage;

  return (
    <div className="flex min-h-screen bg-synema-bg">
      <ScrollToTop />

      {/* Desktop sidebar */}
      {showChrome && <Sidebar />}

      {/* Main content */}
      <div className={`flex-1 min-w-0 w-full ${showChrome ? 'md:ml-60' : ''}`}>

        {/* Mobile navbar (top + bottom bars) */}
        {showChrome && <Navbar />}

        {/* Page content — mobile gets pt-14 for top bar, desktop gets none */}
        <div className={showChrome ? 'pt-14 pb-16 md:pt-0 md:pb-0' : ''}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
            <Route path="/player/:id" element={<PlayerPage />} />
            <Route path="/my-list" element={<MyListPage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route
              path="*"
              element={
                <main className="min-h-screen flex flex-col items-center justify-center">
                  <h1 className="text-6xl font-bold text-synema-violet mb-4">404</h1>
                  <p className="text-xl text-gray-400 mb-8">Page not found</p>
                  <a href="/" className="px-6 py-3 bg-gradient-brand rounded-lg font-semibold text-white">
                    Go Home
                  </a>
                </main>
              }
            />
          </Routes>
        </div>

        {isPlayerPage && <FlickScientOrb />}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MyListProvider>
          <AppLayout />
        </MyListProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
