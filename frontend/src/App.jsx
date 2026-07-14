import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AIAssistantChat from './components/AIAssistantChat';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetail from './pages/MovieDetail';
import Search from './pages/Search';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#141414] text-white flex flex-col justify-between">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/search" element={<Search />} />
              <Route path="/movie/:tmdb_id" element={<MovieDetail />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin-panel" 
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Floating CineAI Chat Assistant globally available */}
          <AIAssistantChat />
          
          <footer className="bg-black/80 border-t border-white/5 py-8 text-center text-xs text-neutral-500 font-medium">
            <div className="max-w-7xl mx-auto px-4 space-y-2">
              <p>&copy; {new Date().getFullYear()} CineSuggest. All rights reserved.</p>
              <p>Powered by MovieLens Datasets, TMDb API, FastAPI, and React + Tailwind v4.</p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
