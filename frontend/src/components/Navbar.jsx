import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Film, LogOut, Shield, Menu, X, ArrowRight, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  // Monitor page scroll to add background color to navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle clicking outside suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/movies/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (movieId) => {
    setSearchQuery('');
    setShowSuggestions(false);
    navigate(`/movie/${movieId}`);
  };

  const isActive = (path) => location.pathname === path;
  const isAdmin = user && (user.is_admin || user.username.toLowerCase() === 'admin');

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-bg-dark border-b border-white/10 shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-brand-red font-extrabold text-2xl tracking-wider select-none">
              <Film className="w-7 h-7 fill-brand-red stroke-2" />
              <span>CINE<span className="text-white font-medium">SUGGEST</span></span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/" className={`transition ${isActive('/') ? 'text-brand-red font-semibold' : 'text-neutral-300 hover:text-white'}`}>Home</Link>
              {user && (
                <Link to="/dashboard" className={`transition ${isActive('/dashboard') ? 'text-brand-red font-semibold' : 'text-neutral-300 hover:text-white'}`}>Dashboard</Link>
              )}
              {isAdmin && (
                <Link to="/admin-panel" className={`flex items-center gap-1 transition ${isActive('/admin-panel') ? 'text-brand-red font-semibold' : 'text-amber-400 hover:text-amber-300'}`}>
                  <Shield className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          </div>

          {/* Search bar & Auth controls */}
          <div className="hidden md:flex items-center gap-6">
            {/* Search Input with suggestions */}
            <div ref={dropdownRef} className="relative">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-black/40 border border-neutral-700 hover:border-neutral-500 focus-within:border-brand-red focus-within:hover:border-brand-red rounded-full transition overflow-hidden px-3 py-1.5 w-64">
                <input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="bg-transparent text-white placeholder-neutral-400 text-xs w-full focus:outline-none pr-6"
                />
                <button type="submit" className="absolute right-3 text-neutral-400 hover:text-white cursor-pointer">
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 right-0 w-80 glass-dropdown rounded-lg overflow-hidden shadow-2xl z-50 animate-fade-in">
                  <div className="p-2 border-b border-white/5 text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">Search Suggestions</div>
                  <div className="divide-y divide-white/5">
                    {suggestions.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => handleSuggestionClick(movie.id)}
                        className="flex items-center gap-3 p-2.5 hover:bg-white/5 transition cursor-pointer"
                      >
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                            alt={movie.title}
                            className="w-8 h-12 object-cover rounded bg-neutral-800"
                          />
                        ) : (
                          <div className="w-8 h-12 rounded bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center border border-white/5">
                            <Film className="w-4 h-4 text-neutral-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-xs font-semibold truncate leading-snug">{movie.title}</h4>
                          <span className="text-neutral-400 text-[10px]">{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-500 opacity-0 group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User details or Logins */}
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="flex items-center gap-2 hover:text-neutral-300 transition text-sm">
                  <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center font-bold text-white shadow-md">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium">{user.username}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-700 hover:border-brand-red rounded-md text-sm font-medium hover:bg-brand-red/10 text-neutral-300 hover:text-white transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm text-neutral-300 hover:text-white transition font-medium">Sign In</Link>
                <Link to="/register" className="px-4 py-1.5 bg-brand-red hover:bg-brand-dark-red rounded-md text-sm font-bold shadow-md transition">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-4">
            {user && (
              <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center font-bold text-white shadow-md text-sm">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-neutral-300 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t-0 border-x-0 border-b border-white/10 px-4 pt-2 pb-6 space-y-4 shadow-2xl animate-slide-up">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-black/60 border border-neutral-800 rounded px-3 py-2 w-full">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white placeholder-neutral-400 text-xs w-full focus:outline-none"
            />
            <button type="submit" className="absolute right-3 text-neutral-400">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-col gap-3 font-medium text-sm">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-neutral-300 hover:text-white py-1">Home</Link>
            {user && (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-neutral-300 hover:text-white py-1">Dashboard</Link>
            )}
            {isAdmin && (
              <Link to="/admin-panel" onClick={() => setMobileMenuOpen(false)} className="text-amber-400 hover:text-amber-300 py-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Admin Panel</span>
              </Link>
            )}
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-neutral-400 hover:text-brand-red py-2 mt-2 border-t border-white/5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="flex gap-4 pt-3 border-t border-white/5">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 border border-neutral-700 rounded text-neutral-300 font-semibold hover:text-white hover:border-white transition">Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 bg-brand-red rounded text-white font-bold hover:bg-brand-dark-red transition">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
