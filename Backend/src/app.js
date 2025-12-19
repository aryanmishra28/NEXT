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
const jobsRoutes = require('./routes/job');
const applicationRoutes = require('./routes/application');


const app = express();

// Middleware

app.use(cors({ origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes with /api prefix to match frontend
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/hackathon', hackathonRoutes);
app.use('/api/ai', aiChatRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationRoutes);



// Health check
app.get('/', (req, res) => {
  res.send('Welcome to the NEXT STEP backend!');
});

module.exports = app; // Export app for server.js to use