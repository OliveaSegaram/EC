// rootRoutes.js

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

// existing routes
router.get('/pending-users', auth, onlyRoot, rootController.getAllUsers);
router.get('/verify/:id', rootController.verifyUser);
router.get('/users', auth, onlyRoot, rootController.getAllUsers);
router.delete('/user/:id', auth, onlyRoot, rootController.deleteUser);

//  NEW: Role routes directly here
router.get('/roles', auth, onlyRoot, rootController.getAllRoles);
router.post('/roles', auth, onlyRoot, rootController.addRole);
router.delete('/roles/:id', auth, onlyRoot, rootController.deleteRole);

module.exports = router;
