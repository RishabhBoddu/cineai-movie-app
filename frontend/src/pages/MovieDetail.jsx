import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MovieRow from '../components/MovieRow';
import Skeleton from '../components/Skeleton';
import StarRating from '../components/StarRating';
import ReviewSection from '../components/ReviewSection';
import { Star, Heart, Bookmark, Calendar, Clock, Film, ChevronLeft, User, DollarSign, Building, Globe, Play } from 'lucide-react';

const MovieDetail = () => {
  const { tmdb_id } = useParams();
  const navigate = useNavigate();
  const { 
    user, 
    isFavorite, 
    addFavorite, 
    removeFavorite, 
    inWatchlist, 
    addToWatchlist, 
    removeFromWatchlist, 
    rateMovie, 
    getUserRating, 
    addToHistory,
    collections,
    addMovieToCollection
  } = useAuth();
  
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [videos, setVideos] = useState([]);
  const [providers, setProviders] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posterError, setPosterError] = useState(false);
  const [backdropError, setBackdropError] = useState(false);
  const [castImageErrors, setCastImageErrors] = useState({});
  const [providerImageErrors, setProviderImageErrors] = useState({});
  const [videoFetchState, setVideoFetchState] = useState('loading');

  useEffect(() => {
    setPosterError(false);
    setBackdropError(false);
    setCastImageErrors({});
    setProviderImageErrors({});
  }, [tmdb_id]);

  // Fetch movie details, cast, similar recommendations, watch-providers and videos
  useEffect(() => {
    const loadVideos = async (id, retryCount = 0) => {
      try {
        setVideoFetchState('loading');
        const videoRes = await fetch(`/api/movies/${id}/videos`);
        if (videoRes.ok) {
          const data = await videoRes.json();
          setVideos(data);
          setVideoFetchState('success');
        } else {
          if (retryCount < 1) {
            console.log('Automated trailer fetch retry...');
            await loadVideos(id, retryCount + 1);
          } else {
            setVideoFetchState('failed');
          }
        }
      } catch (err) {
        if (retryCount < 1) {
          await loadVideos(id, retryCount + 1);
        } else {
          setVideoFetchState('failed');
        }
      }
    };

    const fetchMovieData = async () => {
      setLoading(true);
      setError('');
      try {
        const id = parseInt(tmdb_id);
        
        // Fetch details
        const detailRes = await fetch(`/api/movies/${id}`);
        if (!detailRes.ok) {
          throw new Error('Movie not found or failed to load details.');
        }
        const movieDetails = await detailRes.json();
        setMovie(movieDetails);

        // Fetch cast, similar, and watch providers in parallel
        const [castRes, similarRes, providerRes] = await Promise.all([
          fetch(`/api/movies/${id}/cast`),
          fetch(`/api/movies/${id}/similar`),
          fetch(`/api/movies/${id}/watch-providers`)
        ]);

        if (castRes.ok) setCast(await castRes.json());
        if (similarRes.ok) setSimilar(await similarRes.json());
        
        // Load videos separately with automatic retry rule
        loadVideos(id, 0);
        
        if (providerRes.ok) {
          const provData = await providerRes.json();
          // Extract streaming options for US or IN (fallback to first available)
          const regions = ["US", "IN"];
          let foundRegionData = null;
          for (let r of regions) {
            if (provData[r]) {
              foundRegionData = provData[r];
              break;
            }
          }
          if (!foundRegionData) {
            // Find first available region key
            const keys = Object.keys(provData);
            if (keys.length > 0) foundRegionData = provData[keys[0]];
          }
          setProviders(foundRegionData);
        }

        // Add to history
        if (user && movieDetails) {
          await addToHistory(movieDetails);
        }
      } catch (err) {
        console.error('Error loading movie data:', err);
        setError(err.message || 'Movie failed to load details.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
    window.scrollTo(0, 0);
  }, [tmdb_id, user]);

  const handleFavoriteClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isFavorite(movie.id)) {
      await removeFavorite(movie.id);
    } else {
      await addFavorite(movie);
    }
  };

  const handleWatchlistClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (inWatchlist(movie.id)) {
      await removeFromWatchlist(movie.id);
    } else {
      await addToWatchlist(movie);
    }
  };

  const handleRatingSubmit = async (score) => {
    if (!user) {
      navigate('/login');
      return;
    }
    await rateMovie(movie.id, score, movie);
  };

  if (loading) {
    return <Skeleton.Details />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark pt-24 px-4 flex flex-col items-center justify-center">
        <p className="text-brand-red text-sm font-semibold mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-sm font-bold text-white transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>
    );
  }

  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  const rating = movie.vote_average || 0;
  
  // Find YouTube trailer key if available
  const trailerVideo = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube');

  const retryVideoFetch = async () => {
    try {
      setVideoFetchState('loading');
      const videoRes = await fetch(`/api/movies/${movie.id}/videos`);
      if (videoRes.ok) {
        const data = await videoRes.json();
        setVideos(data);
        setVideoFetchState('success');
      } else {
        setVideoFetchState('failed');
      }
    } catch (err) {
      console.error('Error retrying video fetch:', err);
      setVideoFetchState('failed');
    }
  };
  
  // Format numbers to currencies
  const formatCurrency = (val) => {
    if (!val) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="min-h-screen bg-bg-dark pb-16 pt-16">
      {/* Banner Backdrop header */}
      <div className="relative w-full h-[280px] sm:h-[380px] md:h-[480px] overflow-hidden">
        {movie.backdrop_path && !backdropError ? (
          <div className="absolute inset-0">
            <img
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
              alt={movie.title}
              onError={() => setBackdropError(true)}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-dark to-black/30"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-neutral-900 to-brand-red/20">
            <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/80 to-transparent"></div>
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-4 md:left-8 bg-black/60 hover:bg-black/90 p-2.5 rounded-full border border-white/10 text-white transition shadow-xl z-20 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main Grid Card sheet layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 md:-mt-48 relative z-20 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          
          {/* Column 1: Poster Card */}
          <div className="md:col-span-1">
            <div className="w-full max-w-[280px] mx-auto bg-bg-card rounded-lg overflow-hidden border border-white/10 shadow-2xl aspect-[2/3] relative">
              {movie.poster_path && !posterError ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  onError={() => setPosterError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex flex-col items-center justify-center p-6 text-center">
                  <Film className="w-12 h-12 text-neutral-600 mb-4" />
                  <h3 className="text-sm font-bold text-white leading-snug">{movie.title}</h3>
                  <span className="text-xs text-neutral-500 mt-2 block">{releaseYear}</span>
                </div>
              )}
            </div>

            {/* Streaming Availability Providers */}
            {providers && providers.flatrate && (
              <div className="mt-6 bg-neutral-900/60 p-4 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">Available to Stream On</h4>
                <div className="flex flex-wrap gap-3">
                  {providers.flatrate.map((prov) => (
                    <div key={prov.provider_id} className="flex items-center gap-1.5 bg-black/40 border border-white/5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-300">
                      {prov.logo_path && !providerImageErrors[prov.provider_id] ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${prov.logo_path}`}
                          alt={prov.provider_name}
                          onError={() => setProviderImageErrors(prev => ({ ...prev, [prov.provider_id]: true }))}
                          className="w-5 h-5 rounded"
                        />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-brand-red fill-current" />
                      )}
                      <span>{prov.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Overview, Rating & Stats */}
          <div className="md:col-span-2 space-y-6 pt-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {movie.title} <span className="text-neutral-500 font-light">({releaseYear})</span>
            </h1>

            {/* Certification and duration stats */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-neutral-300 font-medium border-b border-white/5 pb-4">
              {rating > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold">{rating.toFixed(1)} Rating</span>
                </div>
              )}

              {movie.release_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span>{new Date(movie.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}

              {movie.runtime > 0 && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span>{movie.runtime} min</span>
                </div>
              )}

              {movie.certification && (
                <span className="px-2 py-0.5 border border-neutral-600 rounded text-xs text-neutral-400 font-semibold uppercase">
                  {movie.certification}
                </span>
              )}
            </div>

            {/* Interactive Rating selector */}
            <div className="bg-neutral-900/40 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-1">Your Personal Rating</h4>
                <p className="text-[10px] text-neutral-500">Rate this movie to fine-tune your recommendations.</p>
              </div>
              <StarRating
                initialRating={user ? getUserRating(movie.id) : 0}
                onRate={handleRatingSubmit}
              />
            </div>

            {/* Genres Tag list */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {movie.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3.5 py-1 text-xs font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700/50 rounded-full hover:border-neutral-500 transition cursor-default"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Plot/Overview */}
            {movie.overview && (
              <div className="space-y-2">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">Overview</h3>
                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-4xl">{movie.overview}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleFavoriteClick}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-bold shadow-md transition cursor-pointer ${isFavorite(movie.id) ? 'bg-brand-red/20 border-brand-red text-brand-red' : 'bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'}`}
              >
                <Heart className={`w-4 h-4 ${isFavorite(movie.id) ? 'fill-current' : ''}`} />
                <span>{isFavorite(movie.id) ? 'Favorited' : 'Add to Favorites'}</span>
              </button>

              <button
                onClick={handleWatchlistClick}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-bold shadow-md transition cursor-pointer ${inWatchlist(movie.id) ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'}`}
              >
                <Bookmark className={`w-4 h-4 ${inWatchlist(movie.id) ? 'fill-current' : ''}`} />
                <span>{inWatchlist(movie.id) ? 'On Watchlist' : 'Add to Watchlist'}</span>
              </button>

              {/* Add to Custom Collection Dropdown */}
              {user && collections.length > 0 && (
                <div className="relative">
                  <select
                    onChange={async (e) => {
                      const colId = parseInt(e.target.value);
                      if (colId) {
                        const success = await addMovieToCollection(colId, movie);
                        if (success) {
                          alert(`Successfully added to playlist!`);
                        }
                        e.target.value = ''; // reset selection
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-bold shadow-md bg-neutral-800 border-neutral-700 text-neutral-300 outline-none cursor-pointer hover:border-neutral-500 transition"
                    defaultValue=""
                  >
                    <option value="" disabled>Add to Custom List...</option>
                    {collections.map(col => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {user && collections.length === 0 && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-bold shadow-md bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                >
                  <span>Create Custom List...</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Metadata Grid: budget, revenue, directors, company */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-neutral-900/20 p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-800/80 flex items-center justify-center text-brand-red">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block">Budget / Revenue</span>
              <span className="text-white text-xs sm:text-sm font-bold">
                {formatCurrency(movie.budget)} / {formatCurrency(movie.revenue)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-800/80 flex items-center justify-center text-brand-red">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block">Production</span>
              <span className="text-white text-xs sm:text-sm font-bold truncate max-w-[200px] block">
                {movie.production_companies && movie.production_companies.length > 0 ? movie.production_companies[0].name : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-800/80 flex items-center justify-center text-brand-red">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block">Original Language</span>
              <span className="text-white text-xs sm:text-sm font-bold uppercase">
                {movie.spoken_languages && movie.spoken_languages.length > 0 ? movie.spoken_languages[0].name : (movie.original_language || 'en')}
              </span>
            </div>
          </div>
        </div>

        {/* Embedded Trailer Section */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white pl-3 relative">
            Official Trailer Video
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5/6 bg-brand-red rounded-r-md"></span>
          </h2>
          {videoFetchState === 'loading' ? (
            <div className="w-full aspect-video bg-neutral-900/60 rounded-xl overflow-hidden shadow-lg max-w-4xl mx-auto flex items-center justify-center border border-white/5 pulse-skeleton">
              <span className="text-xs text-neutral-500">Loading Official Trailer...</span>
            </div>
          ) : videoFetchState === 'failed' ? (
            <div className="w-full aspect-video bg-neutral-900/40 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto animate-fade-in">
              <Film className="w-12 h-12 text-neutral-600 mb-4" />
              <h3 className="text-white font-bold mb-1">Couldn't load trailer</h3>
              <p className="text-xs text-neutral-400 max-w-xs">
                We encountered a connection issue while communicating with TMDB. Please click below to try again.
              </p>
              <button
                onClick={retryVideoFetch}
                className="mt-4 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-bold transition border border-neutral-700 cursor-pointer"
              >
                Retry Loading Video
              </button>
            </div>
          ) : trailerVideo ? (
            <div className="w-full aspect-video bg-neutral-900 border border-white/5 rounded-xl overflow-hidden shadow-lg max-w-4xl mx-auto">
              <iframe
                src={`https://www.youtube.com/embed/${trailerVideo.key}?autoplay=0&mute=0`}
                className="w-full h-full"
                allowFullScreen
                title={`${movie.title} Trailer`}
              ></iframe>
            </div>
          ) : (
            <div className="w-full aspect-video bg-neutral-900/30 border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
              <Film className="w-12 h-12 text-neutral-650 mb-4" />
              <h3 className="text-white font-bold mb-1">No trailer available</h3>
              <p className="text-xs text-neutral-500 max-w-xs">
                There is no official YouTube trailer listed in TMDB for this movie.
              </p>
            </div>
          )}
        </div>

        {/* Top Cast List */}
        {cast && cast.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white relative pl-3">
              Top Billed Cast
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5/6 bg-brand-red rounded-r-md"></span>
            </h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 select-none">
              {cast.map((actor) => (
                <div
                  key={actor.id}
                  className="flex-shrink-0 w-28 sm:w-32 bg-bg-card rounded-lg overflow-hidden border border-white/5 text-center p-2.5 shadow-md flex flex-col items-center"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-neutral-800 border border-white/10 shadow-inner flex items-center justify-center mb-3">
                    {actor.profile_path && !castImageErrors[actor.id] ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={actor.name}
                        onError={() => setCastImageErrors(prev => ({ ...prev, [actor.id]: true }))}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-neutral-600" />
                    )}
                  </div>
                  <h4 className="text-white text-xs font-bold w-full leading-tight whitespace-normal break-words h-8 flex items-center justify-center text-center">
                    {actor.name}
                  </h4>
                  <span className="text-neutral-500 text-[10px] w-full block mt-1 whitespace-normal break-words leading-tight">
                    {actor.character}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social interactions section */}
        <div className="border-t border-white/5 pt-8">
          <ReviewSection tmdbId={movie.id} movieTitle={movie.title} />
        </div>

        {/* Similar recommendations */}
        {similar && similar.length > 0 && (
          <div className="border-t border-white/5 pt-8">
            <MovieRow title="More Like This" movies={similar} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetail;
