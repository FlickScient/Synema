import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import type { Movie } from '../types/tmdb';
import { SkeletonMovieCard } from './Skeleton';

interface MovieRowProps {
  title: string;
  movies?: Movie[];
  loading?: boolean;
  seeAllPath?: string; // e.g. "/category/action" — omit to hide the "See all" link
}

export function MovieRow({ title, movies, loading, seeAllPath }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [movies]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollability, 300);
    }
  };

  return (
    <section className="relative py-4">
      <div className="flex items-center justify-between mb-4 px-4 md:px-8 lg:px-16">
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
        {seeAllPath && (
          <Link
            to={seeAllPath}
            className="flex items-center gap-1 text-sm font-semibold text-gray-400 active:text-white active:scale-95 transition-all duration-150"
          >
            See all
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-0 bottom-0 z-10 w-12 md:w-16 items-center justify-center bg-gradient-to-r from-synema-bg to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
        )}
        <div
          ref={rowRef}
          onScroll={checkScrollability}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 lg:px-16 pb-2"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonMovieCard key={i} />)
            : movies?.map(movie => <MovieCard key={movie.id} movie={movie} />)}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-0 bottom-0 z-10 w-12 md:w-16 items-center justify-center bg-gradient-to-l from-synema-bg to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}
      </div>
    </section>
  );
}
