import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import StarRating from '../components/StarRating';
import { Heart, Bookmark, Star, Play, History, FolderPlus, Trash2, List, Shield, User, X } from 'lucide-react';

const Dashboard = () => {
  const { 
    user, 
    favorites, 
    watchlist, 
    userRatings, 
    collections, 
    createCollection, 
    deleteCollection, 
    removeMovieFromCollection,
    getHeaders,
    clearAllData
  } = useAuth();
  
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('favorites');
  const [hydratedWatchlist, setHydratedWatchlist] = useState([]);
  const [hydratedFavorites, setHydratedFavorites] = useState([]);
  const [hydratedHistory, setHydratedHistory] = useState([]);
  const [hydratedRatings, setHydratedRatings] = useState([]);
  
  // Custom collection creator form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [colPublic, setColPublic] = useState(true);
  const [formError, setFormError] = useState('');

  const [loading, setLoading] = useState(true);

  // Fetch full details for list items (Favorites, Watchlist, History)
  useEffect(() => {
    const fetchDashboardDetails = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const authHeaders = getHeaders();
        const res = await fetch('/api/user/dashboard', { headers: authHeaders });
        if (res.ok) {
          const summary = await res.json();
          
          // Hydrate favorites and watchlist from tmdb batch details
          const favIds = summary.favorites.map(f => f.tmdb_id);
          const watchIds = summary.watchlist.map(w => w.tmdb_id);
          const histIds = summary.history.map(h => h.tmdb_id);
          
          const [favDetails, watchDetails, histDetails] = await Promise.all([
            tmdbBatchFetch(favIds),
            tmdbBatchFetch(watchIds),
            tmdbBatchFetch(histIds)
          ]);
          
          setHydratedFavorites(favDetails);
          setHydratedWatchlist(watchDetails);
          setHydratedHistory(histDetails);

          // Map rating scores to movie titles
          const ratingDetails = await Promise.all(
            summary.ratings.map(async (r) => {
              const details = await fetch(`/api/movies/${r.tmdb_id}`);
              const movieData = details.ok ? await details.json() : { title: `Movie ${r.tmdb_id}` };
              return {
                id: r.id,
                tmdb_id: r.tmdb_id,
                rating: r.rating,
                rated_at: r.rated_at,
                title: movieData.title,
                poster_path: movieData.poster_path
              };
            })
          );
          setHydratedRatings(ratingDetails);
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardDetails();
  }, [user, favorites.length, watchlist.length, userRatings.length]);

  const tmdbBatchFetch = async (ids) => {
    if (!ids || ids.length === 0) return [];
    try {
      const res = await fetch(`/api/movies/1`); // just dummy check, backend handles batch
      const moviesList = [];
      for (let id of ids.slice(0, 15)) {
        const detailRes = await fetch(`/api/movies/${id}`);
        if (detailRes.ok) {
          moviesList.push(await detailRes.json());
        }
      }
      return moviesList;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const handleCreateCollectionSubmit = async (e) => {
    e.preventDefault();
    if (!colName.trim()) {
      setFormError('Please enter a list name.');
      return;
    }
    setFormError('');
    const newCol = await createCollection(colName, colDesc, colPublic);
    if (newCol) {
      setColName('');
      setColDesc('');
      setColPublic(true);
      setShowCreateModal(false);
    } else {
      setFormError('Failed to create custom list.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark pt-28 px-4 max-w-7xl mx-auto space-y-6">
        <div className="h-28 bg-neutral-800/30 border border-white/5 rounded-xl pulse-skeleton"></div>
        <div className="h-8 bg-neutral-800/30 rounded w-1/3 pulse-skeleton"></div>
        <div className="h-64 bg-neutral-800/30 rounded w-full pulse-skeleton"></div>
      </div>
    );
  }

  const isAdmin = user && (user.is_admin || user.username.toLowerCase() === 'admin');

  return (
    <div className="min-h-screen bg-bg-dark pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Profile Header section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-red flex items-center justify-center font-bold text-white text-3xl shadow-xl select-none">
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{user.username}</span>
              {isAdmin && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[9px] uppercase font-bold tracking-wider">
                  <Shield className="w-2.5 h-2.5" />
                  Admin
                </span>
              )}
            </h1>
            <p className="text-xs text-neutral-400 font-medium">Member since {new Date(user.created_at).toLocaleDateString()}</p>
            <button
              onClick={async () => {
                if (window.confirm("Are you absolutely sure you want to clear all your watchlist, ratings, history, collections, and favorites? This action cannot be undone.")) {
                  await clearAllData();
                  alert("All user data cleared!");
                }
              }}
              className="mt-2.5 flex items-center gap-1 bg-brand-red/15 hover:bg-brand-red/25 border border-brand-red/20 rounded-md px-3 py-1.5 text-[9px] font-bold text-brand-red uppercase tracking-wider transition cursor-pointer"
            >
              Clear All Data
            </button>
          </div>
        </div>

        {/* Dashboard quick stats counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
          <div className="bg-black/30 border border-white/5 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Favorites</span>
            <span className="text-white text-lg font-black">{hydratedFavorites.length}</span>
          </div>
          <div className="bg-black/30 border border-white/5 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Watchlist</span>
            <span className="text-white text-lg font-black">{hydratedWatchlist.length}</span>
          </div>
          <div className="bg-black/30 border border-white/5 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Ratings</span>
            <span className="text-white text-lg font-black">{hydratedRatings.length}</span>
          </div>
          <div className="bg-black/30 border border-white/5 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Collections</span>
            <span className="text-white text-lg font-black">{collections.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-white/5 flex gap-6 overflow-x-auto no-scrollbar font-bold text-sm">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`pb-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'favorites' ? 'text-brand-red border-brand-red' : 'text-neutral-400 border-transparent hover:text-white'}`}
        >
          Favorites
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`pb-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'watchlist' ? 'text-brand-red border-brand-red' : 'text-neutral-400 border-transparent hover:text-white'}`}
        >
          Watchlist
        </button>
        <button
          onClick={() => setActiveTab('ratings')}
          className={`pb-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'ratings' ? 'text-brand-red border-brand-red' : 'text-neutral-400 border-transparent hover:text-white'}`}
        >
          Ratings
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`pb-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'collections' ? 'text-brand-red border-brand-red' : 'text-neutral-400 border-transparent hover:text-white'}`}
        >
          Collections ({collections.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3.5 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'history' ? 'text-brand-red border-brand-red' : 'text-neutral-400 border-transparent hover:text-white'}`}
        >
          Watch History
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {hydratedFavorites.length === 0 ? (
              <div className="text-center py-16 text-neutral-500 bg-neutral-900/10 border border-white/5 rounded-xl">
                <Heart className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <h3 className="text-white font-bold mb-1">No favorites yet</h3>
                <p className="text-xs text-neutral-400 mb-4">Click the heart button on any movie card to add.</p>
                <Link to="/" className="px-4 py-2 bg-brand-red text-white text-xs font-bold rounded hover:bg-brand-dark-red transition">Browse Movies</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {hydratedFavorites.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="space-y-4">
            {hydratedWatchlist.length === 0 ? (
              <div className="text-center py-16 text-neutral-500 bg-neutral-900/10 border border-white/5 rounded-xl">
                <Bookmark className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <h3 className="text-white font-bold mb-1">Watchlist is empty</h3>
                <p className="text-xs text-neutral-400 mb-4">Save movies to watch later by clicking the watchlist button.</p>
                <Link to="/" className="px-4 py-2 bg-brand-red text-white text-xs font-bold rounded hover:bg-brand-dark-red transition">Browse Movies</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {hydratedWatchlist.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div className="space-y-4">
            {hydratedRatings.length === 0 ? (
              <div className="text-center py-16 text-neutral-500 bg-neutral-900/10 border border-white/5 rounded-xl">
                <Star className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <h3 className="text-white font-bold mb-1">No ratings submitted</h3>
                <p className="text-xs text-neutral-400">Your rated movies will appear here to tune recommendation weights.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hydratedRatings.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-neutral-900/50 border border-white/5 rounded-xl items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                          alt={item.title}
                          className="w-10 h-14 object-cover rounded bg-neutral-800"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-neutral-800 rounded flex items-center justify-center border border-white/5">
                          <Film className="w-5 h-5 text-neutral-600" />
                        </div>
                      )}
                      <div>
                        <Link to={`/movie/${item.tmdb_id}`} className="text-white text-sm font-bold hover:text-brand-red transition block leading-snug">{item.title}</Link>
                        <span className="text-[10px] text-neutral-500 mt-1 block">Rated on {new Date(item.rated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <StarRating
                      initialRating={item.rating}
                      onRate={(score) => rateMovie(item.tmdb_id, score)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Custom Lists</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-brand-dark-red transition cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create List</span>
              </button>
            </div>

            {collections.length === 0 ? (
              <p className="text-neutral-500 text-sm italic">You haven't created any custom collections yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {collections.map((col) => (
                  <div key={col.id} className="bg-neutral-900/40 border border-white/5 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-white font-extrabold text-lg tracking-tight leading-snug">{col.name}</h3>
                        {col.description && <p className="text-neutral-400 text-xs mt-1 leading-relaxed">{col.description}</p>}
                        <span className="text-[9px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-2 inline-block">
                          {col.is_public ? 'Public List' : 'Private'}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteCollection(col.id)}
                        className="p-1.5 bg-neutral-850 hover:bg-neutral-800 border border-white/5 hover:border-brand-red text-neutral-400 hover:text-brand-red rounded transition cursor-pointer"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Collection Movies List */}
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Movies in List ({col.movies.length})</span>
                      {col.movies.length === 0 ? (
                        <p className="text-neutral-600 text-xs italic">No movies added to this list yet.</p>
                      ) : (
                        <div className="divide-y divide-white/5 max-h-48 overflow-y-auto pr-1">
                          {col.movies.map((m) => (
                            <div key={m.id} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                              <Link to={`/movie/${m.tmdb_id}`} className="text-white text-xs font-semibold hover:text-brand-red transition truncate max-w-[80%]">
                                {m.title}
                              </Link>
                              <button
                                onClick={() => removeMovieFromCollection(col.id, m.tmdb_id)}
                                className="text-neutral-500 hover:text-brand-red p-1 transition cursor-pointer"
                                title="Remove movie from list"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Watch History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {hydratedHistory.length === 0 ? (
              <p className="text-neutral-500 text-sm italic">No viewed history logged yet.</p>
            ) : (
              <div className="relative border-l border-white/10 pl-6 ml-3 space-y-8">
                {hydratedHistory.map((movie, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline Node dot */}
                    <div className="absolute -left-9.5 top-1.5 w-7 h-7 rounded-full bg-neutral-900 border-2 border-brand-red flex items-center justify-center text-brand-red text-xs z-10">
                      <History className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-neutral-900/30 border border-white/5 rounded-xl p-4 flex gap-4 max-w-xl shadow hover:border-neutral-500 transition duration-300">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          className="w-14 h-20 object-cover rounded bg-neutral-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-20 bg-neutral-850 rounded flex items-center justify-center border border-white/5 flex-shrink-0">
                          <Film className="w-6 h-6 text-neutral-600" />
                        </div>
                      )}
                      <div>
                        <Link to={`/movie/${movie.id}`} className="text-white font-bold hover:text-brand-red transition text-sm leading-snug">{movie.title}</Link>
                        <p className="text-neutral-400 text-xs line-clamp-2 mt-1 leading-relaxed">{movie.overview}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE COLLECTION MODAL DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCreateCollectionSubmit} className="glass-panel border border-white/10 w-full max-w-md p-6 rounded-2xl space-y-4 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
                <List className="w-5 h-5 text-brand-red" />
                <span>Create Custom Playlist</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">List Title</label>
                <input
                  type="text"
                  placeholder="e.g. My Favorite Sci-Fi"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/5 rounded-lg p-2.5 text-sm text-white focus:border-brand-red outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  placeholder="Tell others what this collection contains..."
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/5 rounded-lg p-2.5 text-sm text-white focus:border-brand-red outline-none min-h-[80px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="col-public"
                  checked={colPublic}
                  onChange={(e) => setColPublic(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-red bg-neutral-950 border-white/5 outline-none"
                />
                <label htmlFor="col-public" className="text-xs text-neutral-300 select-none">Make this playlist public on my profile</label>
              </div>

              {formError && <p className="text-xs text-brand-red font-medium">{formError}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-neutral-900 border border-white/5 rounded-lg text-xs font-bold text-neutral-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-brand-dark-red transition cursor-pointer"
              >
                Create List
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
