const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const cache = new Map();

function getCached(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expires) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

function setCached(key, data, durationMs = 5 * 60 * 1000) {
  cache.set(key, {
    data,
    expires: Date.now() + durationMs
  });
}

async function fetchFromTMDB(endpoint, queryParams = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey.includes('your_tmdb')) {
    throw new Error('TMDB_API_KEY is not configured or is using default template. Please add your key to the .env file.');
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    ...queryParams
  });

  const url = `${TMDB_BASE_URL}${endpoint}?${params.toString()}`;
  const cachedData = getCached(url);
  if (cachedData) {
    return cachedData;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB API call failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  setCached(url, data);
  return data;
}

module.exports = {
  fetchFromTMDB,
  
  discover: (params) => fetchFromTMDB('/discover/movie', params),
  getDetails: (id) => fetchFromTMDB(`/movie/${id}`),
  getCredits: (id) => fetchFromTMDB(`/movie/${id}/credits`),
  getVideos: (id) => fetchFromTMDB(`/movie/${id}/videos`),
  getSimilar: (id) => fetchFromTMDB(`/movie/${id}/similar`),
  getWatchProviders: (id) => fetchFromTMDB(`/movie/${id}/watch/providers`),
  getPopular: (page = 1) => fetchFromTMDB('/movie/popular', { page }),
  getTrending: (page = 1) => fetchFromTMDB('/trending/movie/day', { page }),
  getTrendingWeek: (page = 1) => fetchFromTMDB('/trending/movie/week', { page }),
  getNowPlaying: (page = 1) => fetchFromTMDB('/movie/now_playing', { page }),
  getUpcoming: (page = 1) => fetchFromTMDB('/movie/upcoming', { page }),
  getTopRated: (page = 1) => fetchFromTMDB('/movie/top_rated', { page }),
  search: (query, page = 1) => fetchFromTMDB('/search/movie', { query, page })
};
