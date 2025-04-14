const express = require('express');
const router = express.Router();
const rootController = require('../controllers/rootController');
const auth = require('../middleware/auth');

// middleware to allow only root
const onlyRoot = (req, res, next) => {
  if (req.user.role !== 'root') {
    return res.status(403).json({ message: 'Access denied: Not root' });
  }
  next();
};

// Get all users (with optional filtering on frontend)
router.get('/pending-users', auth, onlyRoot, rootController.getAllUsers);

// Verify or decline registration via email links
router.get('/verify/:id', rootController.verifyUser);

module.exports = router;
