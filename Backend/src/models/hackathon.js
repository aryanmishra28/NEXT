const mongoose = require('mongoose');

const hackathonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    default: 'Virtual'
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  registrationLink: {
    type: String,
    required: true
  },
  deadline: {
    type: Date
  },
  prize: {
    type: String,
    default: 'TBA'
  },
  prizeAmount: {
    type: Number
  },
  participants: {
    type: Number,
    default: 0
  },
  participantsText: {
    type: String,
    default: '0'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  tags: [{
    type: String,
    trim: true
  }],
  organizer: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  bannerUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  source: {
    type: String,
    enum: ['devpost', 'manual', 'other'],
    default: 'manual'
  },
  externalId: {
    type: String,
    sparse: true,
    unique: true // Allows multiple nulls but enforces uniqueness when not null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
hackathonSchema.index({ startDate: 1 });
hackathonSchema.index({ status: 1 });
// externalId index is automatically created by unique: true + sparse: true
hackathonSchema.index({ 'tags': 1 });

// Virtual for date range string
hackathonSchema.virtual('dateRange').get(function() {
  const start = this.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const end = this.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} - ${end}`;
});

// Virtual for formatted date string (for display)
hackathonSchema.virtual('dateDisplay').get(function() {
  if (this.startDate.getMonth() === this.endDate.getMonth() && 
      this.startDate.getFullYear() === this.endDate.getFullYear()) {
    return `${this.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${this.endDate.getDate()}, ${this.endDate.getFullYear()}`;
  }
  return this.dateRange;
});

// Method to check if hackathon is upcoming
hackathonSchema.methods.isUpcoming = function() {
  return this.startDate > new Date() && this.status === 'upcoming';
};

// Method to check if hackathon is ongoing
hackathonSchema.methods.isOngoing = function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now && this.status === 'ongoing';
};

const Hackathon = mongoose.model('Hackathon', hackathonSchema);

module.exports = Hackathon;

