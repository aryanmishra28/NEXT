const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const resumeController = require('../controllers/resumeController');

router.post('/analyze', upload.single('resume'), resumeController.analyzeResume);

module.exports = router;
