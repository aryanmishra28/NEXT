const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiChatController');
router.post('/chat', chatWithAI);

module.exports = router;
