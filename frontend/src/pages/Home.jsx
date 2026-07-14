import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MovieCarousel from '../components/MovieCarousel';
import MovieRow from '../components/MovieRow';
import Skeleton from '../components/Skeleton';
import { Play, Sparkles, Languages, Film, ChevronRight } from 'lucide-react';

const Home = () => {
  const { user, favorites, watchlist, getHeaders } = useAuth();
  const navigate = useNavigate();
  
  const [carouselMovies, setCarouselMovies] = useState([]);
  const [trendingToday, setTrendingToday] = useState([]);
  const [trendingWeek, setTrendingWeek] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Award categories simulation lists
  const [oscarWinners, setOscarWinners] = useState([]);
  const [cultClassics, setCultClassics] = useState([]);
  const [hiddenGems, setHiddenGems] = useState([]);

  // Interactive Language row state
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [languageMovies, setLanguageMovies] = useState([]);
  const [loadingLanguageRow, setLoadingLanguageRow] = useState(false);

  // Interactive Genre row state
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(28); // default to Action
  const [genreMovies, setGenreMovies] = useState([]);
  const [loadingGenreRow, setLoadingGenreRow] = useState(false);

  // Regional Indian language lists
  const [teluguMovies, setTeluguMovies] = useState([]);
  const [hindiMovies, setHindiMovies] = useState([]);
  const [malayalamMovies, setMalayalamMovies] = useState([]);
  const [marathiMovies, setMarathiMovies] = useState([]);
  const [tamilMovies, setTamilMovies] = useState([]);
  const [kannadaMovies, setKannadaMovies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial home lists
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      setError('');
      try {
        const [
          todayRes,
          weekRes,
          popRes,
          topRes,
          upcomingRes,
          nowRes,
          langsRes,
          genresRes,
          teRes,
          hiRes,
          mlRes,
          mrRes,
          taRes,
          knRes
        ] = await Promise.all([
          fetch('/api/movies/trending/today'),
          fetch('/api/movies/trending'),
          fetch('/api/movies/popular'),
          fetch('/api/movies/top-rated'),
          fetch('/api/movies/upcoming'),
          fetch('/api/movies/now-playing'),
          fetch('/api/movies/languages'),
          fetch('/api/movies/genres'),
          fetch('/api/movies/discover?language=te'),
          fetch('/api/movies/discover?language=hi'),
          fetch('/api/movies/discover?language=ml'),
          fetch('/api/movies/discover?language=mr'),
          fetch('/api/movies/discover?language=ta'),
          fetch('/api/movies/discover?language=kn')
        ]);

        let todayData = [];
        let weekData = [];
        let popData = [];
        let topData = [];
        let upcomingData = [];
        let nowPlayingData = [];

        if (todayRes.ok) todayData = await todayRes.json();
        if (weekRes.ok) {
          weekData = await weekRes.json();
          setTrendingWeek(weekData);
        }
        if (popRes.ok) {
          popData = await popRes.json();
          setPopular(popData);
        }
        if (topRes.ok) {
          topData = await topRes.json();
          setTopRated(topData);
        }
        if (upcomingRes.ok) {
          upcomingData = await upcomingRes.json();
          setUpcoming(upcomingData);
        }
        if (nowRes.ok) {
          nowPlayingData = await nowRes.json();
          setNowPlaying(nowPlayingData);
        }

        // Setup Carousel: pick top 5 trending
        const carouselList = todayData.slice(0, 5);
        setCarouselMovies(carouselList.length > 0 ? carouselList : weekData.slice(0, 5));
        setTrendingToday(todayData);

        // Parse languages and genres metadata
        if (langsRes.ok) setLanguages(await langsRes.json());
        if (genresRes.ok) setGenres(await genresRes.json());
        if (teRes.ok) setTeluguMovies(await teRes.json());
        if (hiRes.ok) setHindiMovies(await hiRes.json());
        if (mlRes.ok) setMalayalamMovies(await mlRes.json());
        if (mrRes.ok) setMarathiMovies(await mrRes.json());
        if (taRes.ok) setTamilMovies(await taRes.json());
        if (knRes.ok) setKannadaMovies(await knRes.json());

        // Simulate Awards and Special rows using Top Rated and Popular subsets
        if (topData.length > 0) {
          setOscarWinners(topData.filter((_, i) => i % 3 === 0)); // Sample subset
          setCultClassics(popData.filter((_, i) => i % 4 === 1));
          setHiddenGems(topData.filter((_, i) => i % 4 === 2));
        }

        // Load logged in user specific recommendations and history
        if (user) {
          const authHeaders = getHeaders();
          
          const [recRes, histRes] = await Promise.all([
            fetch('/api/user/recommendations', { headers: authHeaders }),
            fetch('/api/user/history', { headers: authHeaders })
          ]);

          if (recRes.ok) setRecommendations(await recRes.json());
          if (histRes.ok) {
            const histData = await histRes.json();
            // Hydrate history list items with details from tmdb batch
            const hydratedHist = await Promise.all(
              histData.map(async (h) => {
                const details = await fetch(`/api/movies/${h.tmdb_id}`);
                return details.ok ? await details.json() : null;
              })
            );
            setHistory(hydratedHist.filter(m => m !== null));
          }
        }
      } catch (err) {
        console.error('Error fetching home page collections:', err);
        setError('Failed to fetch movie collections. Please check backend connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [user]);

  // Fetch dynamic Language Row
  useEffect(() => {
    const fetchLanguageMovies = async () => {
      setLoadingLanguageRow(true);
      try {
        const res = await fetch(`/api/movies/discover?language=${selectedLanguage}`);
        if (res.ok) {
          setLanguageMovies(await res.json());
        }
      } catch (err) {
        console.error('Failed to load language rows:', err);
      } finally {
        setLoadingLanguageRow(false);
      }
    };
    fetchLanguageMovies();
  }, [selectedLanguage]);

  // Fetch dynamic Genre Row
  useEffect(() => {
    const fetchGenreMovies = async () => {
      setLoadingGenreRow(true);
      try {
        const res = await fetch(`/api/movies/discover?genre=${selectedGenre}`);
        if (res.ok) {
          setGenreMovies(await res.json());
        }
      } catch (err) {
        console.error('Failed to load genre rows:', err);
      } finally {
        setLoadingGenreRow(false);
      }
    };
    fetchGenreMovies();
  }, [selectedGenre]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark pt-20 px-4 md:px-8 space-y-6">
        <div className="max-w-7xl mx-auto h-[400px] md:h-[500px] bg-neutral-800/35 rounded-xl pulse-skeleton flex items-center p-8 border border-white/5">
          <div className="w-full md:w-1/2 space-y-4">
            <div className="h-10 bg-neutral-800 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-800 rounded w-full"></div>
            <div className="h-4 bg-neutral-800 rounded w-5/6"></div>
            <div className="h-10 bg-neutral-800 rounded w-1/3 mt-6"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton.Row count={6} />
          <Skeleton.Row count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark pt-24 px-4 flex flex-col items-center justify-center">
        <p className="text-brand-red text-sm font-semibold mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-brand-red rounded text-sm font-bold shadow-md hover:bg-brand-dark-red transition cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const selectedLanguageName = languages.find((l) => l.code === selectedLanguage)?.name || 'Language';
  const selectedGenreName = genres.find((g) => g.id === selectedGenre)?.name || 'Genre';

  return (
    <div className="min-h-screen bg-bg-dark pb-16">
      {/* Featured Banner Carousel */}
      <MovieCarousel movies={carouselMovies} />

      {/* Main Container for Horizontal Lists */}
      <div className="max-w-7xl mx-auto space-y-4 mt-6 relative z-20">
        
        {/* Recommended for You Row */}
        {user && recommendations.length > 0 && (
          <div className="animate-fade-in bg-gradient-to-r from-brand-red/10 via-transparent to-transparent border-l-2 border-brand-red">
            <MovieRow title={`Recommended for you, ${user.username}`} movies={recommendations} />
          </div>
        )}

        {/* Continue Watching / Viewed History */}
        {user && history.length > 0 && (
          <div className="animate-fade-in">
            <MovieRow title="Continue Watching" movies={history} />
          </div>
        )}

        {/* Trending Today */}
        <MovieRow title="Trending Today" movies={trendingToday} />

        {/* Trending This Week */}
        <MovieRow title="Trending This Week" movies={trendingWeek} />

        {/* Popular Hits */}
        <MovieRow title="Popular Hits" movies={popular} />

        {/* Top Rated Movies */}
        <MovieRow title="Top Rated Classics" movies={topRated} />

        {/* Upcoming Releases */}
        <MovieRow title="Highly Anticipated Upcoming" movies={upcoming} />

        {/* Now Playing */}
        <MovieRow title="Now Playing in Theatres" movies={nowPlaying} />

        {/* Regional Language Rows */}
        {teluguMovies.length > 0 && <MovieRow title="Trending in Telugu" movies={teluguMovies} />}
        {hindiMovies.length > 0 && <MovieRow title="Trending in Hindi" movies={hindiMovies} />}
        {malayalamMovies.length > 0 && <MovieRow title="Trending in Malayalam" movies={malayalamMovies} />}
        {marathiMovies.length > 0 && <MovieRow title="Trending in Marathi" movies={marathiMovies} />}
        {tamilMovies.length > 0 && <MovieRow title="Trending in Tamil" movies={tamilMovies} />}
        {kannadaMovies.length > 0 && <MovieRow title="Trending in Kannada" movies={kannadaMovies} />}

        {/* BROWSE BY LANGUAGE ROW */}
        <div className="py-6 px-4 md:px-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Languages className="w-5 h-5 text-brand-red" />
            <span>Browse by Language</span>
          </h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap cursor-pointer ${
                  selectedLanguage === lang.code
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-600'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>

          {loadingLanguageRow ? (
            <Skeleton.Row count={6} />
          ) : (
            <MovieRow title={`Trending in ${selectedLanguageName}`} movies={languageMovies} />
          )}
        </div>

        {/* BROWSE BY GENRE ROW */}
        <div className="py-4 px-4 md:px-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-brand-red" />
            <span>Browse by Genre</span>
          </h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap cursor-pointer ${
                  selectedGenre === g.id
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-600'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {loadingGenreRow ? (
            <Skeleton.Row count={6} />
          ) : (
            <MovieRow title={`Best of ${selectedGenreName}`} movies={genreMovies} />
          )}
        </div>

        {/* Specialized award blocks */}
        <MovieRow title="Oscar Winners" movies={oscarWinners} />
        
        <MovieRow title="Cult Classics" movies={cultClassics} />
        
        <MovieRow title="Hidden Gems" movies={hiddenGems} />
      </div>
    </div>
  );
};

export default Home;
