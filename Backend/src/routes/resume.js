const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
// Match actual filename casing to avoid issues on case-sensitive systems
const resumeController = require('../controllers/resumecontroller');

router.post('/analyze', upload.single('resume'), resumeController.analyzeResume);

module.exports = router;
