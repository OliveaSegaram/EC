<<<<<<< HEAD
// routes/issueRoutes.js
const express = require('express');
const { submitIssue } = require('../controllers/issueController');
const router = express.Router();
const upload = require('../middleware/upload');

// POST request to submit an issue
//router.post('/submit', submitIssue);
router.post('/submit', upload.single('attachment'), submitIssue);
module.exports = router;
=======
// routes/issueRoutes.js
const express = require('express');
const { submitIssue } = require('../controllers/issueController');
const router = express.Router();
const upload = require('../middleware/upload');

// POST request to submit an issue
//router.post('/submit', submitIssue);
router.post('/submit', upload.single('attachment'), submitIssue);
module.exports = router;
>>>>>>> 951fc5d9ac6f561bb274fd3e389faaadb11fec4f
