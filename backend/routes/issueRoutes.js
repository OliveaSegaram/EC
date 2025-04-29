// routes/issueRoutes.js
const express = require('express');
const { submitIssue } = require('../controllers/issueController');
const router = express.Router();
const upload = require('../middleware/upload'); // Middleware for handling file uploads

// POST request to submit an issue with optional attachment (image/pdf)
router.post('/submit', upload.single('attachment'), submitIssue);

module.exports = router;
