const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getIssuesForReview, confirmReview } = require('../controllers/issue/issueReviewController');

// Apply protect middleware to all routes
router.use(protect);

// Only super admin and root can access these routes
router.use(authorize('super_admin', 'root'));

// Get issues for review
router.get('/review', getIssuesForReview);

// Confirm review of an issue
router.post('/:issueId/confirm', confirmReview);

module.exports = router;
