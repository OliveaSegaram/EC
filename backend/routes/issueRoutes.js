const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const issueController = require('../controllers/issue/issueController');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Apply protect middleware to all routes
router.use(protect);

// Issue submission
router.post('/', upload.single('attachment'), issueController.submitIssue);

// Get all issues (filtered by user's role and district)
router.get('/', issueController.getAllIssues);

// Get issue details by ID
router.get('/:id', issueController.getIssueDetails);

// Update issue
router.put('/:id', upload.single('attachment'), issueController.updateIssue);

// Delete issue
router.delete('/:id', issueController.deleteIssue);

// Issue approval routes
// DC approval
router.post('/:issueId/approve-dc', issueController.approveByDC);
router.post('/:issueId/reject-dc', issueController.rejectByDC);

// Super Admin approval (combining superuser and superadmin into one role)
router.post('/:issueId/approve-superadmin', issueController.approveBySuperUser);
router.post('/:issueId/reject-superadmin', issueController.rejectByRoot);

// Root approval (same as super admin for now)
router.post('/:issueId/approve-root', issueController.approveByRoot);
router.post('/:issueId/reject-root', issueController.rejectByRoot);

// Technical Officer routes
router.get('/technicalofficer/assigned', issueController.getTechnicalOfficerAssignedIssues);
router.post('/:issueId/assign-technician', issueController.assignTechnicalOfficer);
router.put('/:issueId/status', issueController.updateTechnicalOfficerIssue);

// Review routes
router.get('/review/pending', issueController.getIssuesForReview);
router.post('/:issueId/review', issueController.confirmReview);

// Reopen issue (for Subject Clerk)
router.post('/:issueId/reopen', issueController.reopenIssue);

// Get all technical officers
router.get('/technical-officers/all', issueController.getTechnicalOfficers);

module.exports = router;