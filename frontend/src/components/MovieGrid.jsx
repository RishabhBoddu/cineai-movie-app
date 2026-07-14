import React from 'react';
import MovieCard from './MovieCard';

const MovieGrid = ({ movies }) => {
  if (!movies || movies.length === 0) {
    return (
      <div class="text-center py-16 bg-neutral-900/20 border border-white/5 rounded-xl flex flex-col items-center justify-center p-8">
        <p class="text-neutral-400 text-sm font-medium">No movies found in this selection.</p>
      </div>
    );
  }

  return (
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 px-1">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
};

export default MovieGrid;
