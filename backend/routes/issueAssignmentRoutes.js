const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const issueController = require('../controllers/issue/issueController');

// Apply protect middleware to all routes
router.use(protect);

// Get issues assigned to the current user (Technical Officer)
router.get('/my-issues', issueController.getTechnicalOfficerAssignedIssues);

// Technical Officer routes for issue updates
// These routes are protected by the 'protect' middleware but not restricted by role
router.post('/:issueId/start', issueController.startWorkingOnIssue);
router.post('/:issueId/resolve', issueController.resolveIssue);

// Admin/Manager only routes
router.use(authorize('admin', 'manager'));

// Assign an issue to a technical officer
router.post('/:issueId/assign', issueController.assignTechnicalOfficer);

// Get all technical officers
router.get('/technical-officers', issueController.getTechnicalOfficers);

module.exports = router;
