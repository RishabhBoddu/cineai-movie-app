const express = require('express');
const tmdb = require('../services/tmdb');
const { getDb } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/movies/trending
router.get('/trending', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdb.getTrending(page);
    res.json(data.results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/trending/today
router.get('/trending/today', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdb.getTrending(page);
    res.json(data.results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/trending-week
router.get('/trending-week', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdb.getTrendingWeek(page);
    res.json(data.results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/popular
router.get('/popular', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdb.getPopular(page);
    res.json(data.results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/top-rated
router.get('/top-rated', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdb.getTopRated(page);
    res.json(data.results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/upcoming
router.get('/upcoming', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdb.getUpcoming(page);
    res.json(data.results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/now-playing
router.get('/now-playing', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdb.getNowPlaying(page);
    res.json(data.results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/discover
router.get('/discover', async (req, res) => {
  const { genre, language, page = 1 } = req.query;
  const params = { 
    page,
    sort_by: 'popularity.desc'
  };

  if (genre) params.with_genres = genre;
  if (language) params.with_original_language = language;

  try {
    const data = await tmdb.discover(params);
    let results = data.results || [];

    // STRICT VERIFICATION: Verify response original_language matches input language code
    if (language) {
      results = results.filter(movie => movie.original_language === language);
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/search
router.get('/search', async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) {
    return res.json([]);
  }

  try {
    const data = await tmdb.search(q, page);
    res.json(data.results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/languages
router.get('/languages', async (req, res) => {
  res.json([
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'kn', name: 'Kannada' },
    { code: 'mr', name: 'Marathi' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ko', name: 'Korean' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'it', name: 'Italian' },
    { code: 'de', name: 'German' }
  ]);
});

// GET /api/movies/genres
router.get('/genres', async (req, res) => {
  res.json([
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' }
  ]);
});

// GET /api/movies/recommendations
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
    ratings.forEach(row => {
      if (row.genres) {
        const ids = row.genres.split(',');
        ids.forEach(gid => {
          const cleanId = gid.trim();
          if (cleanId) {
            genreCounts[cleanId] = (genreCounts[cleanId] || 0) + 1;
          }
        });
      }
    });

    // Pick top genre
    let bestGenre = null;
    let maxCount = -1;
    for (const [gid, count] of Object.entries(genreCounts)) {
      if (count > maxCount) {
        maxCount = count;
        bestGenre = gid;
      }
    }

    if (!bestGenre) {
      const data = await tmdb.getPopular(1);
      return res.json(data.results || []);
    }

    // Fetch movies in that genre
    const data = await tmdb.discover({
      with_genres: bestGenre,
      page: 1
    });

    res.json(data.results || []);
  } catch (err) {
    console.error('Recommendations error:', err);
    // Silent fallback to avoid breaking layout
    try {
      const data = await tmdb.getPopular(1);
      res.json(data.results || []);
    } catch {
      res.json([]);
    }
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const data = await tmdb.getDetails(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Movie not found.' });
  }
});

// GET /api/movies/:id/cast
router.get('/:id/cast', async (req, res) => {
  try {
    const data = await tmdb.getCredits(req.params.id);
    res.json(data.cast || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id/credits
router.get('/:id/credits', async (req, res) => {
  try {
    const data = await tmdb.getCredits(req.params.id);
    res.json(data.cast || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id/videos
router.get('/:id/videos', async (req, res) => {
  try {
    const data = await tmdb.getVideos(req.params.id);
    const results = data.results || [];
    
    // Filter to Trailer type and YouTube site
    const trailers = results.filter(v => v.type === 'Trailer' && v.site === 'YouTube');
    res.json(trailers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id/similar
router.get('/:id/similar', async (req, res) => {
  try {
    const data = await tmdb.getSimilar(req.params.id);
    res.json(data.results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id/watch-providers
router.get('/:id/watch-providers', async (req, res) => {
  try {
    const data = await tmdb.getWatchProviders(req.params.id);
    res.json(data.results || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
