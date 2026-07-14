import React, { useRef, useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MovieRow = ({ title, movies }) => {
  const rowRef = useRef(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  if (!movies || movies.length === 0) return null;

  const updateButtons = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftBtn(scrollLeft > 5);
      setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    const el = rowRef.current;
    if (el) {
      el.addEventListener('scroll', updateButtons);
      // Run once on load to establish correct button visible status
      updateButtons();
      
      // Also listen to window resize
      window.addEventListener('resize', updateButtons);
    }
    return () => {
      if (el) el.removeEventListener('scroll', updateButtons);
      window.removeEventListener('resize', updateButtons);
    };
  }, [movies]);

  const handleScroll = (direction) => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div class="space-y-2 relative group/row py-4">
      {/* Title */}
      <h2 class="text-lg sm:text-xl font-bold tracking-tight px-4 md:px-8 text-white relative">
        {title}
        <span class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5/6 bg-brand-red rounded-r-md"></span>
      </h2>

      {/* Row container */}
      <div class="relative px-4 md:px-8">
        {/* Left Chevron Button */}
        {showLeftBtn && (
          <button
            onClick={() => handleScroll('left')}
            class="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-black/70 hover:bg-black/95 text-white p-2 rounded-full border border-white/10 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 shadow-xl cursor-pointer"
          >
            <ChevronLeft class="w-6 h-6" />
          </button>
        )}

        {/* Scrollable list */}
        <div
          ref={rowRef}
          class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 select-none"
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

        {/* Right Chevron Button */}
        {showRightBtn && (
          <button
            onClick={() => handleScroll('right')}
            class="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-black/70 hover:bg-black/95 text-white p-2 rounded-full border border-white/10 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 shadow-xl cursor-pointer"
          >
            <ChevronRight class="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MovieRow;
