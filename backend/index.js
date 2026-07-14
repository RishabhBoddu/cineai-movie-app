const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const { getDb } = require('./db');

// Load environment variables from parent workspace folder or current dir
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const authRouter = require('./routes/auth');
const moviesRouter = require('./routes/movies');
const userRouter = require('./routes/user');
const aiRouter = require('./routes/ai');
const socialRouter = require('./routes/social');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 8080;

// Setup CORS middleware
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8080', 'http://127.0.0.1:8080'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-side calls)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(null, true); // Allow during migration, or restrict strictly: return callback(new Error('CORS Policy block'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize Database connection on start
getDb().then(() => {
  console.log('Database verification successfully complete.');
}).catch((err) => {
  console.error('Critical database initialization failure:', err);
});

// Bind API Routes
app.use('/api/auth', authRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/user', userRouter);
app.use('/api/ai', aiRouter);
app.use('/api/social', socialRouter);
app.use('/api/admin', adminRouter);

// Serve frontend build static files in production
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Catch-all SPA route: redirect unmatched requests back to React client
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Start Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(` CineAI Server listening at http://localhost:${PORT}`);
  console.log(`===================================================`);
});
