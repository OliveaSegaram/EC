const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
//const userAuth = require('../middleware/userAuth');

//  Public route for registration dropdown
router.get('/', roleController.getRoles);

//  Protected route - only root can add roles
/*router.post('/', userAuth, (req, res) => {
  if (req.userRole !== 'root') return res.status(403).json({ message: 'Only root can add roles' });
  roleController.addRole(req, res);
});*/

module.exports = router;
