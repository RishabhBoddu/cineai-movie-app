import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, BarChart3, Star, RefreshCw, Search, Film, Activity, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 403) {
        throw new Error('Access denied. Administrator privileges required.');
      }
      if (!res.ok) {
        throw new Error('Failed to load server stats. Make sure backend is running.');
      }
      setAnalytics(await res.json());
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect non-admins
    if (user && user.username.toLowerCase() !== 'admin' && !user.is_admin) {
      navigate('/');
      return;
    }
    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark pt-28 px-4 max-w-7xl mx-auto space-y-6">
        <div className="h-6 bg-neutral-800/30 rounded w-1/4 pulse-skeleton"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="h-28 bg-neutral-800/30 border border-white/5 rounded-xl pulse-skeleton"></div>
          <div className="h-28 bg-neutral-800/30 border border-white/5 rounded-xl pulse-skeleton"></div>
          <div className="h-28 bg-neutral-800/30 border border-white/5 rounded-xl pulse-skeleton"></div>
          <div className="h-28 bg-neutral-800/30 border border-white/5 rounded-xl pulse-skeleton"></div>
        </div>
        <div className="h-64 bg-neutral-800/30 rounded w-full pulse-skeleton"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark pt-24 px-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-brand-red mb-4" />
        <p className="text-brand-red text-sm font-semibold mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-neutral-800 border border-neutral-700 rounded text-sm font-bold text-white transition hover:bg-neutral-700 cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Calculate highest counts for chart scaling
  const maxTrafficCount = Math.max(...Object.values(analytics.traffic_by_activity), 1);
  const maxSearchCount = Math.max(...analytics.most_searched.map(s => s.count), 1);

  return (
    <div className="min-h-screen bg-bg-dark pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-xs text-neutral-400 font-medium">Real-time system health and recommendation statistics.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/5 rounded-lg text-xs font-bold text-neutral-300 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Aggregations grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold block">Total Members</span>
            <span className="text-white text-2xl font-black">{analytics.total_users}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold block">Total Reviews</span>
            <span className="text-white text-2xl font-black">{analytics.total_reviews}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold block">Ratings Submitted</span>
            <span className="text-white text-2xl font-black">{analytics.total_ratings}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold block">Cached TMDb Keys</span>
            <span className="text-white text-2xl font-black">{analytics.active_cache_keys}</span>
          </div>
        </div>
      </div>

      {/* Grid: Charts & Analytics details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Traffic Logs SVG Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-red" />
            <span>Activity Traffic Overview</span>
          </h3>
          <div className="space-y-4 pt-2">
            {Object.entries(analytics.traffic_by_activity).map(([activity, count]) => {
              const percentage = (count / maxTrafficCount) * 100;
              const formattedLabel = activity.charAt(0).toUpperCase() + activity.slice(1).replace('_', ' ');
              return (
                <div key={activity} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-neutral-400">
                    <span>{formattedLabel}</span>
                    <span className="text-white font-bold">{count} Action{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-3 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-brand-red to-brand-dark-red h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Most Searched Queries */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-red" />
            <span>Top Searched Movie Queries</span>
          </h3>
          <div className="space-y-4 pt-2">
            {analytics.most_searched.length === 0 ? (
              <p className="text-neutral-500 text-xs italic">No search logs recorded yet.</p>
            ) : (
              analytics.most_searched.map((search, idx) => {
                const percentage = (search.count / maxSearchCount) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-neutral-400">
                      <span className="text-white italic">"{search.query}"</span>
                      <span>{search.count} Query hits</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-3 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Panel: Popular Movies view counts */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-brand-red" />
            <span>Highest Viewed Movie Detail Highlights</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-neutral-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">TMDB ID</th>
                  <th className="py-3 px-4">Movie Title</th>
                  <th className="py-3 px-4 text-right">Server Details Request Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-neutral-300">
                {analytics.popular_movies.map((movie) => (
                  <tr key={movie.tmdb_id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-4 font-mono text-neutral-500">{movie.tmdb_id}</td>
                    <td className="py-3 px-4 text-white font-semibold">
                      <Link to={`/movie/${movie.tmdb_id}`} className="hover:text-brand-red transition">
                        {movie.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">{movie.view_count || movie.review_count} views</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
