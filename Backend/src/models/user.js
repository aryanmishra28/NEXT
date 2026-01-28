const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not using Google OAuth
    }
  },
  googleId: {
    type: String,
    sparse: true, // Allows multiple nulls but enforces uniqueness when not null
    unique: true
  },
  picture: {
    type: String
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  // Dashboard statistics
  resumeScore: {
    type: Number,
    default: null
  },
  hackathonsCount: {
    type: Number,
    default: 0
  },
  connectionsCount: {
    type: Number,
    default: 0
  },
  // User activity and events
  recentActivity: [{
    type: {
      type: String,
      default: 'general'
    },
    message: String,
    time: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  upcomingEvents: [{
    title: String,
    date: String,
    type: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;