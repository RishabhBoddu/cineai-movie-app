# CineAI - Movie Discovery & Recommendation Web App

A premium, Netflix-inspired Full Stack Movie Recommendation application built with React, Node.js/Express, and SQLite, powered directly by the TMDB API with server-side caching.

## Features
- **Secure Authentication**: Simple email/password auth using `bcryptjs` and `jsonwebtoken` session tokens stored in secure, client-hidden `httpOnly` cookies.
- **Dynamic Watchlist & Ratings**: Persisted watchlists and rating logs (1-5 stars) linked directly to user accounts.
- **Personalized Recommendations**: A custom recommendation engine querying TMDB discover based on the genres of the user's highest rated movies (>= 4 stars).
- **Strict Language Filtering**: Maps real ISO 639-1 language codes (`en`, `hi`, `ta`, `te`, `ml`, `kn`, etc.) to live TMDB discover calls.
- **Resilient Trailer & Media Fallbacks**: Handled client-side media and trailer boundaries (handles loading, failed retries, and genuinely missing indicators safely).

---

## Technology Stack
- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons
- **Backend**: Node.js + Express Proxy Layer
- **Database**: SQLite (`db.js` helper)
- **API Integration**: Live TMDB API with 5-minute server-side memory caching

---

## Quick Start Setup

### 1. Prerequisites
- **Node.js**: Node.js v18 or higher installed on your system.
- **TMDB API Key**: Obtain a v3 API Key from [The Movie Database](https://www.themoviedb.org/settings/api).

---

### 2. Configure Environment Variables
1. Copy the `.env.example` file in the project root to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and input your keys:
   ```env
   PORT=8080
   JWT_SECRET=supersecret_cookie_key_9824
   TMDB_API_KEY=YOUR_ACTUAL_TMDB_API_KEY
   DATABASE_URL=./cineai.db
   ```

---

### 3. Install Dependencies
You can install dependencies automatically by running the root helper script:
```bash
npm run install-all
```
Alternatively, you can manually install dependencies in both the frontend and backend folders:
```bash
# Setup backend dependencies
cd backend
npm install

# Setup frontend dependencies
cd ../frontend
npm install
```

---

### 4. Running the Application
Open two separate terminal windows in the project root:

- **Terminal 1 (Backend Server)**:
  ```bash
  npm run server
  ```
  The Express server starts listening at `http://localhost:8080`.

- **Terminal 2 (Frontend Client)**:
  ```bash
  npm run dev
  ```
  Vite opens the local React development client at `http://localhost:5173`. Any API request is proxied to the backend at `http://localhost:8080` automatically.
