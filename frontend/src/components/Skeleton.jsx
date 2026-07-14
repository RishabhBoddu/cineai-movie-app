import React from 'react';

export const MovieCardSkeleton = () => {
  return (
    <div class="flex-shrink-0 w-36 sm:w-44 md:w-48 bg-bg-card rounded-md overflow-hidden pulse-skeleton border border-white/5 shadow-lg">
      <div class="h-52 sm:h-64 md:h-72 bg-neutral-800"></div>
      <div class="p-3 space-y-2">
        <div class="h-4 bg-neutral-800 rounded w-3/4"></div>
        <div class="h-3 bg-neutral-800 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export const MovieRowSkeleton = ({ count = 6 }) => {
  return (
    <div class="space-y-4 py-4">
      <div class="h-6 bg-neutral-800 rounded w-48 pulse-skeleton"></div>
      <div class="flex gap-4 overflow-x-hidden no-scrollbar px-1">
        {Array.from({ length: count }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export const MovieGridSkeleton = ({ count = 12 }) => {
  return (
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} class="w-full bg-bg-card rounded-md overflow-hidden pulse-skeleton border border-white/5">
          <div class="h-56 sm:h-64 md:h-72 bg-neutral-800"></div>
          <div class="p-3 space-y-2">
            <div class="h-4 bg-neutral-800 rounded w-3/4"></div>
            <div class="h-3 bg-neutral-800 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const MovieDetailsSkeleton = () => {
  return (
    <div class="min-h-screen bg-bg-dark pt-20 px-4 md:px-8 pb-12 pulse-skeleton">
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Poster Skeleton */}
        <div class="md:col-span-1 bg-neutral-800 rounded-lg aspect-[2/3] w-full"></div>
        
        {/* Content Skeleton */}
        <div class="md:col-span-2 space-y-6">
          <div class="h-10 bg-neutral-800 rounded w-2/3"></div>
          <div class="flex gap-3">
            <div class="h-6 bg-neutral-800 rounded w-20"></div>
            <div class="h-6 bg-neutral-800 rounded w-16"></div>
            <div class="h-6 bg-neutral-800 rounded w-24"></div>
          </div>
          <div class="space-y-2">
            <div class="h-4 bg-neutral-800 rounded w-full"></div>
            <div class="h-4 bg-neutral-800 rounded w-full"></div>
            <div class="h-4 bg-neutral-800 rounded w-4/5"></div>
          </div>
          <div class="h-8 bg-neutral-800 rounded w-32"></div>
          <div class="h-32 bg-neutral-800 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
};

const Skeleton = {
  Card: MovieCardSkeleton,
  Row: MovieRowSkeleton,
  Grid: MovieGridSkeleton,
  Details: MovieDetailsSkeleton,
};

export default Skeleton;
