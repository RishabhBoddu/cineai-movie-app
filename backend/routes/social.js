const express = require('express');
const { getDb } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/social/reviews/:tmdbId
router.get('/reviews/:tmdbId', optionalAuth, async (req, res) => {
  const { tmdbId } = req.params;
  
  try {
    const db = await getDb();
    const rows = await db.all(
      `SELECT r.id, r.user_id, r.movie_id, r.movie_title, r.content, r.created_at,
              u.email,
              (SELECT COUNT(*) FROM likes WHERE review_id = r.id) as likes_count
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.movie_id = ?
       ORDER BY r.created_at DESC`,
      [parseInt(tmdbId)]
    );

    const reviews = [];
    for (let row of rows) {
      let liked_by_user = false;
      if (req.user) {
        const like = await db.get(
          'SELECT 1 FROM likes WHERE user_id = ? AND review_id = ?',
          [req.user.id, row.id]
        );
        liked_by_user = !!like;
      }

      reviews.push({
        id: row.id,
        movie_id: row.movie_id,
        movie_title: row.movie_title,
        content: row.content,
        created_at: row.created_at,
        likes_count: row.likes_count,
        liked_by_user,
        user: {
          id: row.user_id,
          username: row.email.split('@')[0],
          email: row.email
        }
      });
    }

    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
});

// POST /api/social/reviews
router.post('/reviews', requireAuth, async (req, res) => {
  const { tmdb_id, title, content } = req.body;

  if (!tmdb_id || !content) {
    return res.status(400).json({ error: 'Movie ID and content are required.' });
  }

  try {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO reviews (user_id, movie_id, movie_title, content) VALUES (?, ?, ?, ?)',
      [req.user.id, parseInt(tmdb_id), title || '', content]
    );

    res.status(201).json({
      id: result.lastID,
      movie_id: parseInt(tmdb_id),
      movie_title: title || '',
      content,
      created_at: new Date().toISOString(),
      likes_count: 0,
      liked_by_user: false,
      user: {
        id: req.user.id,
        username: req.user.email.split('@')[0],
        email: req.user.email
      }
    });
  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).json({ error: 'Failed to post review.' });
  }
});

// POST /api/social/reviews/:reviewId/like
router.post('/reviews/:reviewId/like', requireAuth, async (req, res) => {
  const { reviewId } = req.params;

  try {
    const db = await getDb();
    const existing = await db.get(
      'SELECT id FROM likes WHERE user_id = ? AND review_id = ?',
      [req.user.id, parseInt(reviewId)]
    );

    if (existing) {
      await db.run('DELETE FROM likes WHERE id = ?', [existing.id]);
    } else {
      await db.run(
        'INSERT INTO likes (user_id, review_id) VALUES (?, ?)',
        [req.user.id, parseInt(reviewId)]
      );
    }

    const likesCount = await db.get(
      'SELECT COUNT(*) as count FROM likes WHERE review_id = ?',
      [parseInt(reviewId)]
    );

    res.json({ likes_count: likesCount.count });
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ error: 'Failed to process like.' });
  }
});

// GET /api/social/reviews/:reviewId/comments
router.get('/reviews/:reviewId/comments', async (req, res) => {
  const { reviewId } = req.params;

  try {
    const db = await getDb();
    const rows = await db.all(
      `SELECT c.id, c.user_id, c.review_id, c.content, c.created_at,
              u.email
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.review_id = ?
       ORDER BY c.created_at ASC`,
      [parseInt(reviewId)]
    );

    const comments = rows.map(row => ({
      id: row.id,
      review_id: row.review_id,
      content: row.content,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        username: row.email.split('@')[0],
        email: row.email
      }
    }));

    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to retrieve comments.' });
  }
});

// POST /api/social/comments
router.post('/comments', requireAuth, async (req, res) => {
  const { review_id, content } = req.body;

  if (!review_id || !content) {
    return res.status(400).json({ error: 'Review ID and comment content are required.' });
  }

  try {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO comments (user_id, review_id, content) VALUES (?, ?, ?)',
      [req.user.id, parseInt(review_id), content]
    );

    res.status(201).json({
      id: result.lastID,
      review_id: parseInt(review_id),
      content,
      created_at: new Date().toISOString(),
      user: {
        id: req.user.id,
        username: req.user.email.split('@')[0],
        email: req.user.email
      }
    });
  } catch (err) {
    console.error('Error saving comment:', err);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

module.exports = router;
