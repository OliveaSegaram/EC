const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// Generate reports (accessible by root and super_user roles)
router.get('/generate', 
  protect, 
  (req, res, next) => {
    // Flatten the roles array to handle any potential nesting
    const roles = ['root', 'super_user'];
    return authorize(...roles)(req, res, next);
  },
  reportController.generateReport
);

module.exports = router;
