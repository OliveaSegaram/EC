const express = require('express');
const {
  submitIssue,
  getAllIssues,
  getIssueDetails,
  updateIssue,
  deleteIssue
} = require('../controllers/issueController');
const router = express.Router();
const upload = require('../middleware/upload');

// Route for submitting a new issue
router.post('/submit', upload.single('attachment'), submitIssue);

// Route for getting all issues
router.get('/', getAllIssues);

// Route for getting a specific issue by ID
router.get('/:id', getIssueDetails);  

// Route for updating an issue
router.patch('/:id', updateIssue);  

// Route for deleting an issue
router.delete('/:id', deleteIssue); 


module.exports = router;
