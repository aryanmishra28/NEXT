const express = require('express');
const router = express.Router();
const hackathonController = require('../controllers/hackathonController');
const auth = require('../middleware/auth'); // Add auth middleware

// Generate project ideas for hackathons (uses OpenAI)
router.post('/generate-ideas', hackathonController.generateIdeas);

// Post a new hackathon (requires authentication)
router.post('/', auth, hackathonController.postHackathon);

// Fetch actual hackathon events (from MongoDB database)
router.get('/list', hackathonController.getHackathons);

// Fetch fresh hackathons from third-party APIs (without saving to DB)
router.get('/third-party', hackathonController.getThirdPartyHackathons);

// Sync hackathons from external sources (Devpost, MLH, etc.) - Saves to DB
router.post('/sync', hackathonController.syncFromDevpost);

module.exports = router;