const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const tmdb = require('../services/tmdb');

const router = express.Router();

// --- WATCHLIST ENDPOINTS ---

// GET /api/user/watchlist
router.get('/watchlist', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      'SELECT movie_id, movie_metadata, added_at FROM watchlist WHERE user_id = ? ORDER BY added_at DESC',
      [req.user.id]
    );

    const watchlist = rows.map(row => {
      let movie = { id: row.movie_id };
      try {
        if (row.movie_metadata) {
          movie = JSON.parse(row.movie_metadata);
        }
      } catch (e) {
        console.error('Watchlist parsing error:', e);
      }
      return movie;
    });

    res.json(watchlist);
  } catch (err) {
    console.error('Error getting watchlist:', err);
    res.status(500).json({ error: 'Failed to retrieve watchlist.' });
  }
});

// POST /api/user/watchlist
router.post('/watchlist', requireAuth, async (req, res) => {
  const { movieId, movie } = req.body;

  if (!movieId || !movie) {
    return res.status(400).json({ error: 'Movie ID and movie data are required.' });
  }

  try {
    const db = await getDb();
    const metadataStr = JSON.stringify(movie);

    await db.run(
      `INSERT OR REPLACE INTO watchlist (user_id, movie_id, movie_metadata) 
       VALUES (?, ?, ?)`,
      [req.user.id, parseInt(movieId), metadataStr]
    );

    res.json({ message: 'Movie added to watchlist.', movie });
  } catch (err) {
    console.error('Error saving to watchlist:', err);
    res.status(500).json({ error: 'Failed to save to watchlist.' });
  }
});

// DELETE /api/user/watchlist/:movieId
router.delete('/watchlist/:movieId', requireAuth, async (req, res) => {
  const { movieId } = req.params;

  try {
    const db = await getDb();
    await db.run(
      'DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?',
      [req.user.id, parseInt(movieId)]
    );

    res.json({ message: 'Movie removed from watchlist.' });
  } catch (err) {
    console.error('Error deleting from watchlist:', err);
    res.status(500).json({ error: 'Failed to delete from watchlist.' });
  }
});


// --- FAVORITES ENDPOINTS ---

// GET /api/user/favorites
router.get('/favorites', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      'SELECT movie_id, movie_metadata, added_at FROM favorites WHERE user_id = ? ORDER BY added_at DESC',
      [req.user.id]
    );

    const favoritesList = rows.map(row => {
      let movie = { id: row.movie_id };
      try {
        if (row.movie_metadata) {
          movie = JSON.parse(row.movie_metadata);
        }
      } catch (e) {
        console.error('Favorites parsing error:', e);
      }
      return movie;
    });

    res.json(favoritesList);
  } catch (err) {
    console.error('Error getting favorites:', err);
    res.status(500).json({ error: 'Failed to retrieve favorites.' });
  }
});

// POST /api/user/favorites
router.post('/favorites', requireAuth, async (req, res) => {
  const { movieId, movie } = req.body;

  if (!movieId || !movie) {
    return res.status(400).json({ error: 'Movie ID and movie data are required.' });
  }

  try {
    const db = await getDb();
    const metadataStr = JSON.stringify(movie);

    await db.run(
      `INSERT OR REPLACE INTO favorites (user_id, movie_id, movie_metadata) 
       VALUES (?, ?, ?)`,
      [req.user.id, parseInt(movieId), metadataStr]
    );

    res.json({ message: 'Movie added to favorites.', movie });
  } catch (err) {
    console.error('Error saving to favorites:', err);
    res.status(500).json({ error: 'Failed to save to favorites.' });
  }
});

// DELETE /api/user/favorites/:movieId
router.delete('/favorites/:movieId', requireAuth, async (req, res) => {
  const { movieId } = req.params;

  try {
    const db = await getDb();
    await db.run(
      'DELETE FROM favorites WHERE user_id = ? AND movie_id = ?',
      [req.user.id, parseInt(movieId)]
    );

    res.json({ message: 'Movie removed from favorites.' });
  } catch (err) {
    console.error('Error deleting from favorites:', err);
    res.status(500).json({ error: 'Failed to delete from favorites.' });
  }
});


