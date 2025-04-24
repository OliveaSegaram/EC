// routes/issueRoutes.js
const express = require('express');
const { submitIssue } = require('../controllers/issueController');
const router = express.Router();
const upload = require('../middleware/upload');

// POST request to submit an issue
//router.post('/submit', submitIssue);
router.post('/submit', upload.single('attachment'), submitIssue);
module.exports = router;
