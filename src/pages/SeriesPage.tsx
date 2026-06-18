import { Link } from 'react-router-dom';
import { Tv } from 'lucide-react';

export function SeriesPage() {
  return (
    <main className="pt-4 md:pt-8 min-h-screen pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-32 h-32 mb-8 rounded-full bg-synema-card flex items-center justify-center">
            <Tv className="w-16 h-16 text-gray-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">TV Series Coming Soon</h1>
          <p className="text-gray-400 text-center max-w-md mb-8">
            We&apos;re working on bringing you the best TV series. Check back soon for updates!
          </p>
          <Link
            to="/"
            className="px-6 py-3 bg-gradient-brand rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-synema-violet/30 transition-shadow"
          >
            Browse Movies Instead
          </Link>
        </div>
      </div>
    </main>
  );
}