// --- RATING ENDPOINTS ---

// GET /api/user/ratings
router.get('/ratings', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      'SELECT movie_id, rating, genres, movie_metadata, rated_at FROM ratings WHERE user_id = ? ORDER BY rated_at DESC',
      [req.user.id]
    );

    const ratingsList = rows.map(row => {
      let movie = { id: row.movie_id };
      try {
        if (row.movie_metadata) {
          movie = JSON.parse(row.movie_metadata);
        }
      } catch (e) {
        console.error('Rating parsing error:', e);
      }
      return {
        movie_id: row.movie_id,
        rating: row.rating,
        genres: row.genres ? row.genres.split(',') : [],
        movie
      };
    });

    res.json(ratingsList);
  } catch (err) {
    console.error('Error getting ratings:', err);
    res.status(500).json({ error: 'Failed to retrieve ratings.' });
  }
});

// POST /api/user/ratings
router.post('/ratings', requireAuth, async (req, res) => {
  const { movieId, rating, genres, movie } = req.body;

  if (!movieId || rating === undefined || !movie) {
    return res.status(400).json({ error: 'Movie ID, rating score, and movie details are required.' });
  }

  const score = parseInt(rating);
  if (score < 1 || score > 5) {
    return res.status(400).json({ error: 'Rating score must be between 1 and 5.' });
  }

  try {
    const db = await getDb();
    
    // Parse genres array to string if present
    let genresStr = '';
    if (Array.isArray(genres)) {
      genresStr = genres.join(',');
    } else if (movie.genres && Array.isArray(movie.genres)) {
      genresStr = movie.genres.map(g => g.id).join(',');
    }

    const metadataStr = JSON.stringify(movie);

    await db.run(
      `INSERT OR REPLACE INTO ratings (user_id, movie_id, rating, genres, movie_metadata) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, parseInt(movieId), score, genresStr, metadataStr]
    );

    res.json({ message: 'Rating saved successfully.', rating: score });
  } catch (err) {
    console.error('Error saving rating:', err);
    res.status(500).json({ error: 'Failed to save rating.' });
  }
});


// --- BROWSE HISTORY ENDPOINTS ---

// GET /api/user/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    // Retrieve unique browsing entries, newest first, max 15
    const rows = await db.all(
      `SELECT movie_id, movie_metadata, MAX(viewed_at) as latest_viewed
       FROM history 
       WHERE user_id = ? 
       GROUP BY movie_id 
       ORDER BY latest_viewed DESC 
       LIMIT 15`,
      [req.user.id]
    );

    const historyList = rows.map(row => {
      let movie = { id: row.movie_id };
      try {
        if (row.movie_metadata) {
          movie = JSON.parse(row.movie_metadata);
        }
      } catch (e) {
        console.error('History parsing error:', e);
      }
      return movie;
    });

    res.json(historyList);
  } catch (err) {
    console.error('Error getting history:', err);
    res.status(500).json({ error: 'Failed to retrieve viewing history.' });
  }
});

// POST /api/user/history
router.post('/history', requireAuth, async (req, res) => {
  const { movieId, movie } = req.body;

  if (!movieId || !movie) {
    return res.status(400).json({ error: 'Movie ID and movie data are required.' });
  }

  try {
    const db = await getDb();
    const metadataStr = JSON.stringify(movie);

    await db.run(
      'INSERT INTO history (user_id, movie_id, movie_metadata) VALUES (?, ?, ?)',
      [req.user.id, parseInt(movieId), metadataStr]
    );

    res.status(201).json({ message: 'History entry logged.' });
  } catch (err) {
    console.error('Error saving history:', err);
    res.status(500).json({ error: 'Failed to log browsing history.' });
  }
});

// GET /api/user/recommendations
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    
    // Fetch user's ratings with score >= 4
    const ratings = await db.all(
      'SELECT genres FROM ratings WHERE user_id = ? AND rating >= 4',
      [req.user.id]
    );

    if (!ratings || ratings.length === 0) {
      // Fallback to popular movies if user has not rated highly yet
      const data = await tmdb.getPopular(1);
      return res.json(data.results || []);
    }

    // Tabulate genre preferences
    const genreCounts = {};
    ratings.forEach((row) => {
      if (row.genres) {
        row.genres.split(',').forEach((gId) => {
          const id = gId.trim();
          if (id) {
            genreCounts[id] = (genreCounts[id] || 0) + 1;
          }
        });
      }
    });

    let topGenreId = null;
    let maxCount = 0;
    Object.entries(genreCounts).forEach(([id, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topGenreId = id;
      }
    });

    if (!topGenreId) {
      const data = await tmdb.getPopular(1);
      return res.json(data.results || []);
    }

    // Call TMDB discover with the top genre preference
    const discoverData = await tmdb.discover({ with_genres: topGenreId });
    res.json(discoverData.results || []);
  } catch (err) {
    console.error('Recommendations error:', err);
    try {
      const data = await tmdb.getPopular(1);
      res.json(data.results || []);
    } catch {
      res.json([]);
    }
  }
});

// --- COLLECTIONS ENDPOINTS ---

// GET /api/user/collections
router.get('/collections', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const cols = await db.all(
      'SELECT id, name, description, is_public FROM collections WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    
    const collections = [];
    for (let col of cols) {
      const moviesRows = await db.all(
        'SELECT movie_id, movie_metadata FROM collection_movies WHERE collection_id = ? ORDER BY added_at DESC',
        [col.id]
      );
      const movies = moviesRows.map(row => {
        let movie = { id: row.movie_id, tmdb_id: row.movie_id };
        try {
          if (row.movie_metadata) {
            movie = { ...JSON.parse(row.movie_metadata), tmdb_id: row.movie_id };
          }
        } catch (e) {}
        return movie;
      });
      collections.push({
        id: col.id,
        name: col.name,
        description: col.description,
        is_public: !!col.is_public,
        movies
      });
    }
    res.json(collections);
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({ error: 'Failed to retrieve collections.' });
  }
});

// POST /api/user/collections
router.post('/collections', requireAuth, async (req, res) => {
  const { name, description, is_public } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Collection name is required.' });
  }
  try {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO collections (user_id, name, description, is_public) VALUES (?, ?, ?, ?)',
      [req.user.id, name, description || '', is_public ? 1 : 0]
    );
    res.status(201).json({
      id: result.lastID,
      name,
      description: description || '',
      is_public: !!is_public,
      movies: []
    });
  } catch (err) {
    console.error('Error creating collection:', err);
    res.status(500).json({ error: 'Failed to create collection.' });
  }
});

// DELETE /api/user/collections/:collectionId
router.delete('/collections/:collectionId', requireAuth, async (req, res) => {
  const { collectionId } = req.params;
  try {
    const db = await getDb();
    await db.run(
      'DELETE FROM collections WHERE id = ? AND user_id = ?',
      [parseInt(collectionId), req.user.id]
    );
    res.json({ message: 'Collection deleted successfully.' });
  } catch (err) {
    console.error('Error deleting collection:', err);
    res.status(500).json({ error: 'Failed to delete collection.' });
  }
});

// POST /api/user/collections/:collectionId/movies
router.post('/collections/:collectionId/movies', requireAuth, async (req, res) => {
  const { collectionId } = req.params;
  const { movieId, movie } = req.body;
  if (!movieId || !movie) {
    return res.status(400).json({ error: 'Movie ID and movie data are required.' });
  }
  try {
    const db = await getDb();
    const col = await db.get('SELECT id FROM collections WHERE id = ? AND user_id = ?', [parseInt(collectionId), req.user.id]);
    if (!col) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    await db.run(
      'INSERT OR REPLACE INTO collection_movies (collection_id, movie_id, movie_metadata) VALUES (?, ?, ?)',
      [parseInt(collectionId), parseInt(movieId), JSON.stringify(movie)]
    );
    res.json({ message: 'Movie added to collection successfully.' });
  } catch (err) {
    console.error('Error adding movie to collection:', err);
    res.status(500).json({ error: 'Failed to add movie to collection.' });
  }
});

// DELETE /api/user/collections/:collectionId/movies/:movieId
router.delete('/collections/:collectionId/movies/:movieId', requireAuth, async (req, res) => {
  const { collectionId, movieId } = req.params;
  try {
    const db = await getDb();
    const col = await db.get('SELECT id FROM collections WHERE id = ? AND user_id = ?', [parseInt(collectionId), req.user.id]);
    if (!col) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    await db.run(
      'DELETE FROM collection_movies WHERE collection_id = ? AND movie_id = ?',
      [parseInt(collectionId), parseInt(movieId)]
    );
    res.json({ message: 'Movie removed from collection successfully.' });
  } catch (err) {
    console.error('Error removing movie from collection:', err);
    res.status(500).json({ error: 'Failed to remove movie from collection.' });
  }
});

// GET /api/user/dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    
    // Fetch favorites rows
    const favoriteRows = await db.all(
      'SELECT movie_id FROM favorites WHERE user_id = ? ORDER BY added_at DESC',
      [req.user.id]
    );

    // Fetch watchlist rows
    const watchlistRows = await db.all(
      'SELECT movie_id FROM watchlist WHERE user_id = ? ORDER BY added_at DESC',
      [req.user.id]
    );

    // Fetch rating rows
    const ratingRows = await db.all(
      'SELECT movie_id, rating, rated_at FROM ratings WHERE user_id = ? ORDER BY rated_at DESC',
      [req.user.id]
    );

    // Fetch history rows
    const historyRows = await db.all(
      `SELECT movie_id, MAX(viewed_at) as latest_viewed 
       FROM history 
       WHERE user_id = ? 
       GROUP BY movie_id 
       ORDER BY latest_viewed DESC 
       LIMIT 15`,
      [req.user.id]
    );

    // Fetch collections
    const cols = await db.all(
      'SELECT id, name, description, is_public FROM collections WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    
    const collections = [];
    for (let col of cols) {
      const moviesRows = await db.all(
        'SELECT movie_id, movie_metadata FROM collection_movies WHERE collection_id = ? ORDER BY added_at DESC',
        [col.id]
      );
      const movies = moviesRows.map(row => {
        let movie = { id: row.movie_id, tmdb_id: row.movie_id };
        try {
          if (row.movie_metadata) {
            movie = { ...JSON.parse(row.movie_metadata), tmdb_id: row.movie_id };
          }
        } catch (e) {}
        return movie;
      });
      collections.push({
        id: col.id,
        name: col.name,
        description: col.description,
        is_public: !!col.is_public,
        movies
      });
    }

    res.json({
      favorites: favoriteRows.map(row => ({ tmdb_id: row.movie_id })),
      watchlist: watchlistRows.map(row => ({ tmdb_id: row.movie_id })),
      ratings: ratingRows.map(row => ({ tmdb_id: row.movie_id, rating: row.rating, rated_at: row.rated_at })),
      history: historyRows.map(row => ({ tmdb_id: row.movie_id })),
      collections
    });
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ error: 'Failed to query user dashboard summary.' });
  }
});

// POST /api/user/clear-all
router.post('/clear-all', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    
    await db.exec('BEGIN TRANSACTION');
    
    await db.run('DELETE FROM watchlist WHERE user_id = ?', [req.user.id]);
    await db.run('DELETE FROM favorites WHERE user_id = ?', [req.user.id]);
    await db.run('DELETE FROM ratings WHERE user_id = ?', [req.user.id]);
    await db.run('DELETE FROM history WHERE user_id = ?', [req.user.id]);
    
    await db.run(
      'DELETE FROM collection_movies WHERE collection_id IN (SELECT id FROM collections WHERE user_id = ?)',
      [req.user.id]
    );
    await db.run('DELETE FROM collections WHERE user_id = ?', [req.user.id]);

    await db.exec('COMMIT');

    res.json({ message: 'All personal lists and metadata cleared successfully.' });
  } catch (err) {
    try {
      const db = await getDb();
      await db.exec('ROLLBACK');
    } catch (e) {}
    console.error('Error clearing user data:', err);
    res.status(500).json({ error: 'Failed to clear personal data.' });
  }
});

module.exports = router;
