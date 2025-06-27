const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { updateTechnicalOfficerIssue } = require('../controllers/issue/issueReviewController');

// Apply protect middleware to all routes
router.use(protect);

// Update issue status and comment by Technical Officer
router.post('/:issueId/update', updateTechnicalOfficerIssue);

module.exports = router;
