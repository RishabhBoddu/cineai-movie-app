import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, Sparkles, X, Minimize2, Maximize2, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AIAssistantChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hi! I'm your AI Movie Assistant. Ask me anything! For example:\n* *'Recommend funny sci-fi movies.'*\n* *'Recommend emotional Korean dramas.'*\n* *'Show me movies similar to Interstellar.'*\n* *'Find movies starring Tom Cruise.'*",
      movies: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { token } = useAuth();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userText, movies: [] }]);
    setInput('');
    setLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userText })
      });

      if (!res.ok) throw new Error('AI Assistant is currently offline');

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.response,
          movies: data.recommended_movies || []
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: "Oops, I encountered a connection error. Please make sure the backend server is running and try again!",
          movies: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-red to-brand-dark-red text-white font-bold rounded-full shadow-2xl hover:scale-105 active:scale-95 transition duration-200 cursor-pointer border border-white/10 group"
      >
        <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse group-hover:rotate-12 transition duration-200" />
        <span>Ask CineAI</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed right-4 sm:right-6 bottom-6 z-50 glass-panel rounded-xl shadow-2xl border border-white/10 transition-all duration-300 flex flex-col overflow-hidden ${
        isMinimized 
          ? 'w-[280px] h-[55px]' 
          : 'w-[92vw] sm:w-[400px] md:w-[450px] h-[80vh] max-h-[600px]'
      }`}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-black/40 border-b border-white/5 select-none">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand-red" />
          <div>
            <h3 className="text-sm font-bold text-white leading-none">CineAI Assistant</h3>
            {!isMinimized && <span className="text-[10px] text-emerald-400 font-medium mt-1 inline-block">Online</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition cursor-pointer"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleChat}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-brand-red transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Body (Hidden when Minimized) */}
      {!isMinimized && (
        <>
          <div className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar bg-neutral-950/20">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    msg.sender === 'user' 
                      ? 'bg-neutral-700 text-white' 
                      : 'bg-brand-red/20 text-brand-red border border-brand-red/20'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-3">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow ${
                      msg.sender === 'user'
                        ? 'bg-neutral-800 text-white rounded-tr-none'
                        : 'bg-neutral-900/90 text-neutral-200 border border-white/5 rounded-tl-none'
                    }`}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {msg.text}
                  </div>

                  {/* Render Movie Grid Cards */}
                  {msg.movies && msg.movies.length > 0 && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1.5 w-full">
                      {msg.movies.map((movie) => (
                        <div
                          key={movie.id}
                          onClick={() => {
                            navigate(`/movie/${movie.id}`);
                            setIsOpen(false);
                          }}
                          className="bg-bg-card rounded border border-white/5 overflow-hidden hover:border-brand-red cursor-pointer group shadow transition duration-200 hover:-translate-y-0.5"
                        >
                          <div className="aspect-[2/3] w-full bg-neutral-800 relative">
                            {movie.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                                alt={movie.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                                <Film className="w-6 h-6 text-neutral-600 mb-1" />
                                <span className="text-[10px] font-bold text-white truncate w-full">{movie.title}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-1.5">
                            <h4 className="text-white text-xs font-bold truncate group-hover:text-brand-red leading-tight">
                              {movie.title}
                            </h4>
                            {movie.release_date && (
                              <span className="text-neutral-500 text-[9px] block">
                                {movie.release_date.split('-')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-7 h-7 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center border border-brand-red/20 flex-shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-neutral-900 border border-white/5 text-neutral-300 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 shadow">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-150"></span>
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-300"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Form */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-black/60 border-t border-white/5 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CineAI for recommendations..."
              className="flex-grow bg-neutral-900 text-white rounded-lg px-3.5 py-2.5 text-sm border border-white/5 focus:border-brand-red outline-none transition"
              disabled={loading}
            />
            <button
              type="submit"
              className={`p-2.5 rounded-lg text-white transition ${
                input.trim() && !loading
                  ? 'bg-brand-red hover:bg-brand-dark-red cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500'
              }`}
              disabled={!input.trim() || loading}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default AIAssistantChat;
