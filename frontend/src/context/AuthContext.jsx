import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]); // Client-only fallback state to support existing icons
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch watchlist, ratings, viewing history, favorites, and collections from backend Express proxy
  const fetchUserData = async () => {
    try {
      const [watchRes, rateRes, histRes, favRes, colRes] = await Promise.all([
        fetch('/api/user/watchlist'),
        fetch('/api/user/ratings'),
        fetch('/api/user/history'),
        fetch('/api/user/favorites'),
        fetch('/api/user/collections')
      ]);

      if (watchRes.ok) {
        setWatchlist(await watchRes.json());
      }
      if (rateRes.ok) {
        setUserRatings(await rateRes.json());
      }
      if (histRes.ok) {
        setHistory(await histRes.json());
      }
      if (favRes.ok) {
        setFavorites(await favRes.json());
      }
      if (colRes.ok) {
        setCollections(await colRes.json());
      }
    } catch (err) {
      console.error('Failed to load user profile details:', err);
    }
  };

  const saveUser = (u) => {
    if (!u) {
      setUser(null);
      return null;
    }
    const hydratedUser = {
      ...u,
      username: u.username || (u.email ? u.email.split('@')[0] : 'User'),
      created_at: u.created_at || new Date().toISOString()
    };
    setUser(hydratedUser);
    return hydratedUser;
  };

  // Verify cookie session on mount
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            saveUser(data.user);
            await fetchUserData();
          }
        }
      } catch (err) {
        console.error('Session verification failed:', err);
      } finally {
        setLoading(false);
      }
    };
    
    verifyUser();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }

    const data = await res.json();
    const loggedUser = saveUser(data.user);
    await fetchUserData();
    return loggedUser;
  };

  const register = async (arg1, arg2, arg3) => {
    // Handle both (email, password) and (username, email, password) signatures
    const email = arg3 ? arg2 : arg1;
    const password = arg3 || arg2;

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Registration failed');
    }

    const data = await res.json();
    const regUser = saveUser(data.user);
    await fetchUserData();
    return regUser;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    saveUser(null);
    setWatchlist([]);
    setUserRatings([]);
    setHistory([]);
    setFavorites([]);
  };

  // Watchlist Management
  const addToWatchlist = async (movie) => {
    try {
      const res = await fetch('/api/user/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie.id, movie }),
      });
      if (res.ok) {
        setWatchlist((prev) => [movie, ...prev.filter(m => m.id !== movie.id)]);
        return true;
      }
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
    }
    return false;
  };

  const removeFromWatchlist = async (movieId) => {
    try {
      const res = await fetch(`/api/user/watchlist/${movieId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setWatchlist((prev) => prev.filter((m) => m.id !== movieId));
        return true;
      }
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
    return false;
  };

  const inWatchlist = (movieId) => {
    return watchlist.some((m) => m.id === movieId);
  };

  // Ratings Management
  const rateMovie = async (movieId, ratingScore, movie) => {
    try {
      let resolvedMovie = movie;
      if (!resolvedMovie) {
        const fetchRes = await fetch(`/api/movies/${movieId}`);
        if (fetchRes.ok) {
          resolvedMovie = await fetchRes.json();
        }
      }

      if (!resolvedMovie) {
        console.error('Cannot rate movie without metadata');
        return false;
      }

      const res = await fetch('/api/user/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId,
          rating: ratingScore,
          genres: resolvedMovie.genres ? resolvedMovie.genres.map(g => g.id) : [],
          movie: resolvedMovie
        }),
      });
      if (res.ok) {
        setUserRatings((prev) => {
          const filtered = prev.filter((r) => r.movie_id !== movieId);
          return [{ movie_id: movieId, rating: ratingScore, movie: resolvedMovie }, ...filtered];
        });
        return true;
      }
    } catch (err) {
      console.error('Failed to save rating:', err);
    }
    return false;
  };

  const getUserRating = (movieId) => {
    const ratingObj = userRatings.find((r) => r.movie_id === movieId);
    return ratingObj ? ratingObj.rating : 0;
  };

  // Browsing History Tracking
  const addToHistory = async (movie) => {
    if (!user) return;
    try {
      await fetch('/api/user/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie.id, movie }),
      });
      setHistory((prev) => [movie, ...prev.filter(m => m.id !== movie.id)]);
    } catch (err) {
      console.error('Failed to record browsing history:', err);
    }
  };

  // Persisted Favorites triggers
  const addFavorite = async (movie) => {
    try {
      const res = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie.id, movie }),
      });
      if (res.ok) {
        setFavorites((prev) => [movie, ...prev.filter(m => m.id !== movie.id)]);
        return true;
      }
    } catch (err) {
      console.error('Failed to add favorite:', err);
    }
    return false;
  };

  const removeFavorite = async (movieId) => {
    try {
      const res = await fetch(`/api/user/favorites/${movieId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFavorites((prev) => prev.filter((m) => m.id !== movieId));
        return true;
      }
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
    return false;
  };

  const isFavorite = (movieId) => {
    return favorites.some((m) => m.id === movieId);
  };

  const createCollection = async (name, description, isPublic) => {
    try {
      const res = await fetch('/api/user/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, is_public: isPublic }),
      });
      if (res.ok) {
        const created = await res.json();
        setCollections((prev) => [created, ...prev]);
        return created;
      }
    } catch (err) {
      console.error('Failed to create collection:', err);
    }
    return null;
  };

  const deleteCollection = async (collectionId) => {
    try {
      const res = await fetch(`/api/user/collections/${collectionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== collectionId));
        return true;
      }
    } catch (err) {
      console.error('Failed to delete collection:', err);
    }
    return false;
  };

  const addMovieToCollection = async (collectionId, movie) => {
    try {
      const res = await fetch(`/api/user/collections/${collectionId}/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie.id, movie }),
      });
      if (res.ok) {
        setCollections((prev) =>
          prev.map((c) => {
            if (c.id === collectionId) {
              return { ...c, movies: [movie, ...c.movies.filter((m) => m.id !== movie.id)] };
            }
            return c;
          })
        );
        return true;
      }
    } catch (err) {
      console.error('Failed to add movie to collection:', err);
    }
    return false;
  };

  const removeMovieFromCollection = async (collectionId, movieId) => {
    try {
      const res = await fetch(`/api/user/collections/${collectionId}/movies/${movieId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCollections((prev) =>
          prev.map((c) => {
            if (c.id === collectionId) {
              return {
                ...c,
                movies: c.movies.filter((m) => m.id !== movieId && m.tmdb_id !== movieId),
              };
            }
            return c;
          })
        );
        return true;
      }
    } catch (err) {
      console.error('Failed to remove movie from collection:', err);
    }
    return false;
  };

  const clearAllData = async () => {
    try {
      const res = await fetch('/api/user/clear-all', {
        method: 'POST',
      });
      if (res.ok) {
        setWatchlist([]);
        setUserRatings([]);
        setHistory([]);
        setFavorites([]);
        setCollections([]);
        return true;
      }
    } catch (err) {
      console.error('Failed to clear personal data:', err);
    }
    return false;
  };

  const value = {
    user,
    loading,
    watchlist,
    userRatings,
    history,
    favorites,
    login,
    register,
    logout,
    addToWatchlist,
    removeFromWatchlist,
    inWatchlist,
    rateMovie,
    getUserRating,
    addToHistory,
    addFavorite,
    removeFavorite,
    isFavorite,
    getHeaders: () => ({}),
    collections,
    createCollection,
    deleteCollection,
    addMovieToCollection,
    removeMovieFromCollection,
    clearAllData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
