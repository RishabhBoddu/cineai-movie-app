import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import Skeleton from '../components/Skeleton';
import { Search as SearchIcon, Filter, X, Film, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Metadata loaders
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);

  // Filter States
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedRuntime, setSelectedRuntime] = useState(240); // default maximum minutes
  const [selectedProvider, setSelectedProvider] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Predefined streaming providers options
  const STREAMING_PROVIDERS = [
    "Netflix", "Prime Video", "Disney+", "JioHotstar", "Apple TV+", "Hulu", "Max", "Sony LIV", "ZEE5"
  ];

  // Load genres and languages lists
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [genRes, langRes] = await Promise.all([
          fetch('/api/movies/genres'),
          fetch('/api/movies/languages')
        ]);
        if (genRes.ok) setGenres(await genRes.ok ? await genRes.json() : []);
        if (langRes.ok) setLanguages(await langRes.ok ? await langRes.json() : []);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  // Main search and discovery fetch pipeline
  const fetchSearchResults = async (currentPage = 1, append = false) => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '';
      
      // If we have filters active (even if a query string exists, discover endpoint handles tags better)
      if (selectedGenre || selectedLanguage || selectedYear || selectedRating > 0 || selectedRuntime < 240 || selectedProvider) {
        endpoint = `/api/movies/discover?page=${currentPage}`;
        if (selectedGenre) endpoint += `&genre=${selectedGenre}`;
        if (selectedLanguage) endpoint += `&language=${selectedLanguage}`;
        if (selectedYear) endpoint += `&year=${selectedYear}`;
        if (selectedRating > 0) endpoint += `&rating_min=${selectedRating}`;
        if (selectedRuntime < 240) endpoint += `&runtime_max=${selectedRuntime}`;
        if (selectedProvider) endpoint += `&provider=${encodeURIComponent(selectedProvider)}`;
      } else {
        // Simple search query fallback
        const currentQuery = searchQuery.trim() || queryParam.trim();
        if (currentQuery) {
          endpoint = `/api/movies/search?q=${encodeURIComponent(currentQuery)}`;
        } else {
          // No parameters: discover popular movies
          endpoint = `/api/movies/discover?page=${currentPage}`;
        }
      }

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Search request failed. Please check network.');

      const data = await res.json();
      
      if (append) {
        setResults((prev) => [...prev, ...data]);
      } else {
        setResults(data);
      }
      
      // If result set count is low, assume end of collection page limit reached
      setHasMore(data.length >= 10);
    } catch (err) {
      console.error('Failed search fetch:', err);
      setError(err.message || 'Searching error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Sync parameter queries on URL change
  useEffect(() => {
    setSearchQuery(queryParam);
    setPage(1);
    fetchSearchResults(1, false);
  }, [queryParam, selectedGenre, selectedLanguage, selectedYear, selectedRating, selectedRuntime, selectedProvider]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams(searchQuery.trim() ? { q: searchQuery.trim() } : {});
    setPage(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSearchResults(nextPage, true);
  };

  const clearAllFilters = () => {
    setSelectedGenre('');
    setSelectedLanguage('');
    setSelectedYear('');
    setSelectedRating(0);
    setSelectedRuntime(240);
    setSelectedProvider('');
    setSearchParams({});
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-bg-dark pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Search Input Title block */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <form onSubmit={handleSubmit} className="relative flex items-center bg-neutral-900 border border-white/5 focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red rounded-lg overflow-hidden px-4 py-3 w-full md:max-w-xl transition shadow-lg">
          <input
            type="text"
            placeholder="Search by movie title, actor, director, genre, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-white placeholder-neutral-400 text-sm w-full focus:outline-none pr-8"
          />
          <button type="submit" className="absolute right-4 text-neutral-400 hover:text-white cursor-pointer">
            <SearchIcon className="w-5 h-5" />
          </button>
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-bold shadow-md cursor-pointer transition select-none ${
            showFilters 
              ? 'bg-brand-red border-brand-red text-white' 
              : 'bg-neutral-900 border-white/5 text-neutral-300 hover:border-neutral-500'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Advanced Filters</span>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Advanced Filters Drawer/Sidebar (Expandable Panel) */}
      {showFilters && (
        <div className="bg-neutral-900/60 border border-white/5 rounded-xl p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-slide-up relative">
          
          {/* Genre selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Genre Category</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full bg-neutral-950 border border-white/5 rounded p-2 text-sm text-neutral-300 outline-none focus:border-brand-red"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Language selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Original Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-neutral-950 border border-white/5 rounded p-2 text-sm text-neutral-300 outline-none focus:border-brand-red"
            >
              <option value="">All Languages</option>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Release Year */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Release Year</label>
            <input
              type="number"
              placeholder="e.g. 2024"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              min="1900"
              max="2030"
              className="w-full bg-neutral-950 border border-white/5 rounded p-2 text-sm text-neutral-300 outline-none focus:border-brand-red placeholder-neutral-600"
            />
          </div>

          {/* Streaming Platform */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Streaming Platform</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full bg-neutral-950 border border-white/5 rounded p-2 text-sm text-neutral-300 outline-none focus:border-brand-red"
            >
              <option value="">All Streaming Platforms</option>
              {STREAMING_PROVIDERS.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* TMDB Rating Filter */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Min TMDB Rating</label>
              <span className="text-xs font-bold text-amber-400">{selectedRating.toFixed(1)}+</span>
            </div>
            <input
              type="range"
              min="0"
              max="9"
              step="0.5"
              value={selectedRating}
              onChange={(e) => setSelectedRating(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-brand-red"
            />
          </div>

          {/* Runtime Filter */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Max Runtime</label>
              <span className="text-xs font-bold text-neutral-200">{selectedRuntime} min</span>
            </div>
            <input
              type="range"
              min="40"
              max="240"
              step="5"
              value={selectedRuntime}
              onChange={(e) => setSelectedRuntime(parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-brand-red"
            />
          </div>

          {/* Clear Controls */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-2 flex justify-end items-end pb-0.5">
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white font-bold transition uppercase cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Clear All Options</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-semibold p-4 rounded-xl flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Grid Results */}
      <div>
        <h2 className="text-sm uppercase tracking-wider font-bold text-neutral-400 mb-6 relative pl-3.5">
          {queryParam || selectedGenre || selectedLanguage || selectedYear || selectedRating > 0 || selectedProvider
            ? `Matching Results (${results.length})` 
            : 'Popular Recommendations'
          }
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3/4 bg-brand-red rounded"></span>
        </h2>

        {results.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <Film className="w-16 h-16 text-neutral-700 mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No movies found</h3>
            <p className="text-sm text-neutral-400 text-center max-w-sm">
              We couldn't locate any movies matching those criteria. Try broadening your keywords or clearing filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        {/* Loading placeholder skeleton */}
        {loading && (
          <div className="mt-8">
            <Skeleton.Grid count={6} />
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loading && results.length > 0 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2.5 bg-neutral-900 border border-white/5 hover:border-neutral-500 text-white text-sm font-bold rounded-lg transition shadow-md cursor-pointer hover:bg-neutral-800"
            >
              Load More Movies
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
