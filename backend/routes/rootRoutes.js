// rootRoutes.js

const express = require('express');
const router = express.Router();
const rootController = require('../controllers/rootController');
const { protect } = require('../middleware/auth');

// middleware to allow only root
const onlyRoot = (req, res, next) => {
  if (req.user.role !== 'root') {
    return res.status(403).json({ message: 'Access denied: Not root' });
  }
  next();
};

// existing routes
// Apply protect middleware to all routes
router.use(protect);

// Verify user role is root for all routes
router.use(onlyRoot);

// User management routes
router.get('/pending-users', rootController.getAllUsers);
router.get('/verify/:id', rootController.verifyUser);
router.post('/approve-user/:id', rootController.approveUser);
router.post('/reject-user/:id', rootController.rejectUser);
router.get('/users', rootController.getAllUsers);
router.delete('/user/:id', rootController.deleteUser);

// Role management routes
router.get('/roles', rootController.getAllRoles);
router.post('/roles', rootController.addRole);
router.delete('/roles/:id', rootController.deleteRole);

module.exports = router;
