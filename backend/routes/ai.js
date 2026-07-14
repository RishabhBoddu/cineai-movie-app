const express = require('express');
const tmdb = require('../services/tmdb');

const router = express.Router();

// POST /api/ai/assistant
router.post('/assistant', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const text = message.toLowerCase();
    let recommended_movies = [];
    let responseText = '';

    // Language mappings & aliases
    const languageMappings = [
      { code: 'te', name: 'Telugu', patterns: ['telugu', 'tollywood', 'south indian telugu'] },
      { code: 'hi', name: 'Hindi', patterns: ['hindi', 'bollywood', 'north indian hindi'] },
      { code: 'ml', name: 'Malayalam', patterns: ['malayalam', 'mollywood', 'kerala'] },
      { code: 'ta', name: 'Tamil', patterns: ['tamil', 'kollywood', 'south indian tamil'] },
      { code: 'kn', name: 'Kannada', patterns: ['kannada', 'sandalwood'] },
      { code: 'mr', name: 'Marathi', patterns: ['marathi', 'marathwood'] },
      { code: 'pa', name: 'Punjabi', patterns: ['punjabi', 'pollywood'] },
      { code: 'ko', name: 'Korean', patterns: ['korean', 'k-drama', 'k-movie'] },
      { code: 'ja', name: 'Japanese', patterns: ['japanese', 'anime', 'j-movie'] },
      { code: 'zh', name: 'Chinese', patterns: ['chinese', 'mandarin', 'cantonese'] },
      { code: 'fr', name: 'French', patterns: ['french'] },
      { code: 'es', name: 'Spanish', patterns: ['spanish'] }
    ];

    let matchedLanguage = null;
    for (let lang of languageMappings) {
      if (lang.patterns.some(pattern => text.includes(pattern))) {
        matchedLanguage = lang;
        break;
      }
    }

    // Genre mappings & descriptive adjectives
    const genreMappings = [
      { id: 28, name: 'action', patterns: ['action', 'fight', 'action-packed'] },
      { id: 12, name: 'adventure', patterns: ['adventure', 'journey', 'expedition'] },
      { id: 16, name: 'animation', patterns: ['animation', 'cartoon', 'animated', 'anime'] },
      { id: 35, name: 'comedy', patterns: ['comedy', 'funny', 'comedic', 'humorous', 'hilarious'] },
      { id: 80, name: 'crime', patterns: ['crime', 'gangster', 'mafia'] },
      { id: 99, name: 'documentary', patterns: ['documentary', 'biography', 'doc'] },
      { id: 18, name: 'drama', patterns: ['drama', 'emotional', 'dramatic'] },
      { id: 10751, name: 'family', patterns: ['family', 'kids'] },
      { id: 14, name: 'fantasy', patterns: ['fantasy', 'magic', 'mythological'] },
      { id: 36, name: 'history', patterns: ['history', 'historical', 'period'] },
      { id: 27, name: 'horror', patterns: ['horror', 'scary', 'spooky', 'ghost'] },
      { id: 10402, name: 'music', patterns: ['music', 'musical', 'song'] },
      { id: 9648, name: 'mystery', patterns: ['mystery', 'suspense', 'detective'] },
      { id: 10749, name: 'romance', patterns: ['romance', 'love', 'romantic', 'romantic comedy', 'rom-com'] },
      { id: 878, name: 'science fiction', patterns: ['science fiction', 'sci-fi', 'space', 'alien', 'futuristic'] },
      { id: 53, name: 'thriller', patterns: ['thriller', 'mystery thriller', 'action thriller', 'suspenseful'] },
      { id: 10752, name: 'war', patterns: ['war', 'military', 'battle'] },
      { id: 37, name: 'western', patterns: ['western', 'cowboy'] }
    ];

    let matchedGenre = null;
    for (let g of genreMappings) {
      if (g.patterns.some(pattern => text.includes(pattern))) {
        matchedGenre = g;
        break;
      }
    }

    if (matchedGenre || matchedLanguage) {
      const params = {
        page: 1,
        sort_by: 'popularity.desc'
      };

      if (matchedGenre) params.with_genres = matchedGenre.id;
      if (matchedLanguage) params.with_original_language = matchedLanguage.code;

      const data = await tmdb.discover(params);
      let results = data.results || [];

      if (matchedLanguage) {
        results = results.filter(movie => movie.original_language === matchedLanguage.code);
      }

      if (results.length > 0) {
        recommended_movies = results.slice(0, 4);
        
        let label = '';
        if (matchedLanguage) label += `${matchedLanguage.name} `;
        if (matchedGenre) label += `${matchedGenre.name} `;
        responseText = `I found some great ${label.trim()} movies for you! Let me know if you would like to explore other categories.`;
      } else {
        // Honest fallback for zero results with regional language preference
        if (matchedLanguage && matchedGenre) {
          const fallbackData = await tmdb.discover({
            with_original_language: matchedLanguage.code,
            sort_by: 'popularity.desc',
            page: 1
          });
          let fallbackResults = (fallbackData.results || []).filter(movie => movie.original_language === matchedLanguage.code);
          recommended_movies = fallbackResults.slice(0, 4);
          
          responseText = `I couldn't find any ${matchedLanguage.name} ${matchedGenre.name} movies with high ratings. However, here are some popular ${matchedLanguage.name} movies you might enjoy instead!`;
        } else {
          const trendingData = await tmdb.getPopular(1);
          recommended_movies = (trendingData.results || []).slice(0, 4);
          responseText = `I couldn't find any specific movie recommendations matching your criteria. Here are some trending movies instead!`;
        }
      }
    } else if (text.includes('recommend') || text.includes('suggest') || text.includes('good movie') || text.includes('trending')) {
      const data = await tmdb.getPopular(1);
      recommended_movies = (data.results || []).slice(0, 4);
      responseText = "Here are some of the most popular and trending movies right now! You can add them to your watchlist or click them to view trailers.";
    } else {
      const cleanedQuery = text.replace(/suggest|recommend|search|find|show me|movies|movie/gi, '').trim();
      if (cleanedQuery.length > 2) {
        const data = await tmdb.search(cleanedQuery, 1);
        recommended_movies = (data.results || []).slice(0, 4);
        if (recommended_movies.length > 0) {
          responseText = `I searched for "${cleanedQuery}" and found these matches! Click on them to see cast details or watch official trailers.`;
        } else {
          const trendingData = await tmdb.getPopular(1);
          recommended_movies = (trendingData.results || []).slice(0, 4);
          responseText = `I couldn't find any specific movies matching "${cleanedQuery}". However, here are some trending picks you might enjoy!`;
        }
      } else {
        const data = await tmdb.getPopular(1);
        recommended_movies = (data.results || []).slice(0, 4);
        responseText = "Hello! I am CineAI, your personal movie recommendation assistant. Tell me what original language (e.g. 'Telugu', 'Hindi', 'Malayalam') or genre you are in the mood for!";
      }
    }

    res.json({
      response: responseText,
      recommended_movies
    });
  } catch (err) {
    console.error('AI assistant error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
