//Create express app(server)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
//const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const hackathonRoutes = require('./routes/hackathon');
const aiChatRoutes = require('./routes/aiChat');


const app = express();

// Middleware

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'], // Support Vite dev server (default & backup ports)
  credentials: true
}));

// Add headers for Google Sign-In popup flow
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});
app.use(express.json());
app.use(cookieParser());

// Routes with /api prefix to match frontend
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/hackathon', hackathonRoutes);
app.use('/api/ai', aiChatRoutes);



// Health check
app.get('/', (req, res) => {
  res.send('Welcome to the NEXT STEP backend!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

module.exports = app; // Export app for server.js to use