import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, Plus, Check, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

const MovieCarousel = ({ movies }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const { user, isFavorite, addFavorite, removeFavorite, inWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const navigate = useNavigate();
  const [backdropError, setBackdropError] = useState(false);

  useEffect(() => {
    setBackdropError(false);
  }, [currentIdx]);

  useEffect(() => {
    if (!movies || movies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % movies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [movies]);

  if (!movies || movies.length === 0) return null;

  const activeMovie = movies[currentIdx];
  const releaseYear = activeMovie.release_date ? activeMovie.release_date.split('-')[0] : 'N/A';

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % movies.length);
  };

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const handlePlayClick = () => {
    navigate(`/movie/${activeMovie.id}`);
  };

  const handleWatchlistToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (inWatchlist(activeMovie.id)) {
      await removeFromWatchlist(activeMovie.id);
    } else {
      await addToWatchlist(activeMovie);
    }
  };

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (isFavorite(activeMovie.id)) {
      await removeFavorite(activeMovie.id);
    } else {
      await addFavorite(activeMovie);
    }
  };

  return (
    <div className="relative w-full h-[450px] sm:h-[550px] md:h-[620px] overflow-hidden group">
      {/* Background Image / Gradients */}
      {activeMovie.backdrop_path && !backdropError ? (
        <div className="absolute inset-0">
          <img
            src={`https://image.tmdb.org/t/p/original${activeMovie.backdrop_path}`}
            alt={activeMovie.title}
            onError={() => setBackdropError(true)}
            className="w-full h-full object-cover object-top transition-all duration-1000 ease-in-out scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-bg-dark/80 via-transparent to-transparent"></div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-900 to-brand-red/20">
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/60 to-transparent"></div>
        </div>
      )}

      {/* Banner Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16 sm:pb-20 w-full z-10 space-y-4">
        {/* Rating/Match tags */}
        <div className="flex items-center gap-3">
          {activeMovie.vote_average > 0 && (
            <span className="text-xs sm:text-sm font-bold text-emerald-400">
              {Math.round(activeMovie.vote_average * 10)}% Match
            </span>
          )}
          <span className="text-xs sm:text-sm text-neutral-400 font-medium">{releaseYear}</span>
          <span className="px-2 py-0.5 border border-neutral-600 rounded text-[10px] sm:text-xs text-neutral-400 font-semibold uppercase">
            HD
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-md max-w-3xl leading-none transition-all">
          {activeMovie.title}
        </h1>

        {activeMovie.overview && (
          <p className="text-sm sm:text-base text-neutral-300 max-w-2xl line-clamp-3 font-normal leading-relaxed drop-shadow-sm">
            {activeMovie.overview}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handlePlayClick}
            className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-neutral-200 text-black font-bold rounded shadow-lg transition duration-200 text-sm cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current text-black" />
            <span>Play Details</span>
          </button>

          <button
            onClick={handleWatchlistToggle}
            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800/85 hover:bg-neutral-700/90 border border-neutral-700 hover:border-neutral-500 text-white font-bold rounded shadow-lg transition duration-200 text-sm cursor-pointer"
          >
            {inWatchlist(activeMovie.id) ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>On Watchlist</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Watchlist</span>
              </>
            )}
          </button>

          <button
            onClick={handleFavoriteToggle}
            className={`p-2.5 rounded border shadow-lg transition duration-200 cursor-pointer ${
              isFavorite(activeMovie.id)
                ? 'bg-brand-red/20 border-brand-red text-brand-red'
                : 'bg-neutral-800/85 border-neutral-700 text-white hover:border-white'
            }`}
            title={isFavorite(activeMovie.id) ? 'Remove Favorite' : 'Add Favorite'}
          >
            <Heart className={`w-4 h-4 ${isFavorite(activeMovie.id) ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation arrows (visible on hover) */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/80 text-white border border-white/5 opacity-0 group-hover:opacity-100 transition duration-300 cursor-pointer z-20"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/80 text-white border border-white/5 opacity-0 group-hover:opacity-100 transition duration-300 cursor-pointer z-20"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 right-8 flex items-center gap-1.5 z-20">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIdx(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIdx ? 'w-6 bg-brand-red' : 'w-1.5 bg-neutral-600'
            }`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default MovieCarousel;
