const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const issueController = require('../controllers/issueController');

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

// Submit new issue
router.post('/submit', auth, upload.single('attachment'), issueController.submitIssue);

// Get all issues
router.get('/', auth, issueController.getAllIssues);

// DC approval routes
router.post('/:issueId/approve/dc', auth, issueController.approveByDC);
router.post('/:issueId/reject/dc', auth, issueController.rejectByDC);

// Super User approval route
router.post('/:issueId/approve/superuser', auth, issueController.approveBySuperUser);

// Super Admin approval route
router.post('/:issueId/approve/superadmin', auth, issueController.approveBySuperAdmin);

// Root approval routes
router.post('/:issueId/approve/root', auth, issueController.approveByRoot);
router.post('/:issueId/reject/root', auth, issueController.rejectByRoot);

module.exports = router;
